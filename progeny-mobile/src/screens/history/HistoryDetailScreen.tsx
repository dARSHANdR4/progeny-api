import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Leaf, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { SPACING, SHADOWS } from '../../styles/theme';
import { Card, Badge } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface HistoryDetailScreenProps {
    route?: {
        params?: {
            scan?: {
                id: string;
                crop_type: string;
                disease_name: string;
                confidence: number;
                created_at: string;
                image_url?: string;
                remedies?: string[];
            };
        };
    };
    navigation?: any;
}

export default function HistoryDetailScreen({ route, navigation }: HistoryDetailScreenProps) {
    const { colors, isDark, isHighContrast, scaledTypography } = useTheme();
    const { t } = useLanguage();

    const scan = route?.params?.scan || {
        id: 'demo-1',
        crop_type: 'Tomato',
        disease_name: 'Early Blight',
        confidence: 89.5,
        created_at: new Date().toISOString(),
        remedies: [
            'Remove affected leaves immediately',
            'Apply copper-based fungicide',
            'Improve air circulation',
            'Avoid overhead watering',
        ],
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isHealthy = scan.disease_name.toLowerCase().includes('healthy');
    const StatusIcon = isHealthy ? CheckCircle : AlertTriangle;
    const statusColor = isHealthy ? colors.success : colors.warning;

    // Dynamic localization for crop and disease
    const cropKey = scan.crop_type.toLowerCase();
    const translatedCrop = t(cropKey);
    const cropName = translatedCrop === cropKey ? scan.crop_type : translatedCrop;

    const diseaseKey = scan.disease_name.toLowerCase().replace(' ', '_');
    const translatedDisease = t(diseaseKey);
    const diseaseName = translatedDisease === diseaseKey ? scan.disease_name : translatedDisease;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.surface }]}
                    onPress={() => navigation?.goBack()}
                >
                    {/* @ts-ignore */}
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }, scaledTypography.h3]}>{t('scan_details')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Image Preview */}
                {scan.image_url ? (
                    <Image source={{ uri: scan.image_url }} style={styles.scanImage} />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
                        {/* @ts-ignore */}
                        <Leaf size={48} color={colors.textSecondary} />
                        <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }, scaledTypography.bodySmall]}>{t('no_image')}</Text>
                    </View>
                )}

                {/* Status Card */}
                <Card variant="elevated" style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        {/* @ts-ignore */}
                        <StatusIcon size={32} color={statusColor} />
                        <View style={styles.statusInfo}>
                            <Text style={[styles.diseaseName, { color: colors.textPrimary }, scaledTypography.h2]}>{diseaseName}</Text>
                            <Badge
                                label={`${scan.confidence.toFixed(1)}${t('confidence_percent')}`}
                                variant={isHealthy ? 'success' : 'warning'}
                            />
                        </View>
                    </View>
                </Card>

                {/* Details Card */}
                <Card variant="outlined" style={styles.detailsCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }, scaledTypography.h3]}>{t('scan_info')}</Text>

                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                        {/* @ts-ignore */}
                        <Leaf size={20} color={colors.primary} />
                        <View style={styles.detailInfo}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }, scaledTypography.caption]}>{t('crop_type_label')}</Text>
                            <Text style={[styles.detailValue, { color: colors.textPrimary }, scaledTypography.body]}>{cropName}</Text>
                        </View>
                    </View>

                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                        {/* @ts-ignore */}
                        <Calendar size={20} color={colors.primary} />
                        <View style={styles.detailInfo}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }, scaledTypography.caption]}>{t('scanned_on_label')}</Text>
                            <Text style={[styles.detailValue, { color: colors.textPrimary }, scaledTypography.body]}>{formatDate(scan.created_at)}</Text>
                        </View>
                    </View>
                </Card>

                {/* Remedies Card */}
                {!isHealthy && scan.remedies && scan.remedies.length > 0 && (
                    <Card variant="elevated" style={styles.remediesCard}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }, scaledTypography.h3]}>{t('recommended_actions')}</Text>
                        {scan.remedies.map((remedy, index) => (
                            <View key={index} style={styles.remedyItem}>
                                <View style={[styles.remedyBullet, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.remedyNumber, { color: isHighContrast ? '#000' : '#fff' }]}>{index + 1}</Text>
                                </View>
                                <Text style={[styles.remedyText, { color: colors.textPrimary }, scaledTypography.body]}>{remedy}</Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Healthy Congrats */}
                {isHealthy && (
                    <View style={[styles.healthyCard, { backgroundColor: isHighContrast ? '#000' : colors.success + '20', borderWidth: isHighContrast ? 2 : 0, borderColor: colors.success }]}>
                        <Text style={[styles.healthyTitle, { color: colors.success }, scaledTypography.h2]}>{t('great_news')}</Text>
                        <Text style={[styles.healthyText, { color: colors.textPrimary }, scaledTypography.body]}>
                            {t('healthy_plant_desc').replace('{{crop}}', cropName)}
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    scanImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    imagePlaceholderText: {
        marginTop: SPACING.sm,
    },
    statusCard: {
        marginBottom: SPACING.md,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    statusInfo: {
        flex: 1,
        gap: SPACING.xs,
    },
    diseaseName: {
        fontWeight: 'bold',
    },
    detailsCard: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        marginBottom: SPACING.md,
        fontWeight: 'bold',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        marginBottom: 2,
    },
    detailValue: {
        fontWeight: '600',
    },
    remediesCard: {
        marginBottom: SPACING.md,
    },
    remedyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    remedyBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    remedyNumber: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    remedyText: {
        flex: 1,
    },
    healthyCard: {
        padding: SPACING.lg,
        borderRadius: 16,
        marginBottom: SPACING.md,
    },
    healthyTitle: {
        marginBottom: SPACING.sm,
    },
    healthyText: {
    },
});
