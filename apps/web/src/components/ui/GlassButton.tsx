import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GlassButtonVariant = 'primary' | 'danger' | 'success';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: GlassButtonVariant;
}

export const GlassButton = ({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: GlassButtonProps) => {
  const variants = {
    primary: 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-400/25 text-blue-950 dark:text-blue-200 shadow-lg shadow-blue-500/8 hover:shadow-blue-500/15',
    danger: 'bg-red-500/15 hover:bg-red-500/25 border-red-400/25 text-red-950 dark:text-red-200 shadow-lg shadow-red-500/8 hover:shadow-red-500/15',
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/25 text-emerald-950 dark:text-emerald-200 shadow-lg shadow-emerald-500/8 hover:shadow-emerald-500/15',
  };

  return (
    <button
      type={type}
      className={cn(
        'rounded-xl border px-6 py-3 font-semibold backdrop-blur-lg transition-[transform,background-color,border-color,box-shadow,color] duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};