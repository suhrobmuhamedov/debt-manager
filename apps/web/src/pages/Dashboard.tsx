import { AppLayout } from '../components/layout/AppLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { DebtItem } from '../components/dashboard/DebtItem';
import { EmptyState } from '../components/dashboard/EmptyState';
import { SkeletonCard } from '../components/ui/skeleton-card';
import { trpc } from '../lib/trpc';
import { formatCurrency } from '../lib/formatters';
import { useModalStore } from '../store/modalStore';

export const Dashboard = () => {
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { open: openModal } = useModalStore();

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
            <h2 className="text-lg font-semibold text-gray-900">So'nggi qarzlar</h2>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
            title="Ma'lumot yuklanmadi"
            description="Iltimos, sahifani qayta yuklang"
          />
        </div>
      </AppLayout>
    );
  }

  const netBalance = stats.totalGiven - stats.totalTaken;

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Berilgan qarzlar"
            value={formatCurrency(stats.totalGiven, 'UZS')}
            icon="💰"
            variant="success"
          />
          <StatCard
            title="Olingan qarzlar"
            value={formatCurrency(stats.totalTaken, 'UZS')}
            icon="📥"
            variant="danger"
          />
          <StatCard
            title="Kutilayotgan"
            value={stats.pendingCount}
            subtitle="ta qarz"
            icon="⏳"
            variant="warning"
          />
          <StatCard
            title="Muddat o'tgan"
            value={stats.overdueCount}
            subtitle={formatCurrency(stats.overdueAmount, 'UZS')}
            icon="⚠️"
            variant={stats.overdueCount > 0 ? "danger" : "default"}
          />
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Umumiy balans</h3>
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
            <h2 className="text-lg font-semibold text-gray-900">So'nggi qarzlar</h2>
            <button
              onClick={handleCreateDebt}
              className="text-blue-500 text-sm font-medium hover:text-blue-600"
            >
              + Yangi qarz
            </button>
          </div>

          {stats.recentDebts.length === 0 ? (
            <EmptyState
              title="Hali qarzlar yo'q"
              description="Birinchi qarzingizni qo'shish uchun tugmani bosing"
              actionLabel="Qarz qo'shish"
              onAction={handleCreateDebt}
            />
          ) : (
            <div className="space-y-3">
              {stats.recentDebts.map((debt) => (
                <DebtItem
                  key={debt.id}
                  {...debt}
                  onClick={() => handleDebtClick(debt.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
