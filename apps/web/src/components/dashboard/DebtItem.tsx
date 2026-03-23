import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useTranslation } from 'react-i18next';

interface DebtItemProps {
  id: number;
  contactName: string;
  amount: number;
  currency: string | null;
  type: 'given' | 'taken';
  status: 'pending' | 'partial' | 'paid' | null;
  returnDate: string | null;
  confirmationStatus?: 'not_required' | 'pending' | 'confirmed' | 'denied' | null;
  confirmationExpiresAt?: string | null;
  onClick?: () => void;
}

export const DebtItem = ({
  contactName,
  amount,
  currency,
  type,
  status,
  returnDate,
  confirmationStatus,
  onClick
}: DebtItemProps) => {
  const { t } = useTranslation();
  const isPaid = status === 'paid';
  const paidIsTaken = isPaid && type === 'taken';

  const getStatusBadge = () => {
    switch (status) {
      case 'paid':
        return (
          <Badge
            variant="default"
            className={paidIsTaken ? 'border-red-500 bg-red-600 text-white' : 'border-green-500 bg-green-600 text-white'}
          >
            To'langan
          </Badge>
        );
      case 'partial':
        return <Badge variant="secondary" className="border-blue-500 bg-blue-600 text-white">Qisman</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-400 bg-amber-300 text-black">Kutilmoqda</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    return type === 'given' ? 'text-green-600' : 'text-red-600';
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = returnDate ? new Date(returnDate) : null;
  if (deadline) {
    deadline.setHours(0, 0, 0, 0);
  }

  const dayDiff = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isOverdue = dayDiff < 0 && status !== 'paid';
  const deadlineLabel = dayDiff < 0
    ? `${Math.abs(dayDiff)} ${t('debts.daysOverdue')}`
    : `${dayDiff} ${t('debts.daysLeft')}`;

  const confirmationBadge = (() => {
    if (!confirmationStatus || confirmationStatus === 'not_required') {
      return null;
    }
    if (confirmationStatus === 'pending') {
      return <span className="inline-flex animate-pulse rounded-full bg-yellow-300 px-2 py-0.5 text-[11px] font-semibold text-black">⏳ {t('debts.confirmPending')}</span>;
    }
    if (confirmationStatus === 'confirmed') {
      return <span className="inline-flex rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-semibold text-white">✅ {t('debts.confirmConfirmed')}</span>;
    }
    return <span className="inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-semibold text-white">⚠️ {t('debts.confirmDenied')}</span>;
  })();

  const confirmationCardTone = confirmationStatus === 'denied'
    ? 'border-l-4 border-l-orange-400'
    : confirmationStatus === 'confirmed'
      ? 'border-l-4 border-l-green-500'
      : '';

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${confirmationCardTone} ${
        isOverdue
          ? 'border-red-400 bg-red-50/60 backdrop-blur-xl dark:border-red-600 dark:bg-red-950/20'
          : isPaid
            ? paidIsTaken
              ? 'relative overflow-hidden border-red-400/60 bg-red-50/45 backdrop-blur-2xl dark:border-red-500/40 dark:bg-red-950/30'
              : 'relative overflow-hidden border-emerald-400/60 bg-emerald-50/45 backdrop-blur-2xl dark:border-emerald-500/40 dark:bg-emerald-950/30'
          : 'border-white/50 bg-white/40 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-900/30'
      }`}
      onClick={onClick}
    >
      {isPaid ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/45 backdrop-blur-md dark:bg-slate-900/45">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              paidIsTaken
                ? 'border border-red-500/60 bg-red-500/20 text-red-700 dark:text-red-300'
                : 'border border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            To'landi
          </span>
        </div>
      ) : null}
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{contactName}</h3>
              {getStatusBadge()}
              {confirmationBadge}
            </div>
            <div className={`text-lg font-semibold ${getTypeColor()}`}>
              {type === 'given' ? '+' : '-'}{formatCurrency(amount, currency || 'UZS')}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <p>
                {t('debts.returnDate')}: {deadline ? formatDate(deadline) : '—'}
              </p>
              <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${isOverdue ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                {deadlineLabel}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};