import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from 'react-i18next';
import { applyTheme } from '../lib/theme';
import { trpc } from '../lib/trpc';
import { UserAvatarCard } from '../components/profile/UserAvatarCard';
import { StatsCard } from '../components/profile/StatsCard';
import { ThemeSelector } from '../components/profile/ThemeSelector';
import { LanguageSelector } from '../components/profile/LanguageSelector';
import { SettingsItem } from '../components/profile/SettingsItem';
import { AboutSheet } from '../components/profile/AboutSheet';
import { Bell, Info, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '../components/common/BackButton';

export const Profile = () => {
  const { user, logout } = useAuthStore();
  const [, navigate] = useLocation();
  const { language, theme, notificationsEnabled, setLanguage, setTheme, setNotifications } = useSettingsStore();
  const { t } = useTranslation();
  const [sheetMode, setSheetMode] = useState<'about' | 'privacy'>('about');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const statsQuery = trpc.dashboard.getStats.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.assign('/');
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  if (!user) {
    return (
      <AppLayout>
        <div className="p-4">
        <Card>
            <CardContent className="p-5 text-sm text-gray-500 dark:text-gray-400">
              {t('common.loading')}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div
        className="space-y-4 overflow-x-hidden p-4"
        style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, transparent)',
          color: 'var(--tg-theme-text-color, inherit)',
        }}
      >
        <div className="space-y-1">
          <BackButton fallback="/" label={t('common.back')} />
          <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.settingsDescription')}</p>
        </div>

        <UserAvatarCard user={user} language={language} />

        <StatsCard
          stats={statsQuery.data ? {
            totalGiven: statsQuery.data.totalGiven,
            totalTaken: statsQuery.data.totalTaken,
            overdueCount: statsQuery.data.overdueCount,
            paidCount: statsQuery.data.paidCount,
          } : undefined}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          onRetry={() => statsQuery.refetch()}
        />

        <ThemeSelector
          current={theme}
          onChange={(nextTheme) => {
            setTheme(nextTheme);
            applyTheme(nextTheme);
          }}
        />

        <LanguageSelector current={language} onChange={setLanguage} />

        <Card className="shadow-none">
          <CardContent className="space-y-3 p-0">
            <h2 className="px-1 text-sm font-semibold text-gray-900 dark:text-white">{t('profile.accountActions')}</h2>

            <SettingsItem
              icon={<Bell className="h-5 w-5" />}
              label={t('profile.notifications')}
              onClick={() => setNotifications(!notificationsEnabled)}
              rightElement={
                <span
                  className={`inline-flex min-w-16 justify-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    notificationsEnabled
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {notificationsEnabled ? t('profile.notificationsOn') : t('profile.notificationsOff')}
                </span>
              }
            />

            <SettingsItem
              icon={<Shield className="h-5 w-5" />}
              label={t('profile.privacyPolicy')}
              onClick={() => {
                setSheetMode('privacy');
                setSheetOpen(true);
              }}
            />

            <SettingsItem
              icon={<Info className="h-5 w-5" />}
              label={t('profile.about')}
              onClick={() => {
                setSheetMode('about');
                setSheetOpen(true);
              }}
            />

            <div className="transition-transform duration-200 hover:animate-[profile-shake_0.28s_ease-in-out]">
              <SettingsItem
                icon={<span aria-hidden>🚪</span>}
                label={t('profile.logout')}
                onClick={() => setLogoutDialogOpen(true)}
                danger
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-1 pb-2 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>{t('profile.appName')} v1.0.0</p>
          <p>{t('profile.madeInUzbekistan')}</p>
        </div>

        <AboutSheet open={sheetOpen} onOpenChange={setSheetOpen} mode={sheetMode} />

        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('profile.logoutConfirm')}</DialogTitle>
              <DialogDescription>{t('profile.logoutDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                {t('contacts.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? t('common.loading') : t('profile.logout')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};
