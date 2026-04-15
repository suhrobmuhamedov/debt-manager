import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/src/routers/index';
import { useAuthStore } from '../store/authStore';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  console.log('VITE_SERVER_URL:', import.meta.env.VITE_SERVER_URL);
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  return 'http://localhost:3001';
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers: () => {
        const token = useAuthStore.getState().token;
        return token
          ? {
              'x-auth-token': token,
              Authorization: `Bearer ${token}`,
            }
          : {};
      },
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});
