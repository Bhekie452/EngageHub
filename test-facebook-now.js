/**
 * Quick Facebook Connection Test - Run This Now
 */

console.log('🚀 QUICK FACEBOOK CONNECTION TEST');
console.log('================================');

// 1. Check if Facebook functions exist
console.log('🔍 Step 1: Checking Facebook functions...');
const hasFacebookFunctions = typeof handleConnectFacebook === 'function' && typeof loginWithFacebook === 'function';
console.log('Facebook functions available:', hasFacebookFunctions ? '✅ YES' : '❌ NO');

// 2. Check environment variables
console.log('🔍 Step 2: Checking environment...');
const env = {
  VITE_FACEBOOK_APP_ID: import.meta.env?.VITE_FACEBOOK_APP_ID || 'MISSING',
  FACEBOOK_APP_ID: 'FACEBOOK_APP_ID' in window ? 'PRESENT' : 'MISSING'
};
console.log('Environment:', env);

// 3. Check existing tokens
console.log('🔍 Step 3: Checking stored tokens...');
const fbToken = localStorage.getItem('facebook_access_token');
const fbPages = localStorage.getItem('facebook_pages');
const igToken = localStorage.getItem('instagram_access_token');

console.log('Facebook token:', fbToken ? '✅ FOUND' : '❌ NOT FOUND');
console.log('Facebook pages:', fbPages ? '✅ FOUND' : '❌ NOT FOUND');
console.log('Instagram token:', igToken ? '✅ FOUND' : '❌ NOT FOUND');

// 4. Test Facebook API call
console.log('🔍 Step 4: Testing Facebook API...');
if (fbToken) {
  fetch(`https://graph.facebook.com/v21.0/me?access_token=${fbToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.log('❌ Facebook API Error:', data.error);
      } else {
        console.log('✅ Facebook API Working - User:', data.name);
      }
    })
    .catch(error => {
      console.log('❌ Facebook API Call Failed:', error);
    });
}

// 5. Test Pages API call
console.log('🔍 Step 5: Testing Pages API...');
if (fbToken) {
  fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${fbToken}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.log('❌ Pages API Error:', data.error);
      } else {
        console.log('✅ Pages API Working - Found:', data.data?.length || 0, 'pages');
        if (data.data && data.data.length > 0) {
          console.log('📋 Pages:', data.data.map(p => p.name).join(', '));
        }
      }
    })
    .catch(error => {
      console.log('❌ Pages API Call Failed:', error);
    });
}

console.log('================================');
console.log('✅ TEST COMPLETE - Check results above');
console.log('💡 If anything shows ❌, that\'s your issue!');

// Auto-run
if (typeof window !== 'undefined') {
  console.log('🔄 Auto-running test...');
  // Test will run automatically when loaded in browser
}
