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
        return 'border-green-300 bg-green-50 dark:border-green-700/70 dark:bg-green-950/40';
      case 'warning':
        return 'border-yellow-300 bg-yellow-50 dark:border-yellow-700/70 dark:bg-yellow-950/40';
      case 'danger':
        return 'border-red-300 bg-red-50 dark:border-red-700/70 dark:bg-red-950/40';
      default:
        return 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800';
    }
  };

  return (
    <Card
      className={`${getVariantStyles()} ${className || ''} transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0' : ''}`}
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
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
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