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
import { startRemindersJob } from './jobs/reminders.job';

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
    'x-auth-token',
    'x-trpc-source',
    'cookie',
  ],
}));

// Health check — ENG BIRINCHI
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Compression
app.use(compression());

const readInternalApiKey = (req: express.Request): string => {
  const key = req.headers['x-internal-api-key']
    || req.headers['internal_api_key']
    || req.headers['internal-api-key'];

  if (Array.isArray(key)) {
    return String(key[0] || '');
  }

  return String(key || '');
};

const hasValidInternalApiKey = (req: express.Request) => {
  return readInternalApiKey(req) === process.env.INTERNAL_API_KEY;
};

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

app.get('/api/internal/confirmation/:token', async (req, res) => {
  try {
    if (!hasValidInternalApiKey(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caller = appRouter.createCaller({ userId: null, req, res });
    const result = await caller.debts.getConfirmationDetails({ token: req.params.token });
    return res.json(result);
  } catch (error: any) {
    if (error?.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('Internal confirmation details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/internal/confirm-debt', express.json(), async (req, res) => {
  try {
    if (!hasValidInternalApiKey(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, telegramId, firstName, lastName, username } = req.body ?? {};
    if (!token || !telegramId) {
      return res.status(400).json({ error: 'token and telegramId are required' });
    }

    const caller = appRouter.createCaller({ userId: null, req, res });
    const result = await caller.debts.confirmDebt({
      token,
      telegramId,
      internalApiKey: readInternalApiKey(req),
      firstName,
      lastName,
      username,
    });

    return res.json(result);
  } catch (error: any) {
    const message = error?.message || 'Internal server error';
    if (error?.code === 'NOT_FOUND') {
      return res.status(404).json({ error: message });
    }
    if (error?.code === 'BAD_REQUEST' || error?.code === 'UNAUTHORIZED') {
      return res.status(400).json({ error: message });
    }
    console.error('Internal confirm debt error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/internal/deny-debt', express.json(), async (req, res) => {
  try {
    if (!hasValidInternalApiKey(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, telegramId, denierName } = req.body ?? {};
    if (!token || !telegramId) {
      return res.status(400).json({ error: 'token and telegramId are required' });
    }

    const caller = appRouter.createCaller({ userId: null, req, res });
    const result = await caller.debts.denyDebt({
      token,
      telegramId,
      denierName,
      internalApiKey: readInternalApiKey(req),
    });

    return res.json(result);
  } catch (error: any) {
    const message = error?.message || 'Internal server error';
    if (error?.code === 'NOT_FOUND') {
      return res.status(404).json({ error: message });
    }
    if (error?.code === 'BAD_REQUEST' || error?.code === 'UNAUTHORIZED') {
      return res.status(400).json({ error: message });
    }
    console.error('Internal deny debt error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/internal/bot-user-sync', express.json(), async (req, res) => {
  try {
    if (!hasValidInternalApiKey(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { telegramId, firstName, lastName, username, languageCode } = req.body ?? {};
    if (!telegramId || !firstName) {
      return res.status(400).json({ error: 'telegramId and firstName are required' });
    }

    const normalizedTelegramId = String(telegramId);

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, normalizedTelegramId))
      .limit(1);

    if (existing) {
      await db
        .update(users)
        .set({
          firstName: String(firstName),
          lastName: lastName ? String(lastName) : null,
          username: username ? String(username) : null,
          languageCode: languageCode ? String(languageCode) : existing.languageCode,
          botStartedAt: new Date(),
        })
        .where(eq(users.id, existing.id));

      return res.json({ success: true, userId: existing.id, created: false });
    }

    await db.insert(users).values({
      telegramId: normalizedTelegramId,
      firstName: String(firstName),
      lastName: lastName ? String(lastName) : null,
      username: username ? String(username) : null,
      languageCode: languageCode ? String(languageCode) : 'uz',
      botStartedAt: new Date(),
    });

    const [created] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, normalizedTelegramId))
      .limit(1);

    return res.json({ success: true, userId: created?.id ?? null, created: true });
  } catch (error) {
    console.error('Internal bot user sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Internal API — bot uchun
app.get('/api/internal/stats/:telegramId', async (req, res) => {
  try {
    if (!hasValidInternalApiKey(req)) {
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
      .select({
        amount: debts.amount,
        type: debts.type,
        returnDate: debts.returnDate,
        status: debts.status,
      })
      .from(debts)
      .where(and(eq(debts.userId, user.id), isNull(debts.deletedAt)));

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
  startRemindersJob();
});
