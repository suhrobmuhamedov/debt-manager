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

export const CreateContactModal = () => {
  const { type, close } = useModalStore();
  const utils = trpc.useUtils();
  const isOpen = type === 'CREATE_CONTACT';

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate();
      toast.success('Kontakt muvaffaqiyatli qo\'shildi');
      close();
    },
    onError: (error) => {
      toast.error(error.message || 'Kontakt saqlashda xatolik yuz berdi');
    },
  });

  const handleSubmit = async (values: ContactFormValues) => {
    await createContact.mutateAsync(values);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-6">
        <SheetHeader className="px-0">
          <SheetTitle>Yangi kontakt</SheetTitle>
          <SheetDescription>
            Ism va telefon raqam majburiy. Qolgan maydonlar ixtiyoriy.
          </SheetDescription>
        </SheetHeader>

        <ContactForm
          submitLabel="Saqlash"
          isSubmitting={createContact.isPending}
          onCancel={close}
          onSubmit={handleSubmit}
        />
      </SheetContent>
    </Sheet>
  );
};