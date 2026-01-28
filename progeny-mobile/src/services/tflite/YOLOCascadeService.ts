import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { InferenceSession, Tensor as OnnxTensor } from 'onnxruntime-react-native';
import { preprocessImage } from './preprocessor';
import { MODEL_CONFIG } from './modelConfig';
import { apiService } from '../api';

interface DetectionResult {
    disease_name: string;
    confidence_score: number;
    is_healthy: boolean;
    crop_type: string;
    source: 'tflite' | 'onnx' | 'cloud';
}

class YOLOCascadeService {
    private tfliteModel: any = null;
    private onnxSession: InferenceSession | null = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('[YOLO-CASCADE] Initializing inference engines...');
            await tf.ready();

            // Initialize TFLite (Primary)
            try {
                const tfliteAsset = Asset.fromModule(require('../../../assets/models/yolo_v1.tflite'));
                if (!tfliteAsset.localUri) {
                    await tfliteAsset.downloadAsync();
                }
                this.tfliteModel = await loadTensorflowModel(tfliteAsset.localUri || tfliteAsset.uri, 'gpu');
                console.log('[YOLO-CASCADE] ✓ TFLite model loaded (GPU accelerated)');
            } catch (error) {
                console.warn('[YOLO-CASCADE] TFLite initialization failed:', error);
            }

            // Initialize ONNX (Secondary)
            try {
                const onnxAsset = Asset.fromModule(require('../../../assets/models/yolo_v2.onnx'));
                if (!onnxAsset.localUri) {
                    await onnxAsset.downloadAsync();
                }
                this.onnxSession = await InferenceSession.create(onnxAsset.localUri || onnxAsset.uri);
                console.log('[YOLO-CASCADE] ✓ ONNX model loaded');
            } catch (error) {
                console.warn('[YOLO-CASCADE] ONNX initialization failed:', error);
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
    }

    private async runONNX(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        if (!this.onnxSession) return null;

        console.log('[YOLO-CASCADE] Attempting ONNX inference...');
        const inputData = await preprocessImage(imageUri);
        
        // Create ONNX tensor
        const inputTensor = new OnnxTensor(
            'float32',
            inputData,
            [1, MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize, 3]
        );

        const feeds = { input: inputTensor };
        const results = await this.onnxSession.run(feeds);
        const output = results.output.data as Float32Array;

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
            source: 'onnx'
        };
    }

    private async runCloudML(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        console.log('[YOLO-CASCADE] Falling back to Cloud ML...');
        
        try {
            // This would need to be updated to match your actual Cloud ML API
            // For now, using a placeholder structure
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
            console.warn('[YOLO-CASCADE] TFLite failed, trying ONNX...', error);
        }

        // Fallback to ONNX
        try {
            const result = await this.runONNX(imageUri, cropFilter);
            if (result) {
                console.log('[YOLO-CASCADE] ✓ ONNX detection successful');
                return result;
            }
        } catch (error) {
            console.warn('[YOLO-CASCADE] ONNX failed, trying Cloud ML...', error);
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
        const className = MODEL_CONFIG.classNames[classIdx] || `Unknown_${classIdx}`;
        const cropType = MODEL_CONFIG.cropLabels[classIdx] || 'unknown';
        
        return {
            disease: className,
            crop: cropType
        };
    }
}

export const yoloCascade = new YOLOCascadeService();
