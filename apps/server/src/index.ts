import express from 'express';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { db } from './db';
import { users, debts } from './db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
// connect-mysql2 exports a factory requiring the express-session module
const MySQLStore = require('connect-mysql2')(session);

// Load environment variables
const serverDotEnv = path.resolve(__dirname, '.env');
const rootDotEnv = path.resolve(__dirname, '..', '..', '.env');

dotenv.config({ path: serverDotEnv });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: rootDotEnv });
}

// Validate required env variables
const requiredEnvVars = ['DATABASE_URL', 'BOT_TOKEN', 'SESSION_SECRET', 'WEB_APP_URL', 'INTERNAL_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const app = express();

// Health check for Railway
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CORS middleware
app.use(cors({
  origin: process.env.WEB_APP_URL,
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Session middleware
const connection = mysql.createPool(process.env.DATABASE_URL!);

app.use(session({
  secret: process.env.SESSION_SECRET!,
  store: new MySQLStore({ pool: connection, secret: process.env.SESSION_SECRET! }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// tRPC middleware
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// Internal stats endpoint for bot
app.get('/api/internal/stats/:telegramId', async (req, res) => {
  try {
    // Check API key
    const apiKey = req.headers['internal_api_key'];
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const telegramId = parseInt(req.params.telegramId);
    if (isNaN(telegramId)) {
      return res.status(400).json({ error: 'Invalid telegram ID' });
    }

    // Find user by telegramId
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId.toString()))
      .limit(1);

    if (!user) {
      return res.json({ found: false });
    }

    // Get all debts for the user
    const allDebts = await db
      .select({
        debt: debts,
      })
      .from(debts)
      .where(and(eq(debts.userId, user.id), isNull(debts.deletedAt)));

    // Calculate totals
    const totalGiven = allDebts
      .filter(d => d.debt.type === 'given')
      .reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    const totalTaken = allDebts
      .filter(d => d.debt.type === 'taken')
      .reduce((sum, d) => sum + parseFloat(d.debt.amount), 0);

    // Counts
    const pendingCount = allDebts.filter(d => d.debt.status === 'pending').length;
    const overdueCount = allDebts.filter(d =>
      d.debt.returnDate && new Date(d.debt.returnDate) < new Date() && d.debt.status !== 'paid'
    ).length;

    res.json({
      totalGiven,
      totalTaken,
      overdueCount,
      pendingCount,
    });
  } catch (error) {
    console.error('Internal stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
