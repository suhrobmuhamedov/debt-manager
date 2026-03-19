import { useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../store/authStore';
import { isTelegram, getInitData, expandApp } from '../lib/telegram';

export const useAuth = () => {
  const { setUser, setLoading, isAuthenticated, isLoading } = useAuthStore();
  const telegramLogin = trpc.auth.telegramLogin.useMutation();

  useEffect(() => {
    const authenticate = async () => {
      // Check if running in Telegram
      if (!isTelegram()) {
        setLoading(false);
        return;
      }

      try {
        // Get Telegram init data
        const initData = getInitData();
        if (!initData) {
          setLoading(false);
          return;
        }

        // Call login mutation
        const user = await telegramLogin.mutateAsync({ initData });

        if (user) {
          setUser(user);
          // Expand the app to full screen
          expandApp();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [setUser, setLoading, telegramLogin]);

  return {
    isAuthenticated,
    isLoading,
    isTelegram: isTelegram(),
  };
};