import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// 🔥 CRITICAL: Validate environment variables
if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseServiceKey || supabaseServiceKey.includes('placeholder')) {
  console.error('❌ Supabase credentials not properly configured');
  console.error('Missing or invalid environment variables:');
  console.error('- SUPABASE_URL:', supabaseUrl ? '✅' : '❌ MISSING');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌ MISSING');
  
  // Don't create client with invalid credentials
  throw new Error('Supabase credentials not configured. Please check environment variables.');
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('✅ Supabase client initialized for API:', supabaseUrl.substring(0, 30) + '...');
