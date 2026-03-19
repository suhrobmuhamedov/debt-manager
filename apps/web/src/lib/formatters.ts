import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { uz } from 'date-fns/locale';

export const formatCurrency = (amount: number, currency: string): string => {
  const formatted = amount.toLocaleString('uz-UZ');

  switch (currency.toUpperCase()) {
    case 'UZS':
    case 'SO\'M':
      return `${formatted} so'm`;
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    case 'RUB':
      return `${formatted} ₽`;
    default:
      return `${formatted} ${currency}`;
  }
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
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
