import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2, UsersRound } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatCurrency } from "../../lib/formatters"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { GlassCard } from "../ui/GlassCard"
import { cn } from "@/lib/utils"

type DashboardStats = {
  totalGiven: number
  totalTaken: number
  overdueCount: number
  paidCount: number
}

type StatsCardProps = {
  stats?: DashboardStats
  contactsCount?: number
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  onGivenClick?: () => void
  onTakenClick?: () => void
  onOverdueClick?: () => void
  onPaidClick?: () => void
  onContactsClick?: () => void
}

export const StatsCard = ({
  stats,
  contactsCount,
  isLoading,
  isError,
  onRetry,
  onGivenClick,
  onTakenClick,
  onOverdueClick,
  onPaidClick,
  onContactsClick,
}: StatsCardProps) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <GlassCard className="space-y-4 p-4">
        <h2 className="text-base font-semibold text-[color:var(--foreground)]">{t("profile.statistics")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] p-3">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </GlassCard>
    )
  }

  if (isError || !stats) {
    return (
      <GlassCard className="space-y-3 p-4">
        <h2 className="text-base font-semibold text-[color:var(--foreground)]">{t("profile.statistics")}</h2>
        <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-sm text-[var(--destructive)]">
          <p>{t("profile.statsLoadError")}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          ) : null}
        </div>
      </GlassCard>
    )
  }

  const items = [
    {
      key: "given",
      label: t("dashboard.given"),
      value: formatCurrency(stats.totalGiven, "UZS"),
      icon: ArrowUpRight,
      onClick: onGivenClick,
      className: "given",
      valueClassName: "text-[var(--debt-given)]",
      span: "col-span-1",
    },
    {
      key: "taken",
      label: t("dashboard.taken"),
      value: formatCurrency(stats.totalTaken, "UZS"),
      icon: ArrowDownLeft,
      onClick: onTakenClick,
      className: "taken",
      valueClassName: "text-[var(--debt-taken)]",
      span: "col-span-1",
    },
    {
      key: "overdue",
      label: t("dashboard.overdue"),
      value: String(stats.overdueCount),
      icon: AlertTriangle,
      onClick: onOverdueClick,
      className: "overdue",
      valueClassName: "text-[var(--destructive)]",
      span: "col-span-1",
    },
    {
      key: "paid",
      label: t("dashboard.paid"),
      value: String(stats.paidCount),
      icon: CheckCircle2,
      onClick: onPaidClick,
      className: "paid",
      valueClassName: "text-[var(--debt-given)]",
      span: "col-span-1",
    },
    {
      key: "contacts",
      label: t("profile.myContacts"),
      value: String(contactsCount ?? 0),
      icon: UsersRound,
      onClick: onContactsClick,
      className: "contacts",
      valueClassName: "text-[color:var(--foreground)]",
      span: "col-span-2",
    },
  ] as const

  return (
    <GlassCard className="space-y-4 p-4">
      <h2 className="text-base font-semibold text-[color:var(--foreground)]">{t("profile.statistics")}</h2>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              disabled={!item.onClick}
              className={cn("profile-stat-tile text-left", item.className, item.span)}
            >
              <div className="mb-2 flex items-center gap-2 text-sm text-[color:var(--foreground)]">
                <Icon className="size-4 text-[color:var(--muted-foreground)]" />
                <span>{item.label}</span>
              </div>
              <p className={cn("numeric-text text-sm font-semibold", item.valueClassName)}>{item.value}</p>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
