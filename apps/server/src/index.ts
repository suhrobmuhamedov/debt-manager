import express from 'express';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { db } from './db';
import { users, debts } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const app = express();

// Trust proxy — Railway uchun SHART
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-trpc-source',
  ],
}));

// Health check — ENG BIRINCHI
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Compression
app.use(compression());

// Session — MemoryStore (tez, sodda)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

// tRPC
app.use('/trpc', trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Internal API — bot uchun
app.get('/api/internal/stats/:telegramId', async (req, res) => {
  try {
    const apiKey = req.headers['internal_api_key'];
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const telegramId = parseInt(req.params.telegramId);
    if (isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId.toString()))
      .limit(1);

    if (!user) return res.json({ found: false });

    const allDebts = await db
      .select()
      .from(debts)
      .where(and(
        eq(debts.userId, user.id),
        isNull(debts.deletedAt)
      ));

    const totalGiven = allDebts
      .filter(d => d.type === 'given')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const totalTaken = allDebts
      .filter(d => d.type === 'taken')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const overdueCount = allDebts.filter(d =>
      d.returnDate &&
      new Date(d.returnDate) < new Date() &&
      d.status !== 'paid'
    ).length;

    res.json({
      found: true,
      totalGiven,
      totalTaken,
      overdueCount,
      pendingCount: allDebts.filter(d => d.status === 'pending').length,
    });
  } catch (error) {
    console.error('Internal stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = parseInt(process.env.PORT || '8080', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
