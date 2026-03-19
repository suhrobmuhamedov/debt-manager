import { Context } from 'telegraf';
import axios from 'axios';
import { mainKeyboard } from '../utils/keyboards';

export async function balanceCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.reply('Telegram ID topilmadi.');
    return;
  }

  const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
  const endpoint = `${serverUrl}/api/internal/stats/${telegramId}`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        'INTERNAL_API_KEY': process.env.INTERNAL_API_KEY,
      },
    });
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
    const message = `Siz hali ro'yxatdan o'tmagansiz.
Ilovani oching va boshlang! 👇`;

    await ctx.reply(message, mainKeyboard);
  }
}
