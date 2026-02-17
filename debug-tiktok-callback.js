// Debug TikTok Callback - Test the exact flow
console.log('🔍 DEBUGGING TIKTOK OAUTH CALLBACK\n');

// Test 1: Check if we have the authorization code
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

console.log('📋 URL Parameters:');
console.log('  Code:', code ? code.substring(0, 20) + '...' : 'NOT FOUND');
console.log('  State:', state || 'NOT FOUND');

if (!code) {
  console.log('❌ No authorization code found in URL');
  console.log('💡 Please complete TikTok OAuth first');
  return;
}

if (state !== 'tiktok_oauth') {
  console.log('❌ Invalid state parameter:', state);
  console.log('💡 Expected: tiktok_oauth');
  return;
}

console.log('✅ OAuth callback detected correctly');

// Test 2: Check if code verifier is available
const codeVerifier = sessionStorage.getItem('tiktok_oauth_code_verifier');
const redirectUri = sessionStorage.getItem('tiktok_oauth_redirect_uri');

console.log('\n🔑 PKCE Data:');
console.log('  Code Verifier:', codeVerifier ? '✅ Found' : '❌ NOT FOUND');
console.log('  Redirect URI:', redirectUri || '❌ NOT FOUND');

if (!codeVerifier) {
  console.log('❌ Code verifier missing - this will cause token exchange to fail');
  console.log('💡 The code verifier was not stored during OAuth initiation');
  return;
}

// Test 3: Call the API directly
console.log('\n📡 Testing API call...');
console.log('  Endpoint: /api/oauth?provider=tiktok&action=token');
console.log('  Code:', code.substring(0, 20) + '...');
console.log('  Code Verifier:', codeVerifier.substring(0, 20) + '...');

// Make the exact same call as your app
fetch('/api/oauth?provider=tiktok&action=token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, redirectUri, codeVerifier })
})
.then(async response => {
  console.log('\n📊 API Response:');
  console.log('  Status:', response.status);
  console.log('  Status Text:', response.statusText);
  
  const data = await response.json();
  console.log('  Response Body:', data);
  
  if (response.ok && data.success) {
    console.log('\n🎉 SUCCESS! Token exchange worked!');
    console.log('✅ Access Token:', data.access_token ? '✅ Obtained' : '❌ Missing');
    console.log('✅ Refresh Token:', data.refresh_token ? '✅ Obtained' : '❌ Missing');
    console.log('✅ User Info:', data.user ? '✅ Obtained' : '❌ Missing');
    console.log('✅ Display Name:', data.user?.display_name || '❌ Missing');
    
    console.log('\n💡 If this test succeeded but your app still fails:');
    console.log('  1. Check if your app is calling the same endpoint');
    console.log('  2. Check browser network tab for the actual request');
    console.log('  3. Look for any JavaScript errors in console');
    
  } else {
    console.log('\n❌ Token exchange failed');
    console.log('  Error:', data.error || 'Unknown error');
    console.log('  Details:', data.details || 'No details provided');
    
    console.log('\n🔧 Common fixes:');
    if (data.details?.includes('expired')) {
      console.log('  - Code expired: Try OAuth again (codes expire quickly)');
    }
    if (data.details?.includes('redirect_uri')) {
      console.log('  - Redirect URI mismatch: Check TikTok app settings');
    }
    if (data.details?.includes('client')) {
      console.log('  - Client credentials: Check Vercel environment variables');
    }
  }
})
.catch(error => {
  console.error('\n💥 Network Error:', error);
  console.log('💡 This means the API endpoint is not reachable');
  console.log('  - Check if API is deployed: curl -X POST https://engage-hub-ten.vercel.app/api/oauth?provider=tiktok&action=token');
  console.log('  - Check if there are CORS issues');
  console.log('  - Check if your app is calling the right URL');
});

console.log('\n🔄 Debug script running...');
