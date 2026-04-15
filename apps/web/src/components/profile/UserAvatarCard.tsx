import { Phone } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatPhone, getInitials } from "../../lib/contact-utils"
import { Badge } from "../ui/badge"
import { GlassCard } from "../ui/GlassCard"

type User = {
  id: number
  telegramId: string
  firstName: string
  lastName?: string | null
  username?: string | null
  phone?: string | null
  languageCode?: string | null
  createdAt?: string | null
  photoUrl?: string | null
}

type UserAvatarCardProps = {
  user: User
  language: "uz" | "ru"
}

export const UserAvatarCard = ({ user, language }: UserAvatarCardProps) => {
  const { t } = useTranslation()
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || t("profile.userFallback")
  const joinedDate = user.createdAt
    ? new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(user.createdAt))
    : null

  return (
    <GlassCard className="overflow-hidden p-3">
      <div className="flex items-start gap-4">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={fullName}
            className="h-20 w-20 rounded-full object-cover ring-1 ring-[color:var(--glass-border)]"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[color:var(--foreground)] text-2xl font-semibold text-[color:var(--background)]">
            {getInitials(fullName)}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h1 className="truncate text-xl font-semibold text-[color:var(--foreground)]">{fullName}</h1>
            {user.username ? <p className="text-sm text-[color:var(--muted-foreground)]">@{user.username}</p> : null}
          </div>

          {user.phone ? (
            <a
              href={`tel:${user.phone}`}
              className="inline-flex items-center gap-2 text-sm text-[color:var(--foreground)]/90"
            >
              <Phone className="size-4 text-[color:var(--muted-foreground)]" />
              <span>{formatPhone(user.phone)}</span>
            </a>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="px-4 py-1 text-[11px]">
              ID: {user.telegramId}
            </Badge>
            {joinedDate ? (
              <span className="text-xs text-[color:var(--muted-foreground)]">
                {t("profile.joinedAt")}: {joinedDate}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
