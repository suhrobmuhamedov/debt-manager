import { useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { useAuthStore } from '../store/authStore';
import { isTelegram, getInitData, expandApp } from '../lib/telegram';

export const useAuth = () => {
  const { setUser, setLoading, isAuthenticated, isLoading } = useAuthStore();
  const mutateRef = useRef<any>(null);
  const startedRef = useRef(false);

  const telegramLogin = trpc.auth.telegramLogin.useMutation({
    onSuccess: (user) => {
      setUser(user as any);
      setLoading(false);
    },
    onError: (error) => {
      console.error('Auth error:', error);
      setUser(null);
      setLoading(false);
    },
  });

  mutateRef.current = telegramLogin.mutate;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!isTelegram()) {
      setUser(null);
      setLoading(false);
      return;
    }

    expandApp();
    const initData = getInitData();

    if (!initData || initData === '') {
      console.error('No initData from Telegram');
      setUser(null);
      setLoading(false);
      return;
    }

    console.log('Sending initData to server...');
    mutateRef.current({ initData });
  }, []);

  return { isAuthenticated, isLoading, isTelegram: isTelegram() };
};