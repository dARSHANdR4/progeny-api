declare module 'react-native-tflite' {
    export interface TfliteModelOptions {
        model: string;
        labels: string;
        numThreads?: number;
        useGpuDelegate?: boolean;
    }

    export interface TfliteYoloOptions {
        path: string;
        imageMean?: number;
        imageStd?: number;
        threshold?: number;
        numResultsPerClass?: number;
        anchors?: number[];
        blockUint8?: boolean;
    }

    export interface TfliteYoloResult {
        label: string;
        confidenceInClass: number;
        rect: {
            x: number;
            y: number;
            w: number;
            h: number;
        };
        detectedClass: string;
    }

    export default class Tflite {
        static loadModel(options: TfliteModelOptions): Promise<string>;
        static runModelOnImage(options: TfliteRunOptions): Promise<TfliteResult[]>;
        static runModelOnYolo(options: TfliteYoloOptions): Promise<TfliteYoloResult[]>;
        static close(): void;
    }
}
