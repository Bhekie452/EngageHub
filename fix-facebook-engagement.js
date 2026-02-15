// Fix Facebook Engagement - Browser Script
console.log('🔧 Facebook Engagement Fix Script\n');

// The correct workspace ID from your database
const CORRECT_WORKSPACE_ID = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

console.log('📱 Expected workspace ID:', CORRECT_WORKSPACE_ID);

// Check current workspace
const currentWorkspace = localStorage.getItem("current_workspace_id");
console.log('📱 Current workspace:', currentWorkspace);

// Set to correct workspace
console.log('✅ Setting to correct workspace:', CORRECT_WORKSPACE_ID);
localStorage.setItem("current_workspace_id", CORRECT_WORKSPACE_ID);

// Verify fix
const newWorkspace = localStorage.getItem("current_workspace_id");
console.log('🔍 Verification - New workspace:', newWorkspace);
console.log('🎯 Match:', newWorkspace === CORRECT_WORKSPACE_ID ? '✅ YES' : '❌ NO');

if (newWorkspace === CORRECT_WORKSPACE_ID) {
  console.log('\n✅ Facebook Engagement workspace fixed!');
  console.log('🔄 Reloading page in 2 seconds...');
  
  setTimeout(() => {
    location.reload();
  }, 2000);
} else {
  console.log('\n❌ Fix failed - workspace not set correctly');
}

// Also clear any potential cache issues
console.log('🧹 Clearing potential cache...');
localStorage.removeItem('facebook_posts_cache');
localStorage.removeItem('facebook_engagement_cache');
sessionStorage.clear();

console.log('\n🎯 After reload:');
console.log('1. Go to Social Media → Facebook → Engagement tab');
console.log('2. Should now show your Facebook posts with engagement!');
console.log('3. Test like/comment functionality');
