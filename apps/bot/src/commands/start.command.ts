import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { mainKeyboard } from '../utils/keyboards';
import { handleDebtConfirmStartPayload, handleDebtDenyStartPayload } from './debt-confirm.command';
import { syncBotUser } from '../utils/internal-api';

const extractStartPayload = (ctx: Context): string => {
  const text = 'text' in (ctx.message || {}) ? String((ctx.message as { text?: string }).text || '') : '';
  const parts = text.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ').trim() : '';
};

export async function startCommand(ctx: Context) {
  if (ctx.from?.id && ctx.from.first_name) {
    try {
      await syncBotUser({
        telegramId: String(ctx.from.id),
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
        languageCode: ctx.from.language_code,
      });
    } catch (error) {
      console.error('Bot user sync failed:', error);
    }
  }

  const handled = await handleDebtConfirmStartPayload(ctx);
  if (handled) {
    return;
  }

  const denyHandled = await handleDebtDenyStartPayload(ctx);
  if (denyHandled) {
    return;
  }

  const payload = extractStartPayload(ctx);
  if (payload.startsWith('login_')) {
    const telegramUserId = ctx.from?.id ? String(ctx.from.id) : '';
    const baseUrl = process.env.WEB_APP_URL || '';

    if (!baseUrl) {
      await ctx.reply("ilovaga kirish uchun kirish tugmasini bosing");
      return;
    }

    const loginUrl = new URL(baseUrl);
    if (telegramUserId) {
      loginUrl.searchParams.set('tgUserId', telegramUserId);
    }
    loginUrl.searchParams.set('source', 'debt_confirm');

    await ctx.reply(
      'ilovaga kirish uchun kirish tugmasini bosing',
      Markup.inlineKeyboard([
        [Markup.button.webApp('🔐 Kirish', loginUrl.toString())],
      ])
    );
    return;
  }

  const firstName = ctx.from?.first_name || 'Foydalanuvchi';

  const message = `Salom ${firstName}! 👋

💳 Qarz Daftarim — shaxsiy qarz
boshqaruv ilovangiz.

✅ Qarzlaringizni kiriting
✅ To'lovlarni kuzating
✅ Muddatlarni unutmang

👇 Ilovani oching:`;

  await ctx.reply(message, mainKeyboard);
}
