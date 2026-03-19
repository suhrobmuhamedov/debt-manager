import {
	int,
	mysqlTable,
	varchar,
	decimal,
	date,
	timestamp,
	text,
	index,
	uniqueIndex,
	mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { contacts } from './contacts';

const currencyEnum = mysqlEnum('currency', ['UZS', 'USD', 'EUR']);
const debtTypeEnum = mysqlEnum('debt_type', ['given', 'taken']);
const debtStatusEnum = mysqlEnum('debt_status', ['pending', 'partial', 'paid']);

export const debts = mysqlTable(
	'debts',
	{
		id: int('id').primaryKey().autoincrement(),
		uuid: varchar('uuid', { length: 36 })
			.notNull()
				.default(sql`(UUID())`),
		userId: int('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		contactId: int('contact_id').notNull().references(() => contacts.id),
		amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
		paidAmount: decimal('paid_amount', { precision: 15, scale: 2 })
			.notNull()
			.default('0'),
		currency: currencyEnum.default('UZS'),
		type: debtTypeEnum.notNull(),
		status: debtStatusEnum.default('pending'),
		givenDate: date('given_date').notNull(),
		returnDate: date('return_date'),
		note: text('note'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
		deletedAt: timestamp('deleted_at'),
	},
	(table) => ({
		userIdIndex: index('idx_debts_user_id').on(table.userId),
		statusIndex: index('idx_debts_status').on(table.status),
		returnDateIndex: index('idx_debts_return_date').on(table.returnDate),
		uuidUnique: uniqueIndex('uq_debts_uuid').on(table.uuid),
	})
);

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
