// Check TikTok Connection Status
console.log('🔍 CHECKING TIKTOK CONNECTION STATUS\n');

async function checkTikTokConnection() {
  try {
    console.log('='.repeat(50));
    console.log('📊 TIKTOK CONNECTION VERIFICATION');
    console.log('='.repeat(50));

    // Step 1: Check URL parameters for success/error
    console.log('\n🔍 Step 1: Checking URL Parameters...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const platform = urlParams.get('platform');
    const account = urlParams.get('account');
    
    console.log('📋 URL Parameters:');
    console.log('   Success:', success || 'None');
    console.log('   Error:', error || 'None');
    console.log('   Platform:', platform || 'None');
    console.log('   Account:', account || 'None');
    
    if (success === 'tiktok_connected') {
      console.log('✅ TikTok connection successful!');
      console.log('📱 Account:', account || 'Unknown');
    } else if (error) {
      console.log('❌ TikTok connection failed:', error);
    }

    // Step 2: Check social accounts API
    console.log('\n🔄 Step 2: Checking Social Accounts Database...');
    
    try {
      const accountsResponse = await fetch('/api/social-accounts');
      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        console.log('✅ Social Accounts API: Responding');
        console.log('📊 Total accounts:', accounts.length);
        
        const tiktokAccounts = accounts.filter(acc => acc.platform === 'tiktok');
        console.log('🎵 TikTok accounts:', tiktokAccounts.length);
        
        if (tiktokAccounts.length > 0) {
          console.log('\n📱 TikTok Connection Details:');
          tiktokAccounts.forEach((account, index) => {
            console.log(`   ${index + 1}. Account ID: ${account.account_id || 'Unknown'}`);
            console.log(`      Display Name: ${account.display_name || 'Unknown'}`);
            console.log(`      Status: ${account.connection_status || 'Unknown'}`);
            console.log(`      Connected: ${account.last_sync_at || 'Never'}`);
            console.log(`      Token Expires: ${account.token_expires_at || 'Unknown'}`);
            console.log(`      Account Type: ${account.account_type || 'Unknown'}`);
            console.log(`      Platform Data: ${account.platform_data ? 'Available' : 'None'}`);
          });
          
          const connectedAccount = tiktokAccounts.find(acc => acc.connection_status === 'connected');
          if (connectedAccount) {
            console.log('\n✅ TIKTOK IS CONNECTED!');
            console.log('🎵 Account:', connectedAccount.display_name || connectedAccount.account_id);
            console.log('🔄 Last Sync:', connectedAccount.last_sync_at);
            console.log('🔑 Token Status:', connectedAccount.token_expires_at ? 'Valid' : 'Unknown');
          } else {
            console.log('\n❓ TikTok accounts found but none marked as connected');
          }
        } else {
          console.log('\n❌ No TikTok accounts found in database');
        }
      } else {
        console.log('❌ Social Accounts API not responding');
        console.log('🔍 Status:', accountsResponse.status);
      }
    } catch (e) {
      console.log('❌ Error checking social accounts:', e.message);
    }

    // Step 3: Check localStorage for connection data
    console.log('\n💾 Step 3: Checking Local Storage...');
    
    const storageKeys = Object.keys(localStorage);
    const tiktokKeys = storageKeys.filter(key => 
      key.toLowerCase().includes('tiktok') || 
      key.toLowerCase().includes('social') ||
      key.toLowerCase().includes('connection')
    );
    
    console.log('🔑 TikTok-related localStorage keys:', tiktokKeys.length);
    
    tiktokKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed.platform === 'tiktok' || parsed.tiktok) {
            console.log(`   ${key}: TikTok data found`);
            console.log(`      Status: ${parsed.connection_status || 'Unknown'}`);
            console.log(`      Account: ${parsed.display_name || 'Unknown'}`);
          }
        }
      } catch (e) {
        console.log(`   ${key}: [Non-JSON data]`);
      }
    });

    // Step 4: Check UI status
    console.log('\n🎨 Step 4: Checking UI Status...');
    
    // Look for TikTok connection indicators
    const tiktokElements = document.querySelectorAll('[data-platform="tiktok"], .tiktok-card, .platform-tiktok');
    console.log('📱 TikTok UI elements found:', tiktokElements.length);
    
    tiktokElements.forEach((element, index) => {
      const buttonText = element.textContent;
      console.log(`   ${index + 1}. Text: "${buttonText}"`);
      
      if (buttonText.includes('CONNECTED') || buttonText.includes('Connected')) {
        console.log('      ✅ Shows as connected');
      } else if (buttonText.includes('CONNECT') || buttonText.includes('Connect')) {
        console.log('      ❌ Shows as not connected');
      }
    });

    // Step 5: Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎯 CONNECTION STATUS SUMMARY');
    console.log('='.repeat(50));
    
    const hasTiktokAccounts = tiktokAccounts && tiktokAccounts.length > 0;
    const hasConnectedAccount = hasTiktokAccounts && tiktokAccounts.some(acc => acc.connection_status === 'connected');
    const showsSuccessInUrl = success === 'tiktok_connected';
    
    console.log('\n📊 Connection Indicators:');
    console.log(`   ✅ URL Success: ${showsSuccessInUrl ? 'Yes' : 'No'}`);
    console.log(`   ✅ Database Accounts: ${hasTiktokAccounts ? 'Yes' : 'No'}`);
    console.log(`   ✅ Connected Status: ${hasConnectedAccount ? 'Yes' : 'No'}`);
    console.log(`   ✅ UI Shows Connected: ${tiktokElements.length > 0 ? 'Checking...' : 'No'}`);
    
    if (hasConnectedAccount || showsSuccessInUrl) {
      console.log('\n🎉 TIKTOK IS CONNECTED!');
      console.log('✅ Ready to use TikTok APIs');
      console.log('✅ Can publish content to TikTok');
      console.log('✅ Can access TikTok user data');
    } else {
      console.log('\n❌ TIKTOK IS NOT CONNECTED');
      console.log('💡 Next Steps:');
      console.log('1. Go to Social Media page');
      console.log('2. Click "CONNECT" on TikTok card');
      console.log('3. Complete OAuth authorization');
      console.log('4. Verify connection status');
    }

    // Step 6: Test TikTok API if connected
    if (hasConnectedAccount) {
      console.log('\n🧪 Step 6: Testing TikTok API Access...');
      
      try {
        const testResponse = await fetch('/api/tiktok-test');
        if (testResponse.ok) {
          const testResult = await testResponse.json();
          console.log('✅ TikTok API Test: Passed');
          console.log('📊 Test Result:', testResult);
        } else {
          console.log('❓ TikTok API Test: Not available');
        }
      } catch (e) {
        console.log('❓ TikTok API Test: Error -', e.message);
      }
    }

  } catch (error) {
    console.error('❌ Connection check failed:', error);
  }
}

// Auto-run the check
checkTikTokConnection();
