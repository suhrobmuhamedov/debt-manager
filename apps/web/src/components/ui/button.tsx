import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--foreground)]",
        destructive:
          "border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[#991b1b] dark:hover:bg-[#b91c1c]",
        outline:
          "border-[color:var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
        secondary:
          "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--border)]",
        ghost:
          "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
        link: "border-transparent bg-transparent p-0 text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6",
        icon: "h-11 w-11 rounded-full p-0",
        "icon-sm": "h-8 w-8 rounded-full p-0",
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
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
