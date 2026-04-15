import { Send, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { formatCurrency } from "../../lib/formatters"
import { shareToTelegram } from "../../lib/telegram"
import { trpc } from "../../lib/trpc"
import { useModalStore } from "../../store/modalStore"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"

export const DebtConfirmationModal = () => {
  const { type, data, close } = useModalStore()
  const isOpen = type === "DEBT_CONFIRMATION"
  const { t } = useTranslation()

  const debtId = typeof data?.debtId === "number" ? data.debtId : null
  const contactName = typeof data?.contactName === "string" ? data.contactName : ""
  const amount = typeof data?.amount === "number" ? data.amount : 0
  const currency = typeof data?.currency === "string" ? data.currency : "UZS"
  const returnDate = typeof data?.returnDate === "string" ? data.returnDate : ""

  const mutation = trpc.debts.generateConfirmationLink.useMutation({
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const handleSend = async () => {
    if (!debtId) {
      toast.error(t("common.error"))
      return
    }

    const result = await mutation.mutateAsync({ debtId })
    const shareResult = await shareToTelegram(null, result.shareText)
    toast.success(t("debts.linkSent"))
    if (shareResult.copiedFallback) {
      toast.info(t("debts.shareDesktopFallback"))
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="bottom">
        <SheetHeader className="px-0">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="size-4" />
            {t("debts.confirmTitle")}
          </SheetTitle>
          <SheetDescription>{t("debts.confirmDesc")}</SheetDescription>
        </SheetHeader>

        <Card>
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="font-semibold text-[color:var(--foreground)]">{contactName}</p>
            <p className="numeric-text text-[color:var(--foreground)]">{formatCurrency(amount, currency)}</p>
            <p className="text-[color:var(--muted-foreground)]">
              {t("debts.returnDate")}: {returnDate}
            </p>
          </CardContent>
        </Card>

        <p className="px-1 text-sm text-[color:var(--muted-foreground)]">
          {t("debts.confirmDesc")} {contactName}
        </p>

        <Button className="h-11 w-full" onClick={handleSend} disabled={mutation.isPending}>
          {mutation.isSuccess ? (
            t("debts.linkSent")
          ) : (
            <>
              <Send className="size-4" />
              {t("debts.sendConfirmLink")}
            </>
          )}
        </Button>

        {mutation.isSuccess ? (
          <p className="text-center text-xs text-[color:var(--muted-foreground)]">{t("debts.confirmExpiry")}</p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button className="h-11 flex-1" variant="ghost" onClick={close}>
            {t("debts.confirmLater")}
          </Button>
          <Button className="h-11 flex-1" variant="outline" onClick={close}>
            {t("debts.confirmSkip")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
