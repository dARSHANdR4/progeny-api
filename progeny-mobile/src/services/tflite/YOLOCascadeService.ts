import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { preprocessImage } from './preprocessor';
import { MODEL_CONFIG } from './modelConfig';
import { apiService } from '../api';

interface DetectionResult {
    disease_name: string;
    confidence_score: number;
    is_healthy: boolean;
    crop_type: string;
    source: 'tflite' | 'cloud';
}

class YOLOCascadeService {
    private tfliteModel: any = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('[YOLO-CASCADE] Initializing inference engine (TFLite)...');
            await tf.ready();

            // Initialize TFLite (Primary)
            try {
                const tfliteAsset = Asset.fromModule(require('../../../assets/models/float32.tflite'));
                if (!tfliteAsset.localUri) {
                    await tfliteAsset.downloadAsync();
                }
                this.tfliteModel = await loadTensorflowModel(tfliteAsset.localUri || tfliteAsset.uri, 'gpu');
                console.log('[YOLO-CASCADE] ✓ TFLite model loaded (float32.tflite)');
            } catch (error) {
                console.warn('[YOLO-CASCADE] TFLite initialization failed:', error);
            }

            this.isInitialized = true;
            console.log('[YOLO-CASCADE] Initialization complete');
        } catch (error) {
            console.error('[YOLO-CASCADE] Fatal initialization error:', error);
            this.isInitialized = false;
        }
    }

    private async runTFLite(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        if (!this.tfliteModel) return null;

        console.log('[YOLO-CASCADE] Attempting TFLite inference...');
        try {
            const inputData = await preprocessImage(imageUri);
            const outputs = await this.tfliteModel.run([inputData]);

            if (!outputs || outputs.length === 0) return null;

            const output = outputs[0];
            let maxProb = -1;
            let classIdx = -1;

            for (let i = 0; i < output.length; i++) {
                if (output[i] > maxProb) {
                    maxProb = output[i];
                    classIdx = i;
                }
            }

            if (maxProb < MODEL_CONFIG.confidenceThreshold) return null;

            const { disease, crop } = this.formatPrediction(classIdx);

            if (cropFilter && crop.toLowerCase() !== cropFilter.toLowerCase()) {
                return null;
            }

            return {
                disease_name: disease,
                confidence_score: maxProb,
                is_healthy: disease.toLowerCase().includes('healthy'),
                crop_type: crop,
                source: 'tflite'
            };
        } catch (error) {
            console.error('[YOLO-CASCADE] TFLite run error:', error);
            return null;
        }
    }

    private async runCloudML(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        console.log('[YOLO-CASCADE] Falling back to Cloud ML...');

        try {
            const result = await apiService.scanImage(imageUri, cropFilter || 'unknown');

            return {
                disease_name: result.disease_name,
                confidence_score: result.confidence_score,
                is_healthy: result.is_healthy || false,
                crop_type: cropFilter || 'unknown',
                source: 'cloud'
            };
        } catch (error) {
            console.error('[YOLO-CASCADE] Cloud ML fallback failed:', error);
            return null;
        }
    }

    async predict(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Try TFLite first
        try {
            const result = await this.runTFLite(imageUri, cropFilter);
            if (result) {
                console.log('[YOLO-CASCADE] ✓ TFLite detection successful');
                return result;
            }
        } catch (error) {
            console.warn('[YOLO-CASCADE] TFLite failed, trying Cloud ML...', error);
        }

        // Final fallback to Cloud
        try {
            const result = await this.runCloudML(imageUri, cropFilter);
            if (result) {
                console.log('[YOLO-CASCADE] ✓ Cloud ML detection successful');
                return result;
            }
        } catch (error) {
            console.error('[YOLO-CASCADE] All detection methods failed', error);
        }

        return null;
    }

    private formatPrediction(classIdx: number): { disease: string; crop: string } {
        const CLASS_NAMES = [
            'Apple Scab', 'Black Rot', 'Cedar Apple Rust', 'Healthy',
            'Corn Blight', 'Common Rust', 'Healthy',
            'Early Blight', 'Late Blight', 'Healthy',
            'Bacterial Spot', 'Early Blight', 'Late Blight', 'Leaf Mold', 'Target Spot', 'Healthy'
        ];

        const CROP_LABELS = [
            ...Array(4).fill('apple'),
            ...Array(3).fill('corn'),
            ...Array(3).fill('potato'),
            ...Array(6).fill('tomato'),
        ];

        const className = CLASS_NAMES[classIdx] || `Unknown_${classIdx}`;
        const cropType = CROP_LABELS[classIdx] || 'unknown';

        return {
            disease: className,
            crop: cropType
        };
    }
}

export const yoloCascade = new YOLOCascadeService();
