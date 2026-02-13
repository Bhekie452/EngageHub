const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function debugOAuthFlow() {
  console.log('🔍 Debugging OAuth Flow Issues...\n');

  try {
    // Check if there are any recent OAuth attempts
    console.log('🔍 Checking for Recent OAuth Activity...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentActivity, error: activityError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('❌ Error checking recent activity:', activityError);
    } else {
      console.log(`   Recent Activity (1 hour): ${recentActivity?.length || 0} connections`);
      recentActivity?.forEach((conn, index) => {
        console.log(`   ${index + 1}. ${conn.display_name} - ${conn.created_at}`);
        console.log(`      Status: ${conn.connection_status}, Type: ${conn.account_type}`);
      });
    }

    // Check OAuth code usage tracking
    console.log('\n🔍 Checking OAuth Code Usage...');
    const { data: usedCodes, error: codesError } = await supabase
      .from('fb_used_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (codesError) {
      console.log('   ℹ️ fb_used_codes table might not exist');
    } else {
      console.log(`   Used OAuth Codes: ${usedCodes?.length || 0}`);
      usedCodes?.forEach((code, index) => {
        console.log(`   ${index + 1}. ${code.code_hash} - ${code.created_at}`);
      });
    }

    // Check environment variables for OAuth
    console.log('\n🌍 OAuth Environment Check:');
    console.log(`   FACEBOOK_APP_ID: ${process.env.FACEBOOK_APP_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FACEBOOK_APP_SECRET: ${process.env.FACEBOOK_APP_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FACEBOOK_REDIRECT_URI: ${process.env.FACEBOOK_REDIRECT_URI || '❌ Missing'}`);

    // Test production OAuth endpoint
    console.log('\n🧪 Testing Production OAuth Endpoint...');
    try {
      const testUrl = `https://engage-hub-ten.vercel.app/api/facebook?action=diagnostics`;
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Production OAuth API Working');
        console.log(`   App ID: ${data.environment.FACEBOOK_APP_ID.masked}`);
        console.log(`   App Secret: ${data.environment.FACEBOOK_APP_SECRET.masked}`);
        console.log(`   Long Term Token: ${data.environment.FACEBOOK_LONG_TERM_TOKEN.masked}`);
      } else {
        console.log('❌ Production OAuth API Not Working');
      }
    } catch (error) {
      console.log('❌ Production API Test Failed:', error.message);
    }

    // Check what URL the user should use for OAuth
    console.log('\n🔗 Correct OAuth Flow:');
    console.log('1. Visit: https://engage-hub-ten.vercel.app/#social');
    console.log('2. Click: "Connect Facebook" button');
    console.log('3. OAuth URL should include:');
    console.log('   - client_id=' + (process.env.FACEBOOK_APP_ID || 'MISSING'));
    console.log('   - redirect_uri=https://engage-hub-ten.vercel.app/pages/auth/facebook/callback');
    console.log('   - scope=email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts');
    console.log('4. Complete Facebook authentication');
    console.log('5. Redirect to: /select-facebook-pages');
    console.log('6. Select page and complete connection');

    // Common OAuth issues
    console.log('\n⚠️ Common OAuth Issues:');
    console.log('1. ❌ Wrong redirect URI in Meta App settings');
    console.log('2. ❌ Missing required permissions');
    console.log('3. ❌ Browser blocking popup/redirect');
    console.log('4. ❌ Network timeout during OAuth');
    console.log('5. ❌ User cancels authentication');
    console.log('6. ❌ Meta App not in live mode');

    console.log('\n🎯 Debug Steps:');
    console.log('1. Check browser console for OAuth errors');
    console.log('2. Verify Meta App redirect URI settings');
    console.log('3. Check network tab for failed requests');
    console.log('4. Try OAuth in incognito mode');
    console.log('5. Check if you completed the Facebook login flow');

  } catch (error) {
    console.error('❌ Debug Error:', error);
  }
}

// Run debug
debugOAuthFlow();
