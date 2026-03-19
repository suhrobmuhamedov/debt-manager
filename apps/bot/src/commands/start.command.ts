import { Context } from 'telegraf';
import { mainKeyboard } from '../utils/keyboards';

export async function startCommand(ctx: Context) {
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
