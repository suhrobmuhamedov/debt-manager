import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { DebtForm, type DebtFormValues } from "../debts/DebtForm"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"
import { useModalStore } from "../../store/modalStore"
import { trpc } from "../../lib/trpc"

export const CreateDebtModal = () => {
  const { type, data, close } = useModalStore()
  const isOpen = type === "CREATE_DEBT"
  const { t } = useTranslation()
  const utils = trpc.useUtils()
  const preselectedContactId = typeof data?.contactId === "number" ? data.contactId : undefined

  const contactsQuery = trpc.contacts.getAll.useQuery(undefined, { enabled: isOpen })

  const createDebt = trpc.debts.create.useMutation({
    onSuccess: async (created, variables) => {
      await utils.dashboard.getStats.invalidate()
      await utils.debts.getAll.invalidate()
      toast.success(t("contacts.savedSuccess"))

      close()

      if (variables.twoWayConfirmation) {
        const sent = created.confirmation?.telegramNotification?.sent
        if (sent) {
          toast.success(t("debts.confirmRequestSentSelf"))
        } else {
          toast.warning(t("debts.confirmRequestNotSentSelf"))
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const createContactInline = trpc.contacts.create.useMutation({
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const handleSubmit = async (values: DebtFormValues) => {
    await createDebt.mutateAsync(values)
  }

  const handleQuickAddContact = async (values: { name: string; phone: string }) => {
    const created = await createContactInline.mutateAsync({
      name: values.name,
      phone: values.phone,
    })

    await utils.contacts.getAll.invalidate()
    await contactsQuery.refetch()
    toast.success(t("contacts.savedSuccess"))
    return { id: created.id, name: created.name }
  }

  const contactOptions = (contactsQuery.data || []).map((item) => ({ id: item.id, name: item.name }))

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom">
        <SheetHeader className="px-0">
          <SheetTitle>{t("debts.add")}</SheetTitle>
          <SheetDescription>{t("debts.confirmSkip")}</SheetDescription>
        </SheetHeader>

        {contactsQuery.isLoading ? (
          <p className="py-8 text-center text-sm text-[color:var(--muted-foreground)]">{t("common.loading")}</p>
        ) : (
          <DebtForm
            contacts={contactOptions}
            submitLabel={t("debts.add")}
            isSubmitting={createDebt.isPending}
            initialContactId={preselectedContactId}
            lockContact={Boolean(preselectedContactId)}
            onQuickAddContact={handleQuickAddContact}
            onCancel={close}
            onSubmit={handleSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
