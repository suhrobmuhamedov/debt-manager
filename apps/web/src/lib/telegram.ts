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
  
  const initData = window.Telegram?.WebApp?.initData || '';
  
  // Debug logging
  if (!initData && typeof window !== 'undefined') {
    console.warn('⚠️ initData EMPTY on mobile!');
    console.warn('window.Telegram:', !!window.Telegram);
    console.warn('window.Telegram.WebApp:', !!window.Telegram?.WebApp);
    console.warn('Ensure: Bot launched via web_app button in BotFather!');
  }
  
  return initData;
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
