import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Text,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Sun, Moon, Grid3X3, Languages, X } from 'lucide-react-native';
import { SPACING, SHADOWS } from '../../styles/theme';
import { LanguageType } from '../../localization/translations';

const { width } = Dimensions.get('window');

export function AuthAccessibilityToolbar() {
    const { isDark, toggleTheme, isHighContrast, toggleHighContrast, colors } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [showLangModal, setShowLangModal] = useState(false);

    const languages: { code: LanguageType; name: string; native: string }[] = [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'mr', name: 'Marathi', native: 'मराठी' },
    ];

    return (
        <View style={styles.toolbar}>
            {/* Theme Toggle */}
            <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surface }]}
                onPress={toggleTheme}
                accessibilityLabel="Toggle Theme"
            >
                {isDark ? (
                    <Sun size={20} color={colors.primary} />
                ) : (
                    <Moon size={20} color={colors.primary} />
                )}
            </TouchableOpacity>

            {/* High Contrast Toggle */}
            <TouchableOpacity
                style={[
                    styles.iconButton,
                    { backgroundColor: colors.surface },
                    isHighContrast && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={toggleHighContrast}
                accessibilityLabel="Toggle High Contrast"
            >
                <Grid3X3 size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Language Switcher */}
            <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowLangModal(true)}
                accessibilityLabel="Select Language"
            >
                <Languages size={20} color={colors.primary} />
                <Text style={[styles.langText, { color: colors.textPrimary }]}>
                    {language.toUpperCase()}
                </Text>
            </TouchableOpacity>

            {/* Language Selection Modal */}
            <Modal
                visible={showLangModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLangModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                {t('select_language')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowLangModal(false)}>
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.langList}>
                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.langItem,
                                        { borderBottomColor: colors.border },
                                        language === lang.code && { backgroundColor: isHighContrast ? colors.primary : colors.background }
                                    ]}
                                    onPress={() => {
                                        setLanguage(lang.code);
                                        setShowLangModal(false);
                                    }}
                                >
                                    <View>
                                        <Text style={[
                                            styles.langName,
                                            { color: colors.textPrimary },
                                            language === lang.code && { fontWeight: 'bold', color: isHighContrast ? '#000' : colors.primary }
                                        ]}>
                                            {lang.name}
                                        </Text>
                                        <Text style={[
                                            styles.langNative,
                                            { color: colors.textSecondary },
                                            language === lang.code && { color: isHighContrast ? '#000' : colors.primary }
                                        ]}>
                                            {lang.native}
                                        </Text>
                                    </View>
                                    {language === lang.code && (
                                        <View style={[styles.activeDot, { backgroundColor: isHighContrast ? '#000' : colors.primary }]} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: {
        flexDirection: 'row',
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        right: SPACING.lg,
        zIndex: 100,
        gap: SPACING.sm,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        ...SHADOWS.small,
    },
    langText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.85,
        maxHeight: '70%',
        borderRadius: 20,
        padding: SPACING.lg,
        ...SHADOWS.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    langList: {
        width: '100%',
    },
    langItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderBottomWidth: 1,
    },
    langName: {
        fontSize: 16,
    },
    langNative: {
        fontSize: 12,
        marginTop: 2,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
