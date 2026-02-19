declare module 'react-native-tflite' {
    export interface TfliteModelOptions {
        model: string;
        labels: string;
        numThreads?: number;
        useGpuDelegate?: boolean;
    }

    export interface TfliteImageOptions {
        path: string;
        imageMean?: number;
        imageStd?: number;
        numResults?: number;
        threshold?: number;
    }

    export interface TfliteResult {
        label: string;
        confidence: number;
    }

    export default class Tflite {
        static loadModel(options: TfliteModelOptions): Promise<void>;
        static runModelOnImage(options: TfliteImageOptions): Promise<TfliteResult[]>;
    }
}
