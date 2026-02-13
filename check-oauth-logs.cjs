const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkOAuthLogs() {
  console.log('🔍 Checking OAuth Flow Logs...\n');

  try {
    // Check for any recent Facebook-related activity
    console.log('📊 Checking Recent Social Account Activity...');
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentSocial, error: socialError } = await supabase
      .from('social_accounts')
      .select('*')
      .gte('created_at', last24Hours)
      .order('created_at', { ascending: false });

    if (socialError) {
      console.error('❌ Error checking social accounts:', socialError);
    } else {
      console.log(`   Recent Social Accounts (24h): ${recentSocial?.length || 0}`);
      recentSocial?.forEach((account, index) => {
        console.log(`\n   ${index + 1}. ${account.platform} - ${account.account_type}`);
        console.log(`      ID: ${account.id}`);
        console.log(`      Name: ${account.display_name}`);
        console.log(`      Status: ${account.connection_status}`);
        console.log(`      Created: ${account.created_at}`);
        console.log(`      Workspace: ${account.workspace_id}`);
        console.log(`      Token Length: ${account.access_token?.length || 0}`);
        
        if (account.platform_data) {
          const data = typeof account.platform_data === 'string' 
            ? JSON.parse(account.platform_data) 
            : account.platform_data;
          console.log(`      Platform Data: ${Object.keys(data).join(', ')}`);
        }
      });
    }

    // Check for any failed connection attempts
    console.log('\n❌ Checking for Failed Connections...');
    const { data: failedConnections, error: failedError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .neq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(10);

    if (failedError) {
      console.error('❌ Error checking failed connections:', failedError);
    } else {
      console.log(`   Failed Connections: ${failedConnections?.length || 0}`);
      failedConnections?.forEach((conn, index) => {
        console.log(`\n   ${index + 1}. Failed Connection:`);
        console.log(`      Name: ${conn.display_name}`);
        console.log(`      Status: ${conn.connection_status}`);
        console.log(`      Created: ${conn.created_at}`);
        console.log(`      Error: ${conn.error_message || 'No error message'}`);
      });
    }

    // Check OAuth code usage tracking
    console.log('\n🔐 Checking OAuth Code Usage...');
    try {
      const { data: usedCodes, error: codesError } = await supabase
        .from('fb_used_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (codesError) {
        if (codesError.code === '42P01') {
          console.log('   ℹ️ fb_used_codes table does not exist');
        } else {
          console.error('   ❌ Error checking used codes:', codesError);
        }
      } else {
        console.log(`   Used OAuth Codes: ${usedCodes?.length || 0}`);
        usedCodes?.forEach((code, index) => {
          console.log(`\n   ${index + 1}. OAuth Code:`);
          console.log(`      Hash: ${code.code_hash}`);
          console.log(`      Created: ${code.created_at}`);
        });
      }
    } catch (error) {
      console.log('   ℹ️ Could not check fb_used_codes table');
    }

    // Check for any workspace activity
    console.log('\n🏢 Checking Workspace Activity...');
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: desc })
      .limit(5);

    if (workspaceError) {
      console.error('❌ Error checking workspaces:', workspaceError);
    } else {
      console.log(`   Total Workspaces: ${workspaces?.length || 0}`);
      workspaces?.forEach((workspace, index) => {
        console.log(`\n   ${index + 1}. Workspace:`);
        console.log(`      ID: ${workspace.id}`);
        console.log(`      Name: ${workspace.name}`);
        console.log(`      Owner: ${workspace.owner_id}`);
        console.log(`      Created: ${workspace.created_at}`);
      });
    }

    // Simulate what should happen in OAuth flow
    console.log('\n🔄 Expected OAuth Flow Steps:');
    console.log('1. User clicks "Connect Facebook"');
    console.log('2. Redirect to Facebook OAuth');
    console.log('3. User authenticates and grants permissions');
    console.log('4. Facebook redirects to callback with code');
    console.log('5. Backend exchanges code for tokens');
    console.log('6. Backend stores profile connection');
    console.log('7. Backend redirects to page selector');
    console.log('8. User selects page');
    console.log('9. Backend stores page connection');

    console.log('\n🎯 What to Check:');
    console.log('1. Browser console for JavaScript errors');
    console.log('2. Network tab for failed HTTP requests');
    console.log('3. Facebook OAuth redirect URL parameters');
    console.log('4. Meta App dashboard for OAuth events');
    console.log('5. Vercel logs for API errors');

    console.log('\n📱 Debug Steps:');
    console.log('1. Open browser dev tools (F12)');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Try OAuth in incognito mode');
    console.log('4. Check Meta App redirect URI settings');
    console.log('5. Verify required permissions are requested');

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  }
}

// Run log check
checkOAuthLogs();
