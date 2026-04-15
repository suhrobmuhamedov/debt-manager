import { RefreshCw, Search, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation } from "wouter"

import { BackButton } from "../components/common/BackButton"
import { ContactList } from "../components/contacts/ContactList"
import { AppLayout } from "../components/layout/AppLayout"
import { GlassButton } from "../components/ui/GlassButton"
import { GlassCard } from "../components/ui/GlassCard"
import { Input } from "../components/ui/input"
import { SkeletonCard } from "../components/ui/skeleton-card"
import { useContacts } from "../hooks/useContacts"
import { isDesignMode, showDesignModeToast } from "../lib/design-mode"
import { useModalStore } from "../store/modalStore"

export const Contacts = () => {
  const [, navigate] = useLocation()
  const { open } = useModalStore()
  const { contacts, search, setSearch, isLoading, isFetching, error, refetch } = useContacts()
  const { t } = useTranslation()

  const handleContactClick = (id: number) => {
    navigate(`/contacts/${id}`)
  }

  const handleAddClick = () => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    open("CREATE_CONTACT")
  }

  const handleAddDebtClick = (contactId: number) => {
    if (isDesignMode) {
      showDesignModeToast(t("common.designModeReadonly"))
      return
    }

    open("CREATE_DEBT", { contactId })
  }

  return (
    <AppLayout>
      <div className="space-y-4 px-4 py-4">
        <div className="space-y-3">
          <BackButton fallback="/" label={t("common.back")} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">{t("contacts.title")}</h1>
              <p className="text-sm text-[color:var(--muted-foreground)]">{t("contacts.emptyHint")}</p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <GlassButton
                variant="glass"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-11 flex-1 gap-2 px-4 py-0 text-sm font-semibold sm:flex-none"
              >
                <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                {t("contacts.refresh")}
              </GlassButton>
              <GlassButton
                onClick={handleAddClick}
                variant="glass"
                className="h-11 flex-1 gap-2 px-4 py-0 text-sm font-semibold sm:flex-none"
              >
                <UserPlus className="size-4" />
                {t("contacts.add")}
              </GlassButton>
            </div>
          </div>
        </div>

        <GlassCard className="relative p-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("contacts.search")}
            className="border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
          />
        </GlassCard>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[10px] border border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] p-4 text-sm text-[var(--destructive)]">
            {t("contacts.loadError")}
          </div>
        ) : (
          <ContactList
            contacts={contacts}
            hasSearch={Boolean(search.trim())}
            onAddClick={handleAddClick}
            onContactClick={handleContactClick}
            onContactAddDebt={handleAddDebtClick}
          />
        )}
      </div>
    </AppLayout>
  )
}
