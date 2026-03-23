import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './lib/i18n';
import i18n from './lib/i18n';
import { applyTheme, watchSystemTheme } from './lib/theme';
import { useSettingsStore } from './store/settingsStore';

// Initialize Telegram Web App
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
}

const syncSettings = () => {
  const { theme, language } = useSettingsStore.getState();
  applyTheme(theme);
  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
};

syncSettings();

let cleanupSystemTheme = watchSystemTheme(() => {
  const { theme } = useSettingsStore.getState();
  if (theme === 'system') {
    applyTheme('system');
  }
});

useSettingsStore.subscribe((state, previous) => {
  if (state.language !== previous.language) {
    void i18n.changeLanguage(state.language);
  }

  if (state.theme !== previous.theme) {
    applyTheme(state.theme);
  }

  if (state.theme === 'system' && previous.theme !== 'system') {
    cleanupSystemTheme();
    cleanupSystemTheme = watchSystemTheme(() => applyTheme('system'));
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);