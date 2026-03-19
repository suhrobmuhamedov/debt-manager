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
    const [key, value] = pair.split('=');
    if (!key || value === undefined) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  const data = parseInitData(initData);
  const hash = data.hash;
  if (!hash) return null;

  delete data.hash;

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) return null;

  const id = Number(data.id);
  if (Number.isNaN(id)) return null;

  return {
    id,
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    language_code: data.language_code,
  };
}
