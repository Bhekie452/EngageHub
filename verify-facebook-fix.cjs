const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function verifyFacebookFix() {
  console.log('🔍 Verifying Facebook OAuth Fix...\n');

  try {
    // 1. Check if callback page is accessible
    console.log('🌐 Testing Callback Page Accessibility...');
    try {
      const callbackUrl = 'https://engage-hub-ten.vercel.app/pages/auth/facebook/callback';
      const response = await fetch(callbackUrl);
      console.log(`   Callback Page Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ Callback page is accessible');
      } else {
        console.log('   ❌ Callback page not accessible');
      }
    } catch (error) {
      console.log(`   ❌ Callback page test failed: ${error.message}`);
    }

    // 2. Check recent Facebook connections
    console.log('\n📊 Checking Recent Facebook Connections...');
    
    const last10Minutes = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: recentConnections, error: connectionError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .gte('created_at', last10Minutes)
      .order('created_at', { ascending: false });

    if (connectionError) {
      console.error('❌ Error checking connections:', connectionError);
    } else {
      console.log(`   Recent Facebook Connections (10 min): ${recentConnections?.length || 0}`);
      
      if (recentConnections && recentConnections.length > 0) {
        recentConnections.forEach((conn, index) => {
          console.log(`\n   ${index + 1}. Connection:`);
          console.log(`      ID: ${conn.id}`);
          console.log(`      Type: ${conn.account_type}`);
          console.log(`      Name: ${conn.display_name}`);
          console.log(`      Status: ${conn.connection_status}`);
          console.log(`      Created: ${conn.created_at}`);
          console.log(`      Workspace: ${conn.workspace_id}`);
          console.log(`      Token Length: ${conn.access_token?.length || 0}`);
          
          if (conn.platform_data) {
            const data = typeof conn.platform_data === 'string' 
              ? JSON.parse(conn.platform_data) 
              : conn.platform_data;
            console.log(`      Platform Data: ${Object.keys(data).join(', ')}`);
          }
        });
      } else {
        console.log('   ❌ No recent Facebook connections found');
      }
    }

    // 3. Check all Facebook connections
    console.log('\n📊 Checking All Facebook Connections...');
    const { data: allConnections, error: allError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error checking all connections:', allError);
    } else {
      console.log(`   Total Facebook Connections: ${allConnections?.length || 0}`);
      
      if (allConnections && allConnections.length > 0) {
        allConnections.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.account_type} - ${conn.display_name} (${conn.connection_status})`);
        });
      }
    }

    // 4. Test backend OAuth endpoint
    console.log('\n🧪 Testing Backend OAuth Endpoint...');
    try {
      const testUrl = 'https://engage-hub-ten.vercel.app/api/facebook?action=diagnostics';
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.success) {
        console.log('   ✅ Backend OAuth API Healthy');
        console.log(`   App ID: ${data.environment.FACEBOOK_APP_ID.masked}`);
        console.log(`   App Secret: ${data.environment.FACEBOOK_APP_SECRET.masked}`);
        console.log(`   Environment: ${data.deployment.vercelEnv}`);
        console.log(`   Region: ${data.deployment.region}`);
        console.log(`   Timestamp: ${data.deployment.timestamp}`);
      } else {
        console.log('   ❌ Backend OAuth API Unhealthy');
      }
    } catch (error) {
      console.log(`   ❌ Backend API Test Failed: ${error.message}`);
    }

    // 5. Test OAuth flow simulation
    console.log('\n🔄 Simulating OAuth Flow...');
    console.log('1. User clicks "Connect Facebook"');
    console.log('2. Frontend calls: /api/facebook?action=auth&workspaceId=xxx');
    console.log('3. Backend generates OAuth with redirect_uri: https://engage-hub-ten.vercel.app/pages/auth/facebook/callback');
    console.log('4. User authenticates with Facebook');
    console.log('5. Facebook redirects to: /pages/auth/facebook/callback?code=xxx&state=xxx');
    console.log('6. React Router loads: FacebookCallback component');
    console.log('7. Callback page extracts code/state and redirects to backend');
    console.log('8. Backend processes OAuth and stores connection');
    console.log('9. Backend redirects to: /select-facebook-pages');
    console.log('10. User selects pages and connection is saved');

    console.log('\n🎯 Verification Summary:');
    console.log('- Callback Page: Should now be accessible via React Router');
    console.log('- OAuth Flow: Should complete end-to-end');
    console.log('- Database: Should store Facebook connections');
    console.log('- Page Selection: Should show Facebook pages');
    console.log('- UI: Should display connected pages');

    console.log('\n📱 Test Instructions:');
    console.log('1. Visit: https://engage-hub-ten.vercel.app/#social');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Click "Connect Facebook"');
    console.log('4. Complete Facebook authentication');
    console.log('5. Watch for callback page logs');
    console.log('6. Verify page selector loads');
    console.log('7. Select and connect a Facebook page');
    console.log('8. Check Social Media UI for connected page');

  } catch (error) {
    console.error('❌ Verification Error:', error);
  }
}

// Run verification
verifyFacebookFix();
