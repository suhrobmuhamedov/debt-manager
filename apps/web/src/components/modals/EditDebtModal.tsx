import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useModalStore } from '../../store/modalStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
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

  useEffect(() => {
    if (!debtQuery.data?.debt) {
      return;
    }
    setAmount(String(Number(debtQuery.data.debt.amount)));
    setReturnDate(toDateInput(debtQuery.data.debt.returnDate));
    setNote(debtQuery.data.debt.note ?? '');
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

  const debt = debtQuery.data?.debt;
  const pendingAmount = debt ? Math.max(Number(debt.amount) - Number(debt.paidAmount), 0) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[86vh] overflow-y-auto border border-white/50 bg-white/70 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-950/45">
        <DialogHeader>
          <DialogTitle>{t('contacts.edit')}</DialogTitle>
          <DialogDescription>{t('contacts.detailsTitle')}</DialogDescription>
        </DialogHeader>

        {debtQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : debtQuery.error || !debt ? (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200">
            {debtQuery.error?.message || t('common.error')}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/60 bg-white/55 p-3 dark:border-white/15 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{debtQuery.data.contact?.name || '-'}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(pendingAmount, debt.currency || 'UZS')}</p>
                </div>
                <Badge variant={debt.status === 'paid' ? 'secondary' : 'outline'}>
                  {debt.status === 'paid' ? t('debts.paid') : debt.status === 'partial' ? t('debts.partial') : t('debts.pending')}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('debts.givenDate')}: {formatDate(debt.givenDate)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('debts.amount')}</label>
              <Input type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('debts.returnDate')}</label>
              <Input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('debts.note')}</label>
              <Textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('common.close')}
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit || debtQuery.isLoading || Boolean(debtQuery.error)}>
            {updateMutation.isPending ? t('contacts.updating') : t('contacts.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};