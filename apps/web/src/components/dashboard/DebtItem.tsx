import { CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { GlassButton } from '../ui/GlassButton';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../ui/GlassCard';

interface DebtItemProps {
  id: number;
  contactName: string;
  amount: number;
  currency: string | null;
  type: 'given' | 'taken';
  status: 'pending' | 'partial' | 'paid' | null;
  returnDate: string | null;
  paidAt?: string | null;
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
  paidAt,
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
        return (
          <Badge
            variant="secondary"
            className="border border-white/40 bg-white/20 text-foreground backdrop-blur-md dark:border-white/20 dark:bg-white/10"
          >
            Qisman
          </Badge>
        );
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="border border-white/40 bg-white/20 text-foreground backdrop-blur-md dark:border-white/20 dark:bg-white/10"
          >
            Kutilmoqda
          </Badge>
        );
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
  const paidDate = paidAt ? new Date(paidAt) : null;
  const paidDateLabel = paidDate && !Number.isNaN(paidDate.getTime())
    ? paidDate.toLocaleDateString('ru-RU')
    : '—';

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

  const cardVariant = type === 'given' ? 'colored' : 'light';

  return (
    <GlassCard
      variant={cardVariant}
      className={`cursor-pointer ${confirmationCardTone} ${
        isOverdue
          ? 'border-red-400/40 bg-red-500/8'
          : isPaid
            ? paidIsTaken
              ? 'relative overflow-hidden border-red-400/40 bg-red-500/15 backdrop-blur-xl'
              : 'relative overflow-hidden border-emerald-400/40 bg-emerald-500/15 backdrop-blur-xl'
          : type === 'taken'
            ? 'border-orange-300/25 bg-orange-500/8'
            : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl opacity-45 ${type === 'given' ? 'bg-blue-400' : 'bg-orange-400'}`} />
      {isPaid ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex justify-center bg-white/45 pt-3 backdrop-blur-xl dark:bg-black/45">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                paidIsTaken
                  ? 'border border-red-500/60 bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'border border-emerald-500/60 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              To'landi
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                paidIsTaken
                  ? 'border border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300'
                  : 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {paidDateLabel}
            </span>
          </div>
        </div>
      ) : null}
      <CardContent className={`relative z-10 p-0 ${isPaid ? 'pt-20' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-medium ${isPaid ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{contactName}</h3>
              {!isPaid ? getStatusBadge() : null}
              {confirmationBadge}
            </div>
            {!isPaid ? (
              <div className={`numeric-text text-lg font-semibold ${getTypeColor()}`}>
                {type === 'given' ? '+' : '-'}{formatCurrency(amount, currency || 'UZS')}
              </div>
            ) : null}
            {!isPaid ? (
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  {t('debts.returnDate')}: {deadline ? formatDate(deadline) : '—'}
                </p>
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${isOverdue ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {deadlineLabel}
                </span>
              </div>
            ) : null}
          </div>
          <GlassButton variant="primary" className="ml-2 px-3 py-2 text-sm">
            →
          </GlassButton>
        </div>
      </CardContent>
    </GlassCard>
  );
};