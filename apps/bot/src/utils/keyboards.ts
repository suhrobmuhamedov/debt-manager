import { Markup } from 'telegraf';

export const mainKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.webApp('📊 Ilovani ochish', process.env.WEB_APP_URL!),
  ],
  [
    Markup.button.callback('💰 Balans', 'show_balance'),
    Markup.button.callback('❓ Yordam', 'show_help'),
  ],
]);

export const helpText = `
🤖 *Debt Manager Bot* yordami

Bu bot sizga qarzlarni boshqarishda yordam beradi:
- Qarz berish va olishni kuzatish
- To'lovlarni qayd qilish
- Eslatmalar olish

**Qanday ishlatish:**
1. /start buyrug'ini bosing
2. "📊 Ilovani ochish" tugmasini bosing
3. Web ilovada qarzlarni qo'shing va boshqaring

**Muammo bo'lsa:**
@Muhamedov_S ga yozing
`;
