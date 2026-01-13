import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useColorScheme, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY } from '../styles/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
}

interface ScaledTypography {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    bodySecondary: TextStyle;
    label: TextStyle;
    caption: TextStyle;
}

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    isHighContrast: boolean;
    colors: ThemeColors;
    textScale: number;
    scaledTypography: ScaledTypography;
    getScaledFontSize: (baseSize: number) => number;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    toggleHighContrast: () => void;
    setTextScale: (scale: number) => void;
}


const lightColors: ThemeColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    textPrimary: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    border: COLORS.border,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
};

const darkColors: ThemeColors = {
    primary: '#4ADE80',
    secondary: '#FBBF24',
    background: '#0F172A',
    surface: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
};

const highContrastColors: ThemeColors = {
    primary: '#FFFF00', // Pure Yellow
    secondary: '#00FFFF', // Pure Cyan
    background: '#000000', // Pure Black
    surface: '#1A1A1A', // Very Dark Grey
    textPrimary: '#FFFFFF', // Pure White
    textSecondary: '#FFFFFF', // Pure White for HC
    border: '#FFFFFF', // Pure White border
    error: '#FF0000', // Pure Red
    success: '#00FF00', // Pure Green
    warning: '#FFFF00', // Pure Yellow
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@progeny_theme_mode';
const HC_STORAGE_KEY = '@progeny_high_contrast';
const TEXT_SCALE_KEY = '@progeny_text_scale';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [textScale, setTextScaleState] = useState(1.0); // Default: 1.0 (100%)

    // Load saved settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [savedMode, savedHC, savedTextScale] = await Promise.all([
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                    AsyncStorage.getItem(HC_STORAGE_KEY),
                    AsyncStorage.getItem(TEXT_SCALE_KEY)
                ]);

                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setModeState(savedMode as ThemeMode);
                }

                if (savedHC !== null) {
                    setIsHighContrast(savedHC === 'true');
                }

                if (savedTextScale !== null) {
                    const scale = parseFloat(savedTextScale);
                    if (!isNaN(scale) && scale >= 0.8 && scale <= 1.4) {
                        setTextScaleState(scale);
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, []);

    // Determine if dark mode should be active
    const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

    // Determine colors based on HC and Dark mode
    let colors = isDark ? darkColors : lightColors;
    if (isHighContrast) {
        colors = highContrastColors;
    }

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = isDark ? 'light' : 'dark';
        setMode(newMode);
    };

    const toggleHighContrast = async () => {
        const newValue = !isHighContrast;
        setIsHighContrast(newValue);
        try {
            await AsyncStorage.setItem(HC_STORAGE_KEY, String(newValue));
        } catch (error) {
            console.error('Error saving HC setting:', error);
        }
    };

    const setTextScale = async (scale: number) => {
        // Clamp scale between 0.8 and 1.4
        const clampedScale = Math.max(0.8, Math.min(1.4, scale));
        setTextScaleState(clampedScale);
        try {
            await AsyncStorage.setItem(TEXT_SCALE_KEY, String(clampedScale));
        } catch (error) {
            console.error('Error saving text scale:', error);
        }
    };

    // Helper function to scale any font size
    const getScaledFontSize = (baseSize: number): number => {
        return Math.round(baseSize * textScale);
    };

    // Create scaled typography object using useMemo for performance
    const scaledTypography: ScaledTypography = useMemo(() => ({
        h1: { ...TYPOGRAPHY.h1, fontSize: getScaledFontSize(28) },
        h2: { ...TYPOGRAPHY.h2, fontSize: getScaledFontSize(22) },
        h3: { ...TYPOGRAPHY.h3, fontSize: getScaledFontSize(18) },
        h4: { fontSize: getScaledFontSize(16), fontWeight: '600' as const },
        body: { ...TYPOGRAPHY.body, fontSize: getScaledFontSize(14) },
        bodySmall: { ...TYPOGRAPHY.bodySmall, fontSize: getScaledFontSize(13) },
        bodySecondary: { ...TYPOGRAPHY.bodySecondary, fontSize: getScaledFontSize(12) },
        label: { ...TYPOGRAPHY.label, fontSize: getScaledFontSize(14) },
        caption: { ...TYPOGRAPHY.caption, fontSize: getScaledFontSize(10) },
    }), [textScale]);

    return (
        <ThemeContext.Provider
            value={{
                mode,
                isDark,
                isHighContrast,
                colors,
                textScale,
                scaledTypography,
                getScaledFontSize,
                setMode,
                toggleTheme,
                toggleHighContrast,
                setTextScale,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );

}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

