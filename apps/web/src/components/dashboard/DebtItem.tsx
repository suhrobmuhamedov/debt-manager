import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency, formatRelativeDate } from '../../lib/formatters';

interface DebtItemProps {
  id: number;
  contactName: string;
  amount: number;
  currency: string | null;
  type: 'given' | 'taken';
  status: 'pending' | 'partial' | 'paid' | null;
  returnDate: string | null;
  onClick?: () => void;
}

export const DebtItem = ({
  contactName,
  amount,
  currency,
  type,
  status,
  returnDate,
  onClick
}: DebtItemProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="border-green-500 bg-green-600 text-white">To'langan</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="border-blue-500 bg-blue-600 text-white">Qisman</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-400 bg-amber-300 text-black">Kutilmoqda</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    return type === 'given' ? 'text-green-600' : 'text-red-600';
  };

  const isOverdue = returnDate && new Date(returnDate) < new Date() && status !== 'paid';

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isOverdue
          ? 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30'
          : 'border-gray-300 bg-white/90 dark:border-white/15 dark:bg-slate-900/75'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{contactName}</h3>
              {getStatusBadge()}
            </div>
            <div className={`text-lg font-semibold ${getTypeColor()}`}>
              {type === 'given' ? '+' : '-'}{formatCurrency(amount, currency || 'UZS')}
            </div>
            {returnDate && (
              <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                {isOverdue ? (
                  <span className="rounded-md bg-red-600 px-2 py-0.5 text-white font-medium">
                    Muddat o'tgan: {formatRelativeDate(returnDate)}
                  </span>
                ) : (
                  <span>Qaytarish: {formatRelativeDate(returnDate)}</span>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};