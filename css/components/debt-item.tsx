"use client"

import { cn } from "@/lib/utils"

interface DebtItemProps {
  name: string
  amount: string
  status: "pending" | "overdue" | "paid"
  daysLeft?: number
}

const statusConfig = {
  pending: {
    label: "Kutilmoqda",
    className: "bg-stat-blue-bg text-stat-blue",
  },
  overdue: {
    label: "Muddati o'tgan",
    className: "bg-stat-red-bg text-stat-red",
  },
  paid: {
    label: "To'langan",
    className: "bg-stat-green-bg text-stat-green",
  },
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-stat-blue text-stat-blue-bg",
    "bg-stat-purple text-stat-purple-bg",
    "bg-stat-green text-stat-green-bg",
    "bg-stat-red text-stat-red-bg",
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function DebtItem({ name, amount, status, daysLeft }: DebtItemProps) {
  const initials = getInitials(name)
  const avatarColor = getAvatarColor(name)
  const statusStyle = statusConfig[status]

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors cursor-pointer active:scale-[0.99]">
      <div
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
          avatarColor
        )}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{name}</p>
        <p className="text-lg font-semibold text-foreground">{amount}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md", statusStyle.className)}>
          {statusStyle.label}
        </span>
        {daysLeft !== undefined && status !== "paid" && (
          <span className="text-xs text-muted-foreground">
            {daysLeft > 0 ? `${daysLeft} kun qoldi` : `${Math.abs(daysLeft)} kun o'tdi`}
          </span>
        )}
      </div>
    </div>
  )
}
