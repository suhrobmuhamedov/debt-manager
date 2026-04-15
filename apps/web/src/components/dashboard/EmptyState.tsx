import type { ReactNode } from "react"
import { WalletCards } from "lucide-react"

import { GlassButton } from "../ui/GlassButton"
import { Card, CardContent } from "../ui/card"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <Card className="border-dashed border-[color:var(--border)] bg-[color:var(--glass-bg)]">
      <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
          {icon ?? <WalletCards className="size-7" />}
        </div>
        <h3 className="mb-2 text-base font-semibold text-[color:var(--foreground)]">{title}</h3>
        <p className="mb-5 max-w-sm text-sm text-[color:var(--muted-foreground)]">{description}</p>
        {actionLabel && onAction ? <GlassButton onClick={onAction}>{actionLabel}</GlassButton> : null}
      </CardContent>
    </Card>
  )
}
