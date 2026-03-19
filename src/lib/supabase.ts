import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

/**
 * Single Supabase client instance - reused across the app to avoid IndexedDB lock conflicts.
 *
 * ⚠️ IMPORTANT: Using the same client for admin operations is a workaround.
 * For production, implement proper Row Level Security (RLS) policies instead of separate clients.
 * Multiple clients cause IndexedDB lock conflicts and "AbortError: Lock broken" errors.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Re-export as supabaseAdmin for compatibility with existing code.
 * This MUST be the same client instance to avoid lock conflicts.
 * In production, use RLS policies instead of a separate admin client.
 */
export const supabaseAdmin = supabase;
