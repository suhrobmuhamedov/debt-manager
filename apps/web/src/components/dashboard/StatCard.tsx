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
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-3 pb-1 pt-3 sm:px-4">
        <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300 sm:text-xs">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-base text-slate-500 dark:text-slate-300 sm:text-lg">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
        <div className="numeric-text text-2xl font-extrabold leading-none text-slate-900 dark:text-white sm:text-3xl">
          {value}
        </div>
        {subtitle && (
          <p className="text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
            {subtitle}
          </p>
        )}
        {trend && (
          <Badge
            variant={trend.isPositive ? 'default' : 'destructive'}
            className="text-xs"
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Badge>
        )}
      </CardContent>
    </GlassCard>
  );
};