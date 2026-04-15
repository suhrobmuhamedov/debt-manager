
import { mysqlTable, int, varchar, timestamp, uniqueIndex } from 'drizzle-orm/mysql-core';

export const users = mysqlTable(
	'users',
	{
		id: int('id').primaryKey().autoincrement(),
		telegramId: varchar('telegram_id', { length: 20 }).notNull(),
		firstName: varchar('first_name', { length: 100 }).notNull(),
		lastName: varchar('last_name', { length: 100 }),
		username: varchar('username', { length: 100 }),
		phone: varchar('phone', { length: 20 }),
		languageCode: varchar('language_code', { length: 10 }).default('uz'),
		botStartedAt: timestamp('bot_started_at'),
		lastReminderDigestAt: timestamp('last_reminder_digest_at'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
	},
	(table) => ({
		telegramIdUnique: uniqueIndex('uq_users_telegram_id').on(table.telegramId),
	})
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
