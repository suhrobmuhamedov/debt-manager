import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border text-[15px] font-medium transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:scale-95",
  {
    variants: {
      variant: {
        default: "border-blue-400/30 bg-blue-500/20 text-blue-900 shadow-lg shadow-blue-500/15 backdrop-blur-md hover:bg-blue-500/30 dark:text-blue-100",
        destructive: "border-red-400/30 bg-red-500/20 text-red-900 shadow-lg shadow-red-500/15 backdrop-blur-md hover:bg-red-500/30 dark:text-red-100",
        outline: "border-white/20 bg-white/10 text-foreground shadow-[var(--glass-shadow)] backdrop-blur-md hover:bg-white/14 dark:border-white/10 dark:bg-black/20",
        secondary: "border-emerald-400/30 bg-emerald-500/20 text-emerald-900 shadow-lg shadow-emerald-500/15 backdrop-blur-md hover:bg-emerald-500/30 dark:text-emerald-100",
        ghost: "border-transparent bg-transparent text-foreground shadow-none hover:bg-white/10 dark:hover:bg-white/8",
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
