'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
    isRTL: boolean;
}

const defaultContext: LanguageContextType = {
    language: 'fr',
    setLanguage: () => {},
    t: (key: TranslationKey) => translations.fr[key] || key,
    isRTL: false,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('fr');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const savedLang = localStorage.getItem('language') as Language | null;
            if (savedLang && (savedLang === 'fr' || savedLang === 'ar' || savedLang === 'en')) {
                setLanguageState(savedLang);
            }
        } catch {
            // Ignore
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            if (typeof window !== 'undefined') localStorage.setItem('language', lang);
        } catch {
            // Ignore
        }
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || translations['fr'][key] || key;
    };

    const isRTL = language === 'ar';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
