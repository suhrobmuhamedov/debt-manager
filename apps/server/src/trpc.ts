import { initTRPC, TRPCError } from '@trpc/server';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback-secret';

export function createContext({ req, res }: { req: Request; res: Response }): Context {
  if (typeof req.session?.userId === 'number') {
    return { userId: req.session.userId, req, res };
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      return { userId: decoded.userId, req, res };
    } catch {
      // Invalid token, continue to next auth source.
    }
  }

  const xAuthToken = req.headers['x-auth-token'];
  if (typeof xAuthToken === 'string' && xAuthToken) {
    try {
      const decoded = jwt.verify(xAuthToken, JWT_SECRET) as { userId: number };
      return { userId: decoded.userId, req, res };
    } catch {
      // Invalid token.
    }
  }

  return { userId: null, req, res };
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

export { JWT_SECRET };
