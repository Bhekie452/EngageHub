const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function debugOAuthAttempt() {
  console.log('🔍 Debugging OAuth Attempt...\n');

  try {
    // Check recent OAuth activity in last 2 minutes
    console.log('📊 Checking Very Recent OAuth Activity...');
    
    const last2Minutes = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: recentActivity, error: activityError } = await supabase
      .from('social_accounts')
      .select('*')
      .gte('created_at', last2Minutes)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityError) {
      console.error('❌ Error checking recent activity:', activityError);
    } else {
      console.log(`   Recent Activity (2 min): ${recentActivity?.length || 0} connections`);
      
      if (recentActivity && recentActivity.length > 0) {
        recentActivity.forEach((conn, index) => {
          console.log(`\n   ${index + 1}. Recent Connection:`);
          console.log(`      Platform: ${conn.platform}`);
          console.log(`      Type: ${conn.account_type}`);
          console.log(`      Name: ${conn.display_name}`);
          console.log(`      Status: ${conn.connection_status}`);
          console.log(`      Created: ${conn.created_at}`);
          console.log(`      Token Length: ${conn.access_token?.length || 0}`);
        });
      } else {
        console.log('   ❌ No recent activity found');
      }
    }

    // Check for any failed OAuth attempts
    console.log('\n❌ Checking for Failed OAuth Attempts...');
    
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
        });
      } else {
        console.log('   ❌ No Facebook connections at all');
      }
    }

    // Test backend OAuth processing directly
    console.log('\n🧪 Testing Backend OAuth Processing...');
    try {
      // Test the OAuth endpoint that should be called
      const testCode = 'test_code_' + Date.now();
      const testState = JSON.stringify({ 
        workspaceId: 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9',
        origin: 'https://engage-hub-ten.vercel.app/'
      });
      
      const testUrl = `https://engage-hub-ten.vercel.app/api/facebook?action=simple&code=${encodeURIComponent(testCode)}&state=${encodeURIComponent(testState)}`;
      
      console.log(`   Testing OAuth endpoint: ${testUrl.substring(0, 100)}...`);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   OAuth Endpoint Status: ${response.status}`);
      
      if (response.status === 400) {
        const errorData = await response.json();
        console.log('   ❌ OAuth Error Response:', errorData);
        
        if (errorData.message?.includes('redirect_uri')) {
          console.log('   🚨 Redirect URI Issue Detected!');
        }
        
        if (errorData.message?.includes('code')) {
          console.log('   🚨 Authorization Code Issue Detected!');
        }
      } else if (response.status === 200) {
        const successData = await response.json();
        console.log('   ✅ OAuth Endpoint Response:', successData);
      } else {
        console.log(`   ⚠️ Unexpected Response Status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ OAuth Endpoint Test Failed: ${error.message}`);
    }

    // Check what should happen in OAuth flow
    console.log('\n🔄 Expected OAuth Flow Debug:');
    console.log('1. User clicks "Connect Facebook"');
    console.log('2. Frontend calls: /api/facebook?action=auth&workspaceId=xxx');
    console.log('3. Backend generates OAuth URL with redirect_uri');
    console.log('4. User authenticates with Facebook');
    console.log('5. Facebook redirects to: /pages/auth/facebook/callback?code=xxx&state=xxx');
    console.log('6. React Router loads callback page');
    console.log('7. Callback page should show debug logs');
    console.log('8. Callback page redirects to: /api/facebook?action=simple&code=xxx&state=xxx');
    console.log('9. Backend should process OAuth and store connection');
    console.log('10. Backend should redirect to page selector');

    console.log('\n🎯 Debug Questions:');
    console.log('1. Did you see callback page debug logs?');
    console.log('2. Did the callback page load?');
    console.log('3. Did Facebook redirect you back to the app?');
    console.log('4. Did you see any error messages?');
    console.log('5. Did the page selector load?');

    console.log('\n📱 Manual Debug Steps:');
    console.log('1. Open browser dev tools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Clear network log');
    console.log('4. Click "Connect Facebook"');
    console.log('5. Watch for all network requests');
    console.log('6. Complete Facebook authentication');
    console.log('7. Watch for callback page load');
    console.log('8. Watch for backend OAuth request');
    console.log('9. Watch for page selector request');

  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
}

// Run debug
debugOAuthAttempt();
