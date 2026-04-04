import { AppLayout } from '../components/layout/AppLayout';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { DebtItem } from '../components/dashboard/DebtItem';
import { useModalStore } from '../store/modalStore';
import { BackButton } from '../components/common/BackButton';
import { useMemo, useState, useEffect } from 'react';
import { GlassButton } from '../components/ui/GlassButton';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

type TabFilter = 'all' | 'given' | 'taken' | 'overdue' | 'paid';

export const Debts = () => {
  const { t } = useTranslation();
  const { open } = useModalStore();
  const [location] = useLocation();
  const [tab, setTab] = useState<TabFilter>('all');

  // URL'dan kelgan tab parametrini o'qish
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab') as TabFilter | null;

    if (tabParam && ['all', 'given', 'taken', 'overdue', 'paid'].includes(tabParam)) {
      setTab(tabParam);
      return;
    }

    // Legacy query params compatibility
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    const overdueParam = searchParams.get('overdue');

    if (typeParam === 'given') {
      setTab('given');
      return;
    }
    if (typeParam === 'taken') {
      setTab('taken');
      return;
    }
    if (statusParam === 'paid') {
      setTab('paid');
      return;
    }
    if (overdueParam === '1' || overdueParam === 'true') {
      setTab('overdue');
    }
  }, [location]);

  const debtsQuery = trpc.debts.getAll.useQuery({ limit: 500 });
  const reminderMutation = trpc.debts.sendReminder.useMutation({
    onSuccess: (result) => {
      if (result.sentTo === 'counterparty') {
        toast.success(t('debts.reminderSentAuto', { name: result.recipientName }));
        return;
      }
      toast.success(t('debts.reminderSentSelf'));
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const isLoading = debtsQuery.isLoading;
  const queryError = debtsQuery.error;

  const tabFiltered = useMemo(() => {
    const all = debtsQuery.data?.items || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    switch (tab) {
      case 'given': return all.filter((d) => d.type === 'given' && d.status !== 'paid');
      case 'taken': return all.filter((d) => d.type === 'taken' && d.status !== 'paid');
      case 'overdue':
        return all.filter((d) => {
          if (d.status === 'paid' || !d.returnDate) return false;
          const dueMs = new Date(String(d.returnDate).split('T')[0]).getTime();
          return dueMs < todayMs;
        });
      case 'paid':  return all.filter((d) => d.status === 'paid');
      default:      return all;
    }
  }, [debtsQuery.data, tab]);

  const items = useMemo(() => {
    const todayMs = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
    return tabFiltered.slice().sort((a, b) => {
      const aPaid = a.status === 'paid' ? 1 : 0;
      const bPaid = b.status === 'paid' ? 1 : 0;
      if (aPaid !== bPaid) return aPaid - bPaid;
      if (aPaid) {
        const aP = new Date(a.returnDate ?? 0).getTime();
        const bP = new Date(b.returnDate ?? 0).getTime();
        return bP - aP;
      }
      const aMs = a.returnDate ? new Date(String(a.returnDate).split('T')[0]).getTime() : Infinity;
      const bMs = b.returnDate ? new Date(String(b.returnDate).split('T')[0]).getTime() : Infinity;
      const aOverdue = aMs < todayMs;
      const bOverdue = bMs < todayMs;
      if (aOverdue && bOverdue) return aMs - bMs;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return aMs - bMs;
    });
  }, [tabFiltered]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all',   label: t('debts.filterAll') },
    { key: 'given', label: t('debts.given') },
    { key: 'taken', label: t('debts.taken') },
    { key: 'overdue', label: t('dashboard.overdue') },
    { key: 'paid',  label: t('debts.paid') },
  ];

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
              className="h-12 px-6 text-sm font-semibold whitespace-nowrap"
            >
              + {t('debts.add')}
            </GlassButton>
          </div>
          <div className="flex gap-1.5">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 rounded-full border px-2 py-1.5 text-xs font-semibold transition-all ${
                  tab === key
                    ? 'border-white/50 bg-white/25 text-foreground shadow-sm backdrop-blur-md dark:border-white/25 dark:bg-white/15'
                    : 'border-white/15 bg-white/8 text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
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
                paidAt={'paidAt' in debt && debt.paidAt ? String(debt.paidAt).split('T')[0] : null}
                confirmationStatus={debt.confirmationStatus}
                confirmationExpiresAt={debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null}
                onClick={() => open('EDIT_DEBT', { debtId: debt.id })}
                onReminder={debt.status !== 'paid' ? () => reminderMutation.mutate({ debtId: debt.id }) : undefined}
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
