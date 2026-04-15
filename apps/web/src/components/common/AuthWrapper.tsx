import type { ReactNode } from "react"

import { useAuth } from "../../hooks/useAuth"
import { Button } from "../ui/button"
import { GlassCard } from "../ui/GlassCard"
import { LoadingScreen } from "./LoadingScreen"
import { TelegramOnly } from "./TelegramOnly"

interface AuthWrapperProps {
  children: ReactNode
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isAuthenticated, isLoading, isTelegram } = useAuth()

  if (!isTelegram) {
    return <TelegramOnly />
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
        <div className="app-bg" aria-hidden>
          <div className="app-bg-gradient" />
        </div>

        <GlassCard className="relative z-10 w-full max-w-md space-y-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--debt-overdue-light)] text-2xl text-[var(--destructive)]">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-[color:var(--foreground)]">Kirish amalga oshmadi</h1>
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Iltimos, Telegram ichidan qayta urinib ko&apos;ring.
            </p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            Qayta urinish
          </Button>
        </GlassCard>
      </div>
    )
  }

  return <>{children}</>
}
