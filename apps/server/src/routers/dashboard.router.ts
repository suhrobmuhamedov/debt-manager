import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { debts, contacts, payments } from '../db/schema';
import { eq, and, isNull, inArray, sql, sum, count, desc, gte, lte } from 'drizzle-orm';

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId!;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // ✅ PARALLEL: 8 ta query bir vaqtda bajariladi (~sequential o'rniga bitta round-trip)
    const [
      givenStats,
      takenStats,
      givenCountResult,
      takenCountResult,
      statusCounts,
      overdueStats,
      recentDebtRows,
      paidThisMonthResult,
    ] = await Promise.all([
      // 1. Berilgan aktiv qarzlar jami (paid bo'lmagan)
      db.select({ total: sum(debts.amount) })
        .from(debts)
        .where(and(eq(debts.userId, userId), eq(debts.type, 'given'), sql`${debts.status} != 'paid'`, isNull(debts.deletedAt))),

      // 2. Olingan aktiv qarzlar jami (paid bo'lmagan)
      db.select({ total: sum(debts.amount) })
        .from(debts)
        .where(and(eq(debts.userId, userId), eq(debts.type, 'taken'), sql`${debts.status} != 'paid'`, isNull(debts.deletedAt))),

      // 3a. Berilgan qarzlar soni (paid bo'lmagan)
      db.select({ cnt: count() })
        .from(debts)
        .where(and(eq(debts.userId, userId), eq(debts.type, 'given'), sql`${debts.status} != 'paid'`, isNull(debts.deletedAt))),

      // 3b. Olingan qarzlar soni (paid bo'lmagan)
      db.select({ cnt: count() })
        .from(debts)
        .where(and(eq(debts.userId, userId), eq(debts.type, 'taken'), sql`${debts.status} != 'paid'`, isNull(debts.deletedAt))),

      // 4. Holat bo'yicha guruhlangan soni (3 alohida query o'rniga 1 ta)
      db.select({ status: debts.status, cnt: count() })
        .from(debts)
        .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)))
        .groupBy(debts.status),

      // 5. Muddati o'tgan qarzlar (returnDate < bugun AND status != 'paid')
      db.select({ count: count(), total: sum(debts.amount) })
        .from(debts)
        .where(
          and(
            eq(debts.userId, userId),
            isNull(debts.deletedAt),
            sql`${debts.status} != 'paid'`,
            sql`${debts.returnDate} < ${todayStr}`
          )
        ),

      // 6. So'nggi 5 qarz — contact nomi bilan JOIN (N+1 yo'q)
      db.select({
        id: debts.id,
        amount: debts.amount,
        paidAmount: debts.paidAmount,
        currency: debts.currency,
        type: debts.type,
        status: debts.status,
        returnDate: debts.returnDate,
        createdAt: debts.createdAt,
        updatedAt: debts.updatedAt,
        confirmationStatus: debts.confirmationStatus,
        confirmationExpiresAt: debts.confirmationExpiresAt,
        linkedDebtId: debts.linkedDebtId,
        contactName: contacts.name,
      })
        .from(debts)
        .leftJoin(contacts, eq(debts.contactId, contacts.id))
        .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)))
        .orderBy(desc(debts.createdAt))
        .limit(5),

      // 7. Shu oy to'langan summa (debts orqali userId filtri)
      db.select({ total: sum(payments.amount) })
        .from(payments)
        .innerJoin(debts, and(eq(payments.debtId, debts.id), eq(debts.userId, userId)))
        .where(
          and(
            gte(payments.paymentDate, startOfMonth),
            lte(payments.paymentDate, endOfMonth)
          )
        ),
    ]);

    // So'nggi qarzlar uchun to'lov sanalarini olish (faqat kerak bo'lsa)
    const recentDebtIds = recentDebtRows.map(r => r.id);
    const paidAtRows = recentDebtIds.length
      ? await db
          .select({
            debtId: payments.debtId,
            paidAt: sql<string | null>`MAX(${payments.paymentDate})`,
          })
          .from(payments)
          .where(inArray(payments.debtId, recentDebtIds))
          .groupBy(payments.debtId)
      : [];

    const paidAtByDebtId = new Map<number, string | null>(
      paidAtRows.map(row => [row.debtId, row.paidAt])
    );

    const recentDebts = recentDebtRows.map(d => ({
      id: d.id,
      contactName: d.contactName || 'Unknown',
      amount: d.amount,
      paidAmount: d.paidAmount,
      currency: d.currency,
      type: d.type,
      status: d.status,
      paidAt: paidAtByDebtId.get(d.id) ?? (d.status === 'paid' ? d.updatedAt?.toISOString().split('T')[0] ?? null : null),
      confirmationStatus: d.confirmationStatus,
      confirmationExpiresAt: d.confirmationExpiresAt ? d.confirmationExpiresAt.toISOString() : null,
      linkedDebtId: d.linkedDebtId,
      returnDate: d.returnDate ? new Date(d.returnDate).toISOString().split('T')[0] : null,
    }));

    return {
      totalGiven: Number(givenStats[0]?.total ?? 0),
      givenCount: Number(givenCountResult[0]?.cnt ?? 0),
      totalTaken: Number(takenStats[0]?.total ?? 0),
      takenCount: Number(takenCountResult[0]?.cnt ?? 0),
      pendingCount: Number(statusCounts.find(r => r.status === 'pending')?.cnt ?? 0),
      partialCount: Number(statusCounts.find(r => r.status === 'partial')?.cnt ?? 0),
      paidCount: Number(statusCounts.find(r => r.status === 'paid')?.cnt ?? 0),
      overdueCount: Number(overdueStats[0]?.count ?? 0),
      overdueAmount: Number(overdueStats[0]?.total ?? 0),
      paidThisMonth: Number(paidThisMonthResult[0]?.total ?? 0),
      recentDebts,
    };
  }),
});
