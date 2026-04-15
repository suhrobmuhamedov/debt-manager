import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "glass-input flex min-h-24 w-full resize-y px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[color:var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--destructive)] aria-invalid:ring-2 aria-invalid:ring-[rgba(185,28,28,0.12)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
