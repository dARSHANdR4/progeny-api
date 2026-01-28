import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode as b64decode } from 'base64-arraybuffer';
import { MODEL_CONFIG } from './modelConfig';

export const preprocessImage = async (imageUri: string): Promise<Float32Array> => {
    try {
        // 1. Resize image to model input size (416x416)
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: MODEL_CONFIG.inputSize, height: MODEL_CONFIG.inputSize } }],
            { format: ImageManipulator.SaveFormat.JPEG, compress: 1 }
        );

        // 2. Read as base64 and decode to arraybuffer
        const base64Data = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
            encoding: 'base64',
        });

        const arrayBuffer = b64decode(base64Data);
        const uint8Array = new Uint8Array(arrayBuffer);

        // 3. Convert to tensor using tfjs
        // We still use tfjs for easy normalization and channel handling
        // but we convert to Float32Array at the end for the native bridge
        await tf.ready();

        // This is a manual way to get pixels if tfjs-react-native's decodeJpeg is unavailable
        const imageTensor = tf.browser.fromPixels({
            data: uint8Array,
            width: MODEL_CONFIG.inputSize,
            height: MODEL_CONFIG.inputSize,
        });

        // 4. Normalize to [0, 1]
        const normalized = imageTensor.toFloat().div(255.0);

        // 5. Convert to Float32Array
        const result = await normalized.data() as Float32Array;

        // Cleanup
        imageTensor.dispose();
        normalized.dispose();

        return result;
    } catch (error) {
        console.error('Preprocessing Error:', error);
        throw error;
    }
};
