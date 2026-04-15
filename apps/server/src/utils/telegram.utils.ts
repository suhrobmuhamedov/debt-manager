import * as crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function verifyTelegramInitData(
  initData: string,
  botToken: string
): TelegramUser | null {
  try {
    // DEV MODE - test user qaytaradi
    if (initData === 'dev_mode' || initData === '') {
      return {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'uz',
      };
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    // hash ni olib tashla
    urlParams.delete('hash');

    // Kalitlarni saralash
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // HMAC hisoblash
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      console.error('Hash mismatch:', { computedHash, hash });
      return null;
    }

    // user ma'lumotini olish
    const userString = urlParams.get('user');
    if (!userString) return null;

    const user = JSON.parse(decodeURIComponent(userString));
    return user as TelegramUser;

  } catch (error) {
    console.error('verifyTelegramInitData error:', error);
    return null;
  }
}
