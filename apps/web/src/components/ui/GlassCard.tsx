import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'colored';
}

export const GlassCard = ({ children, className, variant = 'light', ...props }: GlassCardProps) => {
  const variants = {
    light: 'bg-white/10 border-white/20 shadow-2xl dark:bg-black/20 dark:border-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
    dark: 'bg-black/20 border-white/10 shadow-2xl text-white',
    colored: 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-white/30 shadow-2xl',
  };

  return (
    <div
      className={cn(
        'rounded-3xl border p-6 backdrop-blur-xl transition-[transform,background-color,border-color,box-shadow] duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};