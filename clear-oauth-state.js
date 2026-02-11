// 🔥 CLEAR ALL FACEBOOK OAUTH STATE
// Run this to fix "already being processed" errors

console.log('🧹 Clearing Facebook OAuth state...');

// Clear sessionStorage (frontend)
if (typeof window !== 'undefined') {
  // Clear all Facebook-related sessionStorage
  Object.keys(sessionStorage)
    .filter(key => key.startsWith('fb_'))
    .forEach(key => sessionStorage.removeItem(key));
  
  // Clear localStorage Facebook data
  localStorage.removeItem('facebook_pages');
  localStorage.removeItem('facebook_user_token');
  localStorage.removeItem('current_workspace_id');
  
  console.log('✅ Cleared frontend OAuth state');
}

// Clear global state (backend - will reset on next deploy)
console.log('📋 To clear backend state:');
console.log('1. Re-deploy the application (this resets global usedCodes Set)');
console.log('2. Or wait 5-10 minutes for serverless function cold start');

console.log('🎯 OAuth state cleared! Try connecting again.');
