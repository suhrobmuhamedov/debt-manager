import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

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
    <Card className="border-dashed dark:bg-gray-900 dark:border-gray-800">
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
          <Button onClick={onAction} className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};