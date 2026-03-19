import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, and, isNull, inArray, sql, not } from 'drizzle-orm';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { contacts, debts } from '../db/schema';

export const contactsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId!;

    const allContacts = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.userId, userId), isNull(contacts.deletedAt)))
      .orderBy(contacts.name);

    const counts = await db
      .select({
        contactId: debts.contactId,
        activeDebtsCount: sql<number>`COUNT(*)`,
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

    const countByContactId = new Map<number, number>();
    counts.forEach((row) => {
      countByContactId.set(row.contactId, Number(row.activeDebtsCount));
    });

    return allContacts.map((contact) => ({
      ...contact,
      activeDebtsCount: countByContactId.get(contact.id) ?? 0,
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
            isNull(debts.deletedAt)
          )
        )
        .orderBy(debts.createdAt);

      return { contact, debts: contactDebts };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        phone: z.string().max(20).optional(),
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
        throw new TRPCError({ code: 'CONFLICT', message: 'Contacto nomi allaqachon mavjud' });
      }

      await db.insert(contacts).values({
        userId,
        name: input.name,
        phone: input.phone,
        note: input.note,
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
        name: z.string().min(2).max(100).optional(),
        phone: z.string().max(20).optional(),
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
          throw new TRPCError({ code: 'CONFLICT', message: 'Contacto nomi allaqachon mavjud' });
        }
      }

      await db
        .update(contacts)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.note !== undefined ? { note: input.note } : {}),
        })
        .where(eq(contacts.id, input.id));

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
        .where(eq(contacts.id, input.id));

      return { success: true };
    }),
});
