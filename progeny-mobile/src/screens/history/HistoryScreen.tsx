import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { History as HistoryIcon, Calendar, ArrowRight, AlertCircle } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { historyApi } from '../../services/api';

export default function HistoryScreen() {
    const { colors, isHighContrast, scaledTypography } = useTheme();
    const { t } = useLanguage();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            setError(null);
            const data = await historyApi.getScanHistory();
            if (data.scans) {
                setHistory(data.scans);
            }
        } catch (err: any) {
            console.error('Error fetching history:', err);
            setError(err.message || 'Failed to fetch history');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Use useFocusEffect to refresh history whenever user navigates to this tab
    useFocusEffect(
        useCallback(() => {
            // Soft refresh: fetch without forced full-screen loading if we already have data
            if (history.length > 0) {
                // Background refresh
                fetchHistory();
            } else {
                // Initial load
                fetchHistory();
            }
        }, [])
    );

    // Keep initial mount fetch as a backup
    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchHistory();
    };

    const renderHistoryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.historyItem,
                {
                    backgroundColor: colors.surface,
                    borderLeftColor: colors.primary,
                    borderWidth: isHighContrast ? 2 : 0,
                    borderColor: colors.border
                }
            ]}
            activeOpacity={0.7}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.cropBadge, { backgroundColor: colors.background }]}>
                    <Text style={[styles.cropText, { color: colors.primary }]}>{item.crop_type.toUpperCase()}</Text>
                </View>
                <View style={styles.dateContainer}>
                    {/* @ts-ignore */}
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.itemContent}>
                <View style={styles.infoContainer}>
                    <Text style={[styles.diseaseName, { color: colors.textPrimary }, scaledTypography.h3]}>{item.disease_name}</Text>
                    <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                        {t('confidence')}: <Text style={[styles.confidenceValue, { color: colors.success }]}>
                            {(item.confidence_score * 100).toFixed(1)}%
                        </Text>
                    </Text>
                </View>
                {/* @ts-ignore */}
                <ArrowRight size={20} color={colors.primary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: isHighContrast ? 3 : 1 }]}>
                {/* @ts-ignore */}
                <HistoryIcon size={24} color={colors.primary} />
                <Text style={[styles.title, { color: colors.textPrimary }, scaledTypography.h2]}>{t('scan_history')}</Text>
            </View>

            {isLoading && !isRefreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.emptyState}>
                    {/* @ts-ignore */}
                    <AlertCircle size={64} color={colors.error || '#EF4444'} />
                    <Text style={[styles.emptyTitle, { color: colors.error || '#EF4444' }, scaledTypography.h3]}>{t('fetch_failed')}</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }, scaledTypography.body]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={fetchHistory}
                    >
                        <Text style={[styles.retryButtonText, scaledTypography.body]}>{t('retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : history.length === 0 ? (
                <View style={styles.emptyState}>
                    {/* @ts-ignore */}
                    <HistoryIcon size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.textSecondary }, scaledTypography.h3]}>{t('no_scans_yet')}</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t('no_scans_desc')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderHistoryItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    title: { ...TYPOGRAPHY.h2 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    emptyTitle: { ...TYPOGRAPHY.h3, marginTop: SPACING.lg },
    emptyText: { ...TYPOGRAPHY.body, textAlign: 'center', marginTop: SPACING.sm },
    listContent: { padding: SPACING.lg },
    historyItem: {
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
        ...SHADOWS.small,
        borderLeftWidth: 4,
    },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    cropBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 8 },
    cropText: { fontSize: 10, fontWeight: 'bold' },
    dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { ...TYPOGRAPHY.caption },
    itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoContainer: { flex: 1 },
    diseaseName: { ...TYPOGRAPHY.h3, marginBottom: 2 },
    confidenceText: { ...TYPOGRAPHY.caption },
    confidenceValue: { fontWeight: '600' },
    retryButton: {
        marginTop: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: 12,
        ...SHADOWS.small,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
