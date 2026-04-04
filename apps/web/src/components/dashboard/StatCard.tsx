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
        return 'border-l-4 border-l-emerald-500 bg-emerald-50/85 dark:bg-emerald-900/20';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-50/85 dark:bg-amber-900/20';
      case 'danger':
        return 'border-l-4 border-l-rose-500 bg-rose-50/85 dark:bg-rose-900/20';
      default:
        return 'border-l-4 border-l-slate-300 bg-white/90 dark:bg-slate-900/25';
    }
  };

  return (
    <GlassCard
      variant="colored"
      className={`!rounded-2xl !p-0 border-slate-200/70 shadow-none backdrop-blur-none transition-none hover:scale-100 hover:shadow-none ${getVariantStyles()} ${className || ''} ${onClick ? 'cursor-pointer' : ''}`}
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-0.5 pt-1.5">
        <div className="flex items-center gap-1">
          <CardTitle className="text-[15px] font-semibold leading-none text-slate-700 dark:text-slate-200">
            {title}
          </CardTitle>
          {icon && (
            <div className="text-base leading-none text-slate-600 dark:text-slate-300">
              {icon}
            </div>
          )}
        </div>
        {subtitle ? (
          <span className="rounded-full border border-slate-300/70 bg-white/90 px-2.5 py-0.5 text-base font-semibold leading-none text-slate-700 dark:border-white/20 dark:bg-slate-800/80 dark:text-slate-200">
            {subtitle}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pb-1.5 pt-0">
        <div className="numeric-text text-[20px] font-extrabold leading-tight text-slate-900 dark:text-white sm:text-[22px]">
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