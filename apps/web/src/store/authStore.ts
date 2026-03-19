import { create } from 'zustand';

interface User {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
  languageCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({
    user: null,
    isAuthenticated: false,
  }),
}));
