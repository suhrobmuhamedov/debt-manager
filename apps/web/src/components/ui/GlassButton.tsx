import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

type GlassButtonVariant = "primary" | "danger" | "success" | "glass"

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
  variant?: GlassButtonVariant
}

const variantClasses: Record<GlassButtonVariant, string> = {
  primary:
    "border-[rgba(87,83,78,0.2)] bg-[rgba(87,83,78,0.1)] text-[var(--foreground)] hover:bg-[rgba(87,83,78,0.18)]",
  danger:
    "border-[rgba(185,28,28,0.2)] bg-[rgba(185,28,28,0.08)] text-[var(--destructive)] hover:bg-[rgba(185,28,28,0.14)]",
  success:
    "border-[rgba(21,128,61,0.2)] bg-[rgba(21,128,61,0.08)] text-[var(--debt-given)] hover:bg-[rgba(21,128,61,0.14)]",
  glass:
    "border-[color:var(--glass-border)] bg-[var(--glass-bg)] text-[var(--foreground)] hover:bg-[color:var(--card)]",
}

export const GlassButton = ({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: GlassButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] border px-6 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
