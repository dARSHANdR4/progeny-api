import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { ArrowLeft, Camera, Zap } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { tfliteInference } from '../../services/tflite/TFLiteInferenceService';
import CropSelector from '../../components/CropSelector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_SIZE = 3; // 3x3 grid = 9 regions
const INFERENCE_INTERVAL = 500; // Run every 500ms = 2 FPS

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
}

export default function RealtimeDetectionScreen({ navigation }: any) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const [permission, requestPermission] = useCameraPermissions();
    const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
    const [cameraType, setCameraType] = useState<CameraType>('back');
    const [debugInfo, setDebugInfo] = useState({ framesProcessed: 0, detectionsFound: 0 });
    const cameraRef = useRef<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    useEffect(() => {
        // Initialize TFLite
        tfliteInference.initialize().catch(err => {
            console.error('[RealtimeDetection] TFLite init error:', err);
        });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Start/stop detection based on crop selection
        if (selectedCrop && !isProcessing && permission?.granted) {
            startRealtimeDetection();
        } else {
            stopRealtimeDetection();
        }

        return () => stopRealtimeDetection();
    }, [selectedCrop, permission]);

    const startRealtimeDetection = () => {
        stopRealtimeDetection(); // Clear any existing interval


        intervalRef.current = setInterval(async () => {
            if (!cameraRef.current || isProcessing) return;

            setIsProcessing(true);
            try {
                // Capture current frame
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.3, // Lower quality for speed
                    skipProcessing: true,
                });

                // Process frame with sliding window
                const boxes = await processFrameWithSlidingWindow(photo.uri);

                // Update debug info
                setDebugInfo(prev => ({
                    framesProcessed: prev.framesProcessed + 1,
                    detectionsFound: prev.detectionsFound + (boxes.length > 0 ? 1 : 0)
                }));

                // Only update if boxes changed (prevent UI blinking)
                if (boxes.length > 0 || boundingBoxes.length > 0) {
                    console.log('[RealtimeDetection] Updating boxes:', boxes.length);
                    setBoundingBoxes(boxes);
                }
            } catch (error) {
                console.error('[RealtimeDetection] Frame processing error:', error);
            } finally {
                setIsProcessing(false);
            }
        }, INFERENCE_INTERVAL);
    };

    const stopRealtimeDetection = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined as any;
        }
        setBoundingBoxes([]);
    };

    const processFrameWithSlidingWindow = async (imageUri: string): Promise<BoundingBox[]> => {
        const boxes: BoundingBox[] = [];
        const regionWidth = SCREEN_WIDTH / GRID_SIZE;
        const regionHeight = (SCREEN_HEIGHT * 0.7) / GRID_SIZE; // Camera view height

        // For simplicity, we'll run inference on the whole image
        // and simulate grid regions based on result confidence
        // (Cropping individual regions requires image manipulation library)

        try {
            console.log('[LiveDetection] Starting YOLO inference...');
            const result = await tfliteInference.predict(imageUri, selectedCrop || undefined);

            if (result && result.boxes && result.boxes.length > 0) {
                console.log(`[LiveDetection] Found ${result.boxes.length} detections`);

                result.boxes.forEach(box => {
                    // YOLO coordinates from library are usually normalized [0, 1]
                    // Scale them to the actual camera view dimensions
                    boxes.push({
                        x: box.x * SCREEN_WIDTH,
                        y: box.y * (SCREEN_HEIGHT * 0.7), // Scale to camera height
                        width: box.width * SCREEN_WIDTH,
                        height: box.height * (SCREEN_HEIGHT * 0.7),
                        label: box.label,
                        confidence: box.confidence,
                    });
                });

                console.log(`[LiveDetection] ✅ ${boxes.length} boxes scaled and added`);
            } else {
                console.log('[LiveDetection] ⚠️ No detections returned from model');
            }
        } catch (error) {
            console.error('[LiveDetection] Inference error:', error);
        }

        return boxes;
    };

    if (!permission) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.permissionContainer}>
                    <Camera size={64} color={colors.textSecondary} />
                    <Text style={[styles.permissionText, { color: colors.textPrimary }]}>
                        {t('camera_permission_required')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                        onPress={requestPermission}
                    >
                        <Text style={[styles.permissionButtonText, { color: '#FFFFFF' }]}>
                            {t('grant_permission') || 'Grant Permission'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {t('realtime_detection') || '📹 Live Detection'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Crop Selector */}
            <View style={styles.cropSelectorContainer}>
                <CropSelector
                    selectedCrop={selectedCrop}
                    onCropSelect={setSelectedCrop}
                />
            </View>

            {/* Camera View with Overlay */}
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={cameraType}
                />

                {/* Grid Overlay */}
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    {/* Draw 3x3 grid lines */}
                    {[...Array(GRID_SIZE - 1)].map((_, i) => {
                        const x = (SCREEN_WIDTH / GRID_SIZE) * (i + 1);
                        const y = ((SCREEN_HEIGHT * 0.7) / GRID_SIZE) * (i + 1);
                        return (
                            <G key={i}>
                                <Rect
                                    x={x}
                                    y={0}
                                    width={1}
                                    height={SCREEN_HEIGHT * 0.7}
                                    fill="rgba(255,255,255,0.2)"
                                />
                                <Rect
                                    x={0}
                                    y={y}
                                    width={SCREEN_WIDTH}
                                    height={1}
                                    fill="rgba(255,255,255,0.2)"
                                />
                            </G>
                        );
                    })}

                    {/* Bounding Boxes */}
                    {boundingBoxes.map((box, i) => (
                        <G key={i}>
                            <Rect
                                x={box.x}
                                y={box.y}
                                width={box.width}
                                height={box.height}
                                stroke="lime"
                                strokeWidth={3}
                                fill="rgba(0,255,0,0.1)"
                            />
                            <SvgText
                                x={box.x + 5}
                                y={box.y + 20}
                                fill="white"
                                fontSize="14"
                                fontWeight="bold"
                            >
                                {box.label}
                            </SvgText>
                            <SvgText
                                x={box.x + 5}
                                y={box.y + 40}
                                fill="lime"
                                fontSize="12"
                            >
                                {(box.confidence * 100).toFixed(0)}%
                            </SvgText>
                        </G>
                    ))}
                </Svg>

                {/* Processing Indicator */}
                {isProcessing && (
                    <View style={styles.processingIndicator}>
                        <Zap size={16} color="lime" fill="lime" />
                        <Text style={styles.processingText}>Processing...</Text>
                    </View>
                )}

                {/* Debug Overlay */}
                <View style={styles.debugOverlay}>
                    <Text style={styles.debugText}>📊 Frames: {debugInfo.framesProcessed}</Text>
                    <Text style={styles.debugText}>🎯 Detections: {debugInfo.detectionsFound}</Text>
                    <Text style={styles.debugText}>📦 Boxes: {boundingBoxes.length}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {selectedCrop
                        ? `🎯 Scanning for ${selectedCrop} diseases...`
                        : '⬆️ Select a crop to start detection'}
                </Text>
                <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                    {boundingBoxes.length > 0
                        ? `⚠️ ${boundingBoxes.length} issue(s) detected`
                        : '✅ No issues detected'}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    cropSelectorContainer: {
        padding: 16,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    processingIndicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    processingText: {
        color: 'lime',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    debugOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 8,
    },
    debugText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'monospace',
        marginVertical: 2,
    },
    infoContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    infoSubtext: {
        fontSize: 12,
        textAlign: 'center',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 24,
    },
    permissionButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
