import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ru } from '../locales/ru';
import { uz } from '../locales/uz';

const getInitialLanguage = (): 'uz' | 'ru' => {
  if (typeof window === 'undefined') return 'uz';
  const saved = window.localStorage.getItem('lang');
  return saved === 'ru' ? 'ru' : 'uz';
};

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'uz',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
