// 🔧 TEST DATABASE GUARD
// Test if the fb_used_codes table is working properly

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDbGuard() {
  console.log('🔧 Testing database OAuth guard...');
  
  try {
    // Test 1: Insert a test code
    const testCode = 'test_oauth_code_' + Date.now();
    const hash = createHash('sha256')
      .update(testCode)
      .digest('hex')
      .substring(0, 32);
    
    console.log('📋 Test code hash:', hash);
    
    // Insert test code
    const { error: insertError } = await supabase
      .from('fb_used_codes')
      .insert({ code_hash: hash });
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    
    console.log('✅ Test code inserted successfully');
    
    // Test 2: Try to insert same code (should fail)
    const { error: duplicateError } = await supabase
      .from('fb_used_codes')
      .insert({ code_hash: hash });
    
    if (duplicateError?.code === '23505') {
      console.log('✅ Duplicate prevention working (error 23505)');
    } else {
      console.error('❌ Duplicate prevention failed:', duplicateError);
    }
    
    // Test 3: Check table contents
    const { data: codes, error: selectError } = await supabase
      .from('fb_used_codes')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Select failed:', selectError);
    } else {
      console.log('✅ Current codes in table:', codes?.length || 0);
      codes.forEach(code => {
        console.log(`  - ${code.code_hash.substring(0, 10)}... (${code.used_at})`);
      });
    }
    
    // Clean up test code
    const { error: deleteError } = await supabase
      .from('fb_used_codes')
      .delete()
      .eq('code_hash', hash);
    
    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test code cleaned up');
    }
    
    console.log('🎯 Database guard test complete!');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testDbGuard();
