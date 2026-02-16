// Debug TikTok Connection Process
console.log('🔍 Debugging TikTok Connection Process...\n');

async function debugTikTokConnection() {
  try {
    // Step 1: Check if we have authorization code in URL
    console.log('🔍 Step 1: Checking for authorization code...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    console.log('📊 URL Parameters:');
    console.log('   Code:', authCode ? '✅ Present' : '❌ Missing');
    console.log('   State:', state || 'None');
    console.log('   Error:', error || 'None');
    
    if (error) {
      console.log('❌ OAuth Error:', error);
      return;
    }
    
    if (!authCode) {
      console.log('❌ No authorization code found in URL');
      console.log('💡 If you just authorized, the code should be in the URL');
      console.log('🔄 Try authorizing again with the correct redirect URI');
      return;
    }
    
    console.log('✅ Authorization code found:', authCode.substring(0, 20) + '...');
    
    // Step 2: Check if backend callback is being called
    console.log('\n🔄 Step 2: Testing backend callback...');
    
    try {
      // Test if the callback endpoint exists
      const callbackTest = await fetch('/api/tiktok-callback?test=true');
      console.log('📡 Callback endpoint status:', callbackTest.status);
      
      if (callbackTest.ok) {
        console.log('✅ TikTok callback endpoint is available');
      } else {
        console.log('❌ TikTok callback endpoint not found');
        console.log('💡 The callback endpoint needs to be deployed');
      }
    } catch (e) {
      console.log('❓ Could not test callback endpoint:', e.message);
    }
    
    // Step 3: Manual token exchange test
    console.log('\n🧪 Step 3: Testing manual token exchange...');
    
    console.log('📋 Required for token exchange:');
    console.log('   ✅ Authorization Code:', authCode.substring(0, 20) + '...');
    console.log('   ✅ Client Key: sbawvd31u17vw8ajd3');
    console.log('   ❓ Client Secret: [Needs to be in environment]');
    console.log('   ✅ Redirect URI: https://engage-hub-ten.vercel.app');
    console.log('   ✅ Grant Type: authorization_code');
    
    // Step 4: Check environment variables
    console.log('\n� Step 4: Checking environment setup...');
    
    console.log('📋 Required Environment Variables:');
    console.log('   ❓ TIKTOK_CLIENT_SECRET: [Check if set]');
    console.log('   ✅ SUPABASE_URL: [Should be set]');
    console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY: [Should be set]');
    
    // Step 5: Instructions for fixing the connection
    console.log('\n🎯 Step 5: Fixing the connection...');
    
    console.log('� To complete TikTok connection:');
    console.log('1. ✅ You have the authorization code');
    console.log('2. 🔄 The backend needs to exchange this code for an access token');
    console.log('3. 💾 The access token needs to be saved to the database');
    console.log('4. 🔄 The UI needs to update to show "Connected"');
    
    console.log('\n💡 Next Steps:');
    console.log('1. Make sure TIKTOK_CLIENT_SECRET is set in environment variables');
    console.log('2. Deploy the callback endpoint (/api/tiktok-callback.js)');
    console.log('3. Update your TikTok redirect URI to: https://engage-hub-ten.vercel.app');
    console.log('4. Try the OAuth flow again');
    
    // Step 6: Try to trigger manual callback
    console.log('\n� Step 6: Attempting manual callback...');
    
    try {
      const manualCallback = await fetch('/api/tiktok-callback?' + new URLSearchParams({
        code: authCode,
        state: state || 'manual'
      }));
      
      console.log('� Manual callback status:', manualCallback.status);
      
      if (manualCallback.redirected) {
        console.log('✅ Callback triggered redirect to:', manualCallback.url);
        console.log('🔄 Follow the redirect to complete connection');
      } else if (manualCallback.ok) {
        const result = await manualCallback.json();
        console.log('📊 Manual callback result:', result);
      } else {
        console.log('❌ Manual callback failed');
      }
    } catch (e) {
      console.log('❓ Manual callback error:', e.message);
      console.log('💡 The callback endpoint might not be deployed yet');
    }
    
    console.log('\n🎯 Summary:');
    console.log('='.repeat(50));
    console.log('✅ OAuth Flow: Authorization code received');
    console.log('❓ Backend Callback: Needs to be deployed');
    console.log('❓ Token Exchange: Depends on environment setup');
    console.log('❓ Connection Saved: Depends on callback success');
    
    console.log('\n� Quick Fix:');
    console.log('1. Add TIKTOK_CLIENT_SECRET to your environment variables');
    console.log('2. Deploy the /api/tiktok-callback.js endpoint');
    console.log('3. Try the TikTok connection again');
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugTikTokConnection();
