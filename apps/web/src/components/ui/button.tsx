import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-[15px] font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-[#3b82f6] text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)] hover:bg-[#2563eb] dark:bg-[#60a5fa] dark:hover:bg-[#3b82f6]",
        destructive: "bg-[#ef4444] text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)] hover:bg-[#dc2626]",
        outline: "glass-surface border border-white/40 bg-white/45 text-foreground font-medium hover:bg-white/60 dark:border-white/12 dark:bg-white/6",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "glass-surface border border-white/40 bg-white/35 text-foreground font-medium hover:bg-white/55 dark:border-white/12 dark:bg-white/8",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
