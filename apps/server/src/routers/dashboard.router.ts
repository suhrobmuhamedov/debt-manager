import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { debts, contacts, payments } from '../db/schema';
import { eq, and, isNull, inArray, sql } from 'drizzle-orm';

export const dashboardRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId!;

    // Get all debts with contacts for the user
    const allDebts = await db
      .select({
        debt: debts,
        contactName: contacts.name,
      })
      .from(debts)
      .leftJoin(contacts, eq(debts.contactId, contacts.id))
      .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)));

    // Calculate totals
    const totalGiven = allDebts
      .filter(d => d.debt.type === 'given')
      .reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    const totalTaken = allDebts
      .filter(d => d.debt.type === 'taken')
      .reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    // Status counts
    const pendingCount = allDebts.filter(d => d.debt.status === 'pending').length;
    const partialCount = allDebts.filter(d => d.debt.status === 'partial').length;
    const paidCount = allDebts.filter(d => d.debt.status === 'paid').length;

    // Overdue calculations
    const now = new Date();
    const overdueDebts = allDebts.filter(d =>
      d.debt.returnDate && new Date(d.debt.returnDate) < now && d.debt.status !== 'paid'
    );
    const overdueCount = overdueDebts.length;
    const overdueAmount = overdueDebts.reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    // Recent debts (last 5)
    const recentDebtRows = allDebts
      .sort((a, b) => {
        const aTime = a.debt.createdAt ? a.debt.createdAt.getTime() : 0;
        const bTime = b.debt.createdAt ? b.debt.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    const recentDebtIds = recentDebtRows.map((row) => row.debt.id);
    const paidAtRows = recentDebtIds.length
      ? await db
          .select({
            debtId: payments.debtId,
            paidAt: sql<Date | null>`MAX(${payments.paymentDate})`,
          })
          .from(payments)
          .where(inArray(payments.debtId, recentDebtIds))
          .groupBy(payments.debtId)
      : [];

    const paidAtByDebtId = new Map<number, Date | null>(
      paidAtRows.map((row) => [row.debtId, row.paidAt])
    );

    const recentDebts = recentDebtRows
      .map((d) => {
        const paidAt = paidAtByDebtId.get(d.debt.id) ?? (d.debt.status === 'paid' ? d.debt.updatedAt : null);
        return {
          id: d.debt.id,
          contactName: d.contactName || 'Unknown',
          amount: parseFloat(d.debt.amount),
          currency: d.debt.currency,
          type: d.debt.type,
          status: d.debt.status,
          paidAt: paidAt ? new Date(paidAt).toISOString().split('T')[0] : null,
          confirmationStatus: d.debt.confirmationStatus,
          confirmationExpiresAt: d.debt.confirmationExpiresAt ? d.debt.confirmationExpiresAt.toISOString() : null,
          linkedDebtId: d.debt.linkedDebtId,
          returnDate: d.debt.returnDate ? d.debt.returnDate.toISOString().split('T')[0] : null,
        };
      });

    return {
      totalGiven,
      totalTaken,
      pendingCount,
      partialCount,
      paidCount,
      overdueCount,
      overdueAmount,
      recentDebts,
    };
  }),
});
