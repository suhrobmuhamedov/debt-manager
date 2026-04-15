import type { ReactNode } from "react"

import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: ReactNode
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
  onClick?: () => void
}

const tileClasses: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "contacts",
  success: "given",
  warning: "overdue",
  danger: "taken",
}

const valueClasses: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-[color:var(--foreground)]",
  success: "text-[var(--debt-given)]",
  warning: "text-[var(--destructive)]",
  danger: "text-[var(--debt-taken)]",
}

export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  className,
  onClick,
}: StatCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "profile-stat-tile w-full text-left disabled:cursor-default disabled:opacity-100",
        tileClasses[variant],
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-sm text-[color:var(--foreground)]">
        {icon ? <span className="text-[color:var(--muted-foreground)]">{icon}</span> : null}
        <span>{title}</span>
      </div>

      <p className={cn("numeric-text text-sm font-semibold", valueClasses[variant])}>{value}</p>

      {subtitle || trend ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {subtitle ? <span className="text-xs text-[color:var(--muted-foreground)]">{subtitle}</span> : null}
          {trend ? (
            <Badge variant={trend.isPositive ? "success" : "destructive"}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </Badge>
          ) : null}
        </div>
      ) : null}
    </button>
  )
}
