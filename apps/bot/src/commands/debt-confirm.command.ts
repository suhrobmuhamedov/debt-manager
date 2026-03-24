import { Context, Markup } from 'telegraf';
import { confirmDebtByToken, denyDebtByToken, getConfirmationDetails } from '../utils/internal-api';

const formatAmount = (amount: number, currency: string): string => {
  return `${amount.toLocaleString('uz-UZ')} ${currency}`;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
};

const DEFAULT_BOT_USERNAME = 'Qarznazoratibot';

const resolveBotUsername = (): string => {
  const raw = (process.env.BOT_USERNAME || DEFAULT_BOT_USERNAME).trim();
  return raw.replace(/^@+/, '');
};

const extractStartPayload = (ctx: Context): string => {
  const text = 'text' in (ctx.message || {}) ? String((ctx.message as { text?: string }).text || '') : '';
  const parts = text.trim().split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ').trim() : '';
};

export const handleDebtConfirmStartPayload = async (ctx: Context): Promise<boolean> => {
  const payload = extractStartPayload(ctx);
  if (!payload.startsWith('confirm_')) {
    return false;
  }

  const token = payload.replace(/^confirm_/, '').trim();
  if (!token) {
    await ctx.reply("❌ Bu havola yaroqsiz yoki muddati o'tgan.\nQarz egasidan yangi havola so'rang.");
    return true;
  }

  try {
    const details = await getConfirmationDetails(token);

    if (!details.isValid) {
      if (details.isExpired) {
        await ctx.reply("❌ Bu havola yaroqsiz yoki muddati o'tgan.\nQarz egasidan yangi havola so'rang.");
        return true;
      }

      if (details.status === 'confirmed') {
        await ctx.reply('✅ Bu qarz allaqachon tasdiqlangan.');
        return true;
      }

      if (details.status === 'denied') {
        await ctx.reply('⚠️ Bu qarz allaqachon inkor qilingan.');
        return true;
      }

      await ctx.reply('❌ Bu havola yaroqsiz.');
      return true;
    }

    const detailsText = `📋 Qarz ma'lumotlari:\n─────────────────────\n👤 Kimdan: ${details.creatorFirstName}\n💰 Miqdor: ${formatAmount(details.amount, details.currency)}\n📅 Qaytarish muddati: ${formatDate(details.returnDate)}\n📝 Tur: ${details.typeLabel}\n─────────────────────\nSiz bu qarzni tasdiqlaysizmi?`;

    await ctx.reply(
      detailsText,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Tasdiqlandi', `debt_confirm_${token}`),
          Markup.button.callback('⚠️ Inkor qilish', `debt_deny_${token}`),
        ],
      ])
    );

    return true;
  } catch (error) {
    console.error('handleDebtConfirmStartPayload error:', error);
    await ctx.reply("❌ Bu havola yaroqsiz yoki muddati o'tgan.\nQarz egasidan yangi havola so'rang.");
    return true;
  }
};

export const handleDebtConfirmCallback = async (ctx: Context, token: string) => {
  try {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.answerCbQuery('Telegram ID topilmadi', { show_alert: true });
      return;
    }

    await confirmDebtByToken({
      token,
      telegramId,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      username: ctx.from?.username,
    });

    const botUsername = resolveBotUsername();
    const loginDeepLink = `https://t.me/${botUsername}?start=login_${token}`;

    await ctx.editMessageText(
      "✅ Qarz tasdiqlandi!\nKeyingi bosqich uchun botdagi kirish tugmasini bosing.",
      Markup.inlineKeyboard([
        [Markup.button.url('🤖 Botga kirish', loginDeepLink)],
      ])
    );

    await ctx.answerCbQuery('Tasdiqlandi');
  } catch (error) {
    console.error('handleDebtConfirmCallback error:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi', { show_alert: true });
    await ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.");
  }
};

export const handleDebtDenyCallback = async (ctx: Context, token: string) => {
  try {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.answerCbQuery('Telegram ID topilmadi', { show_alert: true });
      return;
    }

    await denyDebtByToken({
      token,
      telegramId,
      denierName: ctx.from?.first_name,
    });

    await ctx.editMessageText(
      "⚠️ Siz qarzni inkor qildingiz.\nQarz egasi bu haqda xabardor qilindi."
    );

    await ctx.answerCbQuery('Inkor qilindi');
  } catch (error) {
    console.error('handleDebtDenyCallback error:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi', { show_alert: true });
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
};
