import { initTRPC, TRPCError } from '@trpc/server';
import type { Request, Response } from 'express';

// Extend express-session to include our userId stored in session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export type Context = {
  userId: number | null;
  req: Request;
  res: Response;
};

export function createContext({ req, res }: { req: Request; res: Response }): Context {
  const userId = typeof req.session?.userId === 'number' ? req.session.userId : null;
  return { req, res, userId };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});
