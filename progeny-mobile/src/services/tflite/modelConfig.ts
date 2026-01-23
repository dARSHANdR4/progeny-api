export const MODEL_CONFIG = {
    inputSize: 416,
    numClasses: 16,
    normalize: true,
    confidenceThreshold: 0.45,
    iouThreshold: 0.45,
};

export const CLASS_NAMES = [
    'Apple Scab',
    'Black Rot',
    'Cedar Apple Rust',
    'Healthy',
    'Corn Blight',
    'Common Rust',
    'Healthy',
    'Early Blight',
    'Late Blight',
    'Healthy',
    'Bacterial Spot',
    'Early Blight',
    'Late Blight',
    'Leaf Mold',
    'Target Spot',
    'Healthy'
];

export const CROP_LABELS = [
    ...Array(4).fill('apple'),
    ...Array(3).fill('corn'),
    ...Array(3).fill('potato'),
    ...Array(6).fill('tomato'),
];

export const formatPrediction = (classIdx: number) => {
    return {
        disease: CLASS_NAMES[classIdx],
        crop: CROP_LABELS[classIdx],
    };
};
