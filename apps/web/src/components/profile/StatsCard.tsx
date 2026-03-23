import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/formatters';

type DashboardStats = {
  totalGiven: number;
  totalTaken: number;
  overdueCount: number;
  paidCount: number;
};

type StatsCardProps = {
  stats?: DashboardStats;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export const StatsCard = ({ stats, isLoading, isError, onRetry }: StatsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="border-gray-300 bg-white/90 shadow-sm dark:border-gray-600 dark:bg-gray-800/90">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.statistics')}</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-300 p-3 dark:border-gray-600">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : isError || !stats ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <p>{t('profile.statsLoadError')}</p>
            {onRetry ? (
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-300 bg-sky-50 p-3 dark:border-sky-700/80 dark:bg-sky-950/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">📤 {t('dashboard.given')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalGiven, 'UZS')}</p>
            </div>
            <div className="rounded-2xl border border-gray-300 bg-rose-50 p-3 dark:border-rose-700/80 dark:bg-rose-950/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">📥 {t('dashboard.taken')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalTaken, 'UZS')}</p>
            </div>
            <div className="rounded-2xl border border-gray-300 bg-amber-50 p-3 dark:border-amber-700/80 dark:bg-amber-950/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">⚠️ {t('dashboard.overdue')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{stats.overdueCount}</p>
            </div>
            <div className="rounded-2xl border border-gray-300 bg-emerald-50 p-3 dark:border-emerald-700/80 dark:bg-emerald-950/40">
              <p className="text-xs text-gray-500 dark:text-gray-400">✅ {t('dashboard.paid')}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{stats.paidCount}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
