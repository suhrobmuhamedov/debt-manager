import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Language } from '../../store/settingsStore';

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
    <Card className="border-gray-300 bg-white/90 shadow-sm dark:border-gray-600 dark:bg-gray-800/90">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.language')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const active = current === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-400 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700'
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
