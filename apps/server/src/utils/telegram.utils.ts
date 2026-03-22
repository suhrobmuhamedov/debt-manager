import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

function parseInitData(initData: string): Record<string, string> {
  return initData.split('&').reduce<Record<string, string>>((acc, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) return acc;
    const key = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    if (!key || value === undefined) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) {
    console.warn('Telegram initData validation failed: missing hash');
    return null;
  }

  delete data.hash;

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    console.warn('Telegram initData validation failed: hash mismatch', {
      keys: Object.keys(data).sort(),
      auth_date: data.auth_date,
      hasUser: Boolean(data.user),
    });
    return null;
  }

  let user: TelegramUser | null = null;

  if (data.user) {
    try {
      user = JSON.parse(data.user) as TelegramUser;
    } catch {
      console.warn('Telegram initData validation failed: invalid user JSON');
      return null;
    }
  } else if (data.id) {
    const id = Number(data.id);
    if (Number.isNaN(id)) return null;

    user = {
      id,
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      language_code: data.language_code,
    };
  }

  if (!user || typeof user.id !== 'number' || !user.first_name) {
    console.warn('Telegram initData validation failed: incomplete user payload');
    return null;
  }

  return user;
}
