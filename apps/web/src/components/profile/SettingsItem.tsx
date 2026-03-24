import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

type SettingsItemProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  rightElement?: ReactNode;
  danger?: boolean;
};

export const SettingsItem = ({ icon, label, onClick, rightElement, danger = false }: SettingsItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left backdrop-blur-md transition duration-200 active:scale-[0.98] ${
        danger
          ? 'border-red-400/35 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:border-red-700/35 dark:bg-red-950/25 dark:text-red-300'
          : 'border-white/35 bg-white/20 text-foreground hover:bg-white/25 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {rightElement ?? <ChevronRight className="h-4 w-4" />}
      </span>
    </button>
  );
};
