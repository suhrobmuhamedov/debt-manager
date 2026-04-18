import { Context } from 'telegraf';
import { createAdminLinkToken } from '../utils/internal-api';

const getAdminTelegramId = () => String(process.env.ADMIN_TELEGRAM_ID || '').trim();
const getAdminBotSecret = () => String(process.env.ADMIN_BOT_SECRET || '').trim();

const extractCommandArgument = (ctx: Context): string => {
  const text = 'text' in (ctx.message || {}) ? String((ctx.message as { text?: string }).text || '') : '';
  const parts = text.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ').trim() : '';
};

const buildAdminLink = (token: string): string => {
  const baseUrl = String(process.env.WEB_APP_URL || '').trim();
  if (!baseUrl) {
    throw new Error('WEB_APP_URL is missing');
  }

  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/$/, '');
  url.pathname = `${basePath}/a-panel`;
  url.searchParams.set('t', token);
  return url.toString();
};

export async function adminCommand(ctx: Context) {
  const senderTelegramId = String(ctx.from?.id || '').trim();
  const adminTelegramId = getAdminTelegramId();
  const adminSecret = getAdminBotSecret();
  const providedSecret = extractCommandArgument(ctx);

  if (!adminTelegramId || !adminSecret) {
    await ctx.reply('Admin sozlamalari topilmadi.');
    return;
  }

  if (!senderTelegramId || senderTelegramId !== adminTelegramId) {
    await ctx.reply('Sizda admin ruxsat yo‘q.');
    return;
  }

  if (!providedSecret || providedSecret !== adminSecret) {
    await ctx.reply('Maxfiy kalit noto‘g‘ri. Format: /admin <secret>');
    return;
  }

  try {
    const tokenResponse = await createAdminLinkToken(senderTelegramId);
    const adminLink = buildAdminLink(tokenResponse.token);
    const expiresMinutes = Math.max(1, Math.round(tokenResponse.expiresIn / 60));

    await ctx.reply(
      `Admin havolasi tayyor.\n\nHavola ${expiresMinutes} daqiqa ishlaydi:\n${adminLink}`
    );
  } catch (error) {
    console.error('Admin link generate xatosi:', error);
    await ctx.reply('Admin havolasini yaratib bo‘lmadi. Qayta urinib ko‘ring.');
  }
}
