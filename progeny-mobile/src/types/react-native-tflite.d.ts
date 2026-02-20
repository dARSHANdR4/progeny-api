declare module 'react-native-tflite' {
    export interface TfliteModelOptions {
        model: string;
        labels: string;
        numThreads?: number;
        useGpuDelegate?: boolean;
    }

    export interface TfliteRunOptions {
        path: string;
        imageMean?: number;
        imageStd?: number;
        numResults?: number;
        threshold?: number;
    }

    export interface TfliteResult {
        label: string;
        confidence: number;
        index: number;
    }

    export default class Tflite {
        static loadModel(options: TfliteModelOptions): Promise<string>;
        static runModelOnImage(options: TfliteRunOptions): Promise<TfliteResult[]>;
        static close(): void;
    }
}
