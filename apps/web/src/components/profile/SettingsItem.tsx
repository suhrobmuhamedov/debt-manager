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
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition duration-200 active:scale-[0.98] ${
        danger
          ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300'
          : 'border-gray-300 bg-white/90 text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800/90 dark:text-white dark:hover:bg-gray-700'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {rightElement ?? <ChevronRight className="h-4 w-4" />}
      </span>
    </button>
  );
};
