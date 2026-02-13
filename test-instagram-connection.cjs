// Test Instagram Connection
const { getConnectedInstagramAccounts } = require('./src/lib/facebook');

async function testInstagramConnection() {
  console.log('🔍 Testing Instagram Connection...\n');
  
  try {
    // Test 1: Check if we can get Instagram accounts
    console.log('📸 Step 1: Fetching Instagram accounts from Facebook...');
    const accounts = await getConnectedInstagramAccounts();
    
    console.log(`✅ Found ${accounts.length} Instagram account(s):`);
    accounts.forEach((account, index) => {
      console.log(`  ${index + 1}. @${account.instagram.username} (@${account.pageName})`);
      console.log(`     - Instagram ID: ${account.instagram.id}`);
      console.log(`     - Page ID: ${account.pageId}`);
      console.log(`     - Has Token: ${account.pageToken ? '✅' : '❌'}`);
    });
    
    if (accounts.length === 0) {
      console.log('\n❌ No Instagram accounts found!');
      console.log('💡 Solution: Connect a Facebook Page with Instagram Business Account linked');
    } else {
      console.log('\n✅ Instagram connection is working!');
      console.log('📱 Ready to connect Instagram accounts in the UI');
    }
    
  } catch (error) {
    console.error('❌ Instagram connection test failed:', error.message);
  }
}

// Run the test
testInstagramConnection();
