import { useModalStore } from '../../store/modalStore';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { trpc } from '../../lib/trpc';
import { DebtForm, DebtFormValues } from '../debts/DebtForm';

export const CreateDebtModal = () => {
  const { type, close, open } = useModalStore();
  const isOpen = type === 'CREATE_DEBT';
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const contactsQuery = trpc.contacts.getAll.useQuery(undefined, { enabled: isOpen });

  const createDebt = trpc.debts.create.useMutation({
    onSuccess: async (created, variables) => {
      await utils.dashboard.getStats.invalidate();
      await utils.debts.getAll.invalidate();
      toast.success(t('contacts.savedSuccess'));

      const contactName = contactsQuery.data?.find((item) => item.id === variables.contactId)?.name || 'Contact';
      close();
      open('DEBT_CONFIRMATION', {
        debtId: created.id,
        contactName,
        amount: variables.amount,
        currency: variables.currency,
        returnDate: variables.returnDate,
      });
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const handleSubmit = async (values: DebtFormValues) => {
    await createDebt.mutateAsync(values);
  };

  const contactOptions = (contactsQuery.data || []).map((item) => ({ id: item.id, name: item.name }));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-6">
        <SheetHeader className="px-0">
          <SheetTitle>{t('debts.add')}</SheetTitle>
          <SheetDescription>{t('debts.confirmSkip')}</SheetDescription>
        </SheetHeader>

        {contactsQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : !contactOptions.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('contacts.empty')}</p>
        ) : (
          <DebtForm
            contacts={contactOptions}
            submitLabel={t('debts.add')}
            isSubmitting={createDebt.isPending}
            onCancel={close}
            onSubmit={handleSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};