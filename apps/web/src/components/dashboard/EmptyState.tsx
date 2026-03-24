import { Card, CardContent } from '../ui/card';
import { GlassButton } from '../ui/GlassButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon = '📊',
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="text-6xl mb-4 opacity-50">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {description}
        </p>
        {actionLabel && onAction && (
          <GlassButton onClick={onAction}>
            {actionLabel}
          </GlassButton>
        )}
      </CardContent>
    </Card>
  );
};