import { AppLayout } from '../components/layout/AppLayout';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { DebtItem } from '../components/dashboard/DebtItem';
import { Button } from '../components/ui/button';

export const Debts = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const debtsQuery = trpc.debts.getAll.useQuery({ limit: 50 });

  const items = debtsQuery.data?.items || [];

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold text-foreground">{t('debts.title')}</h1>

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
                onClick={() => navigate(`/debts/${debt.id}`)}
              />
            ))}
          </div>
        )}

        {debtsQuery.error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {debtsQuery.error.message || t('common.error')}
          </div>
        ) : null}

        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          {t('nav.home')}
        </Button>
      </div>
    </AppLayout>
  );
};
