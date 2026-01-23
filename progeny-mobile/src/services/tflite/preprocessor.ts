import * as tf from '@tensorflow/tfjs';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode as b64decode } from 'base64-arraybuffer';
import { MODEL_CONFIG } from './modelConfig';

export const preprocessImage = async (imageUri: string): Promise<tf.Tensor4D> => {
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

        // 3. Convert to tensor using tf.browser.fromPixels fallback for Node/Native
        // In React Native, we often use decodeJpeg from @tensorflow/tfjs-react-native
        // but since we want robust behavior, we'll use base64 -> Uint8Array -> Tensor
        const imageTensor = tf.browser.fromPixels({
            data: uint8Array,
            width: MODEL_CONFIG.inputSize,
            height: MODEL_CONFIG.inputSize,
        });

        // 4. Normalize to [0, 1] as per model analysis
        const normalized = imageTensor.toFloat().div(255.0);

        // 5. Add batch dimension [1, 416, 416, 3]
        return normalized.expandDims(0) as tf.Tensor4D;
    } catch (error) {
        console.error('Preprocessing Error:', error);
        throw error;
    }
};
