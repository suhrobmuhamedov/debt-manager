import { Markup } from 'telegraf';

export const mainKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.webApp('📊 Ilovani ochish', process.env.WEB_APP_URL!),
  ],
  [
    Markup.button.callback('💰 Umumiy Holat', 'show_balance'),
    Markup.button.callback('✍️ Taklif va shikoyat', 'show_help'),
  ],
]);

export const helpText = `
✍️ Taklif va shikoyat

Ilovadagi xatolik, taklif yoki shikoyatlaringizni quyidagi manzilga yuboring:
@Muhamedov_S

Xabaringizda iloji bo'lsa quyidagilarni yozing:
- Muammo nimada
- Qaysi sahifada yuz berdi
- Telefon modeli (ixtiyoriy)
`;
