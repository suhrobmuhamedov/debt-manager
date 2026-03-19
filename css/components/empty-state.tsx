"use client"

import { FileText } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">Qarz yo'q</h3>
      <p className="text-sm text-muted-foreground text-center max-w-[200px]">
        Hozircha hech qanday qarz mavjud emas
      </p>
    </div>
  )
}
