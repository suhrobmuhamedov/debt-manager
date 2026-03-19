// Telegram Web App SDK wrapper
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
        };
        expand: () => void;
        close: () => void;
        ready: () => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export const isTelegram = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
};

export const getTelegramUser = (): TelegramUser | null => {
  if (!isTelegram()) return null;
  return window.Telegram!.WebApp.initDataUnsafe.user || null;
};

export const getInitData = (): string => {
  if (!isTelegram()) return '';
  return window.Telegram!.WebApp.initData;
};

export const expandApp = (): void => {
  if (!isTelegram()) return;
  window.Telegram!.WebApp.expand();
};

export const closeApp = (): void => {
  if (!isTelegram()) return;
  window.Telegram!.WebApp.close();
};

export const showBackButton = (onClick: () => void): void => {
  if (!isTelegram()) return;
  window.Telegram!.WebApp.BackButton.show();
  window.Telegram!.WebApp.BackButton.onClick(onClick);
};

export const hideBackButton = (): void => {
  if (!isTelegram()) return;
  window.Telegram!.WebApp.BackButton.hide();
  window.Telegram!.WebApp.BackButton.offClick(() => {});
};
