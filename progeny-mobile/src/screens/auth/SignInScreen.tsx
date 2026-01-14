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
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { Logo } from '../../components/Logo';
import { AuthAccessibilityToolbar } from '../../components/auth/AuthAccessibilityToolbar';

interface Props {
    navigation: any;
}

export default function SignInScreen({ navigation }: Props) {
    const { colors, isHighContrast } = useTheme();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) {
                Alert.alert(t('sign_in_failed'), error.message);
            }
            // Navigation will happen automatically via AuthContext
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
                        <Logo size={80} style={{ marginBottom: SPACING.md }} />
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('sign_in_title')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('sign_in_subtitle')}</Text>
                    </View>

                    {/* Form */}
                    <View style={[styles.form, { backgroundColor: colors.surface }]}>
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
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                    placeholder={t('password_placeholder')}
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={colors.textSecondary} />
                                    ) : (
                                        <Eye size={20} color={colors.textSecondary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ForgotPassword')}
                                style={styles.forgotPasswordContainer}
                            >
                                <Text style={styles.forgotPasswordText}>{t('forgot_password_link')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: colors.primary },
                                isLoading && styles.buttonDisabled
                            ]}
                            onPress={handleSignIn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>{t('sign_in_button')}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('no_account')} </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                <Text style={[styles.footerLink, { color: colors.primary }]}>{t('sign_up_link')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Features List */}
                    <View style={styles.features}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>🌿</Text>
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{t('feature_scans_day')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📱</Text>
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{t('feature_basic_id')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>⚡</Text>
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{t('feature_treatment')}</Text>
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
        marginBottom: SPACING.xl,
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        paddingRight: 50, // Space for the eye icon
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.md,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xs,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginTop: SPACING.xs,
    },
    forgotPasswordText: {
        ...TYPOGRAPHY.label,
        color: colors.primary,
        fontWeight: '600',
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
    features: {
        marginTop: SPACING.xl,
        padding: SPACING.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    featureIcon: {
        fontSize: 20,
        marginRight: SPACING.sm,
    },
    featureText: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
    },
});
