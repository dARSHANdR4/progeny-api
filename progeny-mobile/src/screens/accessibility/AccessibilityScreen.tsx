import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, Linking, Share, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accessibility, Globe, Eye, Crown, ExternalLink, LogOut, Trash2, Github, Link2, Type, Download, Info, Phone, Mail, X, Users } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
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

// Team Members
const TEAM_MEMBERS = [
    { name: 'Darshan Ramakhyani', email: 'ramrakhyanidarshan@gmail.com', phone: '9024102842', color: '#3B82F6' },
    { name: 'Chandan Arora', email: 'arorachandan2004@gmail.com', phone: '8619084224', color: '#22C55E' },
    { name: 'Rachit Tripathi', email: '22cs93@ecajmer.ac.in', phone: '6350019449', color: '#A855F7' },
    { name: 'Parth Tripathi', email: 'parthdadhich15august@gmail.com', phone: '7339856367', color: '#F97316' },
];

// External Links
const GITHUB_URL = 'https://github.com/dARSHANdR4/progeny-api';
const PROGENY_WEBSITE_URL = 'https://progeny-api.vercel.app';

export default function AccessibilityScreen() {
    const { isPremium, signOut, isDemoMode } = useAuth();
    const { isDark, toggleTheme, isHighContrast, toggleHighContrast, colors, textScale, setTextScale } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [showSubscription, setShowSubscription] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const premiumColor = isHighContrast ? colors.primary : '#8B5CF6';


    const handleExportData = async () => {
        if (isDemoMode) {
            Alert.alert('Demo Mode', 'Data export is disabled in demo mode.');
            return;
        }

        setIsExporting(true);
        try {
            const result = await accountApi.exportData();
            if (result.success) {
                const jsonString = JSON.stringify(result.data, null, 2);
                await Share.share({
                    message: jsonString,
                    title: 'Progeny Data Export',
                });
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to export data.');
        } finally {
            setIsExporting(false);
        }
    };



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

                    {/* Text Size Control */}
                    <View style={[styles.settingItem, { borderBottomColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                        <View style={styles.textSizeHeader}>
                            {/* @ts-ignore */}
                            <Type size={18} color={colors.textPrimary} />
                            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('text_size')}</Text>
                            <Text style={[styles.textSizeValue, { color: colors.primary }]}>{Math.round(textScale * 100)}%</Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>A-</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={0.8}
                                maximumValue={1.4}
                                step={0.1}
                                value={textScale}
                                onValueChange={setTextScale}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.border}
                                thumbTintColor={colors.primary}
                            />
                            <Text style={[styles.sliderLabel, { color: colors.textSecondary, fontSize: 18 }]}>A+</Text>
                        </View>
                    </View>
                </View>

                {/* Data Section */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <View style={styles.sectionHeader}>
                        {/* @ts-ignore */}
                        <Download size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>{t('your_data')}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={handleExportData}
                        disabled={isExporting}
                    >
                        <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('export_my_data')}</Text>
                        {isExporting ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            /* @ts-ignore */
                            <ExternalLink size={16} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                </View>


                {/* Links Section */}
                <View style={[styles.section, dynamicStyles.section]}>
                    <View style={styles.sectionHeader}>
                        {/* @ts-ignore */}
                        <Link2 size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>{t('links')}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={() => Linking.openURL(GITHUB_URL)}
                    >
                        <View style={styles.linkItem}>
                            {/* @ts-ignore */}
                            <Github size={18} color={colors.textPrimary} />
                            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('github_repository')}</Text>
                        </View>
                        {/* @ts-ignore */}
                        <ExternalLink size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={() => Linking.openURL(PROGENY_WEBSITE_URL)}
                    >
                        <View style={styles.linkItem}>
                            {/* @ts-ignore */}
                            <Crown size={18} color={premiumColor} />
                            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('progeny_website')}</Text>
                        </View>
                        {/* @ts-ignore */}
                        <ExternalLink size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: colors.border }]}
                        onPress={() => setShowAboutModal(true)}
                    >
                        <View style={styles.linkItem}>
                            {/* @ts-ignore */}
                            <Info size={18} color={colors.textPrimary} />
                            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('about_us')}</Text>
                        </View>
                        {/* @ts-ignore */}
                        <ExternalLink size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomColor: 'transparent' }]}
                        onPress={() => setShowContactModal(true)}
                    >
                        <View style={styles.linkItem}>
                            {/* @ts-ignore */}
                            <Users size={18} color={colors.textPrimary} />
                            <Text style={[styles.settingLabel, dynamicStyles.settingLabel]}>{t('contact_support')}</Text>
                        </View>
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
                            <Text style={[styles.deleteAccountTxt, { color: isHighContrast ? "#000" : "#fff" }]}>{t('delete_account')}</Text>
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

            {/* About Us Modal */}
            <Modal visible={showAboutModal} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>About Progeny</Text>
                            <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                                {/* @ts-ignore */}
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollContent}>
                            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
                                Progeny is an AI-powered plant disease detection platform designed specifically for modern farmers.
                            </Text>

                            <View style={styles.featureList}>
                                <View style={[styles.featureItem, { backgroundColor: colors.background }]}>
                                    <Text style={styles.featureIcon}>⚡</Text>
                                    <View style={styles.featureText}>
                                        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Instant Disease Detection</Text>
                                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Get accurate diagnosis in seconds using AI</Text>
                                    </View>
                                </View>

                                <View style={[styles.featureItem, { backgroundColor: colors.background }]}>
                                    <Text style={styles.featureIcon}>📱</Text>
                                    <View style={styles.featureText}>
                                        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>User-Friendly Interface</Text>
                                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Simple design that works on any device</Text>
                                    </View>
                                </View>

                                <View style={[styles.featureItem, { backgroundColor: colors.background }]}>
                                    <Text style={styles.featureIcon}>🌱</Text>
                                    <View style={styles.featureText}>
                                        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>Treatment Recommendations</Text>
                                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Actionable treatment and prevention tips</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.howItWorks, { color: colors.textPrimary }]}>How It Works</Text>
                            <View style={styles.stepsContainer}>
                                <View style={styles.stepItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.stepNumberText, { color: isHighContrast ? '#000' : '#fff' }]}>1</Text>
                                    </View>
                                    <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Capture Image</Text>
                                </View>
                                <View style={styles.stepItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: '#22C55E' }]}>
                                        <Text style={styles.stepNumberText}>2</Text>
                                    </View>
                                    <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>AI Analysis</Text>
                                </View>
                                <View style={styles.stepItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: '#F97316' }]}>
                                        <Text style={styles.stepNumberText}>3</Text>
                                    </View>
                                    <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Get Results</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Contact Support Modal */}
            <Modal visible={showContactModal} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Contact Support</Text>
                            <TouchableOpacity onPress={() => setShowContactModal(false)}>
                                {/* @ts-ignore */}
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>
                            For urgent issues or account-related inquiries, please contact our team directly.
                        </Text>

                        <ScrollView style={styles.modalScrollContent}>
                            {TEAM_MEMBERS.map((member, index) => (
                                <View key={index} style={[styles.teamCard, { backgroundColor: colors.background, borderColor: member.color }]}>
                                    <View style={[styles.teamAvatar, { backgroundColor: member.color }]}>
                                        <Text style={styles.teamInitial}>{member.name.charAt(0)}</Text>
                                    </View>
                                    <Text style={[styles.teamName, { color: colors.textPrimary }]}>{member.name}</Text>

                                    <View style={styles.contactActions}>
                                        <TouchableOpacity
                                            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
                                            onPress={() => Linking.openURL(`mailto:${member.email}`)}
                                        >
                                            {/* @ts-ignore */}
                                            <Mail size={16} color={isHighContrast ? '#000' : '#fff'} />
                                            <Text style={[styles.contactBtnText, { color: isHighContrast ? '#000' : '#fff' }]}>Email</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.contactBtn, { backgroundColor: '#22C55E' }]}
                                            onPress={() => Linking.openURL(`tel:${member.phone}`)}
                                        >
                                            {/* @ts-ignore */}
                                            <Phone size={16} color="#fff" />
                                            <Text style={styles.contactBtnText}>Call</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    linkItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    textSizeHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    textSizeValue: { ...TYPOGRAPHY.body, fontWeight: 'bold', marginLeft: 'auto' },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    sliderLabel: { ...TYPOGRAPHY.body, fontSize: 14, fontWeight: 'bold' },
    slider: { flex: 1, height: 40 },

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
    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
    modalContent: { width: '100%', maxHeight: '80%', borderRadius: 20, padding: SPACING.lg, ...SHADOWS.large },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalScrollContent: { flexGrow: 1 },
    // About Modal Styles
    aboutDesc: { ...TYPOGRAPHY.body, textAlign: 'center', marginBottom: SPACING.lg },
    featureList: { gap: SPACING.md, marginBottom: SPACING.lg },
    featureItem: { flexDirection: 'row', alignItems: 'flex-start', padding: SPACING.md, borderRadius: 12, gap: SPACING.md },
    featureIcon: { fontSize: 24 },
    featureText: { flex: 1 },
    featureTitle: { ...TYPOGRAPHY.h4, fontWeight: 'bold', marginBottom: 4 },
    featureDesc: { ...TYPOGRAPHY.caption },
    howItWorks: { ...TYPOGRAPHY.h3, textAlign: 'center', marginBottom: SPACING.md },
    stepsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.lg },
    stepItem: { alignItems: 'center', flex: 1 },
    stepNumber: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
    stepNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    stepTitle: { ...TYPOGRAPHY.caption, fontWeight: '600', textAlign: 'center' },
    // Contact Modal Styles
    contactDesc: { ...TYPOGRAPHY.body, textAlign: 'center', marginBottom: SPACING.lg },
    teamCard: { alignItems: 'center', padding: SPACING.lg, borderRadius: 16, marginBottom: SPACING.md, borderWidth: 2, borderLeftWidth: 4 },
    teamAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
    teamInitial: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    teamName: { ...TYPOGRAPHY.h4, fontWeight: 'bold', marginBottom: SPACING.sm },
    contactActions: { flexDirection: 'row', gap: SPACING.md },
    contactBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 8, gap: SPACING.xs },
    contactBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});

