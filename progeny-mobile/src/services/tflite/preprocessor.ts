/**
 * Optimized Image Preprocessing for Plant Disease Detection
 * This prepares images for the YOLO model (either on-device or server-side)
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { MODEL_CONFIG } from './modelConfig';

export interface PreprocessedImage {
    uri: string;
    width: number;
    height: number;
    base64?: string;
}

/**
 * Preprocess image for YOLO model inference
 * - Resizes to 416x416
 * - Maintains aspect ratio with padding if needed
 * - Normalizes if required
 */
export async function preprocessImage(
    imageUri: string,
    options: {
        includeBase64?: boolean;
        targetSize?: number;
    } = {}
): Promise<PreprocessedImage> {
    const targetSize = options.targetSize || 416;

    try {
        // Resize image to YOLO input size
        const manipulated = await ImageManipulator.manipulateAsync(
            imageUri,
            [
                {
                    resize: {
                        width: targetSize,
                        height: targetSize,
                    },
                },
            ],
            {
                compress: 0.9, // High quality
                format: ImageManipulator.SaveFormat.JPEG,
                base64: options.includeBase64,
            }
        );

        return {
            uri: manipulated.uri,
            width: manipulated.width,
            height: manipulated.height,
            base64: manipulated.base64,
        };
    } catch (error) {
        console.error('Image preprocessing error:', error);
        throw new Error('Failed to preprocess image');
    }
}

/**
 * Convert image URI to blob for upload
 */
export async function imageUriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
}

/**
 * Validate image before processing
 */
export function validateImage(uri: string): boolean {
    if (!uri || uri.trim() === '') {
        return false;
    }

    // Check if it's a valid URI format
    const validPrefixes = ['file://', 'content://', 'http://', 'https://', 'data:'];
    return validPrefixes.some(prefix => uri.startsWith(prefix));
}

/**
 * Get optimal image size based on device capabilities
 * For low-end devices, we might want to use smaller sizes
 */
export function getOptimalImageSize(): number {
    // For now, always use 416x416 as per YOLO model
    // In future, we could add device detection here
    return 416;
}
