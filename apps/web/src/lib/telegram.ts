declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
        };
      };
    };
  }
}

export function isTelegram(): boolean {
  // Dev modeda ham ishlaydi
  if (import.meta.env.DEV) return true;
  return typeof window !== 'undefined' &&
         !!window.Telegram?.WebApp;
}

export function getInitData(): string {
  if (import.meta.env.DEV) {
    return 'dev_mode';
  }
  return window.Telegram?.WebApp?.initData || '';
}

export function expandApp(): void {
  try {
    window.Telegram?.WebApp?.expand();
  } catch (e) {
    // ignore
  }
}

export function readyApp(): void {
  try {
    window.Telegram?.WebApp?.ready();
  } catch (e) {
    // ignore
  }
}
