// 🔥 FIX OAUTH DUPLICATES - BROWSER CONSOLE
// Paste this in your browser console on your app

console.log('🔧 Fixing Facebook OAuth duplicates...');

// 1. Clear all Facebook sessionStorage
Object.keys(sessionStorage)
  .filter(key => key.startsWith('fb_'))
  .forEach(key => {
    console.log(`🗑️ Removing: ${key}`);
    sessionStorage.removeItem(key);
  });

// 2. Clear Facebook localStorage
localStorage.removeItem('facebook_pages');
localStorage.removeItem('facebook_user_token');
console.log('🗑️ Cleared Facebook localStorage');

// 3. Clear any global locks
if (window.facebookOAuthInProgress) {
  window.facebookOAuthInProgress = false;
}

// 4. Remove any pending exchange markers
Object.keys(sessionStorage)
  .filter(key => key.includes('exchange'))
  .forEach(key => sessionStorage.removeItem(key));

console.log('✅ OAuth state cleared!');
console.log('🎯 Now try connecting to Facebook again.');
console.log('💡 If you still get errors, wait 2-3 minutes for backend reset.');
