// src/api/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  {
    // Server-side - we never want a persisted session or auth redirects
    auth: { persistSession: false },
  },
);
