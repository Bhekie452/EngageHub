// Fix Facebook Engagement API Call
console.log('🔧 Fixing Facebook Engagement API Call...\n');

console.log('❌ Current Issue:');
console.log('Calling: /api/facebook?action=list-pages');
console.log('Missing: Authorization header with Facebook token');
console.log('Result: 500 Internal Server Error');

console.log('\n✅ Solution:');
console.log('Use: /api/facebook?action=get-connections');
console.log('This uses your stored database connections instead');

console.log('\n🔧 Browser Fix:');
console.log('1. Open browser console (F12)');
console.log('2. Run this to test correct endpoint:');

const testCorrectEndpoint = `
// Test the correct endpoint
fetch('/api/facebook?action=get-connections&workspaceId=c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9')
  .then(response => response.json())
  .then(data => {
    console.log('✅ get-connections response:', data);
    console.log('Found connections:', data.connections?.length || 0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
`;

console.log(testCorrectEndpoint);

console.log('\n🎯 What This Does:');
console.log('✅ Uses your stored Facebook connections');
console.log('✅ No Authorization header needed');
console.log('✅ Works with your existing database');
console.log('✅ Should return your connected pages');

console.log('\n📱 For FacebookEngagement Component:');
console.log('The component should call get-connections instead of list-pages');
console.log('Or modify the component to use the correct endpoint');

console.log('\n🔄 Quick Test:');
console.log('Copy the fetch code above into browser console');
console.log('Should show your Facebook connections!');
