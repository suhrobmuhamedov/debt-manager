import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { z } from 'zod';
import { eq, and, isNull, inArray, sql, lt } from 'drizzle-orm';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { db } from '../db';
import { debts, contacts, payments, users } from '../db/schema';

type ConfirmActor = {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

const toDateOnly = (value: string): Date => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid date format' });
  }
  return date;
};

const getTodayStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const isExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) {
    return true;
  }
  return expiresAt.getTime() < Date.now();
};

const validateReturnDate = ({
  givenDate,
  returnDate,
}: {
  givenDate: Date;
  returnDate: Date;
}) => {
  const normalizedGivenDate = new Date(givenDate);
  normalizedGivenDate.setHours(0, 0, 0, 0);
  const normalizedReturnDate = new Date(returnDate);
  normalizedReturnDate.setHours(0, 0, 0, 0);

  const today = getTodayStart();
  if (normalizedReturnDate < today) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'debts.returnDatePast' });
  }

  if (normalizedReturnDate <= normalizedGivenDate) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'debts.returnDateAfterGiven' });
  }
};

const formatDebtDate = (date: Date | string | null): string => {
  if (!date) {
    return '-';
  }
  const d = new Date(date);
  return d.toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const sendTelegramText = async (telegramId: string, text: string): Promise<void> => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken || !telegramId) {
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text }),
    });
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
};

const getOrCreateUserByTelegramId = async (actor: ConfirmActor) => {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, actor.telegramId))
    .limit(1);

  if (existing) {
    return existing;
  }

  await db.insert(users).values({
    telegramId: actor.telegramId,
    firstName: actor.firstName?.trim() || 'Telegram User',
    lastName: actor.lastName?.trim() || null,
    username: actor.username?.trim() || null,
  });

  const [created] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, actor.telegramId))
    .limit(1);

  if (!created) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create receiver account' });
  }

  return created;
};

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
        .where(and(eq(debts.id, input.id), eq(debts.userId, userId), isNull(debts.deletedAt)))
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
        returnDate: z.string().min(1, 'debts.returnDateRequired'),
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;
      const givenDate = toDateOnly(input.givenDate);
      const returnDate = toDateOnly(input.returnDate);
      validateReturnDate({ givenDate, returnDate });

      const [contact] = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, input.contactId), eq(contacts.userId, userId), isNull(contacts.deletedAt)))
        .limit(1);

      if (!contact) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const result = await db
        .insert(debts)
        .values({
          userId,
          contactId: input.contactId,
          amount: input.amount.toString(),
          paidAmount: '0',
          currency: input.currency,
          type: input.type,
          status: 'pending',
          confirmationStatus: 'not_required',
          givenDate,
          returnDate,
          note: input.note,
        })
        .execute();

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
        returnDate: z.string().min(1, 'debts.returnDateRequired'),
        note: z.string().max(500).optional(),
        amount: z.number().positive().max(999_999_999).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [existing] = await db
        .select()
        .from(debts)
        .where(and(eq(debts.id, input.id), eq(debts.userId, userId), isNull(debts.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existing.status === 'paid') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Paid debt cannot be updated' });
      }

      const givenDate = new Date(existing.givenDate);
      const returnDate = toDateOnly(input.returnDate);
      validateReturnDate({ givenDate, returnDate });

      await db
        .update(debts)
        .set({
          returnDate,
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
        .where(and(eq(debts.id, input.id), eq(debts.userId, userId), isNull(debts.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await db.update(debts).set({ deletedAt: new Date() }).where(eq(debts.id, input.id));

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

  generateConfirmationLink: protectedProcedure
    .input(z.object({ debtId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId!;

      const [debtRow] = await db
        .select({ debt: debts, contactName: contacts.name })
        .from(debts)
        .leftJoin(contacts, eq(debts.contactId, contacts.id))
        .where(and(eq(debts.id, input.debtId), eq(debts.userId, userId), isNull(debts.deletedAt)))
        .limit(1);

      if (!debtRow) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (debtRow.debt.confirmationStatus === 'confirmed' || debtRow.debt.confirmationStatus === 'denied') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Debt already resolved' });
      }

      const token = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await db
        .update(debts)
        .set({
          confirmationToken: token,
          confirmationExpiresAt: expiresAt,
          confirmationStatus: 'pending',
        })
        .where(eq(debts.id, debtRow.debt.id));

      const botUsername = process.env.BOT_USERNAME;
      if (!botUsername) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BOT_USERNAME is not configured' });
      }

      const link = `https://t.me/${botUsername}?start=confirm_${token}`;
      const amountText = Number(debtRow.debt.amount).toLocaleString('uz-UZ');
      const returnDateText = formatDebtDate(debtRow.debt.returnDate);
      const shareText = `Salom! Men sizga ${amountText} ${debtRow.debt.currency ?? 'UZS'} qarz berdim.\nQaytarish muddati: ${returnDateText}.\nIltimos, quyidagi havolani bosib tasdiqlang:\n${link}`;

      return { token, link, shareText, expiresAt };
    }),

  getConfirmationDetails: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({ debt: debts, creator: users })
        .from(debts)
        .innerJoin(users, eq(users.id, debts.userId))
        .where(and(eq(debts.confirmationToken, input.token), isNull(debts.deletedAt)))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (row.debt.confirmationStatus !== 'pending') {
        return {
          isValid: false as const,
          isExpired: false as const,
          status: row.debt.confirmationStatus,
        };
      }

      if (isExpired(row.debt.confirmationExpiresAt)) {
        return { isValid: false as const, isExpired: true as const };
      }

      const typeLabel = row.debt.type === 'given' ? 'Qarz olindi' : 'Qarz berildi';

      return {
        isValid: true as const,
        isExpired: false as const,
        creatorFirstName: row.creator.firstName,
        amount: Number(row.debt.amount),
        currency: row.debt.currency ?? 'UZS',
        returnDate: row.debt.returnDate,
        typeLabel,
        status: row.debt.confirmationStatus,
      };
    }),

  confirmDebt: publicProcedure
    .input(
      z.object({
        token: z.string().min(10),
        telegramId: z.string().min(5),
        internalApiKey: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.internalApiKey !== process.env.INTERNAL_API_KEY) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const [originalRow] = await db
        .select({ debt: debts, creator: users })
        .from(debts)
        .innerJoin(users, eq(users.id, debts.userId))
        .where(and(eq(debts.confirmationToken, input.token), isNull(debts.deletedAt)))
        .limit(1);

      if (!originalRow) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (originalRow.debt.confirmationStatus !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token already used' });
      }

      if (isExpired(originalRow.debt.confirmationExpiresAt)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'debts.confirmExpired' });
      }

      const receiverUser = await getOrCreateUserByTelegramId({
        telegramId: input.telegramId,
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
      });

      const creatorFullName = [originalRow.creator.firstName, originalRow.creator.lastName].filter(Boolean).join(' ').trim() || originalRow.creator.firstName;

      const result = await db.transaction(async (tx) => {
        await tx
          .update(debts)
          .set({
            confirmationStatus: 'confirmed',
            confirmedByTelegramId: input.telegramId,
          })
          .where(eq(debts.id, originalRow.debt.id));

        let receiverContactId: number;

        const [existingContact] = await tx
          .select()
          .from(contacts)
          .where(and(eq(contacts.userId, receiverUser.id), eq(contacts.name, creatorFullName), isNull(contacts.deletedAt)))
          .limit(1);

        if (existingContact) {
          receiverContactId = existingContact.id;
        } else {
          const insertResult = await tx
            .insert(contacts)
            .values({
              userId: receiverUser.id,
              name: creatorFullName,
              phone: originalRow.creator.phone,
              note: 'Auto-created from debt confirmation',
            })
            .execute();

          receiverContactId = (insertResult as { insertId?: number }).insertId ?? 0;
          if (!receiverContactId) {
            const [createdContact] = await tx
              .select()
              .from(contacts)
              .where(and(eq(contacts.userId, receiverUser.id), eq(contacts.name, creatorFullName), isNull(contacts.deletedAt)))
              .limit(1);
            receiverContactId = createdContact?.id ?? 0;
          }

          if (!receiverContactId) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create receiver contact' });
          }
        }

        const mirrorType = originalRow.debt.type === 'given' ? 'taken' : 'given';

        const mirrorInsert = await tx
          .insert(debts)
          .values({
            userId: receiverUser.id,
            contactId: receiverContactId,
            amount: originalRow.debt.amount,
            paidAmount: '0',
            currency: originalRow.debt.currency,
            type: mirrorType,
            status: originalRow.debt.status,
            confirmationStatus: 'confirmed',
            linkedDebtId: originalRow.debt.id,
            confirmedByTelegramId: input.telegramId,
            givenDate: originalRow.debt.givenDate,
            returnDate: originalRow.debt.returnDate,
            note: originalRow.debt.note,
          })
          .execute();

        const mirrorDebtId = (mirrorInsert as { insertId?: number }).insertId;
        if (!mirrorDebtId) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create mirror debt' });
        }

        await tx
          .update(debts)
          .set({
            linkedDebtId: mirrorDebtId,
            confirmationExpiresAt: null,
          })
          .where(eq(debts.id, originalRow.debt.id));

        return { mirrorDebtId };
      });

      if (originalRow.creator.telegramId) {
        const receiverName = input.firstName || 'Qarzdor';
        await sendTelegramText(
          originalRow.creator.telegramId,
          `✅ ${receiverName} qarzni tasdiqladi! Qarz ikki tomonlama qayd etildi.`
        );
      }

      return { success: true as const, receiverUserId: receiverUser.id, mirrorDebtId: result.mirrorDebtId };
    }),

  denyDebt: publicProcedure
    .input(
      z.object({
        token: z.string().min(10),
        telegramId: z.string().min(5),
        internalApiKey: z.string(),
        denierName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.internalApiKey !== process.env.INTERNAL_API_KEY) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const [row] = await db
        .select({ debt: debts, creator: users })
        .from(debts)
        .innerJoin(users, eq(users.id, debts.userId))
        .where(and(eq(debts.confirmationToken, input.token), isNull(debts.deletedAt)))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (row.debt.confirmationStatus !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token already used' });
      }

      if (isExpired(row.debt.confirmationExpiresAt)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'debts.confirmExpired' });
      }

      await db
        .update(debts)
        .set({
          confirmationStatus: 'denied',
          confirmedByTelegramId: input.telegramId,
          confirmationExpiresAt: null,
        })
        .where(eq(debts.id, row.debt.id));

      if (row.creator.telegramId) {
        await sendTelegramText(
          row.creator.telegramId,
          `⚠️ ${input.denierName || 'Qarzdor'} qarzni inkor qildi. Qarz tasdiqlanmagan holda qoldi.`
        );
      }

      return { success: true as const };
    }),
});
