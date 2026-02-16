// Direct TikTok OAuth Fix
console.log('🔧 DIRECT TIKTOK OAUTH FIX\n');

// Generate correct authorization URL with proper scopes
const config = {
  clientKey: 'sbawvd31u17vw8ajd3',
  redirectUri: 'https://engage-hub-ten.vercel.app',
  scopes: ['user.info.basic', 'video.publish'], // ✅ Both enabled in your sandbox
  responseType: 'code',
  state: 'tiktok_oauth_' + Date.now()
};

const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
  `client_key=${config.clientKey}` +
  `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
  `&response_type=${config.responseType}` +
  `&scope=${config.scopes.join('%20')}` +
  `&state=${config.state}`;

console.log('🔗 CORRECT TIKTOK AUTHORIZATION URL:');
console.log(authUrl);

console.log('\n📋 WHY THIS URL WORKS:');
console.log('✅ user.info.basic - Available in your Sandbox (Login Kit)');
console.log('✅ video.publish - Available in your Sandbox (Content Posting API)');
console.log('❌ video.upload - NOT available (caused invalid_scope error)');

console.log('\n📱 INSTRUCTIONS:');
console.log('1. ✅ Copy the URL above');
console.log('2. 🌐 Paste in browser address bar');
console.log('3. 📱 Login with your TikTok account');
console.log('4. ✅ Click "Continue" or "Authorize"');
console.log('5. 🔄 Should redirect to: https://engage-hub-ten.vercel.app');
console.log('6. 🎯 Check Social Media page for "CONNECTED" status');

console.log('\n🎯 EXPECTED RESULT:');
console.log('🎵 TikTok OAuth callback received');
console.log('✅ Authorization code received');
console.log('✅ Access token obtained successfully');
console.log('✅ User info obtained: @your_username');
console.log('✅ Connection saved successfully');
console.log('🔄 Redirecting to: /social-media?success=tiktok_connected');

// Copy to clipboard
if (navigator.clipboard) {
  navigator.clipboard.writeText(authUrl).then(() => {
    console.log('\n📋 URL copied to clipboard!');
  }).catch(() => {
    console.log('\n📋 Manual copy required');
  });
} else {
  console.log('\n📋 Manual copy required');
}

console.log('\n🚀 READY TO TEST!');
console.log('📱 Click the URL above or run: window.open("' + authUrl + '")');
