import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  header?: ReactNode;
}

export const AppLayout = ({ children, showHeader = false, header }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white flex flex-col transition-colors">
      {showHeader && header && (
        <header className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          {header}
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
