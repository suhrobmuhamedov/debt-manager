import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from server/.env first, then fall back to repo root .env
const serverDotEnv = path.resolve(__dirname, '.env');
const rootDotEnv = path.resolve(__dirname, '..', '..', '.env');

dotenv.config({ path: serverDotEnv });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: rootDotEnv });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set in .env to run drizzle-kit');
}

const dbUrl = new URL(databaseUrl);

const dbCredentials = {
  host: dbUrl.hostname,
  port: dbUrl.port ? Number(dbUrl.port) : undefined,
  user: dbUrl.username || undefined,
  password: dbUrl.password || undefined,
  database: dbUrl.pathname?.slice(1) || undefined,
};

export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials,
});