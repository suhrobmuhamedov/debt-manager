import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'colored';
}

export const GlassCard = ({ children, className, variant = 'light' }: GlassCardProps) => {
  const variants = {
    light: 'bg-white/10 border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:bg-black/20 dark:border-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]',
    dark: 'bg-black/20 border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white',
    colored: 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-white/30 shadow-[0_8px_32px_0_rgba(59,130,246,0.18)]',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow] duration-300 hover:scale-[1.02] active:scale-[0.98]',
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
};