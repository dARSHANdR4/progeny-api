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

export default function ResetPasswordScreen({ navigation }: Props) {
    const { isDark, colors, isHighContrast } = useTheme();
    const { t } = useLanguage();
    const { updatePassword, setIsRecoveringPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert(t('error'), t('fill_all_fields'));
            return;
        }

        if (password.length < 6) {
            Alert.alert(t('error'), t('password_too_short'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('error'), t('passwords_not_match'));
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await updatePassword(password);
            if (error) {
                Alert.alert(t('error'), error.message);
            } else {
                setIsRecoveringPassword(false);
                Alert.alert(
                    t('reset_password_success_title') || t('reset_password_title'),
                    t('reset_password_success_desc') || t('success'),
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
                        <Logo size={80} style={{ marginBottom: SPACING.md }} />
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('reset_password_title')}</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('reset_password_subtitle')}</Text>
                    </View>

                    {/* Form */}
                    <View style={[styles.form, { backgroundColor: colors.surface }]}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>{t('new_password_label')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder={t('new_password_placeholder')}
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
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
                                autoCapitalize="none"
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isHighContrast ? '#000' : '#fff'} />
                            ) : (
                                <Text style={styles.buttonText}>{t('reset_password_title')}</Text>
                            )}
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
});
