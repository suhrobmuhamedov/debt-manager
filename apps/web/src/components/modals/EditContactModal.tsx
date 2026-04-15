import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ContactForm, type ContactFormValues } from "../contacts/ContactForm"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"
import { useModalStore } from "../../store/modalStore"
import { trpc } from "../../lib/trpc"

export const EditContactModal = () => {
  const { type, data, close } = useModalStore()
  const utils = trpc.useUtils()
  const isOpen = type === "EDIT_CONTACT"
  const contactId = typeof data?.contactId === "number" ? data.contactId : null
  const { t } = useTranslation()

  const contactQuery = trpc.contacts.getById.useQuery({ id: contactId || 0 }, { enabled: isOpen && !!contactId })

  const updateContact = trpc.contacts.update.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate()
      if (contactId) {
        await utils.contacts.getById.invalidate({ id: contactId })
      }
      toast.success(t("contacts.savedSuccess"))
      close()
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const handleSubmit = async (values: ContactFormValues) => {
    if (!contactId) return
    await updateContact.mutateAsync({
      id: contactId,
      ...values,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom">
        <SheetHeader className="px-0">
          <SheetTitle>{t("contacts.edit")}</SheetTitle>
          <SheetDescription>{t("contacts.editDescription")}</SheetDescription>
        </SheetHeader>

        {!contactId || contactQuery.isLoading ? (
          <div className="py-8 text-center text-sm text-[color:var(--muted-foreground)]">{t("contacts.loading")}</div>
        ) : contactQuery.error ? (
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-sm text-[var(--destructive)]">
            {t("contacts.noDetails")}
          </div>
        ) : (
          <ContactForm
            initialValues={{
              name: contactQuery.data?.contact.name || "",
              phone: contactQuery.data?.contact.phone || "",
              note: contactQuery.data?.contact.note || "",
            }}
            submitLabel={t("contacts.save")}
            isSubmitting={updateContact.isPending}
            onCancel={close}
            onSubmit={handleSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
