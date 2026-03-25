import { int, mysqlTable, timestamp, text, varchar, index } from 'drizzle-orm/mysql-core';
import { users } from './users';

export const contacts = mysqlTable(
	'contacts',
	{
		id: int('id').primaryKey().autoincrement(),
		userId: int('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 100 }).notNull(),
		phone: varchar('phone', { length: 20 }),
		telegramUsername: varchar('telegram_username', { length: 100 }),
		note: text('note'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
		deletedAt: timestamp('deleted_at'),
	},
	(table) => ({
		userIdIndex: index('idx_contacts_user_id').on(table.userId),
	})
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

