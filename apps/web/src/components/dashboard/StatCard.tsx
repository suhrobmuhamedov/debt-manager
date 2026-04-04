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
        return 'bg-[var(--debt-given-light)] border-blue-400/20';
      case 'warning':
        return 'bg-amber-400/15 border-amber-300/30';
      case 'danger':
        return 'bg-[var(--debt-taken-light)] border-orange-300/30';
      default:
        return '';
    }
  };

  return (
    <GlassCard
      variant={variant === 'success' ? 'colored' : 'light'}
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-2.5">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-sm text-slate-500 dark:text-slate-300">
              {icon}
            </div>
          )}
        </div>
        {subtitle ? (
          <span className="rounded-full border border-slate-300/70 bg-white/65 px-2 py-0.5 text-[11px] font-semibold text-slate-700 backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-slate-200">
            {subtitle}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pb-2.5 pt-0">
        <div className="numeric-text text-xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-2xl">
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