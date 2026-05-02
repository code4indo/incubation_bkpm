import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'id' | 'en';

export interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = 'bkpm-language';

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'id') return stored;
  } catch { /* localStorage unavailable */ }
  return 'id';
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  // Sync to localStorage on every change — this is the runtime source of truth
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch { /* ignore */ }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* ignore */ }
  };

  const toggleLanguage = () => {
    setLanguageState((prev: Language) => prev === 'id' ? 'en' : 'id');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
