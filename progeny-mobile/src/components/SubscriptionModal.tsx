import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { X, Check, Crown, Zap, Shield } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { paymentApi } from '../services/api';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
}

// Features moved inside component for localization

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
    const { colors, isDark, isHighContrast } = useTheme();
    const { t } = useLanguage();

    const PREMIUM_FEATURES = [
        { title: t('feature_unlimited'), description: t('feature_unlimited_desc'), icon: Zap },
        { title: t('feature_expert'), description: t('feature_expert_desc'), icon: Shield },
        { title: t('feature_remedies'), description: t('feature_remedies_desc'), icon: Check },
        { title: t('feature_voice'), description: t('feature_voice_desc'), icon: Crown },
    ];

    const [isLoading, setIsLoading] = React.useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const data = await paymentApi.createCheckout('premium_monthly');
            if (data?.url) {
                Alert.alert(
                    'Checkout Initiated',
                    'Redirecting to secure payment page...',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                Linking.openURL(data.url);
                                onClose();
                            }
                        }
                    ]
                );
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Payment initiation failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const premiumColor = isHighContrast ? colors.primary : '#8B5CF6';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalContent,
                    {
                        backgroundColor: colors.surface,
                        borderWidth: isHighContrast ? 2 : 0,
                        borderColor: colors.border
                    }
                ]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: isHighContrast ? 2 : 1 }]}>
                        <View style={styles.headerTitleRow}>
                            {/* @ts-ignore */}
                            <Crown size={28} color={premiumColor} />
                            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('premium_title')}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            {/* @ts-ignore */}
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {t('premium_subtitle')}
                        </Text>

                        {/* Features List */}
                        <View style={styles.featuresList}>
                            {PREMIUM_FEATURES.map((feature, index) => (
                                <View key={index} style={styles.featureItem}>
                                    <View style={[
                                        styles.featureIconContainer,
                                        { backgroundColor: isHighContrast ? '#000' : (isDark ? '#4c1d95' : '#F3E8FF'), borderWidth: isHighContrast ? 1 : 0, borderColor: colors.border }
                                    ]}>
                                        {/* @ts-ignore */}
                                        <feature.icon size={20} color={premiumColor} />
                                    </View>
                                    <View style={styles.featureTextContainer}>
                                        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{feature.title}</Text>
                                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{feature.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Pricing Card */}
                        <View style={[
                            styles.priceCard,
                            {
                                backgroundColor: colors.background,
                                borderColor: premiumColor,
                                borderWidth: isHighContrast ? 3 : 2
                            }
                        ]}>
                            <View style={[styles.bestValueBadge, { backgroundColor: premiumColor }]}>
                                <Text style={[styles.bestValueText, { color: isHighContrast ? '#000' : '#fff' }]}>{t('popular')}</Text>
                            </View>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{t('monthly_plan')}</Text>
                            <View style={styles.priceRow}>
                                <Text style={[styles.currency, { color: colors.textPrimary }]}>₹</Text>
                                <Text style={[styles.amount, { color: colors.textPrimary }]}>200</Text>
                                <Text style={[styles.period, { color: colors.textSecondary }]}>{t('per_month')}</Text>
                            </View>
                            <Text style={[styles.savingsText, { color: colors.success }]}>{t('save_billing')}</Text>
                        </View>

                        <Text style={[styles.footerNote, { color: colors.textSecondary, opacity: 0.6 }]}>
                            {t('stripe_note')}
                        </Text>
                    </ScrollView>

                    {/* Bottom Action */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.upgradeBtn,
                                { backgroundColor: premiumColor },
                                isLoading && styles.disabled
                            ]}
                            onPress={handleUpgrade}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isHighContrast ? "#000" : "#fff"} />
                            ) : (
                                <Text style={[styles.upgradeBtnText, { color: isHighContrast ? "#000" : "#fff" }]}>{t('upgrade_now')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        paddingBottom: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    title: {
        ...TYPOGRAPHY.h2,
    },
    closeBtn: {
        padding: 4,
    },
    scrollBody: {
        padding: SPACING.lg,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    featuresList: {
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    featureItem: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    featureIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    },
    featureDesc: {
        ...TYPOGRAPHY.bodySecondary,
    },
    priceCard: {
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        position: 'relative',
        marginBottom: SPACING.lg,
    },
    bestValueBadge: {
        position: 'absolute',
        top: -12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bestValueText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    priceLabel: {
        ...TYPOGRAPHY.label,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: SPACING.xs,
    },
    currency: {
        ...TYPOGRAPHY.h2,
        fontSize: 20,
        marginTop: 4,
    },
    amount: {
        ...TYPOGRAPHY.h1,
        fontSize: 48,
    },
    period: {
        ...TYPOGRAPHY.body,
        fontSize: 18,
        alignSelf: 'flex-end',
        marginBottom: 8,
    },
    savingsText: {
        ...TYPOGRAPHY.caption,
        fontWeight: 'bold',
        marginTop: SPACING.sm,
    },
    footerNote: {
        ...TYPOGRAPHY.caption,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
    },
    footer: {
        paddingHorizontal: SPACING.lg,
    },
    upgradeBtn: {
        paddingVertical: SPACING.md,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    upgradeBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabled: {
        opacity: 0.6,
    },
});
