import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
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

const connection = mysql.createPool(process.env.DATABASE_URL!);

export const db = drizzle(connection, { schema, mode: 'default' });
