import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'colored';
}

export const GlassCard = ({ children, className, variant = 'light', ...props }: GlassCardProps) => {
  const variants = {
    light: 'bg-white/6 border-white/15 shadow-xl dark:bg-black/15 dark:border-white/8 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]',
    dark: 'bg-black/15 border-white/8 shadow-xl text-white',
    colored: 'bg-gradient-to-br from-blue-400/15 to-purple-400/15 border-white/20 shadow-xl',
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