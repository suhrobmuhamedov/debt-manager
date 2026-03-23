import { AppLayout } from '../components/layout/AppLayout';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { DebtItem } from '../components/dashboard/DebtItem';
import { Button } from '../components/ui/button';
import { useModalStore } from '../store/modalStore';
import { BackButton } from '../components/common/BackButton';
import { PlusCircle } from 'lucide-react';

export const Debts = () => {
  const { t } = useTranslation();
  const { open } = useModalStore();
  const debtsQuery = trpc.debts.getAll.useQuery({ limit: 50 });

  const items = (debtsQuery.data?.items || []).slice().sort((a, b) => {
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
            <Button
              onClick={() => open('CREATE_DEBT')}
              className="h-10 gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-emerald-600"
            >
              <PlusCircle className="h-4 w-4" />
              {t('debts.add')}
            </Button>
          </div>
        </div>

        {debtsQuery.isLoading ? (
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
                confirmationStatus={debt.confirmationStatus}
                confirmationExpiresAt={debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null}
                onClick={() => open('EDIT_DEBT', { debtId: debt.id })}
              />
            ))}
          </div>
        )}

        {debtsQuery.error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {debtsQuery.error.message || t('common.error')}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};
