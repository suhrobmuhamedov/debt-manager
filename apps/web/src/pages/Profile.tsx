import { useEffect, useState } from "react"
import { Bell, ChevronDown, ChevronUp, Info, LogOut, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useLocation } from "wouter"

import { AboutSheet } from "../components/profile/AboutSheet"
import { LanguageSelector } from "../components/profile/LanguageSelector"
import { SettingsItem } from "../components/profile/SettingsItem"
import { StatsCard } from "../components/profile/StatsCard"
import { ThemeSelector } from "../components/profile/ThemeSelector"
import { UserAvatarCard } from "../components/profile/UserAvatarCard"
import { BackButton } from "../components/common/BackButton"
import { AppLayout } from "../components/layout/AppLayout"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { GlassButton } from "../components/ui/GlassButton"
import { GlassCard } from "../components/ui/GlassCard"
import { Input } from "../components/ui/input"
import { normalizePhone } from "../lib/contact-utils"
import { applyTheme } from "../lib/theme"
import { getMockContacts, getMockDashboardStats, getMockUser } from "../lib/mock-data"
import { trpc } from "../lib/trpc"
import { useAuthStore } from "../store/authStore"
import { useSettingsStore } from "../store/settingsStore"
import { isDesignMode, showDesignModeToast } from "../lib/design-mode"

const UZ_PREFIX = "+998"

const getUzLocalDigits = (phone?: string | null): string => {
  if (!phone) {
    return ""
  }

  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("998")) {
    return digits.slice(3, 12)
  }

  return digits.slice(0, 9)
}

export const Profile = () => {
  const { user, logout, setUser } = useAuthStore()
  const [, navigate] = useLocation()
  const { language, theme, notificationsEnabled, setLanguage, setTheme, setNotifications } = useSettingsStore()
  const { t } = useTranslation()
  const [sheetMode, setSheetMode] = useState<"about" | "privacy">("about")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const effectiveUser = user ?? (isDesignMode ? getMockUser() : null)

  const statsQuery = trpc.dashboard.getStats.useQuery(undefined, { enabled: !isDesignMode })
  const contactsQuery = trpc.contacts.getAll.useQuery(undefined, { enabled: !isDesignMode })

  useEffect(() => {
    if (!effectiveUser) {
      return
    }
    setFirstName(effectiveUser.firstName || "")
    setLastName(effectiveUser.lastName || "")
    setUsername(effectiveUser.username || "")
    setPhoneLocal(getUzLocalDigits(effectiveUser.phone))
  }, [effectiveUser])

  const navigateToDebts = (query: string) => {
    navigate(`/debts${query}`)
  }

  const navigateToContacts = () => {
    navigate("/contacts")
  }

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout()
      window.location.assign("/")
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const updateProfileMutation = trpc.auth.updateMe.useMutation({
    onSuccess: (updated) => {
      setUser({ ...updated, token: effectiveUser?.token })
      toast.success(t("contacts.savedSuccess"))
      setIsProfileEditOpen(false)
    },
    onError: (error) => {
      toast.error(error.message || t("common.error"))
    },
  })

  const dashboardStats = isDesignMode ? getMockDashboardStats() : statsQuery.data
  const contactsCount = isDesignMode ? getMockContacts().length : contactsQuery.data?.length ?? 0

  const handleProfileSave = () => {
    const normalizedUsername = username.trim().replace(/^@+/, "") || null
    const normalizedPhone = normalizePhone(`${UZ_PREFIX}${phoneLocal}`) || null

    if (isDesignMode && effectiveUser) {
      setUser({
        ...effectiveUser,
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        username: normalizedUsername,
        phone: normalizedPhone,
      })
      toast.success(t("contacts.savedSuccess"))
      setIsProfileEditOpen(false)
      return
    }

    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      username: normalizedUsername,
      phone: normalizedPhone,
    })
  }

  if (!effectiveUser) {
    return (
      <AppLayout>
        <div className="p-4">
          <GlassCard>
            <div className="p-5 text-sm text-[color:var(--muted-foreground)]">{t("common.loading")}</div>
          </GlassCard>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4 overflow-x-hidden px-4 py-4">
        <div className="space-y-2">
          <BackButton fallback="/" label={t("common.back")} />
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">{t("profile.title")}</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">{t("profile.settingsDescription")}</p>
          </div>
        </div>

        <UserAvatarCard user={effectiveUser} language={language} />

        <GlassCard className="space-y-3 p-4">
          <button
            type="button"
            onClick={() => setIsProfileEditOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-sm font-semibold text-[color:var(--foreground)]">{t("profile.profileInfo")}</h2>
            {isProfileEditOpen ? (
              <ChevronUp className="size-4 text-[color:var(--muted-foreground)]" />
            ) : (
              <ChevronDown className="size-4 text-[color:var(--muted-foreground)]" />
            )}
          </button>

          {isProfileEditOpen ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                  {t("profile.firstNameLabel")}
                </label>
                <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder={t("profile.firstNamePlaceholder")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                  {t("profile.lastNameLabel")}
                </label>
                <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder={t("profile.lastNamePlaceholder")} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                  {t("profile.telegramUsernameLabel")}
                </label>
                <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="@username" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{t("profile.phoneLabel")}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[color:var(--foreground)]">
                    {UZ_PREFIX}
                  </span>
                  <Input
                    value={phoneLocal}
                    onChange={(event) => setPhoneLocal(event.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="90 123 45 67"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                    className="pl-14"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[color:var(--muted-foreground)]">
                  {t("profile.telegramIdReadonly")}
                </label>
                <Input value={effectiveUser.telegramId} disabled />
              </div>
              <GlassButton onClick={handleProfileSave} disabled={updateProfileMutation.isPending || !firstName.trim()}>
                {updateProfileMutation.isPending ? t("common.loading") : t("contacts.save")}
              </GlassButton>
            </div>
          ) : null}
        </GlassCard>

        <StatsCard
          stats={
            dashboardStats
              ? {
                  totalGiven: dashboardStats.totalGiven,
                  totalTaken: dashboardStats.totalTaken,
                  overdueCount: dashboardStats.overdueCount,
                  paidCount: dashboardStats.paidCount,
                }
              : undefined
          }
          contactsCount={contactsCount}
          isLoading={!isDesignMode && statsQuery.isLoading}
          isError={!isDesignMode && statsQuery.isError}
          onRetry={isDesignMode ? undefined : () => statsQuery.refetch()}
          onGivenClick={() => navigateToDebts("?type=given")}
          onTakenClick={() => navigateToDebts("?type=taken")}
          onOverdueClick={() => navigateToDebts("?tab=overdue")}
          onPaidClick={() => navigateToDebts("?status=paid")}
          onContactsClick={navigateToContacts}
        />

        <ThemeSelector
          current={theme}
          onChange={(nextTheme) => {
            setTheme(nextTheme)
            applyTheme(nextTheme)
          }}
        />

        <LanguageSelector current={language} onChange={setLanguage} />

        <GlassCard className="space-y-3 p-4">
          <h2 className="px-1 text-sm font-semibold text-[color:var(--foreground)]">{t("profile.accountActions")}</h2>

          <SettingsItem
            icon={<Bell className="size-5" />}
            label={t("profile.notifications")}
            onClick={() => setNotifications(!notificationsEnabled)}
            rightElement={
              <span className={notificationsEnabled ? "status-chip status-chip--confirmed" : "status-chip status-chip--neutral"}>
                {notificationsEnabled ? t("profile.notificationsOn") : t("profile.notificationsOff")}
              </span>
            }
          />

          <SettingsItem
            icon={<Shield className="size-5" />}
            label={t("profile.privacyPolicy")}
            onClick={() => {
              setSheetMode("privacy")
              setSheetOpen(true)
            }}
          />

          <SettingsItem
            icon={<Info className="size-5" />}
            label={t("profile.about")}
            onClick={() => {
              setSheetMode("about")
              setSheetOpen(true)
            }}
          />

          <SettingsItem
            icon={<LogOut className="size-5" />}
            label={t("profile.logout")}
            onClick={() => {
              if (isDesignMode) {
                showDesignModeToast(t("common.designModeReadonly"))
                return
              }

              setLogoutDialogOpen(true)
            }}
            danger
          />
        </GlassCard>

        <GlassCard className="space-y-1 p-4 text-center text-xs text-[color:var(--muted-foreground)]">
          <p>{t("profile.appName")} v1.0.0</p>
          <p>{t("profile.madeInUzbekistan")}</p>
        </GlassCard>

        <AboutSheet open={sheetOpen} onOpenChange={setSheetOpen} mode={sheetMode} />

        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("profile.logoutConfirm")}</DialogTitle>
              <DialogDescription>{t("profile.logoutDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                {t("contacts.cancel")}
              </Button>
              <GlassButton
                variant="danger"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? t("common.loading") : t("profile.logout")}
              </GlassButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
