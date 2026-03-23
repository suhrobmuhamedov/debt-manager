import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { DebtItem } from '../components/dashboard/DebtItem';
import { EmptyState } from '../components/dashboard/EmptyState';
import { SkeletonCard } from '../components/ui/skeleton-card';
import { trpc } from '../lib/trpc';
import { formatCurrency } from '../lib/formatters';
import { useModalStore } from '../store/modalStore';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

export const Dashboard = () => {
  const { data: stats, isLoading, error } = trpc.dashboard.getStats.useQuery();
  const { open: openModal } = useModalStore();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const handleCreateDebt = () => {
    openModal('CREATE_DEBT');
  };

  const handleDebtClick = (debtId: number) => {
    openModal('EDIT_DEBT', { debtId });
  };

  const navigateToDebts = (query: string) => {
    navigate(`/debts${query}`);
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
  const recentActiveDebts = [...stats.recentDebts]
    .filter((debt) => debt.status !== 'paid')
    .sort((a, b) => {
      const aDate = a.returnDate ? new Date(a.returnDate).getTime() : 0;
      const bDate = b.returnDate ? new Date(b.returnDate).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 4);

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-sky-100/40 bg-gradient-to-br from-sky-500/85 via-blue-500/80 to-cyan-500/75 p-5 text-white shadow-2xl shadow-sky-600/30 backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-cyan-200/30 blur-3xl" />
          <button
            onClick={handleCreateDebt}
            className="mx-auto flex h-14 items-center justify-center rounded-2xl border border-white/70 bg-white/65 px-8 text-base font-semibold text-sky-800 shadow-2xl shadow-cyan-900/25 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/75"
          >
            + {t('debts.add')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title={t('dashboard.given')}
            value={formatCurrency(stats.totalGiven, 'UZS')}
            icon="💰"
            variant="success"
            onClick={() => navigateToDebts('?type=given')}
            className="border-white/60 bg-white/25 backdrop-blur-2xl shadow-xl shadow-emerald-900/10"
          />
          <StatCard
            title={t('dashboard.taken')}
            value={formatCurrency(stats.totalTaken, 'UZS')}
            icon="📥"
            variant="danger"
            onClick={() => navigateToDebts('?type=taken')}
            className="border-white/60 bg-white/25 backdrop-blur-2xl shadow-xl shadow-rose-900/10"
          />
          <StatCard
            title={t('debts.pending')}
            value={stats.pendingCount}
            subtitle={t('dashboard.pendingCount')}
            icon="⏳"
            variant="warning"
            onClick={() => navigateToDebts('?status=active')}
            className="border-white/60 bg-white/25 backdrop-blur-2xl shadow-xl shadow-amber-900/10"
          />
          <StatCard
            title={t('dashboard.overdue')}
            value={stats.overdueCount}
            subtitle={formatCurrency(stats.overdueAmount, 'UZS')}
            icon="⚠️"
            variant={stats.overdueCount > 0 ? "danger" : "default"}
            onClick={() => navigateToDebts('?overdue=1')}
            className="border-white/60 bg-white/25 backdrop-blur-2xl shadow-xl shadow-slate-900/10"
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
          </div>

          {recentActiveDebts.length === 0 ? (
            <EmptyState
              title={t('dashboard.noDebts')}
              description={t('dashboard.firstDebtHint')}
              actionLabel={t('debts.add')}
              onAction={handleCreateDebt}
            />
          ) : (
            <div className="space-y-3">
              {recentActiveDebts.map((debt, index) => (
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
