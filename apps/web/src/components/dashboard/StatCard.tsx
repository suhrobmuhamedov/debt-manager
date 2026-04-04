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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-3">
        <CardTitle className="text-xs font-medium leading-none text-slate-700 dark:text-slate-200 sm:text-sm">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-sm text-slate-500 dark:text-slate-300 sm:text-base">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="numeric-text mb-0.5 text-lg font-bold leading-none text-slate-900 dark:text-white sm:text-xl">
          {value}
        </div>
        {subtitle && (
          <p className="mb-1 text-[11px] leading-4 text-slate-600 dark:text-slate-300 sm:text-xs">
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