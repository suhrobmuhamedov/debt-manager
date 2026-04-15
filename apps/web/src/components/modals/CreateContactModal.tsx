import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ContactForm, type ContactFormValues } from "../contacts/ContactForm"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"
import { useModalStore } from "../../store/modalStore"
import { trpc } from "../../lib/trpc"

export const CreateContactModal = () => {
  const { type, close } = useModalStore()
  const utils = trpc.useUtils()
  const isOpen = type === "CREATE_CONTACT"
  const { t } = useTranslation()

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate()
      toast.success(t("contacts.savedSuccess"))
      close()
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const handleSubmit = async (values: ContactFormValues) => {
    await createContact.mutateAsync(values)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom">
        <SheetHeader className="px-0">
          <SheetTitle>{t("contacts.add")}</SheetTitle>
          <SheetDescription>{t("contacts.requiredHelp")}</SheetDescription>
        </SheetHeader>

        <ContactForm
          submitLabel={t("contacts.save")}
          isSubmitting={createContact.isPending}
          onCancel={close}
          onSubmit={handleSubmit}
        />
      </SheetContent>
    </Sheet>
  )
}
