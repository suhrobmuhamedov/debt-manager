import { Link, useLocation } from 'wouter';
import { Button } from '../ui/button';

const navItems = [
  { path: '/', label: 'Bosh sahifa', icon: '🏠' },
  { path: '/debts', label: 'Qarzlar', icon: '💳' },
  { path: '/contacts', label: 'Kontaktlar', icon: '👥' },
  { path: '/profile', label: 'Profil', icon: '👤' },
];

export const BottomNav = () => {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
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
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
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
