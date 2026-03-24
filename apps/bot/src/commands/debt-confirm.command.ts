import { Context, Markup } from 'telegraf';
import { confirmDebtByToken, denyDebtByToken } from '../utils/internal-api';

type AxiosLikeError = {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const getApiErrorMessage = (error: unknown): string => {
  const e = error as AxiosLikeError;
  const status = e?.response?.status;
  const apiMessage = e?.response?.data?.error || e?.response?.data?.message;

  if (status === 404) {
    return "❌ Bu havola yaroqsiz yoki muddati o'tgan.\nQarz egasidan yangi havola so'rang.";
  }

  if (status === 400 && apiMessage) {
    const msg = apiMessage.toLowerCase();
    if (msg.includes('expired') || msg.includes('token') || msg.includes('used') || msg.includes('not found')) {
      return "❌ Bu havola yaroqsiz yoki muddati o'tgan.\nQarz egasidan yangi havola so'rang.";
    }
  }

  if (status === 401) {
    return '❌ Server avtorizatsiya xatosi. ADMIN ga murojaat qiling.';
  }

  if (status === 500) {
    return '❌ Server ichki xatosi (500). Birozdan keyin urinib ko\'ring yoki admin loglarini tekshirsin.';
  }

  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') {
    return '❌ Serverga ulanish timeout bo\'ldi. SERVER_URL va tarmoq holatini tekshiring.';
  }

  if (e?.code === 'ECONNREFUSED' || e?.code === 'ENOTFOUND') {
    return '❌ Serverga ulanib bo\'lmadi. SERVER_URL noto\'g\'ri yoki server ishlamayapti.';
  }

  return '❌ Server bilan aloqa xatosi. Keyinroq qayta urinib ko\'ring.';
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
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.reply('❌ Telegram ID topilmadi.');
      return true;
    }

    await confirmDebtByToken({
      token,
      telegramId,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      username: ctx.from?.username,
    });

    const telegramUserId = ctx.from?.id ? String(ctx.from.id) : '';
    const baseUrl = process.env.WEB_APP_URL || '';
    if (baseUrl) {
      const loginUrl = new URL(baseUrl);
      if (telegramUserId) {
        loginUrl.searchParams.set('tgUserId', telegramUserId);
      }
      loginUrl.searchParams.set('source', 'debt_confirm');

      await ctx.reply(
        "✅ Qarz tasdiqlandi.\nilovaga kirish uchun kirish tugmasini bosing",
        Markup.inlineKeyboard([
          [Markup.button.webApp('🔐 Kirish', loginUrl.toString())],
        ])
      );
    } else {
      await ctx.reply("✅ Qarz tasdiqlandi.");
    }

    return true;
  } catch (error) {
    console.error('handleDebtConfirmStartPayload error:', error);
    await ctx.reply(getApiErrorMessage(error));
    return true;
  }
};

export const handleDebtDenyStartPayload = async (ctx: Context): Promise<boolean> => {
  const payload = extractStartPayload(ctx);
  if (!payload.startsWith('deny_')) {
    return false;
  }

  const token = payload.replace(/^deny_/, '').trim();
  if (!token) {
    await ctx.reply("❌ Bu havola yaroqsiz yoki muddati o'tgan.");
    return true;
  }

  try {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.reply('❌ Telegram ID topilmadi.');
      return true;
    }

    await denyDebtByToken({
      token,
      telegramId,
      denierName: ctx.from?.first_name,
    });

    await ctx.reply('⚠️ Qarzni inkor qildingiz. Qarz egasiga xabar yuborildi.');
    return true;
  } catch (error) {
    console.error('handleDebtDenyStartPayload error:', error);
    await ctx.reply(getApiErrorMessage(error));
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
    await ctx.reply(getApiErrorMessage(error));
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
    await ctx.reply(getApiErrorMessage(error));
  }
};
