import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useModalStore } from '../../store/modalStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Minus, Plus, Calendar, Lock, Check } from 'lucide-react';

const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const formatDateDisplay = (date: Date | string | null | undefined): string => {
  if (!date) {
    return '-';
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '-';
  }
  return d.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const EditDebtModal = () => {
  const { type, data, close } = useModalStore();
  const isOpen = type === 'EDIT_DEBT';
  const debtId = typeof data?.debtId === 'number' ? data.debtId : undefined;
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const debtQuery = trpc.debts.getById.useQuery(
    { id: debtId ?? 0 },
    { enabled: isOpen && Number.isFinite(debtId) }
  );

  const [amount, setAmount] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [note, setNote] = useState('');
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'subtract' | 'payment' | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    if (!debtQuery.data?.debt) {
      return;
    }
    setAmount(String(Number(debtQuery.data.debt.amount)));
    setReturnDate(toDateInput(debtQuery.data.debt.returnDate));
    setNote(debtQuery.data.debt.note ?? '');
    setShowReturnDatePicker(false);
    setAdjustmentMode(null);
    setAdjustmentValue('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }, [debtQuery.data?.debt]);

  const updateMutation = trpc.debts.update.useMutation({
    onSuccess: async (updated) => {
      await Promise.all([
        utils.dashboard.getStats.invalidate(),
        utils.debts.getAll.invalidate(),
        utils.debts.getById.invalidate({ id: updated.id }),
        utils.contacts.getById.invalidate(),
      ]);
      toast.success(t('contacts.savedSuccess'));
      close();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const addPaymentMutation = trpc.payments.addPayment.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.dashboard.getStats.invalidate(),
        utils.debts.getAll.invalidate(),
        utils.debts.getById.invalidate({ id: debtId }),
        utils.contacts.getById.invalidate(),
      ]);
      toast.success(t('debts.addPayment'));
      setAdjustmentValue('');
      setPaymentDate('');
      setAdjustmentMode(null);
      void debtQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const currentAmount = Number(amount) || 0;
  const debt = debtQuery.data?.debt;
  const contact = debtQuery.data?.contact;
  const payments = debtQuery.data?.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const isPaid = currentAmount === 0;
  const canSubmit = useMemo(() => {
    return Boolean(returnDate) && !updateMutation.isPending;
  }, [returnDate, updateMutation.isPending]);

  const handleApplyAdjustment = () => {
    const adjustment = Number(adjustmentValue) || 0;
    if (adjustment <= 0) {
      toast.error(t('common.error'));
      return;
    }

    if (adjustmentMode === 'payment') {
      if (!paymentDate) {
        toast.error(t('debts.givenDate') + ' ' + t('common.error'));
        return;
      }

      addPaymentMutation.mutate({
        debtId: debtId!,
        amount: Number(adjustmentValue),
        paymentDate,
      });
    } else {
      let newAmount = currentAmount;
      if (adjustmentMode === 'add') {
        newAmount = currentAmount + adjustment;
      } else if (adjustmentMode === 'subtract') {
        newAmount = Math.max(0, currentAmount - adjustment);
      }
      setAmount(String(newAmount));
      setAdjustmentMode(null);
      setAdjustmentValue('');
    }
  };

  const handleMarkAsPaid = () => {
    if (currentAmount === 0) return;

    addPaymentMutation.mutate({
      debtId: debtId!,
      amount: currentAmount,
      paymentDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSave = async () => {
    if (!debtId) {
      return;
    }

    await updateMutation.mutateAsync({
      id: debtId,
      amount: Math.max(0, Number(amount)),
      returnDate,
      note: note.trim() || undefined,
    });
  };

  if (isPaid) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="border border-white/50 bg-white/70 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-950/45 sm:max-w-md">
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
            <div className="text-5xl">✅</div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">{t('debts.paid')}</p>
              <p className="text-xs text-muted-foreground">{contact?.name}</p>
            </div>
          </div>
          <Button onClick={close} variant="outline" className="w-full">
            {t('common.close')}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

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
                  <Badge
                    variant={
                      debt.status === 'paid'
                        ? 'secondary'
                        : debt.status === 'partial'
                          ? 'outline'
                          : 'destructive'
                    }
                    className="text-xs"
                  >
                    {debt.status === 'paid'
                      ? t('debts.paid')
                      : debt.status === 'partial'
                        ? t('debts.partial')
                        : t('debts.pending')}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="space-y-5">
              {/* Amount with +/- adjustment */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">{t('debts.amount')}</p>

                {adjustmentMode ? (
                  <div className="rounded-lg border border-sky-300/50 bg-sky-50/50 p-3 dark:border-sky-600/40 dark:bg-sky-950/20">
                    <p className="mb-2 text-xs font-medium text-foreground">
                      {adjustmentMode === 'add' ? '➕ Qo\'shish' : adjustmentMode === 'subtract' ? '➖ Ayirish' : '💰 To\'lov qo\'shish'}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={adjustmentValue}
                        onChange={(event) => setAdjustmentValue(event.target.value)}
                        placeholder="Miqdor"
                        autoFocus
                        className="h-10 flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleApplyAdjustment}
                        disabled={adjustmentMode === 'payment' && addPaymentMutation.isPending}
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
                    {adjustmentMode === 'payment' && (
                      <div className="mt-2">
                        <Input
                          type="date"
                          value={paymentDate}
                          onChange={(event) => setPaymentDate(event.target.value)}
                          className="h-10"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdjustmentMode('subtract')}
                      className="h-11 w-11 rounded-lg"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 rounded-lg border border-sky-300/50 bg-sky-50/50 px-3 py-2 text-center dark:border-sky-600/40 dark:bg-sky-950/20">
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(currentAmount, debt.currency || 'UZS')}</p>
                      <p className="text-xs text-muted-foreground">Qolgan: {formatCurrency(currentAmount - totalPaid, debt.currency || 'UZS')}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdjustmentMode('add')}
                      className="h-11 w-11 rounded-lg"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Button & History */}
              <div className="space-y-3">
                {adjustmentMode === 'payment' ? (
                  <div className="rounded-lg border border-green-300/50 bg-green-50/50 p-3 dark:border-green-600/40 dark:bg-green-950/20">
                    <p className="mb-2 text-xs font-medium text-foreground">💰 To'lov qo'shish</p>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={adjustmentValue}
                        onChange={(event) => setAdjustmentValue(event.target.value)}
                        placeholder="Miqdor"
                        autoFocus
                        className="h-10"
                      />
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(event) => setPaymentDate(event.target.value)}
                        className="h-10"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyAdjustment}
                          disabled={addPaymentMutation.isPending}
                          className="flex-1"
                        >
                          {addPaymentMutation.isPending ? t('common.loading') : t('debts.addPayment')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdjustmentMode(null);
                            setAdjustmentValue('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-10"
                      onClick={() => setAdjustmentMode('payment')}
                    >
                      💰 To'lov qo'shish
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 h-10 bg-green-600 hover:bg-green-700"
                      onClick={handleMarkAsPaid}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      To'landi
                    </Button>
                  </div>
                )}

                {/* Payment History Timeline */}
                {payments.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-white/40 bg-white/20 p-3 dark:border-white/20 dark:bg-white/5">
                    <p className="text-xs font-semibold text-foreground">{t('debts.paymentHistory')}</p>
                    <div className="space-y-2">
                      {payments
                        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                        .map((payment, idx) => (
                          <div key={payment.id} className="flex items-center justify-between rounded-md bg-white/50 px-2 py-1.5 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              <div className="text-lg">✓</div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground">{formatDateDisplay(payment.paymentDate)}</p>
                                <p className="text-xs text-muted-foreground">{payment.note || 'To\'lov'}</p>
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                              +{formatCurrency(Number(payment.amount), debt.currency || 'UZS')}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dates Section */}
              <div className="space-y-3 rounded-xl border border-white/40 bg-white/20 p-3 dark:border-white/20 dark:bg-white/5">
                {/* Given Date */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('debts.givenDate')}</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateDisplay(debt.givenDate)}</p>
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
                    <p className="text-sm font-semibold text-foreground">{formatDateDisplay(returnDate)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
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
                {updateMutation.isPending ? t('contacts.updating') : t('contacts.edit')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};