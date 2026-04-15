export type ThemeMode = 'light' | 'dark' | 'system';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  const telegramTheme = (
    window.Telegram?.WebApp as { colorScheme?: 'light' | 'dark' } | undefined
  )?.colorScheme;
  if (telegramTheme === 'light' || telegramTheme === 'dark') {
    return telegramTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: ThemeMode): void => {
  if (typeof document === 'undefined') return;

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
};

export const watchSystemTheme = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => callback();
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
};
