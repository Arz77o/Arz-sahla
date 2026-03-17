import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

/**
 * useAuthInit — Initializes Supabase auth session on app mount.
 *
 * 🔑 Pattern: "Auth Bootstrap Hook"
 * This hook runs once when the app starts. It:
 * 1. Checks if there's already a logged-in session (e.g. from localStorage).
 * 2. Subscribes to auth state changes (login, logout, token refresh).
 *
 * Without this, the store never knows the user is logged in.
 */
export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Fetch global settings
    fetchSettings();
    
    // 1. Check for an existing session immediately on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen to future auth events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);
}
