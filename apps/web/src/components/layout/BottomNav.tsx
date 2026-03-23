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
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white/98 px-4 py-2 backdrop-blur-sm dark:border-white/15 dark:bg-[#0d1018]/96">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive
                    ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white'
                    : 'text-black hover:text-blue-600 dark:text-white dark:hover:text-blue-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
