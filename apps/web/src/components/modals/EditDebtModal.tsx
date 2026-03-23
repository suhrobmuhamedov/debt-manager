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
import { Minus, Plus, Calendar } from 'lucide-react';

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

  useEffect(() => {
    if (!debtQuery.data?.debt) {
      return;
    }
    setAmount(String(Number(debtQuery.data.debt.amount)));
    setReturnDate(toDateInput(debtQuery.data.debt.returnDate));
    setNote(debtQuery.data.debt.note ?? '');
    setShowReturnDatePicker(false);
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

  const canSubmit = useMemo(() => {
    return Boolean(returnDate) && Number(amount) > 0 && !updateMutation.isPending;
  }, [returnDate, amount, updateMutation.isPending]);

  const handleSave = async () => {
    if (!debtId) {
      return;
    }

    await updateMutation.mutateAsync({
      id: debtId,
      amount: Number(amount),
      returnDate,
      note: note.trim() || undefined,
    });
  };

  const handleAmountIncrement = () => {
    setAmount(String(Number(amount) + 1));
  };

  const handleAmountDecrement = () => {
    const newAmount = Math.max(0, Number(amount) - 1);
    setAmount(String(newAmount));
  };

  const debt = debtQuery.data?.debt;
  const contact = debtQuery.data?.contact;

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
              {/* Amount with +/- buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t('debts.amount')}</p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAmountDecrement}
                    disabled={Number(amount) <= 0}
                    className="h-11 w-11 rounded-lg"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 rounded-lg border border-sky-300/50 bg-sky-50/50 px-3 py-2 text-center dark:border-sky-600/40 dark:bg-sky-950/20">
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(Number(amount), debt.currency || 'UZS')}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAmountIncrement}
                    className="h-11 w-11 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
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
                    <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-300" />
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