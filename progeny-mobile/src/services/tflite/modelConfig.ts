/**
 * YOLO TFLite Model Configuration
 * Based on confusion matrix analysis showing 16 total disease classes across 4 crops
 */

export const MODEL_CONFIG = {
    // Model file configuration
    modelPath: require('../../assets/models/plant_disease.tflite'),
    inputShape: [1, 416, 416, 3], // YOLO input: 416x416 RGB
    outputClasses: 16, // Total disease classes across all crops

    // Preprocessing settings
    inputType: 'float32', // Model expects normalized float32 input
    normalization: true, // Divide by 255.0
    meanSubtraction: false, // YOLO typically doesn't use mean subtraction

    // Inference settings
    confidenceThreshold: 0.25, // Minimum confidence to consider a detection
    nmsThreshold: 0.45, // Non-maximum suppression threshold
};

/**
 * Class mapping based on your trained model
 * Order MUST match the model's output layer
 * 
 * Based on confusion matrices:
 * - Apple: 4 classes (Scab, Black Rot, Cedar Rust, Healthy)
 * - Potato: 3 classes (Early Blight, Late Blight, Healthy)
 * - Corn: 3 classes (Blight, Common Rust, Healthy)
 * - Tomato: 6 classes (Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Target Spot, Healthy)
 */
export const CLASS_NAMES = [
    // Apple (indices 0-3)
    'Apple Scab',
    'Apple Black Rot',
    'Apple Cedar Rust',
    'Apple Healthy',

    // Corn (indices 4-6)
    'Corn Blight',
    'Corn Common Rust',
    'Corn Healthy',

    // Potato (indices 7-9)
    'Potato Early Blight',
    'Potato Late Blight',
    'Potato Healthy',

    // Tomato (indices 10-15)
    'Tomato Bacterial Spot',
    'Tomato Early Blight',
    'Tomato Late Blight',
    'Tomato Leaf Mold',
    'Tomato Target Spot',
    'Tomato Healthy',
];

/**
 * Map class names to simplified disease names for remedies lookup
 */
export function mapToRemedyName(className: string): string {
    // Remove crop prefix: "Apple Scab" → "Apple Scab" (keep as is)
    // Backend expects these exact names
    return className;
}

/**
 * Extract crop type from class name
 */
export function getCropFromClass(className: string): string {
    if (className.startsWith('Apple')) return 'apple';
    if (className.startsWith('Corn')) return 'corn';
    if (className.startsWith('Potato')) return 'potato';
    if (className.startsWith('Tomato')) return 'tomato';
    return 'unknown';
}

/**
 * Check if detection is a healthy plant
 */
export function isHealthy(className: string): boolean {
    return className.toLowerCase().includes('healthy');
}
