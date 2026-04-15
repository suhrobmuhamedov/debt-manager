import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatCurrency } from "../../lib/formatters"
import { cn } from "@/lib/utils"
import { GlassButton } from "../ui/GlassButton"
import { GlassCard } from "../ui/GlassCard"

interface DebtItemProps {
  id: number
  contactName: string
  amount: number
  currency: string | null
  type: "given" | "taken"
  status: "pending" | "partial" | "paid" | null
  returnDate: string | null
  paidAt?: string | null
  confirmationStatus?: "not_required" | "pending" | "confirmed" | "denied" | null
  confirmationExpiresAt?: string | null
  onClick?: () => void
  onReminder?: () => void
}

const formatCompactDate = (value: string | null, locale: string) => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export const DebtItem = ({
  contactName,
  amount,
  currency,
  type,
  status,
  returnDate,
  paidAt,
  confirmationStatus,
  onClick,
  onReminder,
}: DebtItemProps) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ru" ? "ru-RU" : "uz-UZ"
  const isPaid = status === "paid"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const deadline = returnDate ? new Date(returnDate) : null
  if (deadline && !Number.isNaN(deadline.getTime())) {
    deadline.setHours(0, 0, 0, 0)
  }

  const isValidDeadline = Boolean(deadline && !Number.isNaN(deadline.getTime()))
  const dayDiff = isValidDeadline && deadline
    ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const isOverdue = typeof dayDiff === "number" && dayDiff < 0 && !isPaid
  const deadlineLabel =
    typeof dayDiff === "number"
      ? dayDiff < 0
        ? `${Math.abs(dayDiff)} ${t("debts.daysOverdue")}`
        : `${dayDiff} ${t("debts.daysLeft")}`
      : null

  const cardStateClass = isPaid
    ? type === "given"
      ? "debt-paid-given"
      : "debt-paid-taken"
    : isOverdue
      ? "debt-overdue"
      : type === "given"
        ? "debt-given"
        : "debt-taken"

  const amountToneClass = isOverdue
    ? "text-[var(--destructive)]"
    : type === "given"
      ? "text-[var(--debt-given)]"
      : "text-[var(--debt-taken)]"

  const confirmationChip = (() => {
    if (!confirmationStatus || confirmationStatus === "not_required") {
      return null
    }

    if (confirmationStatus === "pending") {
      return <span className="status-chip status-chip--pending">{t("debts.confirmPending")}</span>
    }

    if (confirmationStatus === "confirmed") {
      return <span className="status-chip status-chip--confirmed">{t("debts.confirmConfirmed")}</span>
    }

    return <span className="status-chip status-chip--denied">{t("debts.confirmDenied")}</span>
  })()

  const paidDateLabel = formatCompactDate(paidAt ?? null, locale)

  return (
    <GlassCard
      className={cn("cursor-pointer p-3", cardStateClass)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {isPaid ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex justify-center bg-[rgba(250,250,249,0.74)] pt-3 backdrop-blur-[8px] dark:bg-[rgba(28,25,23,0.72)]">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border",
                type === "given"
                  ? "border-[rgba(21,128,61,0.24)] bg-[rgba(21,128,61,0.08)] text-[var(--debt-given)]"
                  : "border-[rgba(185,28,28,0.24)] bg-[rgba(185,28,28,0.08)] text-[var(--destructive)]"
              )}
            >
              <CheckCircle2 className="size-4" />
            </div>
            <p
              className={cn(
                "text-xs font-semibold",
                type === "given" ? "text-[var(--debt-given)]" : "text-[var(--destructive)]"
              )}
            >
              {t("debts.paid")}
            </p>
            <p className="text-[11px] text-[color:var(--muted-foreground)]">{paidDateLabel}</p>
          </div>
        </div>
      ) : null}

      <div className={cn("relative flex items-start justify-between gap-3", isPaid && "opacity-40")}>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[color:var(--foreground)]">{contactName}</h3>
            {confirmationChip}
          </div>

          <p className="text-xs text-[color:var(--muted-foreground)]">
            {type === "given" ? t("debts.given") : t("debts.taken")}
          </p>

          {!isPaid ? (
            <>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {isValidDeadline && deadline ? formatCompactDate(returnDate, locale) : t("debts.returnDate")}
              </p>
              {deadlineLabel ? (
                <p className={cn("text-xs font-medium", amountToneClass)}>{deadlineLabel}</p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className={cn("numeric-text text-base font-bold", amountToneClass)}>
            {formatCurrency(amount, currency || "UZS")}
          </p>

          {!isPaid && onReminder ? (
            <GlassButton
              variant="glass"
              className="h-8 px-3 py-0 text-xs"
              onClick={(event) => {
                event.stopPropagation()
                onReminder()
              }}
            >
              {t("debts.remind")}
            </GlassButton>
          ) : null}
        </div>
      </div>
    </GlassCard>
  )
}
