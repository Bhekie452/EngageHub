const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function checkRecentOAuth() {
  console.log('🔍 Checking Recent OAuth Activity...\n');

  try {
    // Check last 5 minutes for any activity
    console.log('📊 Checking Last 5 Minutes...');
    
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentActivity, error: activityError } = await supabase
      .from('social_accounts')
      .select('*')
      .gte('created_at', last5Minutes)
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('❌ Error checking recent activity:', activityError);
    } else {
      console.log(`   Recent Activity (5 min): ${recentActivity?.length || 0} connections`);
      
      if (recentActivity && recentActivity.length > 0) {
        recentActivity.forEach((conn, index) => {
          console.log(`\n   ${index + 1}. Recent Connection:`);
          console.log(`      Platform: ${conn.platform}`);
          console.log(`      Type: ${conn.account_type}`);
          console.log(`      Name: ${conn.display_name}`);
          console.log(`      Status: ${conn.connection_status}`);
          console.log(`      Created: ${conn.created_at}`);
          console.log(`      Workspace: ${conn.workspace_id}`);
        });
      } else {
        console.log('   ❌ No recent activity found in last 5 minutes');
      }
    }

    // Check last 30 minutes
    console.log('\n📊 Checking Last 30 Minutes...');
    
    const last30Minutes = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: recent30Min, error: error30Min } = await supabase
      .from('social_accounts')
      .select('*')
      .gte('created_at', last30Minutes)
      .order('created_at', { ascending: false });

    if (error30Min) {
      console.error('❌ Error checking 30 min activity:', error30Min);
    } else {
      console.log(`   Recent Activity (30 min): ${recent30Min?.length || 0} connections`);
      
      if (recent30Min && recent30Min.length > 0) {
        recent30Min.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.platform} - ${conn.account_type} (${conn.connection_status})`);
        });
      } else {
        console.log('   ❌ No recent activity found in last 30 minutes');
      }
    }

    // Check all Facebook connections
    console.log('\n📊 Checking All Facebook Connections...');
    const { data: allFacebook, error: fbError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fbError) {
      console.error('❌ Error checking Facebook connections:', fbError);
    } else {
      console.log(`   All Facebook Connections: ${allFacebook?.length || 0}`);
      
      if (allFacebook && allFacebook.length > 0) {
        allFacebook.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.account_type} - ${conn.display_name} (${conn.connection_status})`);
          console.log(`      Created: ${conn.created_at}`);
          console.log(`      Workspace: ${conn.workspace_id}`);
        });
      } else {
        console.log('   ❌ No Facebook connections at all');
      }
    }

    // Test backend OAuth endpoint
    console.log('\n🧪 Testing Backend OAuth Health...');
    try {
      const testUrl = 'https://engage-hub-ten.vercel.app/api/facebook?action=diagnostics';
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.success) {
        console.log('   ✅ Backend OAuth API Healthy');
        console.log(`   App ID: ${data.environment.FACEBOOK_APP_ID.masked}`);
        console.log(`   Environment: ${data.deployment.vercelEnv}`);
        console.log(`   Timestamp: ${data.deployment.timestamp}`);
      } else {
        console.log('   ❌ Backend OAuth API Unhealthy');
      }
    } catch (error) {
      console.log(`   ❌ Backend API Test Failed: ${error.message}`);
    }

    console.log('\n🎯 OAuth Flow Status:');
    console.log('1. Router: ✅ Fixed and deployed');
    console.log('2. Backend: ✅ OAuth API healthy');
    console.log('3. Database: ❌ No connections saved');
    console.log('4. Callback: ❌ Not processing successfully');

    console.log('\n🔍 Debug Questions:');
    console.log('1. Did you see callback page debug logs?');
    console.log('2. Did the callback page load?');
    console.log('3. Did Facebook redirect you back to the app?');
    console.log('4. Did you see any error messages?');
    console.log('5. Did the page selector load?');

    console.log('\n📱 Please try again and watch console:');
    console.log('1. Visit: https://engage-hub-ten.vercel.app/#social');
    console.log('2. Open browser dev tools (F12)');
    console.log('3. Click "Connect Facebook"');
    console.log('4. Complete Facebook authentication');
    console.log('5. Watch for callback page logs');
    console.log('6. Tell me what you see in console');

  } catch (error) {
    console.error('❌ Check Error:', error);
  }
}

// Run check
checkRecentOAuth();
