import { InferenceSession, Tensor as OnnxTensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface DetectionResult {
    disease_name: string;
    confidence_score: number;
    is_healthy: boolean;
    crop_type: string;
}

// Model configuration
const MODEL_CONFIG = {
    inputSize: 320,
    confidenceThreshold: 0.6,
    classNames: [
        'Apple Scab', 'Apple Black Rot', 'Apple Cedar Rust', 'Apple Healthy',
        'Corn Gray Leaf Spot', 'Corn Common Rust', 'Corn Northern Leaf Blight', 'Corn Healthy',
        'Potato Early Blight', 'Potato Late Blight', 'Potato Healthy',
        'Tomato Bacterial Spot', 'Tomato Early Blight', 'Tomato Late Blight',
        'Tomato Leaf Mold', 'Tomato Septoria Leaf Spot', 'Tomato Spider Mites',
        'Tomato Target Spot', 'Tomato Yellow Leaf Curl Virus', 'Tomato Mosaic Virus', 'Tomato Healthy'
    ],
    cropLabels: [
        'apple', 'apple', 'apple', 'apple',
        'corn', 'corn', 'corn', 'corn',
        'potato', 'potato', 'potato',
        'tomato', 'tomato', 'tomato', 'tomato', 'tomato', 'tomato', 'tomato', 'tomato', 'tomato', 'tomato'
    ]
};

class ONNXInferenceService {
    private session: InferenceSession | null = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('[ONNX] Initializing inference engine...');

            const onnxAsset = Asset.fromModule(require('../../../assets/models/yolo_v2.onnx'));
            if (!onnxAsset.localUri) {
                await onnxAsset.downloadAsync();
            }

            this.session = await InferenceSession.create(onnxAsset.localUri || onnxAsset.uri);
            console.log('[ONNX] ✓ Model loaded successfully');
            this.isInitialized = true;
        } catch (error) {
            console.error('[ONNX] Initialization failed:', error);
            this.isInitialized = false;
        }
    }

    private async preprocessImage(imageUri: string): Promise<Float32Array> {
        try {
            // Resize image
            const manipResult = await manipulateAsync(
                imageUri,
                [{ resize: { width: MODEL_CONFIG.inputSize, height: MODEL_CONFIG.inputSize } }],
                { format: SaveFormat.JPEG, compress: 1 }
            );

            // Read as base64
            const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
                encoding: 'base64',
            });

            // Decode base64 to Uint8Array
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Find JPEG data (skip headers)
            let dataStart = 0;
            for (let i = 0; i < bytes.length - 1; i++) {
                if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8) {
                    dataStart = i;
                    break;
                }
            }

            // Extract RGB values (simplified - assumes JPEG structure)
            // In production, use a proper image decoder
            const imageData = bytes.slice(dataStart);
            const pixelCount = MODEL_CONFIG.inputSize * MODEL_CONFIG.inputSize * 3;
            const normalized = new Float32Array(pixelCount);

            // Simple normalization (this is a placeholder - proper decoding needed)
            for (let i = 0; i < Math.min(pixelCount, imageData.length); i++) {
                normalized[i] = imageData[i] / 255.0;
            }

            return normalized;
        } catch (error) {
            console.error('[ONNX] Preprocessing error:', error);
            throw error;
        }
    }

    async predict(imageUri: string, cropFilter?: string): Promise<DetectionResult | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.session) {
            console.warn('[ONNX] Session not initialized');
            return null;
        }

        try {
            console.log('[ONNX] Running inference...');

            // Preprocess image
            const inputData = await this.preprocessImage(imageUri);

            // Create ONNX tensor
            const inputTensor = new OnnxTensor(
                'float32',
                inputData,
                [1, MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize, 3]
            );

            // Run inference
            const feeds = { input: inputTensor };
            const results = await this.session.run(feeds);
            const output = results.output.data as Float32Array;

            // Find highest confidence class
            let maxProb = -1;
            let classIdx = -1;
            for (let i = 0; i < output.length; i++) {
                if (output[i] > maxProb) {
                    maxProb = output[i];
                    classIdx = i;
                }
            }

            // Check threshold
            if (maxProb < MODEL_CONFIG.confidenceThreshold) {
                console.log('[ONNX] Confidence below threshold');
                return null;
            }

            const disease = MODEL_CONFIG.classNames[classIdx];
            const crop = MODEL_CONFIG.cropLabels[classIdx];

            // Apply crop filter
            if (cropFilter && crop.toLowerCase() !== cropFilter.toLowerCase()) {
                console.log(`[ONNX] Filter mismatch: detected ${crop}, filtered for ${cropFilter}`);
                return null;
            }

            console.log(`[ONNX] ✓ Detection: ${disease} (${(maxProb * 100).toFixed(1)}%)`);

            return {
                disease_name: disease,
                confidence_score: maxProb,
                is_healthy: disease.toLowerCase().includes('healthy'),
                crop_type: crop
            };
        } catch (error) {
            console.error('[ONNX] Inference error:', error);
            return null;
        }
    }
}

export const onnxInference = new ONNXInferenceService();
