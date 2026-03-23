import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  header?: ReactNode;
}

export const AppLayout = ({ children, showHeader = false, header }: AppLayoutProps) => {
  return (
    <div className="theme-smooth relative flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-[#0d0d0d] dark:text-white">
      <div className="app-bg" aria-hidden>
        <div className="app-bg-gradient" />
        <span className="app-blob blob-one" />
        <span className="app-blob blob-two" />
        <span className="app-blob blob-three" />
      </div>

      {showHeader && header && (
        <header className="relative z-10 border-b border-gray-300 bg-white/95 dark:border-white/15 dark:bg-[#121521]/90">
          {header}
        </header>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto pb-20">
        <div className="mx-auto max-w-md">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
