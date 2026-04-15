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
          start_param?: string;
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
        platform?: string;
      };
    };
  }
}

type ShareResult = {
  opened: boolean;
  copiedFallback: boolean;
};

const copyToClipboardSafe = async (value: string): Promise<boolean> => {
  try {
    if (!navigator?.clipboard?.writeText) {
      return false;
    }
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

export async function shareToTelegram(link: string | null | undefined, text: string): Promise<ShareResult> {
  const encodedText = encodeURIComponent(text);
  const encodedLink = link ? encodeURIComponent(link) : null;

  const tgScheme = encodedLink
    ? `tg://msg_url?url=${encodedLink}&text=${encodedText}`
    : `tg://msg?text=${encodedText}`;
  const shareUrl = encodedLink
    ? `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`
    : `https://t.me/share/url?text=${encodedText}`;

  const webApp = window.Telegram?.WebApp;
  const platform = webApp?.platform || '';

  // Telegram Desktop webview sometimes blocks scheme/open operations.
  // We still try to open share URL, and copy text as fallback for manual paste.
  if (platform === 'tdesktop') {
    try {
      if (webApp?.openLink) {
        webApp.openLink(shareUrl);
        const copied = await copyToClipboardSafe(text);
        return { opened: true, copiedFallback: copied };
      }
    } catch {
      // Continue to next fallbacks.
    }
  }

  try {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(shareUrl);
      return { opened: true, copiedFallback: false };
    }
  } catch {
    // Continue to next fallback.
  }

  try {
    if (webApp?.openLink) {
      webApp.openLink(shareUrl);
      return { opened: true, copiedFallback: false };
    }
  } catch {
    // Continue to next fallback.
  }

  const openedViaScheme = window.open(tgScheme, '_blank');
  if (!openedViaScheme) {
    const copied = await copyToClipboardSafe(text);
    window.location.href = shareUrl;
    return { opened: false, copiedFallback: copied };
  }

  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = shareUrl;
    }
  }, 700);

  return { opened: true, copiedFallback: false };
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
