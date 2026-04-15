import { House, HandCoins, UsersRound, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation } from "wouter"

import { prefetchContacts, prefetchDebts, prefetchProfile } from "@/App"
import { cn } from "@/lib/utils"

export const BottomNav = () => {
  const [location, navigate] = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { path: "/", label: t("nav.home"), icon: House, prefetch: undefined },
    { path: "/debts", label: t("nav.debts"), icon: HandCoins, prefetch: prefetchDebts },
    { path: "/contacts", label: t("nav.contacts"), icon: UsersRound, prefetch: prefetchContacts },
    { path: "/profile", label: t("nav.profile"), icon: UserRound, prefetch: prefetchProfile },
  ]

  return (
    <nav className="safe-area-pb fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[var(--glass-bg)] backdrop-blur-[12px]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              onMouseEnter={item.prefetch}
              onFocus={item.prefetch}
              onTouchStart={item.prefetch}
              className={cn(
                "flex min-w-14 flex-col items-center gap-1 rounded-[10px] px-3 py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-[color:var(--foreground)]"
                  : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("size-[1.15rem]", isActive ? "stroke-[2.25]" : "stroke-2")} />
              <span className={cn(isActive && "font-semibold")}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
