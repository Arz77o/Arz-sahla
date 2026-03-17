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
    // Check both user_metadata (set by user) and app_metadata (set server-side by Supabase)
    // app_metadata is more secure since it cannot be changed by the user themselves
    isAdmin: 
      user?.user_metadata?.role === 'admin' || 
      user?.app_metadata?.role === 'admin' || 
      false 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAdmin: false }),
}));
