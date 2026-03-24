import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '../ui/button';

type BackButtonProps = {
  fallback?: string;
  label?: string;
};

export const BackButton = ({ fallback = '/', label }: BackButtonProps) => {
  const [, navigate] = useLocation();

  const handleBack = () => {
    navigate(fallback);
  };

  return (
    <Button type="button" variant="ghost" className="h-9 gap-1.5 px-2" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4" />
      <span className="text-sm">{label ?? 'Back'}</span>
    </Button>
  );
};