import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Camera, RotateCcw, CheckCircle, Crown, Leaf, AlertCircle, LogOut } from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { scanApi } from '../../services/api';
import CropSelector from '../../components/CropSelector';
import ScanResultCard, { ScanResult } from '../../components/ScanResultCard';
import SubscriptionModal from '../../components/SubscriptionModal';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';

export default function DetectionScreen() {
    const { colors, isDark, isHighContrast } = useTheme();
    const { t } = useLanguage();
    const {
        profile,
        usage,
        subscription,
        isAdmin,
        isPremium,
        canScan,
        refreshUserData,
        signOut,
        isDemoMode,
        isAuthenticated,
        isLoading
    } = useAuth();

    const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showSubscription, setShowSubscription] = useState(false);
    const [hasAttemptedAutoRefresh, setHasAttemptedAutoRefresh] = useState(false);

    // Auto-refresh user data if it's missing (e.g., right after login)
    useEffect(() => {
        if (isAuthenticated && !profile && !isDemoMode && !isLoading && !hasAttemptedAutoRefresh) {
            console.log('🔄 Auto-refreshing user data on mount...');
            refreshUserData().finally(() => setHasAttemptedAutoRefresh(true));
        }
    }, [isAuthenticated, profile, isDemoMode, isLoading, hasAttemptedAutoRefresh]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshUserData();
        setRefreshing(false);
    };

    const handleCropSelect = (cropValue: string) => {
        setSelectedCrop(cropValue);
        setImageUri(null);
        setScanResult(null);
        setError(null);
    };

    const pickImage = async (useCamera: boolean) => {
        if (!selectedCrop) {
            Alert.alert('Select Crop First', 'Please select a crop type before uploading an image.');
            return;
        }

        const permissionResult = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', `Please grant ${useCamera ? 'camera' : 'gallery'} permission.`);
            return;
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
            })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
            });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setScanResult(null);
            setError(null);
        }
    };

    const handleScan = async () => {
        if (!imageUri || !selectedCrop) return;

        if (!canScan) {
            setShowSubscription(true);
            return;
        }

        setIsScanning(true);
        setError(null);

        try {
            const response = await scanApi.scan(imageUri, selectedCrop);
            setScanResult(response.scan);
            await refreshUserData();
        } catch (err: any) {
            setError(err.message || 'Scan failed. Please try again.');
            if (err.message?.includes('limit')) {
                Alert.alert('Limit Reached', err.message);
            }
        } finally {
            setIsScanning(false);
        }
    };

    const handleReset = () => {
        setSelectedCrop(null);
        setImageUri(null);
        setScanResult(null);
        setError(null);
    };

    const handleSignOut = () => {
        if (isDemoMode) {
            Alert.alert(
                'Demo Mode',
                'Sign out is disabled in demo mode. In the real app, this would log you out.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }
            ]
        );
    };

    const usageCount = usage?.daily_scans_used || 0;
    const dailyLimit = usage?.daily_limit || 5;
    const usagePercentage = Math.min((usageCount / dailyLimit) * 100, 100);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
            >
                {/* Welcome Header */}
                <View style={styles.welcomeSection}>
                    <View style={styles.welcomeRow}>
                        <View>
                            <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
                                {t('welcome')}, {profile?.full_name?.split(' ')[0] || 'Demo'}!
                            </Text>
                            <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>
                                {isAdmin
                                    ? t('admin_unlimited')
                                    : isPremium
                                        ? `${subscription?.scans_remaining || 0} ${t('premium_scans')}`
                                        : `${Math.max(0, dailyLimit - usageCount)} ${t('scans_remaining')}`}
                            </Text>
                        </View>
                        {isPremium && !isAdmin && (
                            <View style={[styles.premiumBadge, { backgroundColor: isHighContrast ? colors.primary : COLORS.premiumPurple }]}>
                                {/* @ts-ignore */}
                                <Crown size={14} color={isHighContrast ? '#000' : '#fff'} />
                                <Text style={[styles.premiumText, { color: isHighContrast ? '#000' : '#fff' }]}>Premium</Text>
                            </View>
                        )}
                        {isAdmin && (
                            <View style={[styles.adminBadge, { backgroundColor: isHighContrast ? colors.primary : COLORS.error }]}>
                                <Text style={[styles.adminText, { color: isHighContrast ? '#000' : '#fff' }]}>Admin</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Usage Tracker (for free users) */}
                {!isAdmin && !isPremium && (
                    <View style={[styles.usageCard, { backgroundColor: colors.surface, borderWidth: isHighContrast ? 2 : 0, borderColor: colors.border }]}>
                        <View style={styles.usageHeader}>
                            {/* @ts-ignore */}
                            <Leaf size={20} color={colors.primary} />
                            <Text style={[styles.usageTitle, { color: colors.textPrimary }]}>{t('daily_usage')}</Text>
                        </View>
                        <View style={styles.usageInfo}>
                            <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>{t('scans_used')}</Text>
                            <Text style={[styles.usageValue, { color: colors.textPrimary }]}>{usageCount} of {dailyLimit}</Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View style={[styles.progressFill, { width: `${usagePercentage}%`, backgroundColor: colors.primary }]} />
                        </View>
                        <View style={styles.usageStats}>
                            <View style={[styles.usageStat, { backgroundColor: colors.background, borderWidth: isHighContrast ? 1 : 0, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{Math.max(0, dailyLimit - usageCount)}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('remaining')}</Text>
                            </View>
                            <View style={[styles.usageStat, { backgroundColor: colors.background, borderWidth: isHighContrast ? 1 : 0, borderColor: colors.border }]}>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{usageCount}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('used')}</Text>
                            </View>
                        </View>
                        {usageCount >= dailyLimit && (
                            <View style={[styles.limitWarning, { backgroundColor: isHighContrast ? '#000' : colors.warning + '20', borderColor: colors.warning, borderWidth: isHighContrast ? 1 : 0 }]}>
                                {/* @ts-ignore */}
                                <AlertCircle size={16} color={colors.warning} />
                                <Text style={[styles.limitText, { color: isHighContrast ? colors.warning : colors.warning }]}>
                                    {t('limit_reached')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Crop Selector */}
                <CropSelector
                    selectedCrop={selectedCrop}
                    onCropSelect={handleCropSelect}
                    disabled={isScanning}
                />

                {/* Image Upload Section */}
                {selectedCrop && (
                    <View style={[styles.uploadCard, { backgroundColor: colors.surface, borderWidth: isHighContrast ? 2 : 0, borderColor: colors.border }]}>
                        <View style={styles.uploadHeader}>
                            {/* @ts-ignore */}
                            <Upload size={20} color={colors.primary} />
                            <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>
                                {t('upload_leaf')} ({selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)})
                            </Text>
                        </View>

                        {imageUri ? (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: imageUri }} style={[styles.previewImage, { borderColor: colors.border, borderWidth: isHighContrast ? 2 : 0 }]} />
                                {!isScanning && (
                                    <TouchableOpacity
                                        style={[styles.changeImageBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                                        onPress={() => setImageUri(null)}
                                    >
                                        <Text style={[styles.changeImageText, { color: colors.textPrimary }]}>Change Image</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.imageButtons}>
                                <TouchableOpacity
                                    style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => pickImage(true)}
                                    disabled={!canScan}
                                >
                                    {/* @ts-ignore */}
                                    <Camera size={24} color={canScan ? colors.primary : colors.textSecondary} />
                                    <Text style={[styles.imageButtonText, { color: colors.textPrimary }, !canScan && { color: colors.textSecondary }]}>
                                        {t('take_photo')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.imageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => pickImage(false)}
                                    disabled={!canScan}
                                >
                                    {/* @ts-ignore */}
                                    <Upload size={24} color={canScan ? colors.primary : colors.textSecondary} />
                                    <Text style={[styles.imageButtonText, { color: colors.textPrimary }, !canScan && { color: colors.textSecondary }]}>
                                        {t('choose_file')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {imageUri && (
                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.scanButton, { backgroundColor: isHighContrast ? colors.primary : COLORS.accent }, (isScanning || !canScan) && styles.scanButtonDisabled, isHighContrast && { borderWidth: 2, borderColor: '#000' }]}
                                    onPress={handleScan}
                                    disabled={isScanning || !canScan}
                                >
                                    {isScanning ? (
                                        <>
                                            <ActivityIndicator color={isHighContrast ? '#000' : '#fff'} size="small" />
                                            <Text style={[styles.scanButtonText, { color: isHighContrast ? '#000' : '#fff' }]}>{t('analyzing')}</Text>
                                        </>
                                    ) : (
                                        <>
                                            {/* @ts-ignore */}
                                            <CheckCircle size={20} color={isHighContrast ? '#000' : '#fff'} />
                                            <Text style={[styles.scanButtonText, { color: isHighContrast ? '#000' : '#fff' }]}>{t('analyze')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.resetButton, { backgroundColor: isHighContrast ? colors.background : colors.surface, borderWidth: 1, borderColor: colors.border }]}
                                    onPress={handleReset}
                                    disabled={isScanning}
                                >
                                    {/* @ts-ignore */}
                                    <RotateCcw size={18} color={colors.textSecondary} />
                                    <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>{t('start_over')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Scan Results */}
                {scanResult && <ScanResultCard result={scanResult} />}

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    {/* @ts-ignore */}
                    <LogOut size={18} color={COLORS.error} />
                    <Text style={styles.signOutText}>{t('sign_out')}</Text>
                </TouchableOpacity>

                <SubscriptionModal
                    visible={showSubscription}
                    onClose={() => setShowSubscription(false)}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SPACING.lg,
        gap: SPACING.lg,
    },
    welcomeSection: {
        marginBottom: SPACING.sm,
    },
    welcomeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeText: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
    },
    welcomeSubtext: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.premiumPurple,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
        gap: 4,
    },
    premiumText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    adminBadge: {
        backgroundColor: COLORS.error,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
    },
    adminText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    usageCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.medium,
    },
    usageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    usageTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
    },
    usageInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    usageLabel: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    usageValue: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    progressBar: {
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    usageStats: {
        flexDirection: 'row',
        marginTop: SPACING.md,
        gap: SPACING.md,
    },
    usageStat: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    statValue: {
        ...TYPOGRAPHY.h3,
        color: COLORS.primary,
    },
    statLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
    },
    limitWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.md,
        padding: SPACING.sm,
        backgroundColor: COLORS.warningLight,
        borderRadius: 8,
        gap: SPACING.sm,
    },
    limitText: {
        ...TYPOGRAPHY.bodySmall,
        color: '#92400E',
        flex: 1,
    },
    uploadCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.medium,
    },
    uploadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    uploadTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    imageButton: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        gap: SPACING.sm,
    },
    imageButtonText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    disabled: {
        color: COLORS.textMuted,
    },
    imagePreview: {
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    changeImageBtn: {
        marginTop: SPACING.sm,
        padding: SPACING.sm,
        backgroundColor: COLORS.background,
        borderRadius: 8,
    },
    changeImageText: {
        ...TYPOGRAPHY.body,
        color: COLORS.primary,
        fontWeight: '500',
    },
    errorContainer: {
        marginTop: SPACING.md,
        padding: SPACING.sm,
        backgroundColor: COLORS.errorLight,
        borderRadius: 8,
    },
    errorText: {
        ...TYPOGRAPHY.body,
        color: COLORS.error,
    },
    actionButtons: {
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.accent,
        padding: SPACING.md,
        borderRadius: 12,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    scanButtonDisabled: {
        opacity: 0.6,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.sm,
    },
    resetButtonText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    signOutText: {
        ...TYPOGRAPHY.body,
        color: COLORS.error,
        fontWeight: '500',
    },
});
