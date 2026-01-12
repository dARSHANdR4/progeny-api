import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Leaf, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { Card, Badge } from '../../components/ui';

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
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isHealthy = scan.disease_name.toLowerCase().includes('healthy');
    const StatusIcon = isHealthy ? CheckCircle : AlertTriangle;
    const statusColor = isHealthy ? COLORS.success : COLORS.warning;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation?.goBack()}
                >
                    {/* @ts-ignore */}
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Image Preview */}
                {scan.image_url ? (
                    <Image source={{ uri: scan.image_url }} style={styles.scanImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        {/* @ts-ignore */}
                        <Leaf size={48} color={COLORS.textSecondary} />
                        <Text style={styles.imagePlaceholderText}>No image available</Text>
                    </View>
                )}

                {/* Status Card */}
                <Card variant="elevated" style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        {/* @ts-ignore */}
                        <StatusIcon size={32} color={statusColor} />
                        <View style={styles.statusInfo}>
                            <Text style={styles.diseaseName}>{scan.disease_name}</Text>
                            <Badge
                                label={`${scan.confidence.toFixed(1)}% confidence`}
                                variant={isHealthy ? 'success' : 'warning'}
                            />
                        </View>
                    </View>
                </Card>

                {/* Details Card */}
                <Card variant="outlined" style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Scan Information</Text>

                    <View style={styles.detailRow}>
                        {/* @ts-ignore */}
                        <Leaf size={20} color={COLORS.primary} />
                        <View style={styles.detailInfo}>
                            <Text style={styles.detailLabel}>Crop Type</Text>
                            <Text style={styles.detailValue}>{scan.crop_type}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        {/* @ts-ignore */}
                        <Calendar size={20} color={COLORS.primary} />
                        <View style={styles.detailInfo}>
                            <Text style={styles.detailLabel}>Scanned On</Text>
                            <Text style={styles.detailValue}>{formatDate(scan.created_at)}</Text>
                        </View>
                    </View>
                </Card>

                {/* Remedies Card */}
                {!isHealthy && scan.remedies && scan.remedies.length > 0 && (
                    <Card variant="elevated" style={styles.remediesCard}>
                        <Text style={styles.sectionTitle}>Recommended Actions</Text>
                        {scan.remedies.map((remedy, index) => (
                            <View key={index} style={styles.remedyItem}>
                                <View style={styles.remedyBullet}>
                                    <Text style={styles.remedyNumber}>{index + 1}</Text>
                                </View>
                                <Text style={styles.remedyText}>{remedy}</Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Healthy Congrats */}
                {isHealthy && (
                    <Card variant="elevated" style={styles.healthyCard}>
                        <Text style={styles.healthyTitle}>🎉 Great News!</Text>
                        <Text style={styles.healthyText}>
                            Your {scan.crop_type} plant appears to be healthy. Keep up the good work with your farming practices!
                        </Text>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
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
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    imagePlaceholderText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
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
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
    },
    detailsCard: {
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
    },
    detailValue: {
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
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
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    remedyNumber: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    remedyText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
        flex: 1,
    },
    healthyCard: {
        backgroundColor: COLORS.successLight,
        marginBottom: SPACING.md,
    },
    healthyTitle: {
        ...TYPOGRAPHY.h2,
        color: '#15803D',
        marginBottom: SPACING.sm,
    },
    healthyText: {
        ...TYPOGRAPHY.body,
        color: '#166534',
    },
});
