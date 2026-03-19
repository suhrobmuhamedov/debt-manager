import { Context } from 'telegraf';
import { db } from '../db';
import { debts, contacts, users } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const balanceCommand = async (ctx: Context) => {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('❌ Foydalanuvchi aniqlanmadi');
    return;
  }

  try {
    // Look up the app user by Telegram ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, String(telegramId)))
      .limit(1);

    if (!user) {
      await ctx.reply('❌ Foydalanuvchi topilmadi. Iltimos, /start buyrug\'ini yuboring.');
      return;
    }

    const allDebts = await db
      .select({ debt: debts })
      .from(debts)
      .leftJoin(contacts, eq(debts.contactId, contacts.id))
      .where(and(eq(debts.userId, user.id), isNull(debts.deletedAt)));

    const totalGiven = allDebts
      .filter(d => d.debt.type === 'given')
      .reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    const totalTaken = allDebts
      .filter(d => d.debt.type === 'taken')
      .reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    const pendingCount = allDebts.filter(d => d.debt.status === 'pending').length;
    const now = new Date();
    const overdueCount = allDebts.filter(d =>
      d.debt.returnDate && new Date(d.debt.returnDate) < now && d.debt.status !== 'paid'
    ).length;

    const stats = { totalGiven, totalTaken, pendingCount, overdueCount };
    const netBalance = totalGiven - totalTaken;

    const message =
      `💰 *Sizning balansingiz*\n\n` +
      `📈 Berilgan qarzlar: ${totalGiven.toLocaleString()} so'm\n` +
      `📉 Olingan qarzlar: ${totalTaken.toLocaleString()} so'm\n` +
      `⚖️ Netto balans: ${netBalance >= 0 ? '+' : ''}${netBalance.toLocaleString()} so'm\n\n` +
      `📊 Kutilayotgan: ${stats.pendingCount} ta\n` +
      `⚠️ Muddat o'tgan: ${stats.overdueCount} ta`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Balance command error:', error);
    await ctx.reply('❌ Balansni olishda xatolik yuz berdi');
  }
};