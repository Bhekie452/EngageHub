// 🔥 DISCONNECT FACEBOOK - Clear all Facebook connections
// Run this to remove all Facebook connections from database

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disconnectFacebook() {
  console.log('🔧 Disconnecting Facebook...');
  
  const workspaceId = '26caa666-2797-40f9-aa99-399be01d57eb';
  
  try {
    // Delete all Facebook connections for this workspace
    const { data, error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook');
    
    if (error) {
      console.error('❌ Error disconnecting:', error);
      return;
    }
    
    console.log('✅ Facebook connections disconnected!');
    console.log(`📋 Deleted ${data?.length || 0} connection(s)`);
    
    // Verify deletion
    const { data: remaining, error: checkError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook');
    
    if (checkError) {
      console.error('❌ Error checking:', checkError);
      return;
    }
    
    console.log(`📋 Remaining connections: ${remaining?.length || 0}`);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

disconnectFacebook();
