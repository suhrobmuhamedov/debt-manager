import type { ReactNode } from "react"

import { Badge } from "../ui/badge"
import { CardContent, CardHeader, CardTitle } from "../ui/card"
import { GlassCard } from "../ui/GlassCard"
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

const variantClasses: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "border-l-[3px] border-l-[color:var(--foreground)] bg-[color:var(--card)]",
  success: "stat-success",
  warning: "stat-warning",
  danger: "stat-danger",
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
    <GlassCard
      className={cn(
        "p-0",
        variantClasses[variant],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pb-0 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {icon ? <div className="text-[color:var(--muted-foreground)]">{icon}</div> : null}
          </div>
          {subtitle ? (
            <span className="text-xs font-medium text-[color:var(--muted-foreground)]">{subtitle}</span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4 pb-4 pt-2">
        <div className="numeric-text text-lg font-bold text-[color:var(--foreground)]">{value}</div>
        {trend ? (
          <Badge variant={trend.isPositive ? "success" : "destructive"}>
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </Badge>
        ) : null}
      </CardContent>
    </GlassCard>
  )
}
