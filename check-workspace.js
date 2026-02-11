// 🔧 CHECK SPECIFIC WORKSPACE CONNECTIONS
// Check the workspace that was actually used in OAuth

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWorkspace(workspaceId) {
  console.log(`🔍 Checking Facebook connections for workspace: ${workspaceId}`);
  
  try {
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`📊 Found ${connections?.length || 0} Facebook connections:`);
    
    if (connections && connections.length > 0) {
      connections.forEach(conn => {
        console.log(`\n🔹 Connection ID: ${conn.id}`);
        console.log(`   Type: ${conn.account_type}`);
        console.log(`   Name: ${conn.display_name}`);
        console.log(`   Status: ${conn.connection_status}`);
        console.log(`   Token: ${conn.access_token ? '✅ Present' : '❌ Missing'}`);
        console.log(`   Created: ${conn.created_at}`);
        console.log(`   Pages: ${conn.platform_data?.pages?.length || 0} pages`);
      });
    } else {
      console.log('❌ No Facebook connections found for this workspace');
    }
    
    // Check OAuth codes table too
    const { data: codes, error: codesError } = await supabase
      .from('fb_used_codes')
      .select('*')
      .limit(5);
    
    if (codesError) {
      console.error('❌ Error checking codes:', codesError);
    } else {
      console.log(`\n🔐 OAuth codes in database: ${codes?.length || 0}`);
      codes.forEach(code => {
        console.log(`   - ${code.code_hash.substring(0, 10)}... (${code.used_at})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Check both workspaces
console.log('🔧 Checking Facebook connections...\n');

// Check the workspace from your OAuth
checkWorkspace('c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');

console.log('\n' + '='.repeat(50) + '\n');

// Check your original workspace
checkWorkspace('26caa666-2797-40f9-aa99-399be01d57eb');
