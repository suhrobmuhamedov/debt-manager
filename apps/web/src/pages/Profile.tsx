import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from 'react-i18next';
import { applyTheme } from '../lib/theme';
import { getAvatarColor, getInitials } from '../lib/contact-utils';
import { trpc } from '../lib/trpc';

export const Profile = () => {
  const { user, logout } = useAuthStore();
  const { language, theme, setLanguage, setTheme } = useSettingsStore();
  const { t } = useTranslation();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => {
      logout();
      window.location.reload();
    },
  });

  const themeOptions = [
    { key: 'light', label: `☀️ ${t('profile.light')}` },
    { key: 'dark', label: `🌙 ${t('profile.dark')}` },
    { key: 'system', label: `💻 ${t('profile.system')}` },
  ] as const;

  return (
    <AppLayout>
      <div className="space-y-4 p-4">
        <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full text-base font-bold ${getAvatarColor(`${user?.firstName || ''} ${user?.lastName || ''}`)}`}>
                {getInitials(`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('profile.userFallback'))}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('profile.userFallback')}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user?.username ? `@${user.username}` : t('profile.noUsername')}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.phone || t('profile.noPhone')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="space-y-3 py-4">
            <h2 className="text-sm font-semibold text-foreground">{t('profile.language')}</h2>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className={language === 'uz' ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300' : ''}
                onClick={() => setLanguage('uz')}
              >
                {t('profile.uzbek')}
              </Button>
              <Button
                variant="outline"
                className={language === 'ru' ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300' : ''}
                onClick={() => setLanguage('ru')}
              >
                {t('profile.russian')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="space-y-3 py-4">
            <h2 className="text-sm font-semibold text-foreground">{t('profile.theme')}</h2>
            <div className="grid grid-cols-1 gap-2">
              {themeOptions.map((option) => (
                <Button
                  key={option.key}
                  variant="outline"
                  className={theme === option.key ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300 justify-start' : 'justify-start'}
                  onClick={() => {
                    setTheme(option.key);
                    applyTheme(option.key);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('profile.appVersion')}</span>
              <span>v1.0.0</span>
            </div>
            <Button variant="destructive" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              {t('profile.logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
