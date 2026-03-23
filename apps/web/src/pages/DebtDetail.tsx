import { useRoute } from 'wouter';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppLayout } from '../components/layout/AppLayout';
import { trpc } from '../lib/trpc';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency, formatDate } from '../lib/formatters';
import { BackButton } from '../components/common/BackButton';

const formatExpires = (value: string | null | undefined) => {
  if (!value) {
    return '-';
  }
  return formatDate(value);
};

export const DebtDetail = () => {
  const { t } = useTranslation();
  const [match, params] = useRoute('/debts/:id');
  const debtId = Number(params?.id);

  const debtQuery = trpc.debts.getById.useQuery({ id: debtId }, { enabled: match && Number.isFinite(debtId) });
  const generateLinkMutation = trpc.debts.generateConfirmationLink.useMutation({
    onSuccess: () => {
      toast.success(t('debts.linkSent'));
      void debtQuery.refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t('common.error'));
    },
  });

  if (!match) {
    return null;
  }

  if (debtQuery.isLoading) {
    return (
      <AppLayout>
        <div className="p-4 text-sm text-muted-foreground">{t('common.loading')}</div>
      </AppLayout>
    );
  }

  if (!debtQuery.data || debtQuery.error) {
    return (
      <AppLayout>
        <div className="p-4 text-sm text-red-600">{debtQuery.error?.message || t('common.error')}</div>
      </AppLayout>
    );
  }

  const debt = debtQuery.data.debt;
  const amount = Math.max(Number(debt.amount) - Number(debt.paidAmount), 0);

  const renderConfirmationBanner = () => {
    if (debt.confirmationStatus === 'pending') {
      return (
        <Card className="border-yellow-300 bg-yellow-50/80 dark:border-yellow-600 dark:bg-yellow-900/20">
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">⏳ {t('debts.confirmPending')}</p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {t('debts.confirmExpiry')}: {formatExpires(debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null)}
            </p>
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => generateLinkMutation.mutate({ debtId: debt.id })}
              disabled={generateLinkMutation.isPending}
            >
              {t('debts.resendLink')}
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (debt.confirmationStatus === 'confirmed') {
      return (
        <Card className="border-green-300 bg-green-50/80 dark:border-green-600 dark:bg-green-900/20">
          <CardContent className="space-y-1 p-4">
            <p className="font-semibold text-green-800 dark:text-green-100">✅ {t('debts.confirmConfirmed')}</p>
            <p className="text-xs text-green-700 dark:text-green-200">{t('debts.confirmedByReceiver')}</p>
            {debt.linkedDebtId ? <p className="text-xs text-green-700 dark:text-green-200">🔗 {t('debts.linkedDebt')}</p> : null}
          </CardContent>
        </Card>
      );
    }

    if (debt.confirmationStatus === 'denied') {
      return (
        <Card className="border-orange-300 bg-orange-50/80 dark:border-orange-600 dark:bg-orange-900/20">
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold text-orange-800 dark:text-orange-100">⚠️ {t('debts.confirmDenied')}</p>
            <p className="text-xs text-orange-700 dark:text-orange-200">{t('debts.deniedByReceiver')}</p>
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={() => generateLinkMutation.mutate({ debtId: debt.id })}
              disabled={generateLinkMutation.isPending}
            >
              {t('debts.resendLink')}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <BackButton fallback="/debts" label={t('common.back')} />

        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">{debtQuery.data.contact?.name || 'Unknown'}</h1>
              <Badge variant={debt.status === 'paid' ? 'secondary' : 'outline'}>
                {debt.status === 'paid' ? t('debts.paid') : debt.status === 'partial' ? t('debts.partial') : t('debts.pending')}
              </Badge>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(amount, debt.currency || 'UZS')}</p>
            <p className="text-sm text-muted-foreground">{t('debts.givenDate')}: {formatDate(debt.givenDate)}</p>
            <p className="text-sm text-muted-foreground">{t('debts.returnDate')}: {formatDate(debt.returnDate)}</p>
          </CardContent>
        </Card>

        {renderConfirmationBanner()}
      </div>
    </AppLayout>
  );
};
