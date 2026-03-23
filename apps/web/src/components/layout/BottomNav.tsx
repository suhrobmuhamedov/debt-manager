import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export const BottomNav = () => {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.home'), icon: '🏠' },
    { path: '/debts', label: t('nav.debts'), icon: '💳' },
    { path: '/contacts', label: t('nav.contacts'), icon: '👥' },
    { path: '/profile', label: t('nav.profile'), icon: '👤' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/6 bg-[rgba(255,255,255,0.75)] px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] backdrop-blur-[24px] backdrop-saturate-[180%] dark:border-white/8 dark:bg-[rgba(12,12,22,0.80)]">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 ${
                  isActive
                    ? 'text-[#3b82f6] dark:text-[#3b82f6]'
                    : 'text-black/45 dark:text-white/45'
                }`}
              >
                <span className="text-2xl leading-none">{item.icon}</span>
                <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
