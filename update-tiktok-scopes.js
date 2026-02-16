// Update TikTok Scopes to Match Available Scopes
console.log('🔧 UPDATING TIKTOK SCOPES\n');

// Current available scopes in your TikTok Sandbox
const availableScopes = [
  'user.info.basic',    // ✅ Available - Read profile info (open id, avatar, display name)
  'video.publish',      // ✅ Available - Directly post content to TikTok
  'video.upload',       // ✅ Available - Share content as draft
  'user.info.profile',  // ✅ Available - Profile web link, bio, verification
  'user.info.stats',    // ✅ Available - Follower count, likes, etc.
  'video.list'         // ✅ Available - Read public videos
];

// Recommended scopes for EngageHub integration
const recommendedScopes = [
  'user.info.basic',    // For user authentication and profile
  'video.publish'       // For publishing content (better than upload)
];

console.log('📋 Available Scopes:');
availableScopes.forEach(scope => {
  console.log(`   ✅ ${scope}`);
});

console.log('\n🎯 Recommended Scopes for EngageHub:');
recommendedScopes.forEach(scope => {
  console.log(`   🎯 ${scope}`);
});

// Generate correct authorization URL
const config = {
  clientKey: 'sbawvd31u17vw8ajd3',
  redirectUri: 'https://engage-hub-ten.vercel.app',
  scopes: recommendedScopes,
  responseType: 'code',
  state: 'tiktok_oauth_' + Date.now()
};

const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
  `client_key=${config.clientKey}` +
  `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
  `&response_type=${config.responseType}` +
  `&scope=${config.scopes.join('%20')}` +
  `&state=${config.state}`;

console.log('\n🔗 CORRECTED AUTHORIZATION URL:');
console.log(authUrl);

console.log('\n📱 INSTRUCTIONS:');
console.log('1. ✅ Copy the URL above');
console.log('2. 🌐 Paste in browser and go to TikTok');
console.log('3. 📱 Login with your TikTok account');
console.log('4. ✅ Click "Continue" or "Authorize"');
console.log('5. 🔄 Should redirect to: https://engage-hub-ten.vercel.app');
console.log('6. 🎯 Check Social Media page for "CONNECTED" status');

console.log('\n🎯 WHY THESE SCOPES:');
console.log('• user.info.basic - Required for user authentication');
console.log('• video.publish - Better than video.upload (direct publishing)');

console.log('\n✅ EXPECTED RESULT:');
console.log('🎵 TikTok OAuth callback received');
console.log('✅ Authorization code received');
console.log('✅ Access token obtained successfully');
console.log('✅ User info obtained: @your_username');
console.log('✅ Connection saved successfully');
console.log('🔄 Redirecting to: /social-media?success=tiktok_connected');

// Auto-copy to clipboard (if supported)
if (navigator.clipboard) {
  navigator.clipboard.writeText(authUrl).then(() => {
    console.log('\n📋 URL copied to clipboard!');
  }).catch(() => {
    console.log('\n📋 Manual copy required');
  });
} else {
  console.log('\n📋 Manual copy required');
}

// Auto-open in new tab (optional)
console.log('\n🚀 READY TO TEST!');
console.log('📱 Click the URL above or run: window.open("' + authUrl + '")');
