import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

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
        return 'border-emerald-300/70 bg-emerald-50/40 backdrop-blur-2xl dark:border-emerald-600/40 dark:bg-emerald-950/25';
      case 'warning':
        return 'border-amber-300/70 bg-amber-50/40 backdrop-blur-2xl dark:border-amber-600/40 dark:bg-amber-950/25';
      case 'danger':
        return 'border-rose-300/70 bg-rose-50/40 backdrop-blur-2xl dark:border-rose-600/40 dark:bg-rose-950/25';
      default:
        return 'border-white/60 bg-white/35 backdrop-blur-2xl dark:border-white/25 dark:bg-slate-900/35';
    }
  };

  return (
    <Card
      className={`${getVariantStyles()} ${className || ''} rounded-2xl transition-all hover:shadow-xl ${onClick ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0' : ''}`}
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-slate-500 dark:text-slate-300">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </div>
        {subtitle && (
          <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">
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
    </Card>
  );
};