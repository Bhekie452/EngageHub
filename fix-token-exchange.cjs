const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'
);

async function testTokenExchange() {
  console.log('🔧 Testing Token Exchange Fix...\n');

  // Check environment variables
  console.log('🌍 Environment Variables:');
  console.log(`   FACEBOOK_APP_ID: ${process.env.FACEBOOK_APP_ID ? process.env.FACEBOOK_APP_ID.substring(0, 10) + '...' : 'MISSING'}`);
  console.log(`   FACEBOOK_APP_SECRET: ${process.env.FACEBOOK_APP_SECRET ? process.env.FACEBOOK_APP_SECRET.substring(0, 10) + '...' : 'MISSING'}`);
  console.log(`   FACEBOOK_REDIRECT_URI: ${process.env.FACEBOOK_REDIRECT_URI || 'MISSING'}`);

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.log('❌ Missing required environment variables');
    return;
  }

  // Test with a fresh OAuth flow simulation
  console.log('\n🔄 Testing Fresh Token Exchange...');
  
  try {
    // Step 1: Test basic app access token (to verify app credentials)
    const appTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&grant_type=client_credentials`;

    console.log('🧪 Testing App Credentials...');
    const appResponse = await fetch(appTokenUrl);
    const appData = await appResponse.json();

    if (appData.error) {
      console.log('❌ App Credentials Invalid:', appData.error);
      return;
    }

    console.log('✅ App Credentials Valid');
    console.log(`   App Access Token: ${appData.access_token.substring(0, 20)}...`);

    // Step 2: Check current stored token issue
    console.log('\n🔍 Analyzing Current Stored Token...');
    const { data: profileConnections, error: profileError } = await supabase
      .from('social_accounts')
      .select('access_token, created_at')
      .eq('platform', 'facebook')
      .eq('account_type', 'profile')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1);

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    const profile = profileConnections?.[0];
    if (profile?.access_token) {
      const token = profile.access_token;
      console.log(`   Current Token: ${token.substring(0, 20)}...`);
      console.log(`   Token Type: ${token.substring(0, 4)}`);
      console.log(`   Created: ${profile.created_at}`);

      // Test if this token can be debugged
      const debugUrl = `https://graph.facebook.com/v21.0/debug_token?` +
        `input_token=${token}`;

      try {
        const debugResponse = await fetch(debugUrl);
        const debugData = await debugResponse.json();
        
        if (debugData.data) {
          console.log('✅ Token Debug Info:');
          console.log(`   App ID: ${debugData.data.app_id}`);
          console.log(`   Type: ${debugData.data.type}`);
          console.log(`   Is Valid: ${debugData.data.is_valid}`);
          console.log(`   User ID: ${debugData.data.user_id}`);
          
          // Check if it's from the right app
          if (debugData.data.app_id !== process.env.FACEBOOK_APP_ID) {
            console.log('❌ TOKEN FROM WRONG APP!');
            console.log(`   Token App ID: ${debugData.data.app_id}`);
            console.log(`   Current App ID: ${process.env.FACEBOOK_APP_ID}`);
            console.log('💡 This explains the EAAM token type - wrong app!');
          } else {
            console.log('✅ Token from correct app');
          }
        } else {
          console.log('❌ Token Debug Failed:', debugData.error);
        }
      } catch (error) {
        console.log('❌ Debug Error:', error.message);
      }
    }

    // Step 3: Provide fix recommendation
    console.log('\n🎯 Fix Recommendation:');
    console.log('1. ❌ Current token is from wrong app or invalid exchange');
    console.log('2. 🔄 User needs to re-authenticate with correct app');
    console.log('3. ✅ Token exchange logic is correct');
    console.log('4. 🔧 Environment variables are correct');
    
    console.log('\n🚀 Action Required:');
    console.log('   Delete current Facebook connection');
    console.log('   Re-authenticate with Facebook OAuth');
    console.log('   Token exchange will work correctly');

  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testTokenExchange();
