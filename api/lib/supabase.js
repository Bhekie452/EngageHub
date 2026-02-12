import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    {
        // Server-side - we never want a persisted session or auth redirects
        auth: { persistSession: false },
    }
);
