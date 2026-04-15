import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CirclePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation } from "wouter"

import { DebtItem } from "../components/dashboard/DebtItem"
import { EmptyState } from "../components/dashboard/EmptyState"
import { StatCard } from "../components/dashboard/StatCard"
import { AppLayout } from "../components/layout/AppLayout"
import { GlassButton } from "../components/ui/GlassButton"
import { SkeletonCard } from "../components/ui/skeleton-card"
import { formatCurrency } from "../lib/formatters"
import { isDesignMode, showDesignModeToast } from "../lib/design-mode"
import { getMockDashboardStats } from "../lib/mock-data"
import { trpc } from "../lib/trpc"
import { useModalStore } from "../store/modalStore"

export const Dashboard = () => {
  const statsQuery = trpc.dashboard.getStats.useQuery(undefined, { enabled: !isDesignMode })
  const { open: openModal } = useModalStore()
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const stats = isDesignMode ? getMockDashboardStats() : statsQuery.data
  const isLoading = !isDesignMode && statsQuery.isLoading
  const error = !isDesignMode ? statsQuery.error : null

  const handleCreateDebt = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    openModal("CREATE_DEBT")
  }

  const handleDebtClick = (debtId: number) => {
    if (isDesignMode) {
      navigate(`/debts/${debtId}`)
      return
    }

    openModal("EDIT_DEBT", { debtId })
  }

  const navigateToDebts = (query: string) => {
    navigate(`/debts${query}`)
  }

  const getActiveCountSubtitle = (count: number) => t("dashboard.activeCount", { count })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-5 px-4 py-4">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-md bg-[color:var(--muted)]" />
            <div className="h-8 w-48 rounded-md bg-[color:var(--muted)]" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-36 rounded-md bg-[color:var(--muted)]" />
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4">
            <h3 className="font-semibold text-[var(--destructive)]">
              {t("common.error")}: {error.message}
            </h3>
            <p className="mt-2 text-sm text-[var(--destructive)]/80">{t("common.retry")}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!stats) {
    return (
      <AppLayout>
        <div className="p-4">
          <EmptyState title={t("common.error")} description={t("common.retry")} />
        </div>
      </AppLayout>
    )
  }

  const recentActiveDebts = [...stats.recentDebts]
    .filter((debt) => debt.status !== "paid")
    .sort((a, b) => {
      const aDate = a.returnDate ? new Date(a.returnDate).getTime() : 0
      const bDate = b.returnDate ? new Date(b.returnDate).getTime() : 0
      return bDate - aDate
    })
    .slice(0, 4)

  return (
    <AppLayout>
      <div className="space-y-5 px-4 py-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">{t("nav.home")}</h1>
          </div>

          <GlassButton
            onClick={handleCreateDebt}
            variant="glass"
            className="h-12 w-full justify-center gap-2 text-sm font-semibold"
          >
            <CirclePlus className="size-4" />
            {t("debts.add")}
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <StatCard
            title={t("dashboard.given")}
            value={formatCurrency(stats.totalGiven, "UZS")}
            subtitle={getActiveCountSubtitle(stats.givenCount)}
            icon={<ArrowUpRight className="size-4" />}
            variant="success"
            onClick={() => navigateToDebts("?tab=given")}
          />
          <StatCard
            title={t("dashboard.taken")}
            value={formatCurrency(stats.totalTaken, "UZS")}
            subtitle={getActiveCountSubtitle(stats.takenCount)}
            variant="danger"
            icon={<ArrowDownLeft className="size-4" />}
            onClick={() => navigateToDebts("?tab=taken")}
          />
          <StatCard
            title={t("dashboard.overdue")}
            value={formatCurrency(stats.overdueAmount, "UZS")}
            subtitle={getActiveCountSubtitle(stats.overdueCount)}
            variant="warning"
            icon={<AlertTriangle className="size-4" />}
            onClick={() => navigateToDebts("?tab=overdue")}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">{t("dashboard.recentDebts")}</h2>
            {recentActiveDebts.length ? (
              <span className="text-xs text-[color:var(--muted-foreground)]">{recentActiveDebts.length} ta</span>
            ) : null}
          </div>

          {recentActiveDebts.length === 0 ? (
            <EmptyState
              title={t("dashboard.noDebts")}
              description={t("dashboard.firstDebtHint")}
              actionLabel={t("debts.add")}
              onAction={handleCreateDebt}
            />
          ) : (
            <div className="space-y-3">
              {recentActiveDebts.map((debt) => (
                <DebtItem
                  key={debt.id}
                  id={debt.id}
                  contactName={debt.contactName || "Unknown"}
                  amount={Math.max(Number(debt.amount) - Number(debt.paidAmount), 0)}
                  currency={debt.currency}
                  type={debt.type}
                  status={debt.status}
                  returnDate={debt.returnDate ? String(debt.returnDate).split("T")[0] : null}
                  paidAt={"paidAt" in debt && debt.paidAt ? String(debt.paidAt).split("T")[0] : null}
                  confirmationStatus={debt.confirmationStatus}
                  confirmationExpiresAt={debt.confirmationExpiresAt ? String(debt.confirmationExpiresAt) : null}
                  onClick={() => handleDebtClick(debt.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
