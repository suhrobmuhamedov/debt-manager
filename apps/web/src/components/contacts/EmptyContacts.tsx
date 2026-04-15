import { UsersRound } from "lucide-react"
import { useTranslation } from "react-i18next"

import { GlassButton } from "../ui/GlassButton"
import { GlassCard } from "../ui/GlassCard"

type EmptyContactsProps = {
  hasSearch: boolean
  onAddClick: () => void
}

export const EmptyContacts = ({ hasSearch, onAddClick }: EmptyContactsProps) => {
  const { t } = useTranslation()

  return (
    <GlassCard className="border-dashed border-[color:var(--border)] p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
        <UsersRound className="size-7" />
      </div>
      <h3 className="text-base font-semibold text-[color:var(--foreground)]">
        {hasSearch ? t("contacts.searchEmpty") : t("contacts.empty")}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
        {hasSearch ? t("contacts.searchHint") : t("contacts.emptyHint")}
      </p>
      {!hasSearch ? (
        <GlassButton variant="glass" className="mt-4" onClick={onAddClick}>
          + {t("contacts.add")}
        </GlassButton>
      ) : null}
    </GlassCard>
  )
}
