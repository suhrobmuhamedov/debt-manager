import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';
import { formatCurrency } from '../../lib/formatters';
import { useModalStore } from '../../store/modalStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Minus, Plus, Calendar, Lock } from 'lucide-react';

const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const formatDateDisplay = (date: Date | string | null | undefined, locale: string): string => {
  if (!date) {
    return '-';
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '-';
  }
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatLongDate = (date: Date | string | null | undefined, locale: string): string => {
  if (!date) {
    return '-';
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '-';
  }
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const EditDebtModal = () => {
  const { type, data, close } = useModalStore();
  const isOpen = type === 'EDIT_DEBT';
  const debtId = typeof data?.debtId === 'number' ? data.debtId : undefined;
  const { t, i18n } = useTranslation();
  const uiLocale = i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ';
  const utils = trpc.useUtils();

  const debtQuery = trpc.debts.getById.useQuery(
    { id: debtId ?? 0 },
    { enabled: isOpen && Number.isFinite(debtId) }
  );

  const [returnDate, setReturnDate] = useState('');
  const [note, setNote] = useState('');
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'subtract' | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [actionDate, setActionDate] = useState('');

  useEffect(() => {
    if (!debtQuery.data?.debt) {
      return;
    }
    setReturnDate(toDateInput(debtQuery.data.debt.returnDate));
    setNote(debtQuery.data.debt.note ?? '');
    setShowReturnDatePicker(false);
    setAdjustmentMode(null);
    setAdjustmentValue('');
    setActionDate(new Date().toISOString().split('T')[0]);
  }, [debtQuery.data?.debt]);

  const updateMutation = trpc.debts.update.useMutation({
    onSuccess: async (updated) => {
      await Promise.all([
        utils.dashboard.getStats.invalidate(),
        utils.debts.getAll.invalidate(),
        utils.debts.getById.invalidate({ id: updated.id }),
        utils.contacts.getById.invalidate(),
      ]);
      // Wait a bit for React Query to refetch the data
      await new Promise(resolve => setTimeout(resolve, 100));
      toast.success(t('contacts.savedSuccess'));
      close();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const adjustDebtMutation = trpc.payments.adjustDebt.useMutation({
    onSuccess: async () => {
      // Invalidate all related caches
      await Promise.all([
        utils.dashboard.getStats.invalidate(),
        utils.debts.getAll.invalidate(),
        utils.debts.getById.invalidate({ id: debtId }),
        utils.contacts.getById.invalidate(),
      ]);
      // Wait a bit for React Query to refetch the data
      await new Promise(resolve => setTimeout(resolve, 100));
      toast.success(t('contacts.savedSuccess'));
      setAdjustmentValue('');
      setActionDate(new Date().toISOString().split('T')[0]);
      setAdjustmentMode(null);
      close();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const debt = debtQuery.data?.debt;
  const contact = debtQuery.data?.contact;
  const payments = debtQuery.data?.payments || [];
  const totalAmount = Number(debt?.amount ?? 0);
  const paidAmount = Number(debt?.paidAmount ?? 0);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const isPaid = debt?.status === 'paid' || remainingAmount === 0;
  const isLockedForCounterparty = Boolean(
    debt?.confirmationStatus === 'confirmed' &&
    debt?.linkedDebtId &&
    debt?.type !== 'given'
  );
  const readOnlyMode = isPaid || isLockedForCounterparty;
  const debtTypeLabel = debt?.type === 'given' ? t('debts.given') : t('debts.taken');

  const increaseTotal = payments
    .filter((entry) => (entry.note || '').startsWith('debt_increase:'))
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const initialAmount = Math.max(totalAmount - increaseTotal, 0);

  const timeline = useMemo(() => {
    if (!debt) {
      return [] as Array<{ id: string; date: Date; title: string; amount: number; kind: 'created' | 'increase' | 'payment'; balance: number }>;
    }

    const entries = [...payments]
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
      .map((entry) => {
        const isIncrease = (entry.note || '').startsWith('debt_increase:');
        return {
          id: `p-${entry.id}`,
          date: new Date(entry.paymentDate),
          amount: Number(entry.amount),
          kind: isIncrease ? ('increase' as const) : ('payment' as const),
          title: isIncrease ? t('debts.historyIncrease') : t('debts.historyPayment'),
        };
      });

    let runningBalance = initialAmount;
    const built: Array<{ id: string; date: Date; title: string; amount: number; kind: 'created' | 'increase' | 'payment'; balance: number }> = [
      {
        id: `created-${debt.id}`,
        date: new Date(debt.createdAt ?? Date.now()),
        title: t('debts.historyCreated'),
        amount: initialAmount,
        kind: 'created' as const,
        balance: initialAmount,
      },
    ];

    entries.forEach((entry) => {
      if (entry.kind === 'increase') {
        runningBalance += entry.amount;
      } else {
        runningBalance = Math.max(0, runningBalance - entry.amount);
      }

      const entryTitle = entry.kind === 'increase'
        ? t('debts.historyIncrease')
        : runningBalance === 0
          ? t('debts.paid')
          : t('debts.historyPayment');

      built.push({
        ...entry,
        title: entryTitle,
        balance: runningBalance,
      });
    });

    return built;
  }, [debt, initialAmount, payments, t]);

  const canSubmit = useMemo(() => {
    return Boolean(returnDate) && !updateMutation.isPending && !readOnlyMode;
  }, [returnDate, updateMutation.isPending, readOnlyMode]);

  const paidDate = useMemo(() => {
    if (!debt || debt.status !== 'paid') {
      return null;
    }

    const paymentDates = payments
      .map((entry) => new Date(entry.paymentDate))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    if (paymentDates.length > 0) {
      return paymentDates[0];
    }

    return debt.updatedAt ? new Date(debt.updatedAt) : null;
  }, [debt, payments]);

  const handleApplyAdjustment = () => {
    const adjustment = Number(adjustmentValue) || 0;
    if (adjustment <= 0) {
      toast.error(t('common.error'));
      return;
    }

    if (!debtId || !adjustmentMode) {
      return;
    }

    if (!actionDate) {
      toast.error(t('common.error'));
      return;
    }

    if (adjustmentMode === 'subtract' && adjustment > remainingAmount) {
      toast.error(t('debts.overPaymentError'));
      return;
    }

    adjustDebtMutation.mutate({
      debtId,
      amount: adjustment,
      action: adjustmentMode === 'add' ? 'increase' : 'payment',
      actionDate,
    });
  };

  const handleFullRepay = () => {
    if (!debtId || readOnlyMode || remainingAmount <= 0) {
      return;
    }

    adjustDebtMutation.mutate({
      debtId,
      amount: remainingAmount,
      action: 'payment',
      actionDate: actionDate || new Date().toISOString().split('T')[0],
    });
  };

  const handleSave = async () => {
    if (!debtId) {
      return;
    }

    await updateMutation.mutateAsync({
      id: debtId,
      returnDate,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-white/50 bg-white/70 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-950/45 sm:max-w-md">
        {debtQuery.isLoading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : debtQuery.error || !debt ? (
          <div className="p-4 text-center">
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
              {debtQuery.error?.message || t('common.error')}
            </p>
          </div>
        ) : (
          <>
            {/* Header: Contact Name */}
            <DialogHeader className="space-y-4 border-b border-white/40 pb-4 dark:border-white/20">
              <DialogTitle className="text-base font-semibold">{t('contacts.edit')}</DialogTitle>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{contact?.name || 'Unknown'}</p>
                <div className="flex items-center gap-2">
                  {contact?.phone ? (
                    <a href={`tel:${contact.phone}`} className="text-sm text-primary underline-offset-4 hover:underline">
                      {contact.phone}
                    </a>
                  ) : null}
                  {isLockedForCounterparty ? (
                    <Badge variant="outline" className="text-xs">
                      {t('debts.onlyLenderCanEdit')}
                    </Badge>
                  ) : null}
                  {isPaid ? (
                    <Badge variant="secondary" className="border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      {t('debts.paidReadOnly')}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="space-y-5">
              {/* Amount with +/- adjustment */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">{t('debts.amount')} ({debtTypeLabel})</p>

                {adjustmentMode ? (
                  <div className="rounded-lg border border-sky-300/50 bg-sky-50/50 p-3 dark:border-sky-600/40 dark:bg-sky-950/20">
                    <p className="mb-2 text-xs font-medium text-foreground">
                      {adjustmentMode === 'add' ? t('debts.addToDebt') : t('debts.subtractFromDebt')}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={adjustmentValue}
                        onChange={(event) => setAdjustmentValue(event.target.value)}
                        placeholder={t('debts.amount')}
                        autoFocus
                        className="h-10 flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleApplyAdjustment}
                        disabled={readOnlyMode || adjustDebtMutation.isPending}
                        className="h-10 w-10"
                      >
                        ✓
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setAdjustmentMode(null);
                          setAdjustmentValue('');
                        }}
                        className="h-10 w-10"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Input
                        type="date"
                        value={actionDate}
                        onChange={(event) => setActionDate(event.target.value)}
                        className="h-10"
                        disabled={readOnlyMode}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={readOnlyMode}
                        onClick={() => setAdjustmentMode('subtract')}
                        className="h-11 w-11 rounded-lg"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <div className="flex-1 rounded-lg border border-sky-300/50 bg-sky-50/50 px-3 py-2 text-center dark:border-sky-600/40 dark:bg-sky-950/20">
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(remainingAmount, debt.currency || 'UZS')}</p>
                        <p className="text-xs text-muted-foreground">{t('debts.totalLabel')}: {formatCurrency(totalAmount, debt.currency || 'UZS')} | {t('debts.paidLabel')}: {formatCurrency(paidAmount, debt.currency || 'UZS')}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={readOnlyMode}
                        onClick={() => setAdjustmentMode('add')}
                        className="h-11 w-11 rounded-lg"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      disabled={readOnlyMode || remainingAmount <= 0 || adjustDebtMutation.isPending}
                      onClick={handleFullRepay}
                      className="h-10 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {t('debts.markFullyPaid')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="space-y-2 rounded-lg border border-white/40 bg-white/20 p-3 dark:border-white/20 dark:bg-white/5">
                  <p className="text-xs font-semibold text-foreground">{t('debts.paymentHistory')}</p>
                  <div className="space-y-2">
                    {timeline.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-md bg-white/50 px-2 py-1.5 dark:bg-white/5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">{formatDateDisplay(entry.date, uiLocale)}</p>
                          <p className="text-xs text-muted-foreground">{entry.title}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${entry.kind === 'payment' ? 'text-emerald-600 dark:text-emerald-400' : entry.kind === 'increase' ? 'text-amber-700 dark:text-amber-300' : 'text-sky-700 dark:text-sky-300'}`}>
                            {formatCurrency(entry.amount, debt.currency || 'UZS', { sign: entry.kind === 'payment' ? 'minus' : 'plus' })}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{t('debts.remainingLabel')}: {formatCurrency(entry.balance, debt.currency || 'UZS')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="space-y-3 rounded-xl border border-white/40 bg-white/20 p-3 dark:border-white/20 dark:bg-white/5">
                {/* Given Date */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('debts.givenDate')}</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateDisplay(debt.givenDate, uiLocale)}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center dark:bg-sky-900/40">
                    <Lock className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                  </div>
                </div>

                <div className="h-px bg-white/30 dark:bg-white/10" />

                {/* Return Date */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('debts.returnDate')}</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateDisplay(returnDate, uiLocale)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                      disabled={readOnlyMode}
                    onClick={() => setShowReturnDatePicker(!showReturnDatePicker)}
                    className="h-8 w-8 rounded-lg"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>

                {showReturnDatePicker && (
                  <div className="pt-2">
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(event) => {
                        setReturnDate(event.target.value);
                        setShowReturnDatePicker(false);
                      }}
                      className="h-10"
                    />
                  </div>
                )}

                {isPaid ? (
                  <>
                    <div className="h-px bg-white/30 dark:bg-white/10" />
                    <div className="space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs dark:border-emerald-500/40 dark:bg-emerald-500/15">
                      <p className="text-foreground">{t('debts.returnDate')}: {formatLongDate(returnDate || debt.returnDate, uiLocale)}</p>
                      <p className="text-foreground">{t('debts.paidDate')}: {formatDateDisplay(paidDate, uiLocale)}</p>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('debts.note')}</p>
                <Textarea
                  rows={2}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t('debts.note')}
                  readOnly={readOnlyMode}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="gap-2 border-t border-white/40 pt-4 dark:border-white/20 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                className="flex-1"
              >
                {t('common.close')}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSubmit || debtQuery.isLoading || Boolean(debtQuery.error)}
                className="flex-1"
              >
                {readOnlyMode ? t('debts.readOnlyInfo') : updateMutation.isPending ? t('contacts.updating') : t('contacts.edit')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};