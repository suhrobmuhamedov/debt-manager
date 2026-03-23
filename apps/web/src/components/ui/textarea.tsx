import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "glass-input flex field-sizing-content min-h-24 w-full px-4 py-3 text-base text-foreground outline-none placeholder:text-[rgba(0,0,0,0.35)] transition-all duration-200 focus-visible:border-[#3b82f6] focus-visible:ring-4 focus-visible:ring-[rgba(59,130,246,0.20)] focus-visible:bg-white/72 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 dark:placeholder:text-[rgba(255,255,255,0.35)] dark:focus-visible:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
