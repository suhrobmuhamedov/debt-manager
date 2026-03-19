import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  header?: ReactNode;
}

export const AppLayout = ({ children, showHeader = false, header }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && header && (
        <header className="bg-white border-b border-gray-200">
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
