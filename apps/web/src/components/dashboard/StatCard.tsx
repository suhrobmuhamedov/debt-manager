import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { GlassCard } from '../ui/GlassCard';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className,
  onClick,
}: StatCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-l-4 border-l-emerald-500 bg-[var(--debt-given-light)] shadow-[inset_0_0_18px_rgba(16,185,129,0.08)]';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-400/12 shadow-[inset_0_0_18px_rgba(245,158,11,0.1)]';
      case 'danger':
        return 'border-l-4 border-l-rose-500 bg-[var(--debt-taken-light)] shadow-[inset_0_0_18px_rgba(244,63,94,0.08)]';
      default:
        return 'border-l-4 border-l-slate-300';
    }
  };

  return (
    <GlassCard
      variant="colored"
      className={`${getVariantStyles()} ${className || ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2.5 pb-0 pt-1">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-semibold leading-none text-slate-700 dark:text-slate-200">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-sm leading-none text-slate-600 dark:text-slate-300">
              {icon}
            </div>
          )}
        </div>
        {subtitle ? (
          <span className="rounded-full border border-slate-300/70 bg-white/70 px-2 py-0.5 text-xs font-semibold leading-none text-slate-700 backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-slate-200">
            {subtitle}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-2.5 pb-1 pt-0">
        <div className="numeric-text text-[19px] font-extrabold leading-tight text-slate-900 dark:text-white sm:text-[21px]">
          {value}
        </div>
        {trend && (
          <Badge
            variant={trend.isPositive ? 'default' : 'destructive'}
            className="mt-1.5 text-xs"
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Badge>
        )}
      </CardContent>
    </GlassCard>
  );
};