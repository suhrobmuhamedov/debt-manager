import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "glass-input h-11 w-full min-w-0 px-4 py-3 text-base text-foreground outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[rgba(0,0,0,0.35)] transition-all duration-200 focus-visible:border-[#3b82f6] focus-visible:ring-4 focus-visible:ring-[rgba(59,130,246,0.20)] focus-visible:bg-white/72 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 dark:placeholder:text-[rgba(255,255,255,0.35)] dark:focus-visible:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Input }
