import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../styles/theme';

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

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    isHighContrast: boolean;
    colors: ThemeColors;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    toggleHighContrast: () => void;
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

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');
    const [isHighContrast, setIsHighContrast] = useState(false);

    // Load saved settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [savedMode, savedHC] = await Promise.all([
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                    AsyncStorage.getItem(HC_STORAGE_KEY)
                ]);

                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setModeState(savedMode as ThemeMode);
                }

                if (savedHC !== null) {
                    setIsHighContrast(savedHC === 'true');
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

    return (
        <ThemeContext.Provider
            value={{
                mode,
                isDark,
                isHighContrast,
                colors,
                setMode,
                toggleTheme,
                toggleHighContrast,
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
