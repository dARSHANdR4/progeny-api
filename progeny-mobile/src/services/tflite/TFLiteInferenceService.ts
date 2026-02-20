import Tflite from 'react-native-tflite';
import { MODEL_CONFIG } from './modelConfig';

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
}

interface DetectionResult {
    disease_name: string;
    confidence_score: number;
    is_healthy: boolean;
    crop_type: string;
    boxes: BoundingBox[];
}

class TFLiteInferenceService {
    private isInitialized = false;

    async initialize() {
        try {
            console.log('[TFLite] Initializing with YOLO model...');

            await Tflite.loadModel({
                model: 'float32.tflite',
                labels: 'labels.txt',
                numThreads: 4,
                useGpuDelegate: false
            });

            console.log('[TFLite] ✅ YOLO Model loaded successfully');
            this.isInitialized = true;
        } catch (error) {
            console.error('[TFLite] Init failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async predict(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log('[TFLite] 🔍 Running YOLO inference on:', imageUri);

            const result = await Tflite.runModelOnYolo({
                path: imageUri,
                imageMean: 0.0,
                imageStd: 255.0,
                threshold: MODEL_CONFIG.confidenceThreshold,
                numResultsPerClass: 1,
            });

            console.log('[TFLite] Raw detection count:', result?.length || 0);

            if (!result || result.length === 0) {
                return null;
            }

            // Map TFLiteYoloResult to BoundingBox
            const boxes: BoundingBox[] = result.map(res => ({
                x: res.rect.x,
                y: res.rect.y,
                width: res.rect.w,
                height: res.rect.h,
                label: res.detectedClass,
                confidence: res.confidenceInClass
            }));

            // Find best detection for the header summary
            const best = boxes.sort((a, b) => b.confidence - a.confidence)[0];

            return {
                disease_name: best.label,
                confidence_score: best.confidence,
                is_healthy: best.label.toLowerCase().includes('healthy'),
                crop_type: cropFilter || 'unknown',
                boxes: boxes
            };
        } catch (error) {
            console.error('[TFLite] ❌ Inference error:', error);
            return null;
        }
    }
}

export const tfliteInference = new TFLiteInferenceService();
