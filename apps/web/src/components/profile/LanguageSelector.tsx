import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../../store/settingsStore';
import { GlassCard } from '../ui/GlassCard';

type LanguageSelectorProps = {
  current: Language;
  onChange: (language: Language) => void;
};

export const LanguageSelector = ({ current, onChange }: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const options: Array<{ value: Language; label: string }> = [
    { value: 'uz', label: `🇺🇿 ${t('profile.uzbek')}` },
    { value: 'ru', label: `🇷🇺 ${t('profile.russian')}` },
  ];

  return (
    <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{t('profile.language')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const active = current === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-2xl border px-3 py-3 text-sm font-medium backdrop-blur-md transition-all duration-200 ${
                  active
                    ? 'border-sky-400/30 bg-sky-500/20 text-sky-950 dark:text-sky-200'
                    : 'border-white/35 bg-white/15 text-foreground hover:bg-white/20 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'
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
