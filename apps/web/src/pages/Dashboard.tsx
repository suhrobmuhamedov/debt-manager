import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { DebtItem } from '../components/dashboard/DebtItem';
import { EmptyState } from '../components/dashboard/EmptyState';
import { SkeletonCard } from '../components/ui/skeleton-card';
import { trpc } from '../lib/trpc';
import { formatCurrency } from '../lib/formatters';
import { useModalStore } from '../store/modalStore';
import { useTranslation } from 'react-i18next';

export const Dashboard = () => {
  const { data: stats, isLoading, error } = trpc.dashboard.getStats.useQuery();
  const { open: openModal } = useModalStore();
  const { t } = useTranslation();

  const handleCreateDebt = () => {
    openModal('CREATE_DEBT');
  };

  const handleDebtClick = (debtId: number) => {
    openModal('EDIT_DEBT', { debtId });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Recent Debts Skeleton */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentDebts')}</h2>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-4">
            <h3 className="text-red-900 dark:text-red-200 font-bold">{t('common.error')}: {error.message}</h3>
            <p className="text-red-700 text-sm mt-2">Data: {error.data?.code || 'Unknown'}</p>
            <p className="text-red-600 dark:text-red-300 text-xs mt-2">{t('common.retry')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) {
    return (
      <AppLayout>
        <div className="p-4">
          <EmptyState
            title={t('common.error')}
            description={t('common.retry')}
          />
        </div>
      </AppLayout>
    );
  }

  const netBalance = stats.totalGiven - stats.totalTaken;

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 p-4 text-white shadow-xl shadow-sky-500/30">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/20 blur-xl" />
          <div className="space-y-2">
            <h2 className="text-lg font-bold">{t('dashboard.newDebt')}</h2>
            <p className="text-sm text-white/90">{t('dashboard.firstDebtHint')}</p>
            <button
              onClick={handleCreateDebt}
              className="mt-1 inline-flex h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              + {t('debts.add')}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title={t('dashboard.given')}
            value={formatCurrency(stats.totalGiven, 'UZS')}
            icon="💰"
            variant="success"
          />
          <StatCard
            title={t('dashboard.taken')}
            value={formatCurrency(stats.totalTaken, 'UZS')}
            icon="📥"
            variant="danger"
          />
          <StatCard
            title={t('debts.pending')}
            value={stats.pendingCount}
            subtitle={t('dashboard.pendingCount')}
            icon="⏳"
            variant="warning"
          />
          <StatCard
            title={t('dashboard.overdue')}
            value={stats.overdueCount}
            subtitle={formatCurrency(stats.overdueAmount, 'UZS')}
            icon="⚠️"
            variant={stats.overdueCount > 0 ? "danger" : "default"}
          />
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('dashboard.netBalance')}</h3>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, 'UZS')}
              </div>
            </div>
            <div className="text-4xl">
              {netBalance >= 0 ? '📈' : '📉'}
            </div>
          </div>
        </div>

        {/* Recent Debts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentDebts')}</h2>
            <button
              onClick={handleCreateDebt}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            >
              + {t('dashboard.newDebt')}
            </button>
          </div>

          {stats.recentDebts.length === 0 ? (
            <EmptyState
              title={t('dashboard.noDebts')}
              description={t('dashboard.firstDebtHint')}
              actionLabel={t('debts.add')}
              onAction={handleCreateDebt}
            />
          ) : (
            <div className="space-y-3">
              {stats.recentDebts.map((debt, index) => (
                <div key={debt.id} className="stagger-item" style={{ animationDelay: `${index * 48}ms` }}>
                  <DebtItem
                    {...debt}
                    onClick={() => handleDebtClick(debt.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
