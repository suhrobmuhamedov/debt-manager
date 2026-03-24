import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, and, isNull, inArray, sql, not } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { contacts, debts, payments } from '../db/schema';

const phoneRegex = /^\+?\d{7,15}$/;

export const contactsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId!;

    const allContacts = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, userId), isNull(contacts.deletedAt)))
      .orderBy(contacts.name);

    const stats = await db
      .select({
        contactId: debts.contactId,
        activeDebtsCount: sql<number>`COUNT(*)`,
        totalAmount: sql<string>`COALESCE(SUM(${debts.amount} - ${debts.paidAmount}), 0)`,
      })
      .from(debts)
      .where(
        and(
          eq(debts.userId, userId),
          inArray(debts.status, ['pending', 'partial']),
          isNull(debts.deletedAt)
        )
      )
      .groupBy(debts.contactId);

    const statsByContactId = new Map<number, { activeDebtsCount: number; totalAmount: number }>();
    stats.forEach((row) => {
      statsByContactId.set(row.contactId, {
        activeDebtsCount: Number(row.activeDebtsCount),
        totalAmount: Number(row.totalAmount),
      });
    });

    return allContacts.map((contact) => ({
      ...contact,
      activeDebtsCount: statsByContactId.get(contact.id)?.activeDebtsCount ?? 0,
      totalAmount: statsByContactId.get(contact.id)?.totalAmount ?? 0,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [contact] = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.userId, userId),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (!contact) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const contactDebts = await db
        .select()
        .from(debts)
        .where(
          and(
            eq(debts.contactId, contact.id),
            eq(debts.userId, userId),
            isNull(debts.deletedAt)
          )
        )
        .orderBy(sql`${debts.createdAt} DESC`);

      const debtIds = contactDebts.map((debt) => debt.id);
      const paidAtRows = debtIds.length
        ? await db
            .select({
              debtId: payments.debtId,
              paidAt: sql<Date | null>`MAX(${payments.paymentDate})`,
            })
            .from(payments)
            .where(inArray(payments.debtId, debtIds))
            .groupBy(payments.debtId)
        : [];

      const paidAtByDebtId = new Map<number, Date | null>(
        paidAtRows.map((row) => [row.debtId, row.paidAt])
      );

      const contactDebtsWithPaidAt = contactDebts.map((debt) => {
        const paidAt = paidAtByDebtId.get(debt.id) ?? (debt.status === 'paid' ? debt.updatedAt : null);
        return {
          ...debt,
          paidAt: paidAt ? new Date(paidAt).toISOString().split('T')[0] : null,
        };
      });

      const stats = contactDebts.reduce(
        (acc, debt) => {
          const amount = Number(debt.amount);
          const paidAmount = Number(debt.paidAmount);
          const outstanding = Math.max(amount - paidAmount, 0);

          if (debt.type === 'given') {
            acc.totalGiven += outstanding;
          }
          if (debt.type === 'taken') {
            acc.totalTaken += outstanding;
          }
          if (debt.status === 'pending' || debt.status === 'partial') {
            acc.activeDebtsCount += 1;
          }

          return acc;
        },
        { totalGiven: 0, totalTaken: 0, activeDebtsCount: 0 }
      );

      return {
        contact,
        stats,
        debts: contactDebtsWithPaidAt,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(7).max(15).regex(phoneRegex, 'Telefon raqam formati noto\'g\'ri'),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [existing] = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.name, input.name),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Kontakt nomi allaqachon mavjud' });
      }

      await db.insert(contacts).values({
        userId,
        name: input.name.trim(),
        phone: input.phone,
        note: input.note?.trim() || null,
      });

      const [created] = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.name, input.name),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (!created) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().trim().min(2).max(100).optional(),
        phone: z
          .string()
          .trim()
          .min(7)
          .max(15)
          .regex(phoneRegex, 'Telefon raqam formati noto\'g\'ri')
          .optional(),
        note: z.string().max(500).optional(),
      }).refine((value) => value.name !== undefined || value.phone !== undefined || value.note !== undefined, {
        message: 'Kamida bitta maydon yuborilishi kerak',
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [existing] = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.userId, userId),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (input.name) {
        const [duplicate] = await db
          .select()
          .from(contacts)
          .where(
            and(
              eq(contacts.userId, userId),
              eq(contacts.name, input.name),
              isNull(contacts.deletedAt),
              not(eq(contacts.id, input.id))
            )
          )
          .limit(1);

        if (duplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Kontakt nomi allaqachon mavjud' });
        }
      }

      await db
        .update(contacts)
        .set({
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
        })
        .where(and(eq(contacts.id, input.id), eq(contacts.userId, userId), isNull(contacts.deletedAt)));

      const [updated] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, input.id))
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
        .from(contacts)
        .where(
          and(
            eq(contacts.id, input.id),
            eq(contacts.userId, userId),
            isNull(contacts.deletedAt)
          )
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const [{ activeCount }] = await db
        .select({
          activeCount: sql<number>`COUNT(*)`,
        })
        .from(debts)
        .where(
          and(
            eq(debts.userId, userId),
            eq(debts.contactId, input.id),
            inArray(debts.status, ['pending', 'partial']),
            isNull(debts.deletedAt)
          )
        );

      if (Number(activeCount) > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Aktiv qarzlari bor, avval qarzlarni yoping',
        });
      }

      await db
        .update(contacts)
        .set({ deletedAt: new Date() })
        .where(and(eq(contacts.id, input.id), eq(contacts.userId, userId), isNull(contacts.deletedAt)));

      return { success: true };
    }),
});
