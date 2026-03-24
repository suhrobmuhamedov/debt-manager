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
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30 text-blue-900 dark:text-blue-100',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-900 dark:text-red-100',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 text-emerald-900 dark:text-emerald-100',
  };

  return (
    <button
      type={type}
      className={cn(
        'rounded-xl border px-6 py-3 font-medium backdrop-blur-md transition-[transform,background-color,border-color,box-shadow,color] duration-200 active:scale-95 shadow-lg disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};