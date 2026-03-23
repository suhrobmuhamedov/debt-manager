import { useModalStore } from '../../store/modalStore';
import { ContactForm, ContactFormValues } from '../contacts/ContactForm';
import { trpc } from '../../lib/trpc';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

export const EditContactModal = () => {
  const { type, data, close } = useModalStore();
  const utils = trpc.useUtils();
  const isOpen = type === 'EDIT_CONTACT';
  const contactId = typeof data?.contactId === 'number' ? data.contactId : null;
  const { t } = useTranslation();

  const contactQuery = trpc.contacts.getById.useQuery(
    { id: contactId || 0 },
    { enabled: isOpen && !!contactId }
  );

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate();
      if (contactId) {
        await utils.contacts.getById.invalidate({ id: contactId });
      }
      toast.success(t('contacts.savedSuccess'));
      close();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const handleSubmit = async (values: ContactFormValues) => {
    if (!contactId) return;
    await updateContact.mutateAsync({
      id: contactId,
      ...values,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-6">
        <SheetHeader className="px-0">
          <SheetTitle>{t('contacts.edit')}</SheetTitle>
          <SheetDescription>{t('contacts.editDescription')}</SheetDescription>
        </SheetHeader>

        {!contactId || contactQuery.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t('contacts.loading')}</div>
        ) : contactQuery.error ? (
          <div className="py-8 text-center text-sm text-red-600">{t('contacts.noDetails')}</div>
        ) : (
          <ContactForm
            initialValues={{
              name: contactQuery.data?.contact.name || '',
              phone: contactQuery.data?.contact.phone || '',
              note: contactQuery.data?.contact.note || '',
            }}
            submitLabel={t('contacts.save')}
            isSubmitting={updateContact.isPending}
            onCancel={close}
            onSubmit={handleSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};