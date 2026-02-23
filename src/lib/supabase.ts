import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if Supabase is configured
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url-here' || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('⚠️ Supabase not configured. Please add your credentials to .env.local');
}

// Create Supabase client (will use placeholder if not configured)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
