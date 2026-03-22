import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { protectedProcedure, publicProcedure, router } from '../trpc';
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

      console.log('telegramLogin called, initData length:', input.initData.length);

      const telegramUser = verifyTelegramInitData(input.initData, botToken);

      if (!telegramUser) {
        console.error('Invalid initData received');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid Telegram data'
        });
      }

      console.log('Telegram user verified:', telegramUser.id);

      // Mavjud userni qidirish
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, String(telegramUser.id)))
        .limit(1);

      let user = existing[0];

      // Yangi user yaratish
      if (!user) {
        console.log('Creating new user for:', telegramUser.id);

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

      // Session ga saqlash
      ctx.req.session.userId = user.id;

      await new Promise<void>((resolve, reject) => {
        ctx.req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('User logged in:', user.id);

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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId!))
      .limit(1);

    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    return user;
  }),
});
