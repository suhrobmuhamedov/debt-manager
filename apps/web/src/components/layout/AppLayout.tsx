import type { ReactNode } from "react"

import { BottomNav } from "./BottomNav"

interface AppLayoutProps {
  children: ReactNode
  showHeader?: boolean
  header?: ReactNode
}

export const AppLayout = ({ children, showHeader = false, header }: AppLayoutProps) => {
  return (
    <div className="theme-smooth relative flex min-h-screen flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="app-bg" aria-hidden>
        <div className="app-bg-gradient" />
      </div>

      {showHeader && header ? (
        <header className="glass-surface relative z-10 rounded-b-[20px] border-b border-[color:var(--glass-border)]">
          {header}
        </header>
      ) : null}

      <main className="relative z-10 flex-1 overflow-y-auto pb-[calc(92px+env(safe-area-inset-bottom,20px))]">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>

      <BottomNav />
    </div>
  )
}
