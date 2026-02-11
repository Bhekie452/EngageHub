// 🔧 CLEAR ALL DATABASE CODES
// Clean slate for fresh OAuth testing

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearCodes() {
  console.log('🧹 Clearing all OAuth codes from database...');
  
  try {
    const { data, error } = await supabase
      .from('fb_used_codes')
      .delete()
      .neq('code_hash', 'impossible_hash'); // Delete all
    
    if (error) {
      console.error('❌ Error clearing codes:', error);
      return;
    }
    
    console.log('✅ Cleared', data?.length || 0, 'OAuth codes');
    
    // Verify empty
    const { data: remaining, error: checkError } = await supabase
      .from('fb_used_codes')
      .select('count');
    
    if (checkError) {
      console.error('❌ Error checking:', checkError);
    } else {
      console.log('✅ Database is now clean:', remaining?.length || 0, 'codes remaining');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

clearCodes();
