import { useTranslation } from "react-i18next"

import { formatCurrency } from "../../lib/formatters"
import { formatPhone, getAvatarColor, getInitials } from "../../lib/contact-utils"
import { Badge } from "../ui/badge"
import { CardContent } from "../ui/card"
import { GlassButton } from "../ui/GlassButton"
import { GlassCard } from "../ui/GlassCard"

type ContactCardProps = {
  contact: {
    id: number
    name: string
    phone: string | null
    telegramUsername?: string | null
    activeDebtsCount: number
    totalAmount: number
  }
  onClick: (id: number) => void
  onAddDebt: (id: number) => void
}

export const ContactCard = ({ contact, onClick, onAddDebt }: ContactCardProps) => {
  const { t } = useTranslation()

  return (
    <GlassCard onClick={() => onClick(contact.id)} className="cursor-pointer p-3">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(contact.name)}`}
              aria-hidden
            >
              {getInitials(contact.name)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">{contact.name}</p>
              <p className="truncate text-xs text-[color:var(--muted-foreground)]">
                {contact.phone ? formatPhone(contact.phone) : t("contacts.noPhone")}
              </p>
              {contact.telegramUsername ? (
                <p className="truncate text-xs text-[color:var(--muted-foreground)]">@{contact.telegramUsername}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={contact.activeDebtsCount > 0 ? "destructive" : "secondary"}>
              {contact.activeDebtsCount} {t("contacts.activeDebts").toLowerCase()}
            </Badge>
            <p className="numeric-text text-xs font-medium text-[color:var(--muted-foreground)]">
              {formatCurrency(contact.totalAmount || 0, "UZS")}
            </p>
            <GlassButton
              type="button"
              variant="glass"
              className="h-8 px-3 py-0 text-xs"
              onClick={(event) => {
                event.stopPropagation()
                onAddDebt(contact.id)
              }}
            >
              + {t("debts.add")}
            </GlassButton>
          </div>
        </div>
      </CardContent>
    </GlassCard>
  )
}
