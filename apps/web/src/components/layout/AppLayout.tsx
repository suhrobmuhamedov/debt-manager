import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  header?: ReactNode;
}

export const AppLayout = ({ children, showHeader = false, header }: AppLayoutProps) => {
  return (
    <div className="theme-smooth relative flex min-h-screen flex-col text-gray-900 transition-colors dark:text-white">
      <div className="app-bg" aria-hidden>
        <div className="app-bg-gradient" />
        <span className="app-blob blob-one" />
        <span className="app-blob blob-two" />
        <span className="app-blob blob-three" />
      </div>

      {showHeader && header && (
        <header className="glass-surface relative z-10 rounded-b-[20px] border-b border-white/30 dark:border-white/10">
          {header}
        </header>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto pb-[90px]">
        <div className="mx-auto max-w-md">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
