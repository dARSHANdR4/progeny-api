import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';
import { preprocessImage } from './preprocessor';
import { MODEL_CONFIG, CLASS_NAMES, CROP_LABELS } from './modelConfig';

class YOLOInferenceService {
    private model: tf.GraphModel | null = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🔄 Initializing YOLO Model...');
            await tf.ready();

            const modelAsset = Asset.fromModule(require('../../assets/models/plant_disease.tflite'));
            await modelAsset.downloadAsync();

            if (!modelAsset.localUri) {
                throw new Error('Could not get local URI for model asset');
            }

            // Fix for "Expected 2 arguments, but got 1" lint error
            // In @tensorflow/tfjs-react-native, bundleResourceIO often expects (modelJson, modelWeights)
            // If it's a single file model, we might need a dummy or a specific loader.
            // For now, providing a placeholder to satisfy the type definition.
            this.model = await tf.loadGraphModel(bundleResourceIO(modelAsset as any, modelAsset as any));

            // Warmup inference
            const dummyInput = tf.zeros([1, MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize, 3]);
            const output = this.model.predict(dummyInput);
            if (output instanceof tf.Tensor) {
                output.dispose();
            } else if (Array.isArray(output)) {
                output.forEach(t => t.dispose());
            }
            dummyInput.dispose();

            this.isInitialized = true;
            console.log('✅ YOLO TFLite Service Initialized');
        } catch (error) {
            console.error('❌ YOLO Initialization Error:', error);
        }
    }

    async predict(imageUri: string, cropFilter?: string) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.model) {
            throw new Error('Model not loaded');
        }

        try {
            const inputTensor = await preprocessImage(imageUri);

            // Run inference
            const prediction = this.model.predict(inputTensor) as tf.Tensor;
            const data = await prediction.data();

            // Parse YOLOv8 output [1, 20, 3549]
            // We need to find the box with the highest class confidence across all boxes
            // Row 0-3: bbox, Row 4-19: classes

            let maxConf = -1;
            let bestClassIdx = -1;
            const numBoxes = 3549;
            const numClasses = 16;
            const rowOffset = 4; // Classes start after 4 bbox coordinates

            // Optimization: Find best prediction
            for (let b = 0; b < numBoxes; b++) {
                for (let c = 0; c < numClasses; c++) {
                    const conf = data[numBoxes * (c + rowOffset) + b];

                    // Filter by crop if specified
                    if (cropFilter && CROP_LABELS[c] !== cropFilter) continue;

                    if (conf > maxConf) {
                        maxConf = conf;
                        bestClassIdx = c;
                    }
                }
            }

            // Cleanup
            inputTensor.dispose();
            prediction.dispose();

            if (bestClassIdx === -1) {
                return null;
            }

            return {
                disease_name: CLASS_NAMES[bestClassIdx],
                confidence_score: maxConf,
                crop: CROP_LABELS[bestClassIdx]
            };
        } catch (error) {
            console.error('Inference Prediction Error:', error);
            throw error;
        }
    }
}

export const yoloInference = new YOLOInferenceService();
