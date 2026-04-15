import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Language } from "../../store/settingsStore"
import { GlassCard } from "../ui/GlassCard"

type LanguageSelectorProps = {
  current: Language
  onChange: (language: Language) => void
}

export const LanguageSelector = ({ current, onChange }: LanguageSelectorProps) => {
  const { t } = useTranslation()

  const options: Array<{ value: Language; label: string }> = [
    { value: "uz", label: t("profile.uzbek") },
    { value: "ru", label: t("profile.russian") },
  ]

  return (
    <GlassCard className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Globe className="size-4 text-[color:var(--muted-foreground)]" />
        <h2 className="text-sm font-semibold text-[color:var(--foreground)]">{t("profile.language")}</h2>
      </div>

      <div className="selector-grid cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="selector-option"
            data-active={current === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}
