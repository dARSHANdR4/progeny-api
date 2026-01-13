import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accessibility, Globe, Volume2, Eye, Crown, ExternalLink, LogOut, Trash2 } from 'lucide-react-native';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import SubscriptionModal from '../../components/SubscriptionModal';
import { accountApi } from '../../services/api';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
];

export default function AccessibilityScreen() {
    const { isPremium, signOut, isDemoMode } = useAuth();
    const { isDark, toggleTheme, isHighContrast, toggleHighContrast, colors } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [showSubscription, setShowSubscription] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const premiumColor = isHighContrast ? colors.primary : '#8B5CF6';


    const handleSignOut = () => {
        if (isDemoMode) {
            Alert.alert(
                'Demo Mode',
                'Sign out is disabled in demo mode. In the real app, this would log you out.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }
            ]
        );
    };

    const handleDeleteAccount = () => {
        if (isDemoMode) {
            Alert.alert(
                'Demo Mode',
                'Account deletion is disabled in demo mode.',
                [{ text: 'OK' }]
            );
            return;
        }

        // First confirmation
        Alert.alert(
            '⚠️ Delete Account',
            'This will permanently delete your account and ALL your data including:\n\n• Scan history\n• Posts & comments\n• Subscription (no refunds)\n• All personal information\n\nThis action CANNOT be undone!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete My Account',
                    style: 'destructive',
                    onPress: () => {
                        // Second confirmation
                        Alert.alert(
                            '🚨 Final Confirmation',
                            'Are you ABSOLUTELY SURE you want to delete your account? Your data will be gone forever.',
                            [
                                { text: 'No, Keep My Account', style: 'cancel' },
                                {
                                    text: 'Yes, Delete Forever',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setIsDeleting(true);
                                        try {
                                            await accountApi.deleteAccount();
                                            Alert.alert(
                                                'Account Deleted',
                                                'Your account and all data have been permanently deleted. Thank you for using Progeny.',
                                                [{ text: 'OK', onPress: () => signOut() }]
                                            );
                                        } catch (error: any) {
                                            Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const handleLanguageSelect = (langCode: string) => {
        setLanguage(langCode as any);
        setShowLanguageModal(false);
    };


    const currentLanguage = LANGUAGES.find(l => l.code === language)?.name || 'English';

    // Dynamic styles based on theme
    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        header: { backgroundColor: colors.surface, borderBottomColor: colors.border },
        title: { color: colors.textPrimary },
        section: { backgroundColor: colors.surface },
        sectionTitle: { color: colors.textPrimary },
        settingLabel: { color: colors.textPrimary },
        settingValue: { color: colors.textSecondary },
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            <View style={[styles.header, dynamicStyles.header]}>
                {/* @ts-ignore */}
                <Accessibility size={24} color={colors.primary} />
                <Text style={[styles.title, dynamicStyles.title]}>{t('accessibility')}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Subscription Section */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <View style={styles.premiumBanner}>
                        {/* @ts-ignore */}
                        <Crown size={32} color={premiumColor} />
                        <View style={styles.bannerText}>
                            <Text style={[styles.bannerTitle, { color: premiumColor }]}>
                                {isPremium ? 'Progeny Premium' : t('unlock_premium')}
                            </Text>
                            <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
                                {isPremium ? 'Thank you for supporting sustainable farming!' : t('premium_desc')}
                            </Text>
                        </View>
                        {!isPremium && (
                            <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: premiumColor }]} onPress={() => setShowSubscription(true)}>
                                <Text style={[styles.upgradeTxt, { color: isHighContrast ? '#000' : '#fff' }]}>{t('upgrade')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Language Modal */}
                {showLanguageModal && (
                    <View style={[styles.languageModal, dynamicStyles.section, isHighContrast && { borderWidth: 2, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, dynamicStyles.sectionTitle]}>{t('select_language')}</Text>
                        {LANGUAGES.map(lang => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[styles.languageOption, language === lang.code && { backgroundColor: colors.primary }]}
                                onPress={() => handleLanguageSelect(lang.code)}
                            >
                                <Text style={[styles.languageText, { color: language === lang.code ? (isHighContrast ? '#000' : '#fff') : colors.textPrimary }]}>
                                    {lang.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalClose} onPress={() => setShowLanguageModal(false)}>
                            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Language Selection Item */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <View style={styles.sectionHeader}>
                        {/* @ts-ignore */}
                        <Globe size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>{t('language')}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={() => setShowLanguageModal(true)}
                    >
                        <View>
                            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('app_language')}</Text>
                        </View>
                        <View style={styles.settingValueContainer}>
                            <Text style={[styles.settingValue, dynamicStyles.settingValue]}>{currentLanguage}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Voice & Notifications */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <View style={styles.sectionHeader}>
                        {/* @ts-ignore */}
                        <Volume2 size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>{t('voice_notifications')}</Text>
                    </View>

                    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('voice_commands')}</Text>
                        <Switch
                            value={voiceEnabled}
                            onValueChange={(val) => {
                                setVoiceEnabled(val);
                                Alert.alert('Voice Settings', `Voice commands ${val ? 'enabled' : 'disabled'}`);
                            }}
                            trackColor={{ false: colors.border, true: colors.primary + '60' }}
                            thumbColor={voiceEnabled ? colors.primary : colors.textSecondary}
                        />
                    </View>

                    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('push_notifications')}</Text>
                        <Switch
                            value={pushEnabled}
                            onValueChange={(val) => {
                                setPushEnabled(val);
                                Alert.alert('Notification Settings', `Push notifications ${val ? 'enabled' : 'disabled'}`);
                            }}
                            trackColor={{ false: colors.border, true: colors.primary + '60' }}
                            thumbColor={pushEnabled ? colors.primary : colors.textSecondary}
                        />
                    </View>
                </View>

                {/* Display Section */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <View style={styles.sectionHeader}>
                        {/* @ts-ignore */}
                        <Eye size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>{t('display')}</Text>
                    </View>

                    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('high_contrast')}</Text>
                        <Switch
                            value={isHighContrast}
                            onValueChange={(val) => {
                                toggleHighContrast();
                            }}
                            trackColor={{ false: colors.border, true: colors.primary + '60' }}
                            thumbColor={isHighContrast ? colors.primary : colors.textSecondary}
                        />
                    </View>

                    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('dark_mode')}</Text>
                        <Switch
                            value={isDark}
                            onValueChange={(val) => {
                                toggleTheme();
                            }}
                            trackColor={{ false: colors.border, true: colors.primary + '60' }}
                            thumbColor={isDark ? colors.primary : colors.textSecondary}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginBottom: SPACING.md }]}>{t('support')}</Text>
                    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('help_center')}</Text>
                        {/* @ts-ignore */}
                        <ExternalLink size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('privacy_policy')}</Text>
                        {/* @ts-ignore */}
                        <ExternalLink size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Sign Out Section */}
                <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.surface, borderColor: colors.error }]} onPress={handleSignOut}>
                    {/* @ts-ignore */}
                    <LogOut size={20} color={colors.error} />
                    <Text style={[styles.signOutTxt, { color: colors.error }]}>{t('sign_out')}</Text>
                </TouchableOpacity>

                {/* Delete Account Section */}
                <TouchableOpacity
                    style={[styles.deleteAccountBtn, { backgroundColor: colors.error }]}
                    onPress={handleDeleteAccount}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator size="small" color={isHighContrast ? "#000" : "#fff"} />
                    ) : (
                        <>
                            {/* @ts-ignore */}
                            <Trash2 size={20} color={isHighContrast ? "#000" : "#fff"} />
                            <Text style={[styles.deleteAccountTxt, { color: isHighContrast ? "#000" : "#fff" }]}>Delete Account</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.aboutContainer}>
                    <Text style={[styles.versionTxt, { color: colors.textSecondary }]}>Progeny Mobile v1.0.0</Text>
                    <Text style={[styles.copyrightTxt, { color: colors.textSecondary }]}>© 2026 Progeny AI Technologies</Text>
                    {isDemoMode && <Text style={styles.demoTxt}>🎮 DEMO MODE</Text>}

                </View>
            </ScrollView>

            <SubscriptionModal visible={showSubscription} onClose={() => setShowSubscription(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        gap: SPACING.sm,
        ...SHADOWS.small,
    },
    title: { ...TYPOGRAPHY.h2 },
    content: { padding: SPACING.lg },
    section: {
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.small,
    },
    premiumBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    bannerText: { flex: 1 },
    bannerTitle: { ...TYPOGRAPHY.h3, color: '#8B5CF6' },
    bannerDesc: { ...TYPOGRAPHY.caption },
    upgradeBtn: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
    },
    upgradeTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
    sectionTitle: { ...TYPOGRAPHY.h3 },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    settingLabel: { ...TYPOGRAPHY.body, fontWeight: '500' },
    settingValue: { ...TYPOGRAPHY.body, opacity: 0.7 },
    settingValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    languageModal: {
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.medium,
    },
    modalTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md, textAlign: 'center' },
    languageOption: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: 8, marginBottom: SPACING.xs },
    languageText: { ...TYPOGRAPHY.body },
    modalClose: { marginTop: SPACING.md, alignItems: 'center' },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    signOutTxt: { ...TYPOGRAPHY.h3 },
    deleteAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: 16,
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    deleteAccountTxt: { ...TYPOGRAPHY.h3, fontWeight: 'bold' },
    aboutContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
    versionTxt: { ...TYPOGRAPHY.caption },
    copyrightTxt: { ...TYPOGRAPHY.caption },
    demoTxt: { ...TYPOGRAPHY.caption, color: '#F59E0B', marginTop: SPACING.sm, fontWeight: 'bold' },
});

