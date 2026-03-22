// Telegram WebApp SDK type
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        BackButton: {
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
        MainButton: {
          show: () => void
          hide: () => void
        }
      }
    }
  }
}

export function isTelegram(): boolean {
  // Development mode uchun - localhost da ham ishlaydi
  if (import.meta.env.DEV) return true

  return !!(window.Telegram?.WebApp?.initData || window.Telegram?.WebApp)
}

export function getTelegramUser() {
  if (import.meta.env.DEV) {
    // Development uchun test user
    return {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'uz',
    }
  }
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null
}

export function getInitData(): string {
  if (import.meta.env.DEV) {
    return 'dev_mode'
  }
  return window.Telegram?.WebApp?.initData || ''
}

export function expandApp(): void {
  window.Telegram?.WebApp?.expand()
}

export function readyApp(): void {
  window.Telegram?.WebApp?.ready()
}

export function showBackButton(onClick: () => void): void {
  window.Telegram?.WebApp?.BackButton?.show()
  window.Telegram?.WebApp?.BackButton?.onClick(onClick)
}

export function hideBackButton(): void {
  window.Telegram?.WebApp?.BackButton?.hide()
}
