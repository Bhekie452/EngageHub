// 🔧 FIND WHAT WORKSPACE ID OAUTH USED
// Check which workspace actually has Facebook connections

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findOAuthWorkspace() {
  console.log('🔍 Finding workspace with Facebook connections...');
  
  try {
    // Get ALL Facebook connections across all workspaces
    const { data: connections, error } = await supabase
      .from('social_accounts')
      .select('workspace_id, account_type, display_name, created_at')
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (!connections || connections.length === 0) {
      console.log('❌ No Facebook connections found anywhere');
      return;
    }
    
    console.log(`\n📊 Found ${connections.length} Facebook connections:`);
    
    // Group by workspace
    const workspaces = {};
    connections.forEach(conn => {
      const wsId = conn.workspace_id;
      if (!workspaces[wsId]) {
        workspaces[wsId] = [];
      }
      workspaces[wsId].push(conn);
    });
    
    console.log('\n🔑 Workspaces with Facebook connections:');
    Object.entries(workspaces).forEach(([wsId, conns]) => {
      console.log(`\n📁 Workspace: ${wsId}`);
      conns.forEach((conn, idx) => {
        console.log(`   ${idx + 1}. ${conn.display_name} (${conn.account_type})`);
      });
      console.log(`   Total: ${conns.length} connections`);
    });
    
    // Find most recent workspace
    const mostRecent = connections[0]; // Already ordered by created_at desc
    console.log(`\n🎯 Most recent connection: ${mostRecent.display_name} in workspace ${mostRecent.workspace_id}`);
    console.log(`\n💡 USE THIS WORKSPACE ID: ${mostRecent.workspace_id}`);
    
    return mostRecent.workspace_id;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

findOAuthWorkspace();
