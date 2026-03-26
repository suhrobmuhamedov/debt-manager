import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { contacts, debts, users } from '../db/schema';

type ReminderRow = {
	id: number;
	userId: number;
	amount: string;
	paidAmount: string;
	currency: 'UZS' | 'USD' | 'EUR' | null;
	type: 'given' | 'taken';
	returnDate: Date;
	contactName: string | null;
	contactPhone: string | null;
	linkedDebtId: number | null;
	ownerTelegramId: string;
	ownerFirstName: string;
	ownerLastName: string | null;
	lastReminderDigestAt: Date | null;
};

type CounterpartyInfo = {
	debtId: number;
	username: string | null;
};

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const DEFAULT_TIME_ZONE = process.env.REMINDER_TIME_ZONE || 'Asia/Tashkent';

const formatDateOnly = (date: Date): string => {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: DEFAULT_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
};

const parseGmtOffsetMinutes = (offsetLabel: string): number => {
	if (offsetLabel === 'GMT' || offsetLabel === 'UTC') {
		return 0;
	}

	const match = offsetLabel.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
	if (!match) {
		return 0;
	}

	const sign = match[1] === '-' ? -1 : 1;
	const hours = Number(match[2] || '0');
	const minutes = Number(match[3] || '0');
	return sign * (hours * 60 + minutes);
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'shortOffset',
		hour: '2-digit',
		hour12: false,
	}).formatToParts(date);

	const offsetLabel = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
	return parseGmtOffsetMinutes(offsetLabel);
};

const getZonedDayStartUtc = (date = new Date()) => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: DEFAULT_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);

	const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const year = Number(map.year || '1970');
	const month = Number(map.month || '01');
	const day = Number(map.day || '01');

	const utcMidnightGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
	const offsetMinutes = getTimeZoneOffsetMinutes(utcMidnightGuess, DEFAULT_TIME_ZONE);
	return new Date(utcMidnightGuess.getTime() - offsetMinutes * 60 * 1000);
};

const getZonedDateParts = (date = new Date()) => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: DEFAULT_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		hour12: false,
	}).formatToParts(date);

	const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const dateKey = `${map.year}-${map.month}-${map.day}`;
	return {
		dateKey,
		hour: Number(map.hour || '0'),
	};
};

const escapeHtml = (value: string): string => {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
};

const formatAmount = (amount: number, currency: string | null): string => {
	return `${amount.toLocaleString('uz-UZ')} ${currency || 'UZS'}`;
};

const formatReminderDate = (date: Date): string => {
	return date.toLocaleDateString('uz-UZ', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: DEFAULT_TIME_ZONE,
	});
};

const formatDebtTypeLabel = (type: 'given' | 'taken'): string => {
	return type === 'given' ? 'Siz bergan qarz' : 'Siz olgan qarz';
};

const buildUsernameLine = (username: string | null | undefined): string => {
	return username ? `\n🔗 Telegram: @${escapeHtml(username)}` : '';
};

export const sendTelegramHtmlMessage = async (telegramId: string, html: string): Promise<void> => {
	const botToken = process.env.BOT_TOKEN;
	if (!botToken || !telegramId) {
		throw new Error('BOT_TOKEN or telegramId missing');
	}

	const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: telegramId,
			text: html,
			parse_mode: 'HTML',
			disable_web_page_preview: true,
		}),
	});

	if (!response.ok) {
		const bodyText = await response.text();
		throw new Error(`Telegram API error: ${response.status} ${bodyText}`);
	}
};

export const buildForwardableReminderMessage = (payload: {
	contactName: string;
	contactPhone?: string | null;
	contactUsername?: string | null;
	amount: number;
	currency: string | null;
	returnDate: Date;
	type: 'given' | 'taken';
}) => {
	const intro = payload.type === 'given'
		? '⏰ Eslatma: ushbu qarzni qaytarish muddati yaqinlashmoqda.'
		: '⏰ Eslatma: ushbu qarz bo\'yicha to\'lov muddati yaqinlashmoqda.';

	return [
		intro,
		`👤 Ism: ${escapeHtml(payload.contactName)}`,
		`📞 Telefon: ${escapeHtml(payload.contactPhone || 'Kiritilmagan')}`,
		`${buildUsernameLine(payload.contactUsername)}`.trim(),
		`💵 Qarz miqdori: ${escapeHtml(formatAmount(payload.amount, payload.currency))}`,
		`📅 Qaytarish sanasi: ${escapeHtml(formatReminderDate(payload.returnDate))}`,
	].filter(Boolean).join('\n');
};

export const buildDirectReminderMessage = (payload: {
	ownerName: string;
	ownerPhone?: string | null;
	ownerUsername?: string | null;
	amount: number;
	currency: string | null;
	returnDate: Date;
}) => {
	return [
		'⏰ Qarz eslatmasi',
		`${escapeHtml(payload.ownerName)} sizga qarz bo\'yicha eslatma yubordi.`,
		'🧾 Turi: Siz qaytarishingiz kerak bo\'lgan qarz',
		`👤 Ism: ${escapeHtml(payload.ownerName)}`,
		`📞 Telefon: ${escapeHtml(payload.ownerPhone || 'Kiritilmagan')}`,
		`${buildUsernameLine(payload.ownerUsername)}`.trim(),
		`💵 Qarz miqdori: ${escapeHtml(formatAmount(payload.amount, payload.currency))}`,
		`📅 Qaytarish sanasi: ${escapeHtml(formatReminderDate(payload.returnDate))}`,
	].filter(Boolean).join('\n');
};

const buildDigestMessage = (items: Array<ReminderRow & { counterpartyUsername?: string | null }>) => {
	const body = items
		.map((item) => {
			const remainingAmount = Math.max(Number(item.amount) - Number(item.paidAmount), 0);
			const ownerName = [item.ownerFirstName, item.ownerLastName].filter(Boolean).join(' ');
			return [
				`⏰ Eslatma: Salom ${escapeHtml(item.contactName || 'Noma\'lum')} qarzingiz haqida eslatma.`,
				`👤 Kimdan: ${escapeHtml(ownerName || 'Noma\'lum')}`,
				`📞 Telefon: ${escapeHtml(item.contactPhone || 'Kiritilmagan')}`,
				`💵 Qarz miqdori: ${escapeHtml(formatAmount(remainingAmount, item.currency))}`,
				`📅 Qaytarish sanasi: ${escapeHtml(formatReminderDate(item.returnDate))}`,
			].filter(Boolean).join('\n');
		})
		.join('\n\n');

	return `<b>Muddati yaqinlashgan qarzlar</b>\n\n${body}`;
};

const getCounterpartyUsernames = async (rows: ReminderRow[]): Promise<Map<number, string | null>> => {
	const linkedDebtIds = rows.map((row) => row.linkedDebtId).filter((value): value is number => Boolean(value));
	if (!linkedDebtIds.length) {
		return new Map();
	}

	const counterpartRows = await db
		.select({
			debtId: debts.id,
			username: users.username,
		})
		.from(debts)
		.innerJoin(users, eq(users.id, debts.userId))
		.where(inArray(debts.id, linkedDebtIds));

	return new Map(counterpartRows.map((row: CounterpartyInfo) => [row.debtId, row.username]));
};

export const sendDailyDueSoonReminderDigests = async (): Promise<{ processedUsers: number; sentUsers: number }> => {
	const runHour = Number(process.env.REMINDER_RUN_HOUR || '9');
	const now = new Date();
	const { dateKey, hour } = getZonedDateParts(now);
	if (hour < runHour) {
		return { processedUsers: 0, sentUsers: 0 };
	}

	const todayStartUtc = getZonedDayStartUtc(now);
	const limitDate = new Date(todayStartUtc.getTime() + 3 * 24 * 60 * 60 * 1000);
	const todayKey = dateKey;
	const limitKey = formatDateOnly(limitDate);

	const dueSoonRows = await db
		.select({
			id: debts.id,
			userId: debts.userId,
			amount: debts.amount,
			paidAmount: debts.paidAmount,
			currency: debts.currency,
			type: debts.type,
			returnDate: debts.returnDate,
			contactName: contacts.name,
			contactPhone: contacts.phone,
			linkedDebtId: debts.linkedDebtId,
			ownerTelegramId: users.telegramId,
			ownerFirstName: users.firstName,
			ownerLastName: users.lastName,
			lastReminderDigestAt: users.lastReminderDigestAt,
		})
		.from(debts)
		.innerJoin(users, eq(users.id, debts.userId))
		.leftJoin(contacts, eq(contacts.id, debts.contactId))
		.where(
			and(
				isNull(debts.deletedAt),
				isNotNull(users.botStartedAt),
				sql`${debts.status} IN ('pending', 'partial')`,
				sql`${debts.returnDate} >= ${todayKey}`,
				sql`${debts.returnDate} <= ${limitKey}`,
				sql`(${users.lastReminderDigestAt} IS NULL OR ${users.lastReminderDigestAt} < ${todayStartUtc})`
			)
		) as ReminderRow[];

	if (!dueSoonRows.length) {
		return { processedUsers: 0, sentUsers: 0 };
	}

	const counterpartUsernames = await getCounterpartyUsernames(dueSoonRows);
	const grouped = new Map<number, Array<ReminderRow & { counterpartyUsername?: string | null }>>();
	for (const row of dueSoonRows) {
		const current = grouped.get(row.userId) || [];
		current.push({
			...row,
			counterpartyUsername: row.linkedDebtId ? (counterpartUsernames.get(row.linkedDebtId) ?? null) : null,
		});
		grouped.set(row.userId, current);
	}

	let sentUsers = 0;

	for (const [userId, items] of grouped.entries()) {
		const telegramId = items[0]?.ownerTelegramId;
		if (!telegramId) {
			continue;
		}

		try {
			await sendTelegramHtmlMessage(telegramId, buildDigestMessage(items));
			await db.update(users).set({ lastReminderDigestAt: new Date() }).where(eq(users.id, userId));
			sentUsers += 1;
		} catch (error) {
			console.error(`[reminders] failed to send digest for userId=${userId}`, error);
		}
	}

	return {
		processedUsers: grouped.size,
		sentUsers,
	};
};
