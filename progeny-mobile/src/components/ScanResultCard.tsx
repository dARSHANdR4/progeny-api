import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export interface ScanResult {
    id: string;
    disease_name: string;
    confidence_score: number;
    remedies: string[];
    created_at: string;
    crop_type: string;
}

interface ScanResultCardProps {
    result: ScanResult;
}

export default function ScanResultCard({ result }: ScanResultCardProps) {
    const { colors, isDark, isHighContrast, scaledTypography } = useTheme();
    const { t } = useLanguage();
    const confidencePercentage = (result.confidence_score * 100).toFixed(1);

    const cropKey = result.crop_type.toLowerCase();
    const translatedCrop = t(cropKey);
    const cropName = translatedCrop === cropKey ? (result.crop_type.charAt(0).toUpperCase() + result.crop_type.slice(1)) : translatedCrop;

    const diseaseKey = result.disease_name.toLowerCase().replace(' ', '_');
    const translatedDisease = t(diseaseKey);
    const diseaseName = translatedDisease === diseaseKey ? result.disease_name : translatedDisease;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isHighContrast ? '#000' : (isDark ? colors.success + '20' : colors.success + '10'),
                borderColor: colors.success,
                borderWidth: isHighContrast ? 2 : 1
            }
        ]}>
            <View style={[styles.header, { backgroundColor: colors.success + '20', borderBottomColor: colors.success + '40' }]}>
                {/* @ts-ignore */}
                <CheckCircle size={24} color={colors.success} />
                <Text style={[styles.headerTitle, { color: colors.success }, scaledTypography.h3]}>{t('scan_results')} - {cropName}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                        <Text style={[styles.resultLabel, { color: colors.success }, scaledTypography.label]}>{t('disease_detected')}:</Text>
                        <Text style={[styles.resultValue, { color: colors.textPrimary }, scaledTypography.body]}>{diseaseName}</Text>
                    </View>
                    <View style={styles.resultItem}>
                        <Text style={[styles.resultLabel, { color: colors.success }, scaledTypography.label]}>{t('confidence_score')}:</Text>
                        <Text style={[styles.resultValue, { color: colors.textPrimary }, scaledTypography.body]}>{confidencePercentage}%</Text>
                    </View>
                </View>

                <View style={styles.remediesSection}>
                    <Text style={[styles.remediesTitle, { color: colors.success }, scaledTypography.label]}>{t('recommended_remedies')}:</Text>
                    <ScrollView style={styles.remediesList} nestedScrollEnabled>
                        {result.remedies.map((remedy, index) => (
                            <View key={index} style={styles.remedyItem}>
                                <Text style={[styles.bulletPoint, { color: colors.success }]}>•</Text>
                                <Text style={[styles.remedyText, { color: isHighContrast ? colors.textPrimary : colors.success }, scaledTypography.body]}>{remedy}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <Text style={[styles.timestamp, { color: colors.textSecondary }, scaledTypography.caption]}>
                    {t('scanned_on')}: {new Date(result.created_at).toLocaleString()}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        marginLeft: SPACING.sm,
    },
    content: {
        padding: SPACING.md,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    resultItem: {
        flex: 1,
    },
    resultLabel: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.xs,
    },
    resultValue: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
    },
    remediesSection: {
        marginTop: SPACING.sm,
    },
    remediesTitle: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.sm,
    },
    remediesList: {
        maxHeight: 150,
    },
    remedyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.xs,
    },
    bulletPoint: {
        marginRight: SPACING.sm,
        fontSize: 16,
    },
    remedyText: {
        ...TYPOGRAPHY.body,
        flex: 1,
    },
    timestamp: {
        ...TYPOGRAPHY.caption,
        marginTop: SPACING.md,
        textAlign: 'right',
    },
});
