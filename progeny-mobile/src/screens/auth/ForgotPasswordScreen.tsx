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

export default function ForgotPasswordScreen({ navigation }: Props) {
    const { colors, isHighContrast } = useTheme();
    const { t } = useLanguage();
    const { resetPasswordForEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetRequest = async () => {
        if (!email) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await resetPasswordForEmail(email);
            if (error) {
                Alert.alert(t('error'), error.message);
            } else {
                Alert.alert(
                    t('verification_sent_title'),
                    t('reset_email_sent_desc'),
                    [{ text: t('ok'), onPress: () => navigation.goBack() }]
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
                        <Logo size={80} style={{ marginBottom: SPACING.md }} />
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('forgot_password_title')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('forgot_password_subtitle')}</Text>
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

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleResetRequest}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isHighContrast ? '#000' : '#fff'} />
                            ) : (
                                <Text style={styles.buttonText}>{t('send_reset_link')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>{t('sign_in_link')}</Text>
                        </TouchableOpacity>
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
        textAlign: 'center',
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.md,
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
    footerLink: {
        ...TYPOGRAPHY.body,
        color: colors.primary,
        fontWeight: '600',
    },
});
