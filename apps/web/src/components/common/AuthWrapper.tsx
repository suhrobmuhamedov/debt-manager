import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TelegramOnly } from './TelegramOnly';
import { LoadingScreen } from './LoadingScreen';

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isAuthenticated, isLoading, isTelegram } = useAuth();

  // Show TelegramOnly if not in Telegram
  if (!isTelegram) {
    return <TelegramOnly />;
  }

  // Show loading screen while authenticating
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated but in Telegram, show loading (will handle auth failure)
  return <LoadingScreen />;
};