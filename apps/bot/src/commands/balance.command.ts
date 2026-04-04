import { Context } from 'telegraf';
import axios from 'axios';
import { mainKeyboard } from '../utils/keyboards';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function balanceCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply('Telegram ID topilmadi.');
    return;
  }

  const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
  const endpoint = `${serverUrl}/api/internal/stats/${telegramId}`;

  try {
    let response;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await axios.get(endpoint, {
          headers: {
            'INTERNAL_API_KEY': process.env.INTERNAL_API_KEY,
          },
          timeout: 10000,
        });
        break;
      } catch (error: any) {
        lastError = error;

        const status = error?.response?.status;
        const shouldRetry = status === 502 || status === 503 || status === 504 || !status;
        if (!shouldRetry || attempt === 3) {
          throw lastError;
        }

        await sleep(700 * attempt);
      }
    }

    if (!response) {
      throw lastError;
    }

    const data = response.data;

    if (data.found === false) {
      const message = `Siz hali ro'yxatdan o'tmagansiz.
Ilovani oching va boshlang! 👇`;

      await ctx.reply(message, mainKeyboard);
      return;
    }

    const totalGivenText = Number(data.totalGiven || 0).toLocaleString('uz-UZ');
    const totalTakenText = Number(data.totalTaken || 0).toLocaleString('uz-UZ');
    const activeGivenCount = Number(data.activeGivenCount || 0);
    const activeTakenCount = Number(data.activeTakenCount || 0);
    const activeGivenTotalText = Number(data.activeGivenTotal || 0).toLocaleString('uz-UZ');
    const activeTakenTotalText = Number(data.activeTakenTotal || 0).toLocaleString('uz-UZ');
    const webAppUrl = process.env.WEB_APP_URL || '';
    const detailsLink = webAppUrl
      ? `<a href="${webAppUrl}">📊 Batafsil ko'rish uchun ilovani oching</a>`
      : `📊 Batafsil ko'rish uchun ilovani oching`;

    const message = `💰 Umumiy Holat:

📤 Berilgan qarzlar (jami): ${totalGivenText} so'm
Aktiv Berilgan qarzlar (${activeGivenCount} ta): ${activeGivenTotalText} so'm

📥 Olingan qarzlar (jami): ${totalTakenText} so'm
Aktiv Olingan qarzlar (${activeTakenCount} ta): ${activeTakenTotalText} so'm

${detailsLink}`;

    await ctx.replyWithHTML(message, mainKeyboard);
  } catch (error) {
    console.error('Balance fetch error:', error);
    const message = `Serverga ulanishda vaqtinchalik muammo bo'ldi.
Bir necha soniyadan keyin qayta urinib ko'ring. 👇`;

    await ctx.reply(message, mainKeyboard);
  }
}
