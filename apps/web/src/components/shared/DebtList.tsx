import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DebtItem } from '../dashboard/DebtItem';
import { EmptyState } from '../dashboard/EmptyState';

type TabFilter = 'all' | 'given' | 'taken' | 'overdue' | 'paid';

interface Debt {
  id: number;
  contactName?: string;
  amount: string;
  paidAmount: string;
  currency?: string | null;
  type: 'given' | 'taken';
  status: 'pending' | 'partial' | 'paid' | null;
  returnDate?: string | null;
  paidAt?: string | null;
  confirmationStatus?: 'not_required' | 'pending' | 'confirmed' | 'denied' | null;
  confirmationExpiresAt?: string | null;
}

interface DebtListProps {
  debts: Debt[] | undefined;
  isLoading: boolean;
  error?: Error | null;
  tab?: TabFilter;
  onEditDebt: (debtId: number) => void;
  onReminder?: (debtId: number) => void;
  maxItems?: number;
}

export const DebtList = ({
  debts = [],
  isLoading,
  error,
  tab = 'all',
  onEditDebt,
  onReminder,
  maxItems,
}: DebtListProps) => {
  const { t } = useTranslation();

  // Filter by tab
  const tabFiltered = useMemo(() => {
    const all = debts || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    switch (tab) {
      case 'given':
        return all.filter((d) => d.type === 'given' && d.status !== 'paid');
      case 'taken':
        return all.filter((d) => d.type === 'taken' && d.status !== 'paid');
      case 'overdue':
        return all.filter((d) => {
          if (d.status === 'paid' || !d.returnDate) return false;
          const dueMs = new Date(String(d.returnDate).split('T')[0]).getTime();
          return dueMs < todayMs;
        });
      case 'paid':
        return all.filter((d) => d.status === 'paid');
      default:
        return all;
    }
  }, [debts, tab]);

  // Sort items
  const items = useMemo(() => {
    const todayMs = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();

    return tabFiltered
      .slice()
      .sort((a, b) => {
        const aPaid = a.status === 'paid' ? 1 : 0;
        const bPaid = b.status === 'paid' ? 1 : 0;
        if (aPaid !== bPaid) return aPaid - bPaid;

        if (aPaid) {
          const aP = new Date(a.returnDate ?? 0).getTime();
          const bP = new Date(b.returnDate ?? 0).getTime();
          return bP - aP;
        }

        const aMs = a.returnDate
          ? new Date(String(a.returnDate).split('T')[0]).getTime()
          : Infinity;
        const bMs = b.returnDate
          ? new Date(String(b.returnDate).split('T')[0]).getTime()
          : Infinity;

        const aDiff = aMs - todayMs;
        const bDiff = bMs - todayMs;

        if (aDiff < 0 && bDiff >= 0) return -1;
        if (aDiff >= 0 && bDiff < 0) return 1;

        return aDiff - bDiff;
      })
      .slice(0, maxItems);
  }, [tabFiltered, maxItems]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
        {error.message || t('common.error')}
      </div>
    );
  }

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{t('debts.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((debt, index) => {
        const remainingAmount = Number(debt.amount) - Number(debt.paidAmount);
        return (
          <div
            key={debt.id}
            className="stagger-item"
            style={{ animationDelay: `${index * 48}ms` }}
          >
            <DebtItem
              id={debt.id}
              contactName={debt.contactName || 'Unknown'}
              amount={remainingAmount}
              currency={debt.currency}
              type={debt.type}
              status={debt.status}
              returnDate={
                debt.returnDate ? String(debt.returnDate).split('T')[0] : null
              }
              paidAt={
                'paidAt' in debt && debt.paidAt
                  ? String(debt.paidAt).split('T')[0]
                  : null
              }
              confirmationStatus={debt.confirmationStatus}
              confirmationExpiresAt={
                debt.confirmationExpiresAt
                  ? String(debt.confirmationExpiresAt)
                  : null
              }
              onClick={() => onEditDebt(debt.id)}
              onReminder={
                debt.status !== 'paid' && onReminder
                  ? () => onReminder(debt.id)
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
};
