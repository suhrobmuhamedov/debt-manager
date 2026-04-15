import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(21,128,61,0.2)] bg-[var(--debt-given-light)] text-[var(--debt-given)]",
        secondary:
          "border-[color:var(--border)] bg-[color:var(--card)] text-[var(--foreground)]",
        destructive:
          "border-[rgba(185,28,28,0.2)] bg-[var(--debt-overdue-light)] text-[var(--destructive)]",
        outline:
          "border-[rgba(161,98,7,0.2)] bg-[var(--debt-taken-light)] text-[var(--debt-taken)]",
        success:
          "border-[rgba(21,128,61,0.2)] bg-[var(--debt-given-light)] text-[var(--debt-given)]",
        warning:
          "border-[rgba(161,98,7,0.2)] bg-[var(--debt-taken-light)] text-[var(--debt-taken)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
