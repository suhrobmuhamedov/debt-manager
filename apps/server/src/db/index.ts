import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as schema from './schema';

// Load .env from server folder first, then fall back to repository root
const serverDotEnv = path.resolve(__dirname, '.env');
const rootDotEnv = path.resolve(__dirname, '..', '..', '.env');

dotenv.config({ path: serverDotEnv });
if (!process.env.DATABASE_URL) {
	dotenv.config({ path: rootDotEnv });
}

const pool = mysql.createPool({
	uri: process.env.DATABASE_URL,
	connectionLimit: 10,   // parallel querylar uchun oshirildi (5 → 10)
	connectTimeout: 10000,
	waitForConnections: true,
	queueLimit: 0,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,
});

export const db = drizzle(pool, { schema, mode: 'default' });
