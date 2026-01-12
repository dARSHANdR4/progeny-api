import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Home } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { stripeService } from '../../services/stripe';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface PaymentSuccessScreenProps {
    route?: {
        params?: {
            sessionId?: string;
        };
    };
    navigation?: any;
}

export default function PaymentSuccessScreen({ route, navigation }: PaymentSuccessScreenProps) {
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
                    setError('Payment verification failed. Please contact support.');
                }
            } catch (err) {
                setError('An error occurred while verifying your payment.');
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
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Verifying your payment...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {isSuccess ? (
                    <>
                        <View style={styles.iconContainer}>
                            {/* @ts-ignore */}
                            <CheckCircle size={80} color={COLORS.success} />
                        </View>
                        <Text style={styles.title}>Payment Successful!</Text>
                        <Text style={styles.subtitle}>
                            Welcome to Progeny Premium! You now have access to unlimited scans and expert support.
                        </Text>
                        <View style={styles.benefitsCard}>
                            <Text style={styles.benefitsTitle}>Your Premium Benefits:</Text>
                            <Text style={styles.benefitItem}>✓ Unlimited disease scans</Text>
                            <Text style={styles.benefitItem}>✓ Priority expert support</Text>
                            <Text style={styles.benefitItem}>✓ Advanced treatment plans</Text>
                            <Text style={styles.benefitItem}>✓ Voice AI Plus features</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.iconContainerError}>
                            {/* @ts-ignore */}
                            <XCircle size={80} color={COLORS.error} />
                        </View>
                        <Text style={styles.title}>Payment Issue</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </>
                )}

                <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                    {/* @ts-ignore */}
                    <Home size={20} color="#fff" />
                    <Text style={styles.homeButtonText}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        backgroundColor: COLORS.successLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainerError: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.errorLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    errorText: {
        ...TYPOGRAPHY.body,
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    loadingText: {
        ...TYPOGRAPHY.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.lg,
    },
    benefitsCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 16,
        width: '100%',
        marginBottom: SPACING.xl,
        ...SHADOWS.medium,
    },
    benefitsTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.premiumPurple,
        marginBottom: SPACING.md,
    },
    benefitItem: {
        ...TYPOGRAPHY.body,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 12,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    homeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
