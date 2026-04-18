import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { and, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { contacts, debts, users } from '../db/schema';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { sendTelegramHtmlMessage } from '../services/notification.service';

const ADMIN_LINK_PURPOSE = 'admin_access';
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

type AdminAccessTokenPayload = {
  purpose: typeof ADMIN_LINK_PURPOSE;
  telegramId: string;
};

const normalizeTelegramId = (value: string) => value.trim();

const getAdminTelegramId = () => normalizeTelegramId(process.env.ADMIN_TELEGRAM_ID || '');

const getAdminLinkSecret = () => {
  const secret = (process.env.ADMIN_LINK_SECRET || process.env.SESSION_SECRET || '').trim();
  if (!secret) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Admin secret not configured' });
  }
  return secret;
};

const getAdminLinkTtlSeconds = () => {
  const raw = Number(process.env.ADMIN_LINK_TTL_SECONDS || '300');
  if (!Number.isFinite(raw) || raw <= 0) {
    return 300;
  }
  return Math.min(raw, 3600);
};

const assertAdminTelegramId = (telegramId: string) => {
  const adminTelegramId = getAdminTelegramId();
  if (!adminTelegramId || normalizeTelegramId(telegramId) !== adminTelegramId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
};

const assertAdminByUserId = async (userId: number) => {
  const [currentUser] = await db
    .select({
      id: users.id,
      telegramId: users.telegramId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser?.telegramId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }

  assertAdminTelegramId(currentUser.telegramId);
  return currentUser;
};

export const signAdminAccessToken = (telegramId: string) => {
  assertAdminTelegramId(telegramId);
  const expiresIn = getAdminLinkTtlSeconds();
  const token = jwt.sign(
    {
      purpose: ADMIN_LINK_PURPOSE,
      telegramId: normalizeTelegramId(telegramId),
    } satisfies AdminAccessTokenPayload,
    getAdminLinkSecret(),
    { expiresIn }
  );

  return { token, expiresIn };
};

const verifyAdminAccessToken = (token: string): AdminAccessTokenPayload => {
  let payload: jwt.JwtPayload | string;
  try {
    payload = jwt.verify(token, getAdminLinkSecret());
  } catch {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid admin token' });
  }

  if (!payload || typeof payload === 'string') {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid admin token payload' });
  }

  const purpose = String(payload.purpose || '');
  const telegramId = normalizeTelegramId(String(payload.telegramId || ''));
  if (purpose !== ADMIN_LINK_PURPOSE || !telegramId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid admin token payload' });
  }

  assertAdminTelegramId(telegramId);
  return { purpose: ADMIN_LINK_PURPOSE, telegramId };
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sendMessageToMany = async (telegramIds: string[], message: string) => {
  let successCount = 0;
  let failedCount = 0;

  const uniqueTelegramIds = Array.from(new Set(telegramIds.map(normalizeTelegramId).filter(Boolean)));
  for (const telegramId of uniqueTelegramIds) {
    try {
      await sendTelegramHtmlMessage(telegramId, message);
      successCount += 1;
    } catch {
      failedCount += 1;
    }
    await wait(45);
  }

  return { total: uniqueTelegramIds.length, successCount, failedCount };
};

export const adminRouter = router({
  verifyAccessToken: publicProcedure
    .input(z.object({ token: z.string().min(10) }))
    .query(async ({ input, ctx }) => {
      const payload = verifyAdminAccessToken(input.token);

      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please login first' });
      }

      const currentUser = await assertAdminByUserId(ctx.userId);
      if (normalizeTelegramId(currentUser.telegramId) !== payload.telegramId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin mismatch' });
      }

      return { ok: true };
    }),

  getUsers: protectedProcedure
    .input(
      z.object({
        search: z.string().trim().optional(),
        limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      await assertAdminByUserId(ctx.userId!);
      const search = input.search?.trim();

      const whereClauses = [
        search
          ? or(
              like(users.firstName, `%${search}%`),
              like(users.lastName, `%${search}%`),
              like(users.username, `%${search}%`),
              like(users.phone, `%${search}%`),
              like(users.telegramId, `%${search}%`)
            )
          : undefined,
      ].filter(Boolean);

      const list = await db
        .select({
          id: users.id,
          telegramId: users.telegramId,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          phone: users.phone,
          createdAt: users.createdAt,
          botStartedAt: users.botStartedAt,
        })
        .from(users)
        .where(whereClauses.length ? and(...whereClauses) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(whereClauses.length ? and(...whereClauses) : undefined);

      return { items: list, total: Number(count || 0) };
    }),

  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertAdminByUserId(ctx.userId!);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const userContacts = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.userId, input.userId), isNull(contacts.deletedAt)))
        .orderBy(desc(contacts.createdAt));

      const userDebts = await db
        .select({
          id: debts.id,
          amount: debts.amount,
          paidAmount: debts.paidAmount,
          currency: debts.currency,
          type: debts.type,
          status: debts.status,
          returnDate: debts.returnDate,
          note: debts.note,
          createdAt: debts.createdAt,
          contactName: contacts.name,
        })
        .from(debts)
        .leftJoin(contacts, eq(contacts.id, debts.contactId))
        .where(and(eq(debts.userId, input.userId), isNull(debts.deletedAt)))
        .orderBy(desc(debts.createdAt));

      return { user, contacts: userContacts, debts: userDebts };
    }),

  getDebts: protectedProcedure
    .input(
      z.object({
        search: z.string().trim().optional(),
        type: z.enum(['given', 'taken']).optional(),
        status: z.enum(['pending', 'partial', 'paid']).optional(),
        limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      await assertAdminByUserId(ctx.userId!);

      const search = input.search?.trim();
      const whereClauses = [
        isNull(debts.deletedAt),
        input.type ? eq(debts.type, input.type) : undefined,
        input.status ? eq(debts.status, input.status) : undefined,
        search
          ? or(
              like(users.firstName, `%${search}%`),
              like(users.lastName, `%${search}%`),
              like(users.telegramId, `%${search}%`),
              like(contacts.name, `%${search}%`),
              like(contacts.phone, `%${search}%`)
            )
          : undefined,
      ].filter(Boolean);

      const items = await db
        .select({
          id: debts.id,
          amount: debts.amount,
          paidAmount: debts.paidAmount,
          currency: debts.currency,
          type: debts.type,
          status: debts.status,
          returnDate: debts.returnDate,
          createdAt: debts.createdAt,
          ownerId: users.id,
          ownerFirstName: users.firstName,
          ownerLastName: users.lastName,
          ownerTelegramId: users.telegramId,
          contactName: contacts.name,
          contactPhone: contacts.phone,
        })
        .from(debts)
        .innerJoin(users, eq(users.id, debts.userId))
        .leftJoin(contacts, eq(contacts.id, debts.contactId))
        .where(and(...whereClauses))
        .orderBy(desc(debts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(debts)
        .innerJoin(users, eq(users.id, debts.userId))
        .leftJoin(contacts, eq(contacts.id, debts.contactId))
        .where(and(...whereClauses));

      return { items, total: Number(count || 0) };
    }),

  sendToOne: protectedProcedure
    .input(
      z.object({
        telegramId: z.string().trim().min(5).max(30),
        message: z.string().trim().min(1).max(4000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertAdminByUserId(ctx.userId!);

      await sendTelegramHtmlMessage(normalizeTelegramId(input.telegramId), input.message);
      return { success: true };
    }),

  sendToAll: protectedProcedure
    .input(
      z.object({
        message: z.string().trim().min(1).max(4000),
        onlyUserIds: z.array(z.number().int().positive()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertAdminByUserId(ctx.userId!);

      const userIdFilter = input.onlyUserIds?.length ? inArray(users.id, input.onlyUserIds) : undefined;
      const targetUsers = await db
        .select({
          telegramId: users.telegramId,
        })
        .from(users)
        .where(userIdFilter);

      const stats = await sendMessageToMany(
        targetUsers.map((user) => user.telegramId),
        input.message
      );

      return { success: true, ...stats };
    }),
});
