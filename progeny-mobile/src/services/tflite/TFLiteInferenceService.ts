import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';
import { preprocessImage } from './preprocessor';
import { MODEL_CONFIG, CLASS_NAMES, CROP_LABELS } from './modelConfig';

interface DetectionResult {
    disease_name: string;
    confidence_score: number;
    is_healthy: boolean;
    crop_type: string;
}

class TFLiteInferenceService {
    private model: TensorflowModel | null = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized && this.model) return;

        try {
            console.log('[TFLite] Initializing with float32.tflite...');

            const modelResult = await loadTensorflowModel(
                require('../../../assets/models/float32.tflite')
            );

            if (modelResult.state === 'loaded') {
                this.model = modelResult.model;
                this.isInitialized = true;
                console.log('[TFLite] ✅ Model loaded successfully');
            } else {
                console.error('[TFLite] Model loading failed:', modelResult.error);
                throw new Error(`Model loading failed: ${modelResult.error}`);
            }
        } catch (error) {
            console.error('[TFLite] Init failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async predict(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        if (!this.isInitialized || !this.model) {
            await this.initialize();
        }

        if (!this.model) return null;

        try {
            // 1. Preprocess image
            const inputData = await preprocessImage(imageUri);

            // 2. Run inference
            const outputs = this.model.runSync([inputData]);

            if (!outputs || outputs.length === 0) return null;

            // 3. Post-process (assuming classification output)
            const predictions = outputs[0];
            let maxProb = -1;
            let classIdx = -1;

            for (let i = 0; i < predictions.length; i++) {
                if (predictions[i] > maxProb) {
                    maxProb = predictions[i];
                    classIdx = i;
                }
            }

            if (maxProb < MODEL_CONFIG.confidenceThreshold) {
                console.log(`[TFLite] Confidence too low: ${maxProb.toFixed(2)}`);
                return null;
            }

            const diseaseName = CLASS_NAMES[classIdx] || 'Unknown';
            const cropType = CROP_LABELS[classIdx] || 'unknown';

            // Filter by crop if requested
            if (cropFilter && cropType.toLowerCase() !== cropFilter.toLowerCase()) {
                console.log(`[TFLite] Filter mismatch: detected ${cropType}, filter ${cropFilter}`);
                return null;
            }

            console.log(`[TFLite] ✅ Detection: ${diseaseName} (${(maxProb * 100).toFixed(1)}%)`);

            return {
                disease_name: diseaseName,
                confidence_score: maxProb,
                is_healthy: diseaseName.toLowerCase().includes('healthy'),
                crop_type: cropType
            };
        } catch (error) {
            console.error('[TFLite] Inference error:', error);
            return null;
        }
    }
}

export const tfliteInference = new TFLiteInferenceService();
