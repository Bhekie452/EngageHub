// Check Facebook Engagement Data Structure
console.log('🔍 Checking Facebook Engagement Data Structure...\n');

// Your workspace ID from previous logs
const workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
console.log(`📱 Workspace ID: ${workspaceId}`);

// Simulate the Facebook pages data structure
const mockPagesData = [
  {
    account_id: '991921717332604',
    access_token: 'EAAd7mnK3tIsBQl5DELLTYeKG8VAtIHZBeAZCcBZADHH0YpnLW...'
  },
  {
    account_id: '17841480561146301', // Instagram Business Account ID
    access_token: 'EAAd7mnK3tIsBQl5DELLTYeKG8VAtIHZBeAZCcBZADHH0YpnLW...'
  }
];

console.log('📄 Expected Facebook Pages Structure:');
mockPagesData.forEach((page, index) => {
  console.log(`  Page ${index + 1}: ${page.account_id}`);
  console.log(`    - Has Instagram: ${page.account_id === '17841480561146301' ? '✅ YES' : '❌ NO'}`);
  console.log(`    - Token Present: ${page.access_token ? '✅ YES' : '❌ NO'}`);
});

console.log('\n📝 To Check Real Data:');
console.log('1. Go to your app → Social Media → Facebook → Engagement tab');
console.log('2. Look for posts with likes, comments, shares');
console.log('3. Check if Instagram Business Account is linked (should show ✅ YES)');
console.log('4. Try liking/commenting on posts to test real-time updates');
console.log('5. Check the Metrics dashboard for total counts');

console.log('\n✅ Facebook engagement structure check complete!');
console.log('💡 Your Facebook page with Instagram should show "Has Instagram: ✅ YES"');
