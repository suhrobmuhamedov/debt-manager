import { useModalStore } from '../../store/modalStore';
import { ContactForm, ContactFormValues } from '../contacts/ContactForm';
import { trpc } from '../../lib/trpc';
import { toast } from 'sonner';
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
      toast.success('Kontakt ma\'lumotlari yangilandi');
      close();
    },
    onError: (error) => {
      toast.error(error.message || 'Kontaktni yangilashda xatolik yuz berdi');
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
          <SheetTitle>Kontaktni tahrirlash</SheetTitle>
          <SheetDescription>Ma'lumotlarni yangilang va saqlang.</SheetDescription>
        </SheetHeader>

        {!contactId || contactQuery.isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Yuklanmoqda...</div>
        ) : contactQuery.error ? (
          <div className="py-8 text-center text-sm text-red-600">Kontaktni yuklab bo'lmadi</div>
        ) : (
          <ContactForm
            initialValues={{
              name: contactQuery.data?.contact.name || '',
              phone: contactQuery.data?.contact.phone || '',
              note: contactQuery.data?.contact.note || '',
            }}
            submitLabel="Yangilash"
            isSubmitting={updateContact.isPending}
            onCancel={close}
            onSubmit={handleSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};