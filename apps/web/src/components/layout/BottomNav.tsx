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
    <div className="safe-area-pb fixed bottom-0 left-0 right-0 z-40 border-t border-white/20 bg-white/80 px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto flex h-[64px] max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-400'
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
