import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "glass-input h-11 w-full min-w-0 px-4 py-3 text-sm text-[var(--foreground)] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--foreground)] placeholder:text-[color:var(--muted-foreground)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--destructive)] aria-invalid:ring-2 aria-invalid:ring-[rgba(185,28,28,0.12)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
