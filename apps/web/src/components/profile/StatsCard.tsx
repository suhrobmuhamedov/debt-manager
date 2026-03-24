import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/formatters';
import { GlassCard } from '../ui/GlassCard';

type DashboardStats = {
  totalGiven: number;
  totalTaken: number;
  overdueCount: number;
  paidCount: number;
};

type StatsCardProps = {
  stats?: DashboardStats;
  contactsCount?: number;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onGivenClick?: () => void;
  onTakenClick?: () => void;
  onOverdueClick?: () => void;
  onPaidClick?: () => void;
  onContactsClick?: () => void;
};

export const StatsCard = ({ stats, contactsCount, isLoading, isError, onRetry, onGivenClick, onTakenClick, onOverdueClick, onPaidClick, onContactsClick }: StatsCardProps) => {
  const { t } = useTranslation();

  return (
    <GlassCard className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{t('profile.statistics')}</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-white/35 bg-white/15 p-3 backdrop-blur-md dark:border-white/20 dark:bg-white/10">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : isError || !stats ? (
          <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-700 backdrop-blur-md dark:border-red-700/40 dark:bg-red-950/30 dark:text-red-200">
            <p>{t('profile.statsLoadError')}</p>
            {onRetry ? (
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={onGivenClick}
              className={`rounded-2xl border border-sky-400/25 bg-sky-500/10 p-3 backdrop-blur-md dark:border-sky-500/25 dark:bg-sky-500/10 transition-all ${onGivenClick ? 'cursor-pointer hover:border-sky-400/40 hover:bg-sky-500/15' : ''}`}
            >
              <p className="text-xs text-muted-foreground">📤 {t('dashboard.given')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(stats.totalGiven, 'UZS')}</p>
            </div>
            <div 
              onClick={onTakenClick}
              className={`rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 backdrop-blur-md dark:border-rose-500/25 dark:bg-rose-500/10 transition-all ${onTakenClick ? 'cursor-pointer hover:border-rose-400/40 hover:bg-rose-500/15' : ''}`}
            >
              <p className="text-xs text-muted-foreground">📥 {t('dashboard.taken')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrency(stats.totalTaken, 'UZS')}</p>
            </div>
            <div 
              onClick={onOverdueClick}
              className={`rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 backdrop-blur-md dark:border-amber-500/25 dark:bg-amber-500/10 transition-all ${onOverdueClick ? 'cursor-pointer hover:border-amber-400/40 hover:bg-amber-500/15' : ''}`}
            >
              <p className="text-xs text-muted-foreground">⚠️ {t('dashboard.overdue')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{stats.overdueCount}</p>
            </div>
            <div 
              onClick={onPaidClick}
              className={`rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 backdrop-blur-md dark:border-emerald-500/25 dark:bg-emerald-500/10 transition-all ${onPaidClick ? 'cursor-pointer hover:border-emerald-400/40 hover:bg-emerald-500/15' : ''}`}
            >
              <p className="text-xs text-muted-foreground">✅ {t('dashboard.paid')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{stats.paidCount}</p>
            </div>
            <div 
              onClick={onContactsClick}
              className={`rounded-2xl border border-purple-400/25 bg-purple-500/10 p-3 backdrop-blur-md dark:border-purple-500/25 dark:bg-purple-500/10 transition-all ${onContactsClick ? 'cursor-pointer hover:border-purple-400/40 hover:bg-purple-500/15' : ''}`}
            >
              <p className="text-xs text-muted-foreground">👤 {t('profile.myContacts')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{contactsCount ?? 0}</p>
            </div>
          </div>
        )}
    </GlassCard>
  );
};
