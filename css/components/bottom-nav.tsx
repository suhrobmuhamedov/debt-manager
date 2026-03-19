"use client"

import { Home, Users, Settings, PieChart } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: typeof Home
  label: string
  active?: boolean
}

const navItems: NavItem[] = [
  { icon: Home, label: "Bosh sahifa", active: true },
  { icon: Users, label: "Kontaktlar" },
  { icon: PieChart, label: "Statistika" },
  { icon: Settings, label: "Sozlamalar" },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px]",
              item.active
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <item.icon className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
