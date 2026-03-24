import { AppLayout } from '../components/layout/AppLayout';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { DebtItem } from '../components/dashboard/DebtItem';
import { useModalStore } from '../store/modalStore';
import { BackButton } from '../components/common/BackButton';
import { PlusCircle } from 'lucide-react';
import { useMemo } from 'react';
import { GlassButton } from '../components/ui/GlassButton';

export const Debts = () => {
  const { t } = useTranslation();
  const { open } = useModalStore();
  const search = typeof window !== 'undefined' ? window.location.search : '';

  const filters = useMemo(() => {
    const params = new URLSearchParams(search);
    const type = params.get('type');
    const status = params.get('status');
    const overdue = params.get('overdue') === '1';

    return {
      type: type === 'given' || type === 'taken' ? type : undefined,
      status:
        status === 'pending' || status === 'partial' || status === 'paid' || status === 'active'
          ? status
          : undefined,
      overdue,
    } as {
      type?: 'given' | 'taken';
      status?: 'pending' | 'partial' | 'paid' | 'active';
      overdue: boolean;
    };
  }, [search]);

  const debtsQuery = trpc.debts.getAll.useQuery(
    {
      limit: 50,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status && filters.status !== 'active' ? { status: filters.status } : {}),
    },
    { enabled: !filters.overdue }
  );

  const overdueQuery = trpc.debts.getOverdue.useQuery(undefined, { enabled: filters.overdue });

  const fetchedItems = filters.overdue ? (overdueQuery.data || []) : (debtsQuery.data?.items || []);
  const baseItems =
    filters.status === 'active'
      ? fetchedItems.filter((item) => item.status === 'pending' || item.status === 'partial')
      : fetchedItems;
  const isLoading = filters.overdue ? overdueQuery.isLoading : debtsQuery.isLoading;
  const queryError = filters.overdue ? overdueQuery.error : debtsQuery.error;

  const items = baseItems.slice().sort((a, b) => {
    const aPaid = a.status === 'paid' ? 1 : 0;
    const bPaid = b.status === 'paid' ? 1 : 0;
    if (aPaid !== bPaid) {
      return aPaid - bPaid;
    }
    const aCreatedAt = new Date(a.createdAt ?? 0).getTime();
    const bCreatedAt = new Date(b.createdAt ?? 0).getTime();
    return bCreatedAt - aCreatedAt;
  });

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <BackButton fallback="/" label={t('common.back')} />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{t('debts.title')}</h1>
            <GlassButton
              onClick={() => open('CREATE_DEBT')}
              variant="glass"
              className="h-12 gap-2 px-6 text-sm font-semibold whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              {t('debts.add')}
            </GlassButton>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : !items.length ? (
          <p className="text-sm text-muted-foreground">{t('debts.empty')}</p>
        ) : (
          <div className="space-y-3">
            {items.map((debt) => (
              <DebtItem
                key={debt.id}
                id={debt.id}
                contactName={debt.contactName || 'Unknown'}
                amount={Number(debt.amount) - Number(debt.paidAmount)}
                currency={debt.currency}
                type={debt.type}
                status={debt.status}
                returnDate={debt.returnDate ? String(debt.returnDate).split('T')[0] : null}
                paidAt={debt.paidAt ? String(debt.paidAt).split('T')[0] : null}
                confirmationStatus={debt.confirmationStatus}
                confirmationExpiresAt={debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null}
                onClick={() => open('EDIT_DEBT', { debtId: debt.id })}
              />
            ))}
          </div>
        )}

        {queryError ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {queryError.message || t('common.error')}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};
