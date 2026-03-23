import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { debts, payments } from '../db/schema';

export const paymentsRouter = router({
  adjustDebt: protectedProcedure
    .input(
      z.object({
        debtId: z.number(),
        amount: z.number().positive(),
        action: z.enum(['increase', 'payment']),
        actionDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [currentDebt] = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, input.debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
        .limit(1);

      if (!currentDebt) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found or access denied' });
      }

      const currentTotal = parseFloat(currentDebt.amount);
      const currentPaid = parseFloat(currentDebt.paidAmount);
      const remainingAmount = currentTotal - currentPaid;

      if (input.action === 'payment' && input.amount > remainingAmount) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment amount exceeds remaining debt' });
      }

      const result = await db.transaction(async (tx) => {
        const nextTotal = input.action === 'increase' ? currentTotal + input.amount : currentTotal;
        const nextPaid = input.action === 'payment' ? currentPaid + input.amount : currentPaid;
        const nextStatus = nextPaid === 0 ? 'pending' : nextPaid >= nextTotal ? 'paid' : 'partial';

        await tx
          .insert(payments)
          .values({
            debtId: input.debtId,
            amount: input.amount.toString(),
            paymentDate: new Date(input.actionDate),
            note: input.action === 'increase' ? 'debt_increase:Qarzga qo\'shildi' : 'debt_payment:Qisman qaytarildi',
          })
          .execute();

        const [timelineEntry] = await tx
          .select()
          .from(payments)
          .where(eq(payments.id, sql`LAST_INSERT_ID()`))
          .limit(1);

        await tx
          .update(debts)
          .set({
            amount: nextTotal.toString(),
            paidAmount: nextPaid.toString(),
            status: nextStatus,
          })
          .where(eq(debts.id, input.debtId));

        const [updatedDebt] = await tx
          .select()
          .from(debts)
          .where(eq(debts.id, input.debtId))
          .limit(1);

        return { entry: timelineEntry, debt: updatedDebt };
      });

      return result;
    }),

  addPayment: protectedProcedure
    .input(
      z.object({
        debtId: z.number(),
        amount: z.number().positive(),
        paymentDate: z.string(), // assuming ISO date string
        note: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      // Check debt ownership and get debt details
      const debt = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, input.debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
        .limit(1);

      if (!debt.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found or access denied' });
      }

      const currentDebt = debt[0];

      if (currentDebt.status === 'paid') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Debt is already paid' });
      }

      const remainingAmount = parseFloat(currentDebt.amount) - parseFloat(currentDebt.paidAmount);
      if (input.amount > remainingAmount) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment amount exceeds remaining debt' });
      }

      // Transaction: create payment and update debt
      const result = await db.transaction(async (tx) => {
        // Insert payment
        await tx
          .insert(payments)
          .values({
            debtId: input.debtId,
            amount: input.amount.toString(), // decimal as string
            paymentDate: new Date(input.paymentDate),
            note: input.note,
          })
          .execute();

        // Get the inserted payment id (since MySQL doesn't support returning)
        const insertedPayment = await tx
          .select()
          .from(payments)
          .where(eq(payments.id, sql`LAST_INSERT_ID()`))
          .limit(1);

        if (!insertedPayment.length) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create payment' });
        }

        const payment = insertedPayment[0];

        // Update debt paidAmount
        const newPaidAmount = parseFloat(currentDebt.paidAmount) + input.amount;
        const newStatus = newPaidAmount === parseFloat(currentDebt.amount) ? 'paid' :
                         newPaidAmount > 0 ? 'partial' : 'pending';

        await tx
          .update(debts)
          .set({
            paidAmount: newPaidAmount.toString(),
            status: newStatus,
          })
          .where(eq(debts.id, input.debtId));

        // Get updated debt
        const [updatedDebt] = await tx
          .select()
          .from(debts)
          .where(eq(debts.id, input.debtId))
          .limit(1);

        return { payment, debt: updatedDebt };
      });

      return result;
    }),

  getByDebt: protectedProcedure
    .input(z.object({ debtId: z.number() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      // Check debt ownership
      const debtCheck = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, input.debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
        .limit(1);

      if (!debtCheck.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Debt not found or access denied' });
      }

      // Get payments
      const paymentList = await db
        .select()
        .from(payments)
        .where(eq(payments.debtId, input.debtId))
        .orderBy(sql`${payments.paymentDate} DESC`);

      return paymentList;
    }),

  deletePayment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      // Get payment and check ownership via debt
      const paymentWithDebt = await db
        .select({
          payment: payments,
          debtUserId: debts.userId,
        })
        .from(payments)
        .innerJoin(debts, eq(payments.debtId, debts.id))
        .where(and(eq(payments.id, input.id), isNull(debts.deletedAt)))
        .limit(1);

      if (!paymentWithDebt.length || paymentWithDebt[0].debtUserId !== userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment not found or access denied' });
      }

      const debtId = paymentWithDebt[0].payment.debtId;

      // Transaction: delete payment and recalculate debt
      await db.transaction(async (tx) => {
        // Delete payment
        await tx.delete(payments).where(eq(payments.id, input.id));

        // Recalculate paidAmount
        const sumResult = await tx
          .select({
            total: sql<string>`COALESCE(SUM(CASE WHEN ${payments.note} LIKE 'debt_increase:%' THEN 0 ELSE ${payments.amount} END), 0)`,
          })
          .from(payments)
          .where(eq(payments.debtId, debtId));

        const newPaidAmount = sumResult[0]?.total ? parseFloat(sumResult[0].total) : 0;

        // Update debt
        const [debt] = await tx
          .select()
          .from(debts)
          .where(eq(debts.id, debtId))
          .limit(1);

        if (debt) {
          const newStatus = newPaidAmount === parseFloat(debt.amount) ? 'paid' :
                           newPaidAmount > 0 ? 'partial' : 'pending';

          await tx
            .update(debts)
            .set({
              paidAmount: newPaidAmount.toString(),
              status: newStatus,
            })
            .where(eq(debts.id, debtId));
        }
      });

      return { success: true };
    }),
});
