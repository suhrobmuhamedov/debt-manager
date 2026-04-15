import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useRoute } from "wouter"

import { BackButton } from "../components/common/BackButton"
import { AppLayout } from "../components/layout/AppLayout"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { formatCurrency, formatDate } from "../lib/formatters"
import { isDesignMode, showDesignModeToast } from "../lib/design-mode"
import { getMockDebtDetail } from "../lib/mock-data"
import { trpc } from "../lib/trpc"

const formatExpires = (value: string | null | undefined) => {
  if (!value) {
    return "-"
  }
  return formatDate(value)
}

export const DebtDetail = () => {
  const { t } = useTranslation()
  const [match, params] = useRoute("/debts/:id")
  const debtId = Number(params?.id)

  const debtQuery = trpc.debts.getById.useQuery(
    { id: debtId },
    { enabled: !isDesignMode && match && Number.isFinite(debtId) }
  )
  const generateLinkMutation = trpc.debts.generateConfirmationLink.useMutation({
    onSuccess: () => {
      toast.success(t("debts.linkSent"))
      void debtQuery.refetch()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("common.error"))
    },
  })
  const reminderMutation = trpc.debts.sendReminder.useMutation({
    onSuccess: (result) => {
      if (result.sentTo === "counterparty") {
        toast.success(t("debts.reminderSentAuto", { name: result.recipientName }))
        return
      }

      toast.success(t("debts.reminderSentSelf"))
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || t("common.error"))
    },
  })

  if (!match) {
    return null
  }

  const detailData = isDesignMode ? getMockDebtDetail(debtId) : debtQuery.data

  const handleGenerateConfirmation = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    generateLinkMutation.mutate({ debtId })
  }

  const handleReminder = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    reminderMutation.mutate({ debtId })
  }

  if (!isDesignMode && debtQuery.isLoading) {
    return (
      <AppLayout>
        <div className="p-4 text-sm text-[color:var(--muted-foreground)]">{t("common.loading")}</div>
      </AppLayout>
    )
  }

  if ((!isDesignMode && debtQuery.error) || !detailData) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-sm text-[var(--destructive)]">
            {debtQuery.error?.message || t("common.error")}
          </div>
        </div>
      </AppLayout>
    )
  }

  const debt = detailData.debt
  const amount = Math.max(Number(debt.amount) - Number(debt.paidAmount), 0)
  const canSendConfirmation = debt.confirmationStatus !== "confirmed"

  const renderConfirmationBanner = () => {
    if (debt.confirmationStatus === "pending") {
      return (
        <div className="confirm-banner confirm-banner--pending space-y-2">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-[var(--debt-taken)]" />
            <p className="font-semibold text-[var(--debt-taken)]">{t("debts.confirmPending")}</p>
          </div>
          <p className="text-xs text-[color:var(--muted-foreground)]">
            {t("debts.confirmExpiry")}: {formatExpires(debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null)}
          </p>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={handleGenerateConfirmation}
            disabled={generateLinkMutation.isPending}
          >
            {t("debts.resendLink")}
          </Button>
        </div>
      )
    }

    if (debt.confirmationStatus === "confirmed") {
      return (
        <div className="confirm-banner confirm-banner--confirmed space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[var(--debt-given)]" />
            <p className="font-semibold text-[var(--debt-given)]">{t("debts.confirmConfirmed")}</p>
          </div>
          <p className="text-xs text-[color:var(--muted-foreground)]">{t("debts.confirmedByReceiver")}</p>
          {debt.linkedDebtId ? (
            <p className="text-xs text-[color:var(--muted-foreground)]">{t("debts.linkedDebt")}</p>
          ) : null}
        </div>
      )
    }

    if (debt.confirmationStatus === "denied") {
      return (
        <div className="confirm-banner confirm-banner--denied space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-[var(--destructive)]" />
            <p className="font-semibold text-[var(--destructive)]">{t("debts.confirmDenied")}</p>
          </div>
          <p className="text-xs text-[color:var(--muted-foreground)]">{t("debts.deniedByReceiver")}</p>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={handleGenerateConfirmation}
            disabled={generateLinkMutation.isPending}
          >
            {t("debts.resendLink")}
          </Button>
        </div>
      )
    }

    return null
  }

  return (
    <AppLayout>
      <div className="space-y-4 px-4 py-4">
        <BackButton fallback="/debts" label={t("common.back")} />

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-[color:var(--foreground)]">
                  {detailData.contact?.name || "Unknown"}
                </h1>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  {debt.type === "given" ? t("debts.given") : t("debts.taken")}
                </p>
              </div>
              {debt.status === "paid" ? <Badge variant="secondary">{t("debts.paid")}</Badge> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="numeric-text text-2xl font-bold text-[color:var(--foreground)]">
                {formatCurrency(amount, debt.currency || "UZS")}
              </p>

              {debt.status !== "paid" ? (
                <Button
                  variant="outline"
                  className="h-10 px-4"
                  onClick={handleReminder}
                  disabled={reminderMutation.isPending}
                >
                  {t("debts.remind")}
                </Button>
              ) : null}
            </div>

            <div className="space-y-1 text-sm text-[color:var(--muted-foreground)]">
              <p>
                {t("debts.givenDate")}: {formatDate(debt.givenDate)}
              </p>
              <p>
                {t("debts.returnDate")}: {formatDate(debt.returnDate)}
              </p>
            </div>

            {canSendConfirmation ? (
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={handleGenerateConfirmation}
                disabled={generateLinkMutation.isPending}
              >
                {t("debts.sendForConfirmation")}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {renderConfirmationBanner()}
      </div>
    </AppLayout>
  )
}
