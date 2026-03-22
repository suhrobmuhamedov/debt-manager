import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TelegramOnly } from './TelegramOnly';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isAuthenticated, isLoading, isTelegram } = useAuth();

  if (!isTelegram) {
    return <TelegramOnly />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 text-center">
          Kirish amalga oshmadi. Iltimos qaytadan urinib ko'ring.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return <>{children}</>;
};