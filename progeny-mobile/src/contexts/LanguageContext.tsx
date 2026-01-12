import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, LanguageType } from '../localization/translations';

interface LanguageContextType {
    language: LanguageType;
    setLanguage: (lang: LanguageType) => Promise<void>;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@progeny_app_language';

interface LanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<LanguageType>('en');

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLanguage && (['en', 'hi', 'te', 'ta', 'kn', 'mr'] as string[]).includes(savedLanguage)) {
                    setLanguageState(savedLanguage as LanguageType);
                }
            } catch (error) {
                console.error('Error loading language:', error);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (newLang: LanguageType) => {
        setLanguageState(newLang);
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key: string): string => {
        // @ts-ignore
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
