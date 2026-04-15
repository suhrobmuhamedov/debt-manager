import { useEffect, useMemo, useState } from "react"
import { Calendar, Check, Lock, Minus, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { formatCurrency } from "../../lib/formatters"
import { trpc } from "../../lib/trpc"
import { useModalStore } from "../../store/modalStore"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { cn } from "@/lib/utils"

const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0]
}

const formatDateDisplay = (date: Date | string | null | undefined, locale: string): string => {
  if (!date) {
    return "-"
  }
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatLongDate = (date: Date | string | null | undefined, locale: string): string => {
  if (!date) {
    return "-"
  }
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return parsed.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

type TimelineEntry = {
  id: string
  date: Date
  title: string
  amount: number
  kind: "created" | "increase" | "payment"
  balance: number
}

export const EditDebtModal = () => {
  const { type, data, close } = useModalStore()
  const isOpen = type === "EDIT_DEBT"
  const debtId = typeof data?.debtId === "number" ? data.debtId : undefined
  const { t, i18n } = useTranslation()
  const uiLocale = i18n.language === "ru" ? "ru-RU" : "uz-UZ"
  const utils = trpc.useUtils()

  const debtQuery = trpc.debts.getById.useQuery({ id: debtId ?? 0 }, { enabled: isOpen && Number.isFinite(debtId) })

  const [returnDate, setReturnDate] = useState("")
  const [note, setNote] = useState("")
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false)
  const [adjustmentMode, setAdjustmentMode] = useState<"add" | "subtract" | null>(null)
  const [adjustmentValue, setAdjustmentValue] = useState("")
  const [actionDate, setActionDate] = useState("")

  useEffect(() => {
    if (!debtQuery.data?.debt) {
      return
    }

    setReturnDate(toDateInput(debtQuery.data.debt.returnDate))
    setNote(debtQuery.data.debt.note ?? "")
    setShowReturnDatePicker(false)
    setAdjustmentMode(null)
    setAdjustmentValue("")
    setActionDate(new Date().toISOString().split("T")[0])
  }, [debtQuery.data?.debt])

  const invalidateDebtViews = async (id: number) => {
    await Promise.all([
      utils.dashboard.getStats.invalidate(),
      utils.debts.getAll.invalidate(),
      utils.debts.getById.invalidate({ id }),
      utils.contacts.getById.invalidate(),
    ])
  }

  const updateMutation = trpc.debts.update.useMutation({
    onSuccess: async (updated) => {
      await invalidateDebtViews(updated.id)
      await new Promise((resolve) => setTimeout(resolve, 100))
      toast.success(t("contacts.savedSuccess"))
      close()
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const adjustDebtMutation = trpc.payments.adjustDebt.useMutation({
    onSuccess: async () => {
      if (debtId) {
        await invalidateDebtViews(debtId)
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      toast.success(t("contacts.savedSuccess"))
      setAdjustmentValue("")
      setActionDate(new Date().toISOString().split("T")[0])
      setAdjustmentMode(null)
      close()
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const debt = debtQuery.data?.debt
  const contact = debtQuery.data?.contact
  const payments = debtQuery.data?.payments || []
  const totalAmount = Number(debt?.amount ?? 0)
  const paidAmount = Number(debt?.paidAmount ?? 0)
  const remainingAmount = Math.max(totalAmount - paidAmount, 0)
  const isPaid = debt?.status === "paid" || remainingAmount === 0
  const isLockedForCounterparty = Boolean(
    debt?.confirmationStatus === "confirmed" && debt?.linkedDebtId && debt?.type !== "given"
  )
  const readOnlyMode = isPaid || isLockedForCounterparty
  const debtTypeLabel = debt?.type === "given" ? t("debts.given") : t("debts.taken")

  const increaseTotal = payments
    .filter((entry) => (entry.note || "").startsWith("debt_increase:"))
    .reduce((sum, entry) => sum + Number(entry.amount), 0)

  const initialAmount = Math.max(totalAmount - increaseTotal, 0)

  const timeline = useMemo(() => {
    if (!debt) {
      return [] as TimelineEntry[]
    }

    const entries = [...payments]
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
      .map((entry) => {
        const isIncrease = (entry.note || "").startsWith("debt_increase:")
        return {
          id: `p-${entry.id}`,
          date: new Date(entry.paymentDate),
          amount: Number(entry.amount),
          kind: isIncrease ? ("increase" as const) : ("payment" as const),
          title: isIncrease ? t("debts.historyIncrease") : t("debts.historyPayment"),
        }
      })

    let runningBalance = initialAmount
    const built: TimelineEntry[] = [
      {
        id: `created-${debt.id}`,
        date: new Date(debt.createdAt ?? Date.now()),
        title: t("debts.historyCreated"),
        amount: initialAmount,
        kind: "created",
        balance: initialAmount,
      },
    ]

    entries.forEach((entry) => {
      if (entry.kind === "increase") {
        runningBalance += entry.amount
      } else {
        runningBalance = Math.max(0, runningBalance - entry.amount)
      }

      built.push({
        ...entry,
        title:
          entry.kind === "increase"
            ? t("debts.historyIncrease")
            : runningBalance === 0
              ? t("debts.paid")
              : t("debts.historyPayment"),
        balance: runningBalance,
      })
    })

    return built
  }, [debt, initialAmount, payments, t])

  const canSubmit = useMemo(() => {
    return Boolean(returnDate) && !updateMutation.isPending && !readOnlyMode
  }, [returnDate, updateMutation.isPending, readOnlyMode])

  const paidDate = useMemo(() => {
    if (!debt || debt.status !== "paid") {
      return null
    }

    const paymentDates = payments
      .map((entry) => new Date(entry.paymentDate))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())

    if (paymentDates.length > 0) {
      return paymentDates[0]
    }

    return debt.updatedAt ? new Date(debt.updatedAt) : null
  }, [debt, payments])

  const handleApplyAdjustment = () => {
    const adjustment = Number(adjustmentValue) || 0
    if (adjustment <= 0) {
      toast.error(t("common.error"))
      return
    }

    if (!debtId || !adjustmentMode) {
      return
    }

    if (!actionDate) {
      toast.error(t("common.error"))
      return
    }

    if (adjustmentMode === "subtract" && adjustment > remainingAmount) {
      toast.error(t("debts.overPaymentError"))
      return
    }

    adjustDebtMutation.mutate({
      debtId,
      amount: adjustment,
      action: adjustmentMode === "add" ? "increase" : "payment",
      actionDate,
    })
  }

  const handleFullRepay = () => {
    if (!debtId || readOnlyMode || remainingAmount <= 0) {
      return
    }

    adjustDebtMutation.mutate({
      debtId,
      amount: remainingAmount,
      action: "payment",
      actionDate: actionDate || new Date().toISOString().split("T")[0],
    })
  }

  const handleSave = async () => {
    if (!debtId) {
      return
    }

    await updateMutation.mutateAsync({
      id: debtId,
      returnDate,
      note: note.trim() || undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {debtQuery.isLoading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[color:var(--muted-foreground)]">{t("common.loading")}</p>
          </div>
        ) : debtQuery.error || !debt ? (
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-center text-sm text-[var(--destructive)]">
            {debtQuery.error?.message || t("common.error")}
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-4 border-b border-[color:var(--border)] pb-4">
              <DialogTitle className="text-sm font-semibold text-[color:var(--muted-foreground)]">
                {t("contacts.edit")}
              </DialogTitle>
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-[color:var(--foreground)]">{contact?.name || "Unknown"}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {contact?.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-[color:var(--foreground)]/90 underline-offset-4 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  ) : null}
                  {isLockedForCounterparty ? (
                    <Badge variant="outline" className="text-[11px]">
                      {t("debts.onlyLenderCanEdit")}
                    </Badge>
                  ) : null}
                  {isPaid ? (
                    <Badge variant="success" className="text-[11px]">
                      {t("debts.paidReadOnly")}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5">
              <section className="space-y-3">
                <p className="text-sm font-medium text-[color:var(--muted-foreground)]">
                  {t("debts.amount")} ({debtTypeLabel})
                </p>

                {adjustmentMode ? (
                  <div className="rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                    <p className="mb-2 text-xs font-medium text-[color:var(--foreground)]">
                      {adjustmentMode === "add" ? t("debts.addToDebt") : t("debts.subtractFromDebt")}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={adjustmentValue}
                        onChange={(event) => setAdjustmentValue(event.target.value)}
                        placeholder={t("debts.amount")}
                        autoFocus
                        className="h-10 flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleApplyAdjustment}
                        disabled={readOnlyMode || adjustDebtMutation.isPending}
                        className="h-10 w-10"
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setAdjustmentMode(null)
                          setAdjustmentValue("")
                        }}
                        className="h-10 w-10"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Input
                        type="date"
                        value={actionDate}
                        onChange={(event) => setActionDate(event.target.value)}
                        className="h-10"
                        disabled={readOnlyMode}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={readOnlyMode}
                        onClick={() => setAdjustmentMode("subtract")}
                        className="h-11 w-11 rounded-[10px]"
                      >
                        <Minus className="size-5" />
                      </Button>

                      <div className="flex-1 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-3 text-center">
                        <p className="numeric-text text-2xl font-bold text-[color:var(--foreground)]">
                          {formatCurrency(remainingAmount, debt.currency || "UZS")}
                        </p>
                        <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                          {t("debts.totalLabel")}: {formatCurrency(totalAmount, debt.currency || "UZS")} | {t("debts.paidLabel")}:{" "}
                          {formatCurrency(paidAmount, debt.currency || "UZS")}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={readOnlyMode}
                        onClick={() => setAdjustmentMode("add")}
                        className="h-11 w-11 rounded-[10px]"
                      >
                        <Plus className="size-5" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      disabled={readOnlyMode || remainingAmount <= 0 || adjustDebtMutation.isPending}
                      onClick={handleFullRepay}
                      className="h-10 w-full"
                    >
                      {t("debts.markFullyPaid")}
                    </Button>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                  <p className="mb-3 text-xs font-semibold text-[color:var(--foreground)]">{t("debts.paymentHistory")}</p>
                  <div className="space-y-2">
                    {timeline.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-[10px] border border-[color:var(--border)] bg-[var(--glass-bg)] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[color:var(--foreground)]">
                            {formatDateDisplay(entry.date, uiLocale)}
                          </p>
                          <p className="text-xs text-[color:var(--muted-foreground)]">{entry.title}</p>
                        </div>

                        <div className="text-right">
                          <p
                            className={cn(
                              "numeric-text text-xs font-semibold",
                              entry.kind === "payment"
                                ? "text-[var(--debt-given)]"
                                : entry.kind === "increase"
                                  ? "text-[var(--debt-taken)]"
                                  : "text-[color:var(--foreground)]"
                            )}
                          >
                            {formatCurrency(entry.amount, debt.currency || "UZS", {
                              sign: entry.kind === "payment" ? "minus" : "plus",
                            })}
                          </p>
                          <p className="text-[11px] text-[color:var(--muted-foreground)]">
                            {t("debts.remainingLabel")}: {formatCurrency(entry.balance, debt.currency || "UZS")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[color:var(--muted-foreground)]">{t("debts.givenDate")}</p>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {formatDateDisplay(debt.givenDate, uiLocale)}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color:var(--muted)]">
                    <Lock className="size-4 text-[color:var(--muted-foreground)]" />
                  </div>
                </div>

                <div className="h-px bg-[color:var(--border)]" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[color:var(--muted-foreground)]">{t("debts.returnDate")}</p>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {formatDateDisplay(returnDate, uiLocale)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={readOnlyMode}
                    onClick={() => setShowReturnDatePicker((prev) => !prev)}
                  >
                    <Calendar className="size-4" />
                  </Button>
                </div>

                {showReturnDatePicker ? (
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(event) => {
                      setReturnDate(event.target.value)
                      setShowReturnDatePicker(false)
                    }}
                    className="h-10"
                  />
                ) : null}

                {isPaid ? (
                  <>
                    <div className="h-px bg-[color:var(--border)]" />
                    <div className="rounded-[10px] border border-[rgba(21,128,61,0.2)] bg-[var(--debt-given-light)] px-3 py-2 text-xs text-[color:var(--foreground)]">
                      <p>
                        {t("debts.returnDate")}: {formatLongDate(returnDate || debt.returnDate, uiLocale)}
                      </p>
                      <p>
                        {t("debts.paidDate")}: {formatDateDisplay(paidDate, uiLocale)}
                      </p>
                    </div>
                  </>
                ) : null}
              </section>

              <section className="space-y-2">
                <p className="text-sm font-medium text-[color:var(--muted-foreground)]">{t("debts.note")}</p>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t("debts.note")}
                  readOnly={readOnlyMode}
                  className="resize-none"
                />
              </section>
            </div>

            <DialogFooter className="gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={close} className="flex-1">
                {t("common.close")}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSubmit || debtQuery.isLoading || Boolean(debtQuery.error)}
                className="flex-1"
              >
                {readOnlyMode ? t("debts.readOnlyInfo") : updateMutation.isPending ? t("contacts.updating") : t("contacts.edit")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
