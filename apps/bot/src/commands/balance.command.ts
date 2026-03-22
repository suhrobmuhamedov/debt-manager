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

    // Assuming the response has: totalGiven, totalTaken, overdueCount, pendingCount
    const message = `💰 Sizning balans:

📤 Berilgan qarzlar: ${data.totalGiven?.toLocaleString() || 0} so'm
📥 Olingan qarzlar: ${data.totalTaken?.toLocaleString() || 0} so'm
⚠️ Muddati o'tgan: ${data.overdueCount || 0} ta
⏳ Kutayotgan: ${data.pendingCount || 0} ta

📊 Batafsil ko'rish uchun ilovani oching`;

    await ctx.reply(message, mainKeyboard);
  } catch (error) {
    console.error('Balance fetch error:', error);
    const message = `Serverga ulanishda vaqtinchalik muammo bo'ldi.
Bir necha soniyadan keyin qayta urinib ko'ring. 👇`;

    await ctx.reply(message, mainKeyboard);
  }
}
