import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AppLayout } from '../components/layout/AppLayout';
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
import { Bell, ChevronDown, ChevronUp, Info, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '../components/common/BackButton';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { Input } from '../components/ui/input';
import { normalizePhone } from '../lib/contact-utils';

const UZ_PREFIX = '+998';

const getUzLocalDigits = (phone?: string | null): string => {
  if (!phone) {
    return '';
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    return digits.slice(3, 12);
  }

  return digits.slice(0, 9);
};

export const Profile = () => {
  const { user, logout, setUser } = useAuthStore();
  const [, navigate] = useLocation();
  const { language, theme, notificationsEnabled, setLanguage, setTheme, setNotifications } = useSettingsStore();
  const { t } = useTranslation();
  const [sheetMode, setSheetMode] = useState<'about' | 'privacy'>('about');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const statsQuery = trpc.dashboard.getStats.useQuery();
  const contactsQuery = trpc.contacts.getAll.useQuery();

  useEffect(() => {
    if (!user) {
      return;
    }
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setUsername(user.username || '');
    setPhoneLocal(getUzLocalDigits(user.phone));
  }, [user]);

  const navigateToDebts = (query: string) => {
    navigate(`/debts${query}`);
  };

  const navigateToContacts = () => {
    navigate('/contacts');
  };

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.assign('/');
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const updateProfileMutation = trpc.auth.updateMe.useMutation({
    onSuccess: (updated) => {
      setUser({ ...updated, token: user?.token });
      toast.success(t('contacts.savedSuccess'));
      setIsProfileEditOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || t('common.error'));
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      username: username.trim() || null,
      phone: normalizePhone(`${UZ_PREFIX}${phoneLocal}`) || null,
    });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="p-4">
          <GlassCard>
            <div className="p-5 text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 overflow-x-hidden p-4">
        <div className="space-y-2">
          <BackButton fallback="/" label={t('common.back')} />
          <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('profile.settingsDescription')}</p>
        </div>

        <UserAvatarCard user={user} language={language} />

        <GlassCard className="space-y-3">
          <button
            type="button"
            onClick={() => setIsProfileEditOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"
          >
            <h2 className="text-sm font-semibold text-foreground">{t('profile.profileInfo')}</h2>
            {isProfileEditOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {isProfileEditOpen ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t('profile.firstNameLabel')}</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('profile.firstNamePlaceholder')} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t('profile.lastNameLabel')}</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('profile.lastNamePlaceholder')} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t('profile.telegramUsernameLabel')}</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t('profile.phoneLabel')}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/95">
                    {UZ_PREFIX}
                  </span>
                  <Input
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="90 123 45 67"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={9}
                    className="pl-14"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{t('profile.telegramIdReadonly')}</label>
                <Input value={user.telegramId} disabled />
              </div>
              <GlassButton
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending || !firstName.trim()}
              >
                {updateProfileMutation.isPending ? t('common.loading') : t('contacts.save')}
              </GlassButton>
            </>
          ) : null}
        </GlassCard>

        <StatsCard
          stats={statsQuery.data ? {
            totalGiven: statsQuery.data.totalGiven,
            totalTaken: statsQuery.data.totalTaken,
            overdueCount: statsQuery.data.overdueCount,
            paidCount: statsQuery.data.paidCount,
          } : undefined}
          contactsCount={contactsQuery.data?.length ?? 0}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          onRetry={() => statsQuery.refetch()}
          onGivenClick={() => navigateToDebts('?type=given')}
          onTakenClick={() => navigateToDebts('?type=taken')}
          onOverdueClick={() => navigateToDebts('?tab=overdue')}
          onPaidClick={() => navigateToDebts('?status=paid')}
          onContactsClick={navigateToContacts}
        />

        <ThemeSelector
          current={theme}
          onChange={(nextTheme) => {
            setTheme(nextTheme);
            applyTheme(nextTheme);
          }}
        />

        <LanguageSelector current={language} onChange={setLanguage} />

        <GlassCard className="space-y-3">
          <h2 className="px-1 text-sm font-semibold text-foreground">{t('profile.accountActions')}</h2>

            <SettingsItem
              icon={<Bell className="h-5 w-5" />}
              label={t('profile.notifications')}
              onClick={() => setNotifications(!notificationsEnabled)}
              rightElement={
                <span
                  className={`inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md ${
                    notificationsEnabled
                      ? 'border-sky-400/30 bg-sky-500/20 text-sky-900 dark:text-sky-200'
                      : 'border-white/30 bg-white/20 text-muted-foreground dark:border-white/20 dark:bg-white/10'
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
        </GlassCard>

        <GlassCard className="space-y-1 pb-2 text-center text-xs text-muted-foreground">
          <p>{t('profile.appName')} v1.0.0</p>
          <p>{t('profile.madeInUzbekistan')}</p>
        </GlassCard>

        <AboutSheet open={sheetOpen} onOpenChange={setSheetOpen} mode={sheetMode} />

        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="border border-white/50 bg-white/70 backdrop-blur-2xl dark:border-white/20 dark:bg-slate-950/45">
            <DialogHeader>
              <DialogTitle>{t('profile.logoutConfirm')}</DialogTitle>
              <DialogDescription>{t('profile.logoutDescription')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                {t('contacts.cancel')}
              </Button>
              <GlassButton
                variant="danger"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? t('common.loading') : t('profile.logout')}
              </GlassButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};
