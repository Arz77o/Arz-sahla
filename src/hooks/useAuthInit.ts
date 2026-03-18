import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { toast } from 'sonner';

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('is_active').eq('id', session.user.id).single();
        if (data && data.is_active === false) {
          await supabase.auth.signOut();
          setUser(null);
          toast.error('لقد تم حظر حسابك. يرجى التواصل مع الدعم للرجوع.');
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 2. Listen to future auth events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('is_active').eq('id', session.user.id).single();
        if (data && data.is_active === false) {
          await supabase.auth.signOut();
          setUser(null);
          toast.error('لقد تم حظر حسابك. يرجى التواصل مع الدعم.');
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);
}
