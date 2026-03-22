import { useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../store/authStore';
import { isTelegram, getInitData, expandApp } from '../lib/telegram';

export const useAuth = () => {
  const { setUser, setLoading, isAuthenticated, isLoading } = useAuthStore();
  const telegramLogin = trpc.auth.telegramLogin.useMutation();

  useEffect(() => {
    const authenticate = async () => {
      if (!isTelegram()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        expandApp();
        const initData = getInitData();
        if (!initData) {
          console.error('Auth error: empty initData');
          setUser(null);
          return;
        }

        const user = await telegramLogin.mutateAsync({ initData });
        setUser(user as any);
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, [setUser, setLoading, telegramLogin]);

  return { isAuthenticated, isLoading, isTelegram: isTelegram() };
};