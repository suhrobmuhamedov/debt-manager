import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { ThemeMode } from '../../lib/theme';

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
    <Card className="border-gray-300 bg-white/90 shadow-sm dark:border-gray-600 dark:bg-gray-800/90">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.theme')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800/80">
          {options.map((option) => {
            const active = current === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-700/80'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
