import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";

/**
 * useAuthInit — Initializes Supabase auth session on app mount.
 *
 * Simple & reliable: Just use Supabase auth without extra DB queries.
 * Database checks for is_active will be re-added after fixing the lock issues.
 */
export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    let mounted = true;

    // Fetch global settings
    fetchSettings();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      try {
        setUser(session?.user || null);
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    // Get current session immediately
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setUser(session?.user || null);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Session check error:", error);
        if (mounted) {
          setLoading(false);
        }
      });

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, fetchSettings]);
}
