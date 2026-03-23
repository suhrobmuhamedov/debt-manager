import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../lib/i18n';
import { ThemeMode } from '../lib/theme';

export type Language = 'uz' | 'ru';

type SettingsState = {
  language: Language;
  theme: ThemeMode;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'uz',
      theme: 'system',
      setLanguage: (language) => {
        void i18n.changeLanguage(language);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('lang', language);
        }
        set({ language });
      },
      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: 'debt-manager-settings',
    }
  )
);
