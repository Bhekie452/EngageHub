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
      // Use a simple localStorage-backed adapter to avoid Navigator LockManager timeouts
      // (some browsers/platforms have issues acquiring the lock). This adapter implements
      // the minimal storage interface expected by supabase-js and avoids using the
      // LockManager API for cross-tab synchronization.
      storage: (typeof window !== 'undefined') ? {
        getItem: async (key: string) => {
          try { return localStorage.getItem(key); } catch { return null; }
        },
        setItem: async (key: string, value: string) => {
          try { localStorage.setItem(key, value); } catch { /* ignore */ }
        },
        removeItem: async (key: string) => {
          try { localStorage.removeItem(key); } catch { /* ignore */ }
        }
      } : undefined,
    },
  }
);
