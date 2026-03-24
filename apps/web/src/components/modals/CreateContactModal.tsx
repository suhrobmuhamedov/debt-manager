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

export const CreateContactModal = () => {
  const { type, close } = useModalStore();
  const utils = trpc.useUtils();
  const isOpen = type === 'CREATE_CONTACT';
  const { t } = useTranslation();

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate();
      toast.success(t('contacts.savedSuccess'));
      close();
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const handleSubmit = async (values: ContactFormValues) => {
    await createContact.mutateAsync(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="rounded-t-3xl border border-white/60 bg-white/55 pb-6 backdrop-blur-2xl dark:border-white/25 dark:bg-slate-900/70 shadow-2xl shadow-black/20 dark:shadow-black/50">
        <SheetHeader className="px-0">
          <SheetTitle>{t('contacts.add')}</SheetTitle>
          <SheetDescription>
            {t('contacts.requiredHelp')}
          </SheetDescription>
        </SheetHeader>

        <ContactForm
          submitLabel={t('contacts.save')}
          isSubmitting={createContact.isPending}
          onCancel={close}
          onSubmit={handleSubmit}
        />
      </SheetContent>
    </Sheet>
  );
};