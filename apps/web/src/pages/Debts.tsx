import { AppLayout } from '../components/layout/AppLayout';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { DebtList } from '../components/shared/DebtList';
import { useModalStore } from '../store/modalStore';
import { BackButton } from '../components/common/BackButton';
import { useState, useEffect } from 'react';
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
        ) : (
          <DebtList
            debts={debtsQuery.data?.items}
            isLoading={false}
            error={queryError}
            tab={tab}
            onEditDebt={(debtId) => open('EDIT_DEBT', { debtId })}
            onReminder={(debtId) => reminderMutation.mutate({ debtId })}
          />
        )}
      </div>
    </AppLayout>
  );
};
