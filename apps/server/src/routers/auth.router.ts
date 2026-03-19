import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { db } from '../db';
import { users } from '../db/schema';
import { verifyTelegramInitData } from '../utils/telegram.utils';

dotenv.config();

const botToken = process.env.BOT_TOKEN;
if (!botToken) {
  throw new Error('BOT_TOKEN must be set in environment');
}

export const authRouter = router({
  telegramLogin: publicProcedure
    .input(z.object({ initData: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const telegramUser = verifyTelegramInitData(input.initData, botToken);
      if (!telegramUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid initData' });
      }

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, String(telegramUser.id)))
        .limit(1);
      let user = existing[0];

      if (!user) {
        await db.insert(users).values({
          telegramId: String(telegramUser.id),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
        });

        const [created] = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, String(telegramUser.id)))
          .limit(1);

        if (!created) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
        }

        user = created;
      }

      ctx.req.session.userId = user.id;

      return user;
    }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    return new Promise<void>((resolve, reject) => {
      ctx.req.session.destroy((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId!;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return user;
  }),
});
