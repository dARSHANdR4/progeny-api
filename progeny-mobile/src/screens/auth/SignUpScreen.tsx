import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { Logo } from '../../components/Logo';
import { AuthAccessibilityToolbar } from '../../components/auth/AuthAccessibilityToolbar';

interface Props {
    navigation: any;
}

export default function SignUpScreen({ navigation }: Props) {
    const { colors, isHighContrast } = useTheme();
    const { t } = useLanguage();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signUp } = useAuth();

    const handleSignUp = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('error'), t('passwords_not_match'));
            return;
        }

        if (password.length < 6) {
            Alert.alert(t('error'), t('password_too_short'));
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await signUp(email, password, fullName);
            if (error) {
                Alert.alert(t('sign_up_failed'), error.message);
            } else {
                Alert.alert(
                    t('verification_sent_title'),
                    t('verification_sent_desc'),
                    [{ text: t('ok'), onPress: () => navigation.navigate('SignIn') }]
                );
            }
        } catch (error: any) {
            Alert.alert(t('error'), error.message || t('something_went_wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const styles = createStyles(colors, isHighContrast);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <AuthAccessibilityToolbar />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Header */}
                    <View style={styles.header}>
                        <Logo size={70} style={{ marginBottom: SPACING.md }} />
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('sign_up_title')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('sign_up_subtitle')}</Text>
                    </View>

                    {/* Form */}
                    <View style={[styles.form, { backgroundColor: colors.surface }]}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('full_name_label')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder={t('full_name_placeholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('email_label')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder={t('email_placeholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('password_label')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder={t('create_password_placeholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('confirm_password_label')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder={t('confirm_password_placeholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: colors.primary },
                                isLoading && styles.buttonDisabled
                            ]}
                            onPress={handleSignUp}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>{t('create_account_button')}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('already_account')} </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                <Text style={[styles.footerLink, { color: colors.primary }]}>{t('sign_in_link')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Plan Info */}
                    <View style={[
                        styles.planInfo,
                        {
                            backgroundColor: isHighContrast ? colors.background : colors.success + '1A',
                            borderColor: colors.success
                        }
                    ]}>
                        <Text style={[styles.planTitle, { color: colors.success }]}>{t('free_plan_includes')}</Text>
                        <View style={styles.planFeature}>
                            <Text style={[styles.checkIcon, { color: colors.success }]}>✓</Text>
                            <Text style={[styles.planFeatureText, { color: colors.success }]}>{t('feature_scans_day')}</Text>
                        </View>
                        <View style={styles.planFeature}>
                            <Text style={[styles.checkIcon, { color: colors.success }]}>✓</Text>
                            <Text style={[styles.planFeatureText, { color: colors.success }]}>{t('feature_basic_id')}</Text>
                        </View>
                        <View style={styles.planFeature}>
                            <Text style={[styles.checkIcon, { color: colors.success }]}>✓</Text>
                            <Text style={[styles.planFeatureText, { color: colors.success }]}>{t('feature_treatment')}</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any, isHighContrast: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
        marginTop: SPACING.xl * 2,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: colors.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    form: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.medium,
        borderWidth: isHighContrast ? 2 : 0,
        borderColor: colors.border,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.label,
        color: colors.textPrimary,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: 16,
        color: colors.textPrimary,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
        ...SHADOWS.small,
        borderWidth: isHighContrast ? 2 : 0,
        borderColor: colors.textPrimary,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: isHighContrast ? '#000' : '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    footerText: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
    },
    footerLink: {
        ...TYPOGRAPHY.body,
        color: colors.primary,
        fontWeight: '600',
    },
    planInfo: {
        marginTop: SPACING.lg,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    planTitle: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.sm,
    },
    planFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    checkIcon: {
        marginRight: SPACING.sm,
        fontWeight: 'bold',
    },
    planFeatureText: {
        ...TYPOGRAPHY.bodySmall,
    },
});
