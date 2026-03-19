import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, and, isNull, inArray, sql, lt } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { debts, contacts, payments } from '../db/schema';

export const debtsRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
        status: z.enum(['pending', 'partial', 'paid']).optional(),
        type: z.enum(['given', 'taken']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const whereClauses: any[] = [eq(debts.userId, userId), isNull(debts.deletedAt)];
      if (input.status) whereClauses.push(eq(debts.status, input.status));
      if (input.type) whereClauses.push(eq(debts.type, input.type));
      if (input.cursor) {
        // cursor is a timestamp number in ms
        const cursorDate = new Date(input.cursor);
        whereClauses.push(lt(debts.createdAt, cursorDate));
      }

      const items = await db
        .select({
          debt: debts,
          contactName: contacts.name,
        })
        .from(debts)
        .leftJoin(contacts, eq(debts.contactId, contacts.id))
        .where(and(...whereClauses))
        .orderBy(sql`${debts.createdAt} DESC`)
        .limit(input.limit + 1);

      const hasMore = items.length > input.limit;
      const sliced = hasMore ? items.slice(0, input.limit) : items;
      const lastDebt = hasMore ? sliced[sliced.length - 1]?.debt : null;
      const nextCursor = lastDebt?.createdAt ? lastDebt.createdAt.getTime() : null;

      return {
        items: sliced.map((row) => ({ ...row.debt, contactName: row.contactName })),
        nextCursor,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [debt] = await db
        .select()
        .from(debts)
        .where(
          and(
            eq(debts.id, input.id),
            eq(debts.userId, userId),
            isNull(debts.deletedAt)
          )
        )
        .limit(1);

      if (!debt) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [contact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, debt.contactId))
        .limit(1);

      const paymentHistory = await db
        .select()
        .from(payments)
        .where(eq(payments.debtId, debt.id))
        .orderBy(sql`${payments.paymentDate} DESC`);

      return { debt, contact, payments: paymentHistory };
    }),

  getOverdue: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.userId!;
      const now = new Date();

      const overdue = await db
        .select({ debt: debts, contactName: contacts.name })
        .from(debts)
        .leftJoin(contacts, eq(debts.contactId, contacts.id))
        .where(
          and(
            eq(debts.userId, userId),
            isNull(debts.deletedAt),
            lt(debts.returnDate, now),
            inArray(debts.status, ['pending', 'partial'])
          )
        )
        .orderBy(debts.returnDate);

      return overdue.map((row) => ({ ...row.debt, contactName: row.contactName }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        amount: z.number().positive().max(999_999_999),
        currency: z.enum(['UZS', 'USD', 'EUR']).default('UZS'),
        type: z.enum(['given', 'taken']),
        givenDate: z.string(),
        returnDate: z.string().optional(),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [contact] = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.contactId),
            eq(contacts.userId, userId),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (!contact) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const result = await db.insert(debts).values({
        userId,
        contactId: input.contactId,
        amount: input.amount.toString(),
        paidAmount: '0',
        currency: input.currency,
        type: input.type,
        status: 'pending',
        givenDate: new Date(input.givenDate),
        returnDate: input.returnDate ? new Date(input.returnDate) : null,
        note: input.note,
      }).execute();

      const insertedId = (result as { insertId?: number }).insertId;
      if (!insertedId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      const [inserted] = await db
        .select()
        .from(debts)
        .where(eq(debts.id, insertedId))
        .limit(1);

      if (!inserted) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return inserted;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        returnDate: z.string().optional(),
        note: z.string().max(500).optional(),
        amount: z.number().positive().max(999_999_999).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [existing] = await db
        .select()
        .from(debts)
        .where(
          and(
            eq(debts.id, input.id),
            eq(debts.userId, userId),
            isNull(debts.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existing.status === 'paid') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Paid debt cannot be updated' });
      }

      await db
        .update(debts)
        .set({
          ...(input.returnDate !== undefined ? { returnDate: new Date(input.returnDate) } : {}),
          ...(input.note !== undefined ? { note: input.note } : {}),
          ...(input.amount !== undefined ? { amount: input.amount.toString() } : {}),
        })
        .where(eq(debts.id, input.id));

      const [updated] = await db
        .select()
        .from(debts)
        .where(eq(debts.id, input.id))
        .limit(1);

      if (!updated) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [existing] = await db
        .select()
        .from(debts)
        .where(
          and(
            eq(debts.id, input.id),
            eq(debts.userId, userId),
            isNull(debts.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await db
        .update(debts)
        .set({ deletedAt: new Date() })
        .where(eq(debts.id, input.id));

      return { success: true };
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.userId!;

      const rows = await db
        .select({
          currency: debts.currency,
          type: debts.type,
          total: sql<number>`SUM(${debts.amount})`,
        })
        .from(debts)
        .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)))
        .groupBy(debts.currency, debts.type);

      const summary: Record<string, { given: number; taken: number }> = {};

      rows.forEach((row) => {
        const currencyKey = row.currency ?? 'UNKNOWN';
        if (!summary[currencyKey]) summary[currencyKey] = { given: 0, taken: 0 };
        summary[currencyKey][row.type] = Number(row.total);
      });

      return summary;
    }),
});
