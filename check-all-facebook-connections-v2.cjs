const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkAllFacebookConnections() {
  console.log('🔍 Checking ALL Facebook Connections Across All Workspaces...\n');

  try {
    // Get ALL Facebook connections regardless of workspace
    const { data: allConnections, error: allError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all connections:', allError);
      return;
    }

    console.log(`📊 Total Facebook Connections Found: ${allConnections?.length || 0}`);

    if (allConnections && allConnections.length > 0) {
      console.log('\n🔗 All Facebook Connections:');
      allConnections.forEach((conn, index) => {
        console.log(`\n${index + 1}. Connection Details:`);
        console.log(`   ID: ${conn.id}`);
        console.log(`   Workspace ID: ${conn.workspace_id}`);
        console.log(`   Account Type: ${conn.account_type}`);
        console.log(`   Account ID: ${conn.account_id}`);
        console.log(`   Display Name: ${conn.display_name}`);
        console.log(`   Connection Status: ${conn.connection_status}`);
        console.log(`   Is Active: ${conn.is_active}`);
        console.log(`   Connected By: ${conn.connected_by}`);
        console.log(`   Created At: ${conn.created_at}`);
        console.log(`   Token Length: ${conn.access_token?.length || 0} chars`);
        
        // Check token type
        if (conn.access_token) {
          console.log(`   Token Type: ${conn.access_token.substring(0, 4)}...`);
        }
        
        // Check platform data
        if (conn.platform_data) {
          const platformData = typeof conn.platform_data === 'string' 
            ? JSON.parse(conn.platform_data) 
            : conn.platform_data;
          
          if (platformData.pages && platformData.pages.length > 0) {
            console.log(`   Pages: ${platformData.pages.length} stored`);
            platformData.pages.forEach((page, i) => {
              console.log(`     ${i + 1}. ${page.pageName} (${page.pageId})`);
            });
          }
        }
        console.log('   ---');
      });

      // Group by workspace
      const workspaces = {};
      allConnections.forEach(conn => {
        if (!workspaces[conn.workspace_id]) {
          workspaces[conn.workspace_id] = [];
        }
        workspaces[conn.workspace_id].push(conn);
      });

      console.log('\n🏢 Connections by Workspace:');
      Object.keys(workspaces).forEach(workspaceId => {
        console.log(`\nWorkspace: ${workspaceId}`);
        const workspaceConnections = workspaces[workspaceId];
        workspaceConnections.forEach(conn => {
          console.log(`   - ${conn.account_type}: ${conn.display_name} (${conn.connection_status})`);
        });
      });

    } else {
      console.log('❌ No Facebook connections found in ANY workspace');
      console.log('💡 This means either:');
      console.log('   1. OAuth flow failed');
      console.log('   2. Connection was not saved to database');
      console.log('   3. You connected to a different app/instance');
      console.log('   4. There was a database error');
    }

    // Check recent activity
    console.log('\n⏰ Recent Activity (Last 24 Hours):');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentConnections, error: recentError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Error checking recent activity:', recentError);
    } else {
      console.log(`   Recent Connections: ${recentConnections?.length || 0}`);
      recentConnections?.forEach((conn, index) => {
        console.log(`   ${index + 1}. ${conn.display_name} - ${conn.created_at}`);
        console.log(`      Status: ${conn.connection_status}, Type: ${conn.account_type}`);
      });
    }

    // Check for any failed connections
    console.log('\n❌ Failed Connections:');
    const { data: failedConnections, error: failedError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .neq('connection_status', 'connected')
      .order('created_at', { ascending: false });

    if (failedError) {
      console.error('❌ Error checking failed connections:', failedError);
    } else {
      console.log(`   Failed Connections: ${failedConnections?.length || 0}`);
      failedConnections?.forEach((conn, index) => {
        console.log(`   ${index + 1}. ${conn.display_name} - ${conn.connection_status}`);
        console.log(`      Created: ${conn.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking all connections:', error);
  }
}

// Run the comprehensive check
checkAllFacebookConnections();
