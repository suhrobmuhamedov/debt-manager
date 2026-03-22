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
        setLoading(false);
        return;
      }

      try {
        expandApp();
        const initData = getInitData();

        const user = await Promise.race([
          telegramLogin.mutateAsync({ initData }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
          ),
        ]);

        setUser(user as any);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };

    authenticate();
  }, []);

  return { isAuthenticated, isLoading, isTelegram: isTelegram() };
};