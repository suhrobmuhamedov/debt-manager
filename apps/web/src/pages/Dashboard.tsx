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
import { GlassButton } from '../components/ui/GlassButton';

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
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
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
        <div className="space-y-3">
          <div className="flex justify-center py-2">
            <GlassButton
              onClick={handleCreateDebt}
              variant="glass"
              className="flex h-14 items-center justify-center px-7 text-base font-bold whitespace-nowrap shadow-sm ring-1 ring-white/20"
            >
              + {t('debts.add')}
            </GlassButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-1">
          <StatCard
            title={t('dashboard.given')}
            value={formatCurrency(stats.totalGiven, 'UZS')}
            subtitle={`${stats.givenCount} ta`}
            variant="success"
            onClick={() => navigateToDebts('?tab=given')}
            className="w-full"
          />
          <StatCard
            title={t('dashboard.taken')}
            value={formatCurrency(stats.totalTaken, 'UZS')}
            subtitle={`${stats.takenCount} ta`}
            variant="danger"
            onClick={() => navigateToDebts('?tab=taken')}
            className="w-full"
          />
          <StatCard
            title={t('dashboard.overdue')}
            value={formatCurrency(stats.overdueAmount, 'UZS')}
            subtitle={`${stats.overdueCount} ta`}
            variant="warning"
            onClick={() => navigateToDebts('?tab=overdue')}
            className="w-full"
          />
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
              {recentActiveDebts.map((debt) => (
                <div key={debt.id}>
                  <DebtItem
                    id={debt.id}
                    contactName={debt.contactName || 'Unknown'}
                    amount={Math.max(Number(debt.amount) - Number(debt.paidAmount), 0)}
                    currency={debt.currency}
                    type={debt.type}
                    status={debt.status}
                    returnDate={debt.returnDate ? String(debt.returnDate).split('T')[0] : null}
                    paidAt={'paidAt' in debt && debt.paidAt ? String(debt.paidAt).split('T')[0] : null}
                    confirmationStatus={debt.confirmationStatus}
                    confirmationExpiresAt={debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null}
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
