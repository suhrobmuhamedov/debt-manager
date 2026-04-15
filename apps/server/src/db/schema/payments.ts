
import { int, mysqlTable, timestamp, text, date, decimal, index } from 'drizzle-orm/mysql-core';
import { debts } from './debts';

export const payments = mysqlTable(
	'payments',
	{
		id: int('id').primaryKey().autoincrement(),
		debtId: int('debt_id')
			.notNull()
			.references(() => debts.id, { onDelete: 'cascade' }),
		amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
		paymentDate: date('payment_date').notNull(),
		note: text('note'),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => ({
		debtIdIndex: index('idx_payments_debt_id').on(table.debtId),
	})
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

