import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { protectedProcedure, publicProcedure, router, JWT_SECRET } from '../trpc';
import { db } from '../db';
import { users } from '../db/schema';
import { verifyTelegramInitData } from '../utils/telegram.utils';

export const authRouter = router({
  telegramLogin: publicProcedure
    .input(z.object({ initData: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const botToken = process.env.BOT_TOKEN;
      if (!botToken) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Server configuration error'
        });
      }

      const telegramUser = verifyTelegramInitData(input.initData, botToken);

      if (!telegramUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid Telegram data'
        });
      }

      // Timeout bilan DB query
      const existingPromise = db
        .select()
        .from(users)
        .where(eq(users.telegramId, String(telegramUser.id)))
        .limit(1);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 8000)
      );

      const existing = await Promise.race([existingPromise, timeoutPromise]) as any[];

      let user = existing[0];

      if (!user) {
        await db.insert(users).values({
          telegramId: String(telegramUser.id),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name ?? null,
          username: telegramUser.username ?? null,
        });

        const [created] = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, String(telegramUser.id)))
          .limit(1);

        if (!created) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create user'
          });
        }

        user = created;
      }

      // Session ni async saver emas, sync qilamiz
      ctx.req.session.userId = user.id;

      // session.save() ni kutmasdan qaytarish
      ctx.req.session.save(() => {});

      const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return { ...user, token };
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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId!))
      .limit(1);

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    return user;
  }),
});
