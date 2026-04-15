import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

type SettingsItemProps = {
  icon: ReactNode
  label: string
  onClick?: () => void
  rightElement?: ReactNode
  danger?: boolean
}

export const SettingsItem = ({ icon, label, onClick, rightElement, danger = false }: SettingsItemProps) => {
  return (
    <button type="button" onClick={onClick} className="settings-item" data-danger={danger}>
      <span className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
        {rightElement ?? <ChevronRight className="size-4" />}
      </span>
    </button>
  )
}
