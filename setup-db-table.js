// 🔧 CREATE fb_used_codes TABLE
// Run this to create the database table for OAuth code tracking

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTable() {
  console.log('🔧 Creating fb_used_codes table...');
  
  try {
    // Create the table using SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS fb_used_codes (
          code_hash TEXT PRIMARY KEY,
          used_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Optional: Add index for performance
        CREATE INDEX IF NOT EXISTS idx_fb_used_codes_used_at ON fb_used_codes(used_at);
      `
    });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      return;
    }
    
    console.log('✅ fb_used_codes table created successfully!');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('fb_used_codes')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table test failed:', testError);
    } else {
      console.log('✅ Table test passed - ready for OAuth codes!');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTable();
