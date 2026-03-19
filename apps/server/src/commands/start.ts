import { Context } from 'telegraf';

export const startCommand = async (ctx: Context) => {
  const user = ctx.from;
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
    `👋 Salom ${user?.first_name || 'foydalanuvchi'}!\n\n` +
    `💰 Qarz nazorati botiga xush kelibsiz!\n\n` +
    `📱 Quyidagi tugmani bosib ilovani oching:`,
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    }
  );
};