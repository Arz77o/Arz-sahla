import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client (for admin pages only) - Note: In a real app, this should only be used server-side
// but the prompt specifies using it for admin pages.
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);
