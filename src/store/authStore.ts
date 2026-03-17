import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAdmin: false,
  setUser: (user) => set({ 
    user, 
    isAdmin: user?.user_metadata?.role === 'admin' || false 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAdmin: false }),
}));
