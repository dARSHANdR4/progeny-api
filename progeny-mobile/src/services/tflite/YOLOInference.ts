import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { preprocessImage } from './preprocessor';
import { MODEL_CONFIG, formatPrediction } from './modelConfig';

class YOLOInferenceService {
    private model: any = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('[YOLO] Initializing TensorFlow & Native TFLite...');
            await tf.ready();

            // 1. Load the model asset
            const modelAsset = Asset.fromModule(require('../../../assets/models/plant_disease.tflite'));
            if (!modelAsset.localUri) {
                await modelAsset.downloadAsync();
            }

            // 2. Load the model into the native bridge
            // We use the GPU delegate for maximum speed on mobile
            this.model = await loadTensorflowModel(modelAsset.localUri || modelAsset.uri, 'gpu');

            console.log('[YOLO] Native on-device inference engine ready (GPU accelerated).');
            this.isInitialized = true;
        } catch (error) {
            console.error('[YOLO] Initialization failed:', error);
            this.isInitialized = false;
        }
    }

    async predict(imageUri: string, cropFilter?: string) {
        try {
            if (!this.isInitialized) await this.initialize();
            if (!this.model) return null;

            // 1. Prepare input Float32Array
            const inputData = await preprocessImage(imageUri);

            // 2. Run Inference natively
            // model.run returns a TypedArray[] (outputs)
            const outputs = await this.model.run([inputData]);

            if (!outputs || outputs.length === 0) return null;

            // 3. Post-process (Simplistic Argmax for single output models)
            const output = outputs[0];
            let maxProb = -1;
            let classIdx = -1;

            for (let i = 0; i < output.length; i++) {
                if (output[i] > maxProb) {
                    maxProb = output[i];
                    classIdx = i;
                }
            }

            // Apply threshold
            if (maxProb < MODEL_CONFIG.confidenceThreshold) return null;

            // 4. Format Result
            const { disease, crop } = formatPrediction(classIdx);

            // Apply filter if provided
            if (cropFilter && crop.toLowerCase() !== cropFilter.toLowerCase()) {
                console.log(`[YOLO] Filter mismatch: detected ${crop}, filtered for ${cropFilter}`);
                return null;
            }

            return {
                disease_name: disease,
                confidence_score: maxProb,
                is_healthy: disease.toLowerCase().includes('healthy'),
                crop_type: crop
            };
        } catch (error) {
            console.error('[YOLO] Native Inference error:', error);
            return null;
        }
    }
}

export const yoloInference = new YOLOInferenceService();
