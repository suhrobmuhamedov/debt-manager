import { CirclePlus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useLocation } from "wouter"

import { BackButton } from "../components/common/BackButton"
import { DebtItem } from "../components/dashboard/DebtItem"
import { EmptyState } from "../components/dashboard/EmptyState"
import { AppLayout } from "../components/layout/AppLayout"
import { GlassButton } from "../components/ui/GlassButton"
import { SkeletonCard } from "../components/ui/skeleton-card"
import { isDesignMode, showDesignModeToast } from "../lib/design-mode"
import { getMockDebts } from "../lib/mock-data"
import { trpc } from "../lib/trpc"
import { useModalStore } from "../store/modalStore"

type TabFilter = "all" | "given" | "taken" | "overdue" | "paid"

export const Debts = () => {
  const { t } = useTranslation()
  const { open } = useModalStore()
  const [location, navigate] = useLocation()
  const [tab, setTab] = useState<TabFilter>("all")

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tabParam = searchParams.get("tab") as TabFilter | null

    if (tabParam && ["all", "given", "taken", "overdue", "paid"].includes(tabParam)) {
      setTab(tabParam)
      return
    }

    const typeParam = searchParams.get("type")
    const statusParam = searchParams.get("status")
    const overdueParam = searchParams.get("overdue")

    if (typeParam === "given") {
      setTab("given")
      return
    }
    if (typeParam === "taken") {
      setTab("taken")
      return
    }
    if (statusParam === "paid") {
      setTab("paid")
      return
    }
    if (overdueParam === "1" || overdueParam === "true") {
      setTab("overdue")
    }
  }, [location])

  const debtsQuery = trpc.debts.getAll.useQuery({ limit: 500 }, { enabled: !isDesignMode })
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

  const allDebts = isDesignMode ? getMockDebts() : debtsQuery.data?.items || []
  const isLoading = !isDesignMode && debtsQuery.isLoading
  const queryError = !isDesignMode ? debtsQuery.error : null

  const tabFiltered = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()

    switch (tab) {
      case "given":
        return allDebts.filter((debt) => debt.type === "given" && debt.status !== "paid")
      case "taken":
        return allDebts.filter((debt) => debt.type === "taken" && debt.status !== "paid")
      case "overdue":
        return allDebts.filter((debt) => {
          if (debt.status === "paid" || !debt.returnDate) return false
          const dueMs = new Date(String(debt.returnDate).split("T")[0]).getTime()
          return dueMs < todayMs
        })
      case "paid":
        return allDebts.filter((debt) => debt.status === "paid")
      default:
        return allDebts
    }
  }, [allDebts, tab])

  const items = useMemo(() => {
    const todayMs = (() => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })()

    return tabFiltered.slice().sort((a, b) => {
      const aPaid = a.status === "paid" ? 1 : 0
      const bPaid = b.status === "paid" ? 1 : 0
      if (aPaid !== bPaid) return aPaid - bPaid

      if (aPaid) {
        const aDate = new Date(a.returnDate ?? 0).getTime()
        const bDate = new Date(b.returnDate ?? 0).getTime()
        return bDate - aDate
      }

      const aMs = a.returnDate ? new Date(String(a.returnDate).split("T")[0]).getTime() : Infinity
      const bMs = b.returnDate ? new Date(String(b.returnDate).split("T")[0]).getTime() : Infinity
      const aOverdue = aMs < todayMs
      const bOverdue = bMs < todayMs

      if (aOverdue && bOverdue) return aMs - bMs
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      return aMs - bMs
    })
  }, [tabFiltered])

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: t("debts.filterAll") },
    { key: "given", label: t("debts.given") },
    { key: "taken", label: t("debts.taken") },
    { key: "overdue", label: t("dashboard.overdue") },
    { key: "paid", label: t("debts.paid") },
  ]

  const handleCreateDebt = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    open("CREATE_DEBT")
  }

  const handleDebtClick = (debtId: number) => {
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

  return (
    <AppLayout>
      <div className="space-y-4 px-4 py-4">
        <div className="space-y-3">
          <BackButton fallback="/" label={t("common.back")} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">{t("debts.title")}</h1>
            </div>
            <GlassButton
              onClick={handleCreateDebt}
              variant="glass"
              className="h-11 gap-2 px-4 py-0 text-sm font-semibold"
            >
              <CirclePlus className="size-4" />
              {t("debts.add")}
            </GlassButton>
          </div>

          <div className="tab-pills">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className="tab-pill"
                data-active={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState title={t("debts.empty")} description={t("dashboard.firstDebtHint")} actionLabel={t("debts.add")} onAction={handleCreateDebt} />
        ) : (
          <div className="space-y-3">
            {items.map((debt) => (
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
                onReminder={debt.status !== "paid" ? () => handleReminder(debt.id) : undefined}
              />
            ))}
          </div>
        )}

        {queryError ? (
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-sm text-[var(--destructive)]">
            {queryError.message || t("common.error")}
          </div>
        ) : null}
      </div>
    </AppLayout>
  )
}
