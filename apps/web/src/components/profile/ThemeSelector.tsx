import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeMode } from '../../lib/theme';
import { GlassCard } from '../ui/GlassCard';

type ThemeSelectorProps = {
  current: ThemeMode;
  onChange: (theme: ThemeMode) => void;
};

export const ThemeSelector = ({ current, onChange }: ThemeSelectorProps) => {
  const { t } = useTranslation();
  const options: Array<{ value: ThemeMode; label: string }> = [
    { value: 'light', label: `☀️ ${t('profile.light')}` },
    { value: 'dark', label: `🌙 ${t('profile.dark')}` },
    { value: 'system', label: `💻 ${t('profile.system')}` },
  ];

  return (
    <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{t('profile.theme')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/30 bg-white/10 p-1 backdrop-blur-md dark:border-white/20 dark:bg-white/5">
          {options.map((option) => {
            const active = current === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'border border-sky-400/30 bg-sky-500/20 text-sky-950 shadow-sm dark:text-sky-200'
                    : 'bg-transparent text-muted-foreground hover:bg-white/20 dark:hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
    </GlassCard>
  );
};
