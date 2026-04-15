import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

type GlassCardVariant = "default" | "light" | "subtle" | "dark"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  variant?: GlassCardVariant
}

const variantClasses: Record<GlassCardVariant, string> = {
  default: "glass-card",
  light: "glass-card",
  subtle:
    "rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  dark:
    "rounded-[var(--radius)] border border-[rgba(87,83,78,0.4)] bg-[rgba(28,25,23,0.92)] p-4 text-[color:var(--card-foreground)] shadow-[0_1px_3px_rgba(0,0,0,0.24)]",
}

export const GlassCard = ({
  children,
  className,
  variant = "default",
  ...props
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        "transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.995]",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
