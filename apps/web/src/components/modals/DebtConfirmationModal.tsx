import { Shield, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useModalStore } from '../../store/modalStore';
import { trpc } from '../../lib/trpc';
import { shareToTelegram } from '../../lib/telegram';

export const DebtConfirmationModal = () => {
  const { type, data, close } = useModalStore();
  const isOpen = type === 'DEBT_CONFIRMATION';
  const { t } = useTranslation();

  const debtId = typeof data?.debtId === 'number' ? data.debtId : null;
  const contactName = typeof data?.contactName === 'string' ? data.contactName : '';
  const amount = typeof data?.amount === 'number' ? data.amount : 0;
  const currency = typeof data?.currency === 'string' ? data.currency : 'UZS';
  const returnDate = typeof data?.returnDate === 'string' ? data.returnDate : '';

  const mutation = trpc.debts.generateConfirmationLink.useMutation({
    onError: (error: { message?: string }) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const handleSend = async () => {
    if (!debtId) {
      toast.error(t('common.error'));
      return;
    }

    const result = await mutation.mutateAsync({ debtId });
    shareToTelegram(null, result.shareText);
    toast.success(t('debts.linkSent'));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-6">
        <SheetHeader className="px-0">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('debts.confirmTitle')}
          </SheetTitle>
          <SheetDescription>{t('debts.confirmDesc')}</SheetDescription>
        </SheetHeader>

        <Card className="border-gray-300 dark:border-white/15">
          <CardContent className="space-y-1 p-4 text-sm">
            <p><span className="font-semibold">{contactName}</span></p>
            <p>{amount.toLocaleString('uz-UZ')} {currency}</p>
            <p>{t('debts.returnDate')}: {returnDate}</p>
          </CardContent>
        </Card>

        <p className="px-1 text-sm text-muted-foreground">
          {t('debts.confirmDesc')} {contactName}
        </p>

        <Button
          className="h-11 w-full"
          onClick={handleSend}
          disabled={mutation.isPending}
        >
          {mutation.isSuccess ? '✅ ' : <Send className="h-4 w-4" />} {mutation.isSuccess ? t('debts.linkSent') : t('debts.sendConfirmLink')}
        </Button>

        {mutation.isSuccess ? (
          <p className="text-center text-xs text-muted-foreground">{t('debts.confirmExpiry')}</p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button className="h-11 flex-1" variant="ghost" onClick={close}>
            {t('debts.confirmLater')}
          </Button>
          <Button className="h-11 flex-1" variant="outline" onClick={close}>
            {t('debts.confirmSkip')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
