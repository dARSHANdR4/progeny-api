import Tflite from 'react-native-tflite';

interface DetectionResult {
    disease_name: string;
    confidence_score: number;
    is_healthy: boolean;
    crop_type: string;
}

class TFLiteInferenceService {
    private isInitialized = false;

    async initialize() {
        try {
            console.log('[TFLite] Initializing...');

            await Tflite.loadModel({
                model: 'best_float16.tflite',
                labels: 'labels.txt',
                numThreads: 4,
                useGpuDelegate: false // Start without GPU for stability
            });

            console.log('[TFLite] ✅ Model loaded successfully');
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
            console.log('[TFLite] 🔍 Running inference on:', imageUri);
            console.log('[TFLite] Crop filter:', cropFilter);

            const result = await Tflite.runModelOnImage({
                path: imageUri,
                imageMean: 0.0,
                imageStd: 255.0,
                numResults: 5,
                threshold: 0.1  // LOWERED from 0.5 to get ANY results
            });

            console.log('[TFLite] Raw result:', JSON.stringify(result));

            if (!result || result.length === 0) {
                console.warn('[TFLite] ⚠️ No results returned (threshold: 0.1)');
                return null;
            }

            const best = result[0];
            const diseaseName = best.label as string;
            const confidence = best.confidence as number;

            console.log(`[TFLite] ✅ DETECTION FOUND!`);
            console.log(`[TFLite]    Label: ${diseaseName}`);
            console.log(`[TFLite]    Confidence: ${(confidence * 100).toFixed(1)}%`);
            console.log(`[TFLite]    All results count: ${result.length}`);

            return {
                disease_name: diseaseName,
                confidence_score: confidence,
                is_healthy: diseaseName.toLowerCase().includes('healthy'),
                crop_type: cropFilter || 'unknown'
            };
        } catch (error) {
            console.error('[TFLite] ❌ Inference error:', error);
            console.error('[TFLite] Error details:', JSON.stringify(error));
            return null;
        }
    }
}

export const tfliteInference = new TFLiteInferenceService();
