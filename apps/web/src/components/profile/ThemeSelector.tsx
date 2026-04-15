import { Monitor, MoonStar, Palette, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ThemeMode } from "../../lib/theme"
import { GlassCard } from "../ui/GlassCard"

type ThemeSelectorProps = {
  current: ThemeMode
  onChange: (theme: ThemeMode) => void
}

export const ThemeSelector = ({ current, onChange }: ThemeSelectorProps) => {
  const { t } = useTranslation()

  const options: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: "light", label: t("profile.light"), icon: Sun },
    { value: "dark", label: t("profile.dark"), icon: MoonStar },
    { value: "system", label: t("profile.system"), icon: Monitor },
  ]

  return (
    <GlassCard className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Palette className="size-4 text-[color:var(--muted-foreground)]" />
        <h2 className="text-sm font-semibold text-[color:var(--foreground)]">{t("profile.theme")}</h2>
      </div>

      <div className="selector-grid cols-3">
        {options.map((option) => {
          const Icon = option.icon

          return (
            <button
              key={option.value}
              type="button"
              className="selector-option"
              data-active={current === option.value}
              onClick={() => onChange(option.value)}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Icon className="size-3.5" />
                <span>{option.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
