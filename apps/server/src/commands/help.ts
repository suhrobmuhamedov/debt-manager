import { Context } from 'telegraf';

export const helpCommand = async (ctx: Context) => {
  const webAppUrl = process.env.WEB_APP_URL || 'https://your-web-app-url.com';

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Ilovani ochish',
          web_app: { url: webAppUrl }
        }
      ]
    ]
  };

  await ctx.reply(
    `🆘 *Yordam*\n\n` +
    `Bu bot qarzlarni nazorat qilish uchun mo'ljallangan.\n\n` +
    `📋 *Buyruqlar:*\n` +
    `/start - Botni ishga tushirish\n` +
    `/help - Yordam\n` +
    `/balance - Balansni ko'rish\n\n` +
    `📱 *Ilova:*\n` +
    `Quyidagi tugmani bosib to'liq ilovani oching:`,
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    }
  );
};