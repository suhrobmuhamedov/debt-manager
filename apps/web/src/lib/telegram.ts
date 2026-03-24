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
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
      };
    };
  }
}

export function shareToTelegram(link: string | null | undefined, text: string): void {
  const encodedText = encodeURIComponent(text);
  const encodedLink = link ? encodeURIComponent(link) : null;

  const tgScheme = encodedLink
    ? `tg://msg_url?url=${encodedLink}&text=${encodedText}`
    : `tg://msg?text=${encodedText}`;
  const shareUrl = encodedLink
    ? `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`
    : `https://t.me/share/url?text=${encodedText}`;

  const webApp = window.Telegram?.WebApp;
  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(shareUrl);
    return;
  }

  if (webApp?.openLink) {
    webApp.openLink(shareUrl);
    return;
  }

  const openedViaScheme = window.open(tgScheme, '_blank');
  if (!openedViaScheme) {
    window.open(shareUrl, '_blank');
    return;
  }

  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.open(shareUrl, '_blank');
    }
  }, 700);
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
