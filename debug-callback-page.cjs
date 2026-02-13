const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function debugCallbackPage() {
  console.log('🔍 Debugging Callback Page Issue...\n');

  try {
    // Check recent Facebook connections
    console.log('📊 Checking Recent Facebook Connections...');
    
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentConnections, error: connectionError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .gte('created_at', last5Minutes)
      .order('created_at', { ascending: false });

    if (connectionError) {
      console.error('❌ Error checking connections:', connectionError);
    } else {
      console.log(`   Recent Facebook Connections (5 min): ${recentConnections?.length || 0}`);
      
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
        });
      } else {
        console.log('   ❌ No recent Facebook connections found');
      }
    }

    // Check all Facebook connections
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

    // Test backend OAuth endpoint
    console.log('\n🧪 Testing Backend OAuth Endpoint...');
    try {
      const testUrl = 'https://engage-hub-ten.vercel.app/api/facebook?action=diagnostics';
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.success) {
        console.log('   ✅ Backend OAuth API Healthy');
        console.log(`   App ID: ${data.environment.FACEBOOK_APP_ID.masked}`);
        console.log(`   App Secret: ${data.environment.FACEBOOK_APP_SECRET.masked}`);
      } else {
        console.log('   ❌ Backend OAuth API Unhealthy');
      }
    } catch (error) {
      console.log(`   ❌ Backend API Test Failed: ${error.message}`);
    }

    // Simulate what should happen in callback
    console.log('\n🔄 Expected Callback Flow:');
    console.log('1. Facebook redirects to: /pages/auth/facebook/callback?code=xxx&state=xxx');
    console.log('2. Callback page loads and extracts code/state');
    console.log('3. Callback page redirects to: /api/facebook?action=simple&code=xxx&state=xxx');
    console.log('4. Backend processes OAuth and stores connection');
    console.log('5. Backend redirects to: /select-facebook-pages');
    console.log('6. User selects page and connection is saved');

    console.log('\n🎯 Debug Steps:');
    console.log('1. Check if callback page is actually loading');
    console.log('2. Check if callback page is redirecting to backend');
    console.log('3. Check backend logs for OAuth processing');
    console.log('4. Check if database insert is happening');
    console.log('5. Check if redirect to page selector is working');

    console.log('\n📱 Manual Debug:');
    console.log('1. Open browser dev tools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Click "Connect Facebook"');
    console.log('4. Watch for callback page load');
    console.log('5. Watch for redirect to /api/facebook?action=simple');
    console.log('6. Watch for redirect to /select-facebook-pages');

  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
}

// Run debug
debugCallbackPage();
