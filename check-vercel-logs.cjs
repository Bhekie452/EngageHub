const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkVercelLogs() {
  console.log('🔍 Checking Vercel Logs & OAuth Activity...\n');

  try {
    // Check database for any Facebook activity
    console.log('📊 Database Activity Check...');
    
    const { data: allFacebook, error: fbError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fbError) {
      console.error('❌ Database error:', fbError);
    } else {
      console.log(`   Total Facebook Connections: ${allFacebook?.length || 0}`);
      
      if (allFacebook && allFacebook.length > 0) {
        allFacebook.forEach((conn, index) => {
          console.log(`\n   ${index + 1}. Connection:`);
          console.log(`      ID: ${conn.id}`);
          console.log(`      Type: ${conn.account_type}`);
          console.log(`      Name: ${conn.display_name}`);
          console.log(`      Status: ${conn.connection_status}`);
          console.log(`      Created: ${conn.created_at}`);
          console.log(`      Workspace: ${conn.workspace_id}`);
        });
      } else {
        console.log('   ❌ No Facebook connections found in database');
      }
    }

    // Check for any social account activity (all platforms)
    console.log('\n🌐 All Social Account Activity...');
    const { data: allSocial, error: allError } = await supabase
      .from('social_accounts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error checking all social:', allError);
    } else {
      console.log(`   Total Social Connections: ${allSocial?.length || 0}`);
      
      if (allSocial && allSocial.length > 0) {
        console.log('\n   Recent Social Connections:');
        allSocial.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.platform} - ${conn.account_type} - ${conn.display_name}`);
          console.log(`      Status: ${conn.connection_status}, Created: ${conn.created_at}`);
        });
      }
    }

    // Test the OAuth callback endpoint directly
    console.log('\n🧪 Testing OAuth Callback Endpoint...');
    try {
      const callbackUrl = 'https://engage-hub-ten.vercel.app/api/facebook?action=simple';
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: 'test-workspace',
          code: 'test-code',
          state: 'test-state'
        })
      });
      
      const data = await response.json();
      console.log(`   OAuth Endpoint Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.log(`   OAuth Endpoint Error: ${error.message}`);
    }

    // Check production API health
    console.log('\n🏥 Production API Health Check...');
    try {
      const healthUrl = 'https://engage-hub-ten.vercel.app/api/facebook?action=diagnostics';
      const response = await fetch(healthUrl);
      const data = await response.json();
      
      if (data.success) {
        console.log('   ✅ Production API Healthy');
        console.log(`   App ID: ${data.environment.FACEBOOK_APP_ID.masked}`);
        console.log(`   App Secret: ${data.environment.FACEBOOK_APP_SECRET.masked}`);
        console.log(`   Environment: ${data.deployment.vercelEnv}`);
        console.log(`   Region: ${data.deployment.region}`);
        console.log(`   Timestamp: ${data.deployment.timestamp}`);
      } else {
        console.log('   ❌ Production API Unhealthy');
      }
    } catch (error) {
      console.log(`   ❌ API Health Check Failed: ${error.message}`);
    }

    // Simulate OAuth URL generation
    console.log('\n🔗 OAuth URL Analysis...');
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = encodeURIComponent('https://engage-hub-ten.vercel.app/pages/auth/facebook/callback');
    const scope = encodeURIComponent('email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts');
    const state = 'test-state-' + Date.now();
    
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&response_type=code` +
      `&state=${state}`;
    
    console.log(`   App ID: ${appId}`);
    console.log(`   Redirect URI: https://engage-hub-ten.vercel.app/pages/auth/facebook/callback`);
    console.log(`   Scope: email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts`);
    console.log(`   OAuth URL: ${oauthUrl.substring(0, 100)}...`);

    console.log('\n🎯 Debug Recommendations:');
    console.log('1. Check browser console for OAuth errors');
    console.log('2. Verify Meta App redirect URI settings');
    console.log('3. Check Vercel function logs');
    console.log('4. Test OAuth in incognito mode');
    console.log('5. Check network tab for failed requests');

    console.log('\n📱 Manual Debug Steps:');
    console.log('1. Open: https://engage-hub-ten.vercel.app/#social');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Click "Connect Facebook"');
    console.log('4. Watch Console and Network tabs');
    console.log('5. Complete Facebook authentication');
    console.log('6. Note any errors or redirects');

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  }
}

// Run log check
checkVercelLogs();
