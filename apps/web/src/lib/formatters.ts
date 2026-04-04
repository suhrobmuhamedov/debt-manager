import { format, formatDistanceToNow, differenceInDays, isValid } from 'date-fns';
import { uz } from 'date-fns/locale';

export type MoneyInput = number | string | null | undefined;
export type MoneySign = 'plus' | 'minus' | 'none';

const CURRENCY_LABELS: Record<string, string> = {
  UZS: "so'm",
  "SO'M": "so'm",
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

export const normalizeMoneyValue = (value: MoneyInput): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Object.is(parsed, -0) ? 0 : parsed;
};

export const formatMoneyNumber = (value: MoneyInput): string => {
  const normalized = normalizeMoneyValue(value);
  const absValue = Math.abs(normalized);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(absValue)
    .replace(/,/g, ' ');
};

type FormatCurrencyOptions = {
  sign?: MoneySign;
  withCurrency?: boolean;
};

export const formatCurrency = (
  amount: MoneyInput,
  currency: string,
  options: FormatCurrencyOptions = {}
): string => {
  const normalized = normalizeMoneyValue(amount);
  const sign = options.sign ?? 'none';
  const withCurrency = options.withCurrency ?? true;
  const formattedNumber = formatMoneyNumber(normalized);
  const currencyCode = (currency || 'UZS').toUpperCase();
  const currencyLabel = CURRENCY_LABELS[currencyCode] ?? currency;
  const signPrefix = sign === 'plus' ? '+' : sign === 'minus' ? '-' : normalized < 0 ? '-' : '';

  if (!withCurrency) {
    return `${signPrefix}${formattedNumber}`;
  }

  if (currencyLabel === '$' || currencyLabel === '€') {
    return `${signPrefix}${currencyLabel}${formattedNumber}`;
  }

  if (currencyLabel === '₽') {
    return `${signPrefix}${formattedNumber} ${currencyLabel}`;
  }

  return `${signPrefix}${formattedNumber} ${currencyLabel}`;
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (date === null || date === undefined || date === '') return "Sana ko'rsatilmagan";
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) {
    console.warn('[formatDate] Invalid date value:', date);
    return "Sana ko'rsatilmagan";
  }
  return format(d, 'd MMMM yyyy', { locale: uz });
};

export const formatRelativeDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: uz });
};

export const getDaysUntil = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return differenceInDays(d, new Date());
};
