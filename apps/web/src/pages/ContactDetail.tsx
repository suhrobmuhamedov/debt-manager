import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useLocation, useRoute } from "wouter"

import { BackButton } from "../components/common/BackButton"
import { DebtItem } from "../components/dashboard/DebtItem"
import { AppLayout } from "../components/layout/AppLayout"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { GlassButton } from "../components/ui/GlassButton"
import { formatPhone, getAvatarColor, getInitials } from "../lib/contact-utils"
import { formatCurrency } from "../lib/formatters"
import { isDesignMode, showDesignModeToast } from "../lib/design-mode"
import { getMockContactDetail } from "../lib/mock-data"
import { trpc } from "../lib/trpc"
import { useModalStore } from "../store/modalStore"

export const ContactDetail = () => {
  const [match, params] = useRoute("/contacts/:id")
  const [, navigate] = useLocation()
  const { open } = useModalStore()
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { t } = useTranslation()

  if (!match) return null

  const contactId = Number(params?.id)
  const utils = trpc.useUtils()
  const detailQuery = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !isDesignMode && Number.isFinite(contactId) }
  )

  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: async () => {
      await utils.contacts.getAll.invalidate()
      toast.success(t("contacts.deletedSuccess"))
      navigate("/contacts")
    },
    onError: (error) => {
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
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const detailData = isDesignMode ? getMockContactDetail(contactId) : detailQuery.data

  const handleDelete = async () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      setDeleteDialogOpen(false)
      return
    }

    await deleteMutation.mutateAsync({ id: contactId })
    setDeleteDialogOpen(false)
  }

  const handleCreateDebt = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    open("CREATE_DEBT", { contactId })
  }

  const handleEditContact = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    open("EDIT_CONTACT", { contactId })
  }

  const handleDebtOpen = (debtId: number) => {
    if (isDesignMode) {
      navigate(`/debts/${debtId}`)
      return
    }

    open("EDIT_DEBT", { debtId })
  }

  const handleReminder = (debtId: number) => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    reminderMutation.mutate({ debtId })
  }

  if (!isDesignMode && detailQuery.isLoading) {
    return (
      <AppLayout>
        <div className="space-y-3 p-4">
          <div className="h-28 animate-pulse rounded-[var(--radius)] bg-[color:var(--muted)]" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-[10px] bg-[color:var(--muted)]" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if ((!isDesignMode && detailQuery.error) || !detailData) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-sm text-[var(--destructive)]">
            {t("contacts.noDetails")}
          </div>
        </div>
      </AppLayout>
    )
  }

  const { contact, debts, stats } = detailData
  const sortedDebts = [...debts].sort((a, b) => {
    const aPaid = a.status === "paid" ? 1 : 0
    const bPaid = b.status === "paid" ? 1 : 0
    if (aPaid !== bPaid) {
      return aPaid - bPaid
    }
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bCreated - aCreated
  })

  return (
    <AppLayout>
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <BackButton fallback="/contacts" label={t("common.back")} />
          <GlassButton onClick={handleCreateDebt} className="h-11 gap-2 px-4 py-0 text-sm font-semibold">
            + {t("debts.add")}
          </GlassButton>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-semibold ${getAvatarColor(contact.name)}`}
                >
                  {getInitials(contact.name)}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-[color:var(--foreground)]">{contact.name}</h1>
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-[color:var(--foreground)]/90 underline-offset-4 hover:underline"
                    >
                      {formatPhone(contact.phone)}
                    </a>
                  ) : (
                    <p className="text-sm text-[color:var(--muted-foreground)]">{t("contacts.noPhone")}</p>
                  )}
                </div>
              </div>

              <Badge variant={stats.activeDebtsCount > 0 ? "destructive" : "secondary"}>
                {stats.activeDebtsCount} {t("contacts.activeDebts").toLowerCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <CardContent className="space-y-1 p-0">
              <p className="text-[11px] text-[color:var(--muted-foreground)]">{t("contacts.totalGiven")}</p>
              <p className="numeric-text text-sm font-semibold text-[var(--debt-given)]">
                {formatCurrency(stats.totalGiven, "UZS")}
              </p>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardContent className="space-y-1 p-0">
              <p className="text-[11px] text-[color:var(--muted-foreground)]">{t("contacts.totalTaken")}</p>
              <p className="numeric-text text-sm font-semibold text-[var(--debt-taken)]">
                {formatCurrency(stats.totalTaken, "UZS")}
              </p>
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardContent className="space-y-1 p-0">
              <p className="text-[11px] text-[color:var(--muted-foreground)]">{t("contacts.activeDebts")}</p>
              <p className="numeric-text text-sm font-semibold text-[color:var(--foreground)]">{stats.activeDebtsCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={handleEditContact}>
            {t("contacts.edit")}
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            onClick={() => {
              if (isDesignMode) {
                showDesignModeToast(t("common.designModeReadonly"))
                return
              }

              setDeleteDialogOpen(true)
            }}
          >
            {t("contacts.delete")}
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[color:var(--foreground)]">{t("contacts.detailsTitle")}</h2>

          {!sortedDebts.length ? (
            <Card className="border-dashed border-[color:var(--border)]">
              <CardContent className="p-4 text-center text-sm text-[color:var(--muted-foreground)]">
                {t("contacts.noDebts")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedDebts.map((debt) => (
                <DebtItem
                  key={debt.id}
                  id={debt.id}
                  contactName={contact.name}
                  amount={Math.max(Number(debt.amount) - Number(debt.paidAmount), 0)}
                  currency={debt.currency}
                  type={debt.type}
                  status={debt.status}
                  returnDate={debt.returnDate ? String(debt.returnDate).split("T")[0] : null}
                  paidAt={debt.paidAt ? String(debt.paidAt).split("T")[0] : null}
                  confirmationStatus={debt.confirmationStatus}
                  confirmationExpiresAt={debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null}
                  onClick={() => handleDebtOpen(debt.id)}
                  onReminder={debt.status !== "paid" ? () => handleReminder(debt.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("contacts.delete")}</DialogTitle>
              <DialogDescription>{t("contacts.deleteDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {t("contacts.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? t("contacts.deleting") : t("contacts.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
