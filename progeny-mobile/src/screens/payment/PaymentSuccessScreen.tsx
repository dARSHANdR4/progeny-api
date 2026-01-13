import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Home } from 'lucide-react-native';
import { SPACING, SHADOWS, TYPOGRAPHY } from '../../styles/theme';
import { stripeService } from '../../services/stripe';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface PaymentSuccessScreenProps {
    route?: {
        params?: {
            sessionId?: string;
        };
    };
    navigation?: any;
}

export default function PaymentSuccessScreen({ route, navigation }: PaymentSuccessScreenProps) {
    const { colors, isHighContrast, scaledTypography } = useTheme();
    const { t } = useLanguage();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { refreshUsage } = useSubscription();

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const sessionId = route?.params?.sessionId || 'demo_session';
                const result = await stripeService.verifyPayment(sessionId);

                if (result.success) {
                    setIsSuccess(true);
                    await refreshUsage();
                } else {
                    setError(t('pay_verify_failed'));
                }
            } catch (err) {
                setError(t('pay_verify_error'));
            } finally {
                setIsVerifying(false);
            }
        };

        verifyPayment();
    }, []);

    const handleGoHome = () => {
        navigation?.navigate('Detection');
    };

    if (isVerifying) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }, scaledTypography.body]}>{t('verifying_payment')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {isSuccess ? (
                    <>
                        <View style={[styles.iconContainer, { backgroundColor: isHighContrast ? '#000' : colors.success + '20', borderWidth: isHighContrast ? 2 : 0, borderColor: colors.success }]}>
                            {/* @ts-ignore */}
                            <CheckCircle size={80} color={colors.success} />
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }, scaledTypography.h1]}>{t('payment_success')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }, scaledTypography.body]}>
                            {t('payment_welcome')}
                        </Text>
                        <View style={[styles.benefitsCard, { backgroundColor: colors.surface, borderWidth: isHighContrast ? 2 : 0, borderColor: colors.border }]}>
                            <Text style={[styles.benefitsTitle, { color: isHighContrast ? colors.textPrimary : colors.secondary }, scaledTypography.h3]}>{t('premium_benefits')}</Text>
                            <Text style={[styles.benefitItem, { color: colors.textPrimary }, scaledTypography.body]}>{t('benefit_scans')}</Text>
                            <Text style={[styles.benefitItem, { color: colors.textPrimary }, scaledTypography.body]}>{t('benefit_support')}</Text>
                            <Text style={[styles.benefitItem, { color: colors.textPrimary }, scaledTypography.body]}>{t('benefit_remedies')}</Text>
                            <Text style={[styles.benefitItem, { color: colors.textPrimary }, scaledTypography.body]}>{t('benefit_voice')}</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={[styles.iconContainerError, { backgroundColor: isHighContrast ? '#000' : colors.error + '20', borderWidth: isHighContrast ? 2 : 0, borderColor: colors.error }]}>
                            {/* @ts-ignore */}
                            <XCircle size={80} color={colors.error} />
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }, scaledTypography.h1]}>{t('payment_issue')}</Text>
                        <Text style={[styles.errorText, { color: colors.error }, scaledTypography.body]}>{error}</Text>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.homeButton, { backgroundColor: colors.primary, borderWidth: isHighContrast ? 2 : 0, borderColor: '#000' }]}
                    onPress={handleGoHome}
                >
                    {/* @ts-ignore */}
                    <Home size={20} color={isHighContrast ? '#000' : "#fff"} />
                    <Text style={[styles.homeButtonText, { color: isHighContrast ? '#000' : "#fff" }, scaledTypography.body]}>{t('go_dashboard')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainerError: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    loadingText: {
        marginTop: SPACING.lg,
    },
    benefitsCard: {
        padding: SPACING.lg,
        borderRadius: 16,
        width: '100%',
        marginBottom: SPACING.xl,
        ...SHADOWS.medium,
    },
    benefitsTitle: {
        marginBottom: SPACING.md,
    },
    benefitItem: {
        marginBottom: SPACING.xs,
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 12,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    homeButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
