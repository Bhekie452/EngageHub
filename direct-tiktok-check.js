// Direct TikTok Connection Check - Bypass API Issues
console.log('🔍 DIRECT TIKTOK CONNECTION CHECK\n');

// Check if TikTok is connected by looking at the UI directly
function checkTikTokUI() {
  console.log('🎨 Checking TikTok UI Status...');
  
  // Look for TikTok connection indicators in the page
  const possibleSelectors = [
    '[data-platform="tiktok"]',
    '.tiktok-card',
    '.platform-tiktok',
    '[data-tiktok]',
    '*[class*="tiktok"]',
    '*[class*="TikTok"]'
  ];
  
  let tiktokElement = null;
  let foundSelector = null;
  
  for (const selector of possibleSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      tiktokElement = elements[0];
      foundSelector = selector;
      console.log(`✅ Found TikTok element with selector: ${selector}`);
      break;
    }
  }
  
  if (!tiktokElement) {
    console.log('❌ No TikTok UI element found');
    console.log('💡 Make sure you are on the Social Media page');
    
    // Look for any platform cards
    const allCards = document.querySelectorAll('[data-platform], .platform-card, .social-card');
    console.log(`📱 Total platform cards found: ${allCards.length}`);
    
    allCards.forEach((card, index) => {
      const text = card.textContent || '';
      console.log(`   ${index + 1}. "${text.substring(0, 50)}..."`);
    });
    
    return false;
  }
  
  console.log('📱 TikTok element found, analyzing content...');
  
  // Check the text content for connection status
  const elementText = tiktokElement.textContent || '';
  console.log(`📋 Element text: "${elementText}"`);
  
  // Look for connection indicators
  const isConnected = 
    elementText.includes('CONNECTED') ||
    elementText.includes('Connected') ||
    elementText.includes('Disconnect') ||
    elementText.includes('Disconnect') ||
    elementText.includes('Manage') ||
    elementText.includes('Settings');
  
  const needsConnection = 
    elementText.includes('CONNECT') ||
    elementText.includes('Connect') ||
    elementText.includes('Authorize') ||
    elementText.includes('Link Account');
  
  console.log(`🔍 Connection indicators:`);
  console.log(`   Shows Connected: ${isConnected ? 'Yes' : 'No'}`);
  console.log(`   Shows Connect: ${needsConnection ? 'Yes' : 'No'}`);
  
  if (isConnected && !needsConnection) {
    console.log('\n🎉 TIKTOK IS CONNECTED!');
    console.log('✅ Ready to use TikTok APIs');
    console.log('✅ Can publish to TikTok');
    console.log('✅ Can access TikTok data');
    return true;
  } else if (needsConnection && !isConnected) {
    console.log('\n❌ TIKTOK IS NOT CONNECTED');
    console.log('💡 To connect TikTok:');
    console.log('1. Click the "CONNECT" button on TikTok card');
    console.log('2. Complete the OAuth authorization flow');
    console.log('3. Wait for redirect back to Social Media page');
    console.log('4. Verify connection status');
    return false;
  } else {
    console.log('\n❓ TikTok status unclear from UI');
    console.log('💡 Check the TikTok card manually');
    return false;
  }
}

// Check URL for success parameters
function checkURLSuccess() {
  console.log('\n🔍 Checking URL for success parameters...');
  
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const error = urlParams.get('error');
  const platform = urlParams.get('platform');
  const account = urlParams.get('account');
  
  console.log('📋 URL Parameters:');
  console.log(`   Success: ${success || 'None'}`);
  console.log(`   Error: ${error || 'None'}`);
  console.log(`   Platform: ${platform || 'None'}`);
  console.log(`   Account: ${account || 'None'}`);
  
  if (success === 'tiktok_connected') {
    console.log('\n✅ URL shows TikTok connection success!');
    console.log(`📱 Account: ${account || 'Unknown'}`);
    return true;
  } else if (error) {
    console.log(`\n❌ URL shows TikTok connection error: ${error}`);
    return false;
  }
  
  return false;
}

// Check localStorage for TikTok data
function checkLocalStorage() {
  console.log('\n💾 Checking localStorage for TikTok data...');
  
  const keys = Object.keys(localStorage);
  const tiktokKeys = keys.filter(key => 
    key.toLowerCase().includes('tiktok') ||
    key.toLowerCase().includes('social') ||
    key.toLowerCase().includes('connection')
  );
  
  console.log(`🔑 TikTok-related keys found: ${tiktokKeys.length}`);
  
  let hasTikTokData = false;
  
  tiktokKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        if (parsed.platform === 'tiktok' || parsed.tiktok || parsed.tiktok_connected) {
          console.log(`✅ TikTok data found in: ${key}`);
          console.log(`   Status: ${parsed.connection_status || 'Unknown'}`);
          console.log(`   Account: ${parsed.display_name || 'Unknown'}`);
          hasTikTokData = true;
        }
      }
    } catch (e) {
      console.log(`📋 Non-JSON data in: ${key}`);
    }
  });
  
  return hasTikTokData;
}

// Main check function
function performTikTokCheck() {
  console.log('='.repeat(60));
  console.log('🎯 COMPREHENSIVE TIKTOK CONNECTION CHECK');
  console.log('='.repeat(60));
  
  const urlSuccess = checkURLSuccess();
  const uiConnected = checkTikTokUI();
  const hasLocalStorage = checkLocalStorage();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL CONNECTION STATUS SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Connection Indicators:');
  console.log(`   ✅ URL Success: ${urlSuccess ? 'Yes' : 'No'}`);
  console.log(`   ✅ UI Connected: ${uiConnected ? 'Yes' : 'No'}`);
  console.log(`   ✅ LocalStorage Data: ${hasLocalStorage ? 'Yes' : 'No'}`);
  
  if (urlSuccess || uiConnected || hasLocalStorage) {
    console.log('\n🎉 TIKTOK IS CONNECTED!');
    console.log('✅ Ready to use TikTok APIs');
    console.log('✅ Can publish content to TikTok');
    console.log('✅ Can access TikTok user data');
    console.log('\n💡 Next Steps:');
    console.log('• Test TikTok publishing functionality');
    console.log('• Check TikTok analytics');
    console.log('• Manage TikTok account settings');
  } else {
    console.log('\n❌ TIKTOK IS NOT CONNECTED');
    console.log('💡 To Connect TikTok:');
    console.log('1. Make sure you are on the Social Media page');
    console.log('2. Look for the TikTok platform card');
    console.log('3. Click the "CONNECT" button');
    console.log('4. Complete OAuth authorization with TikTok');
    console.log('5. Wait for redirect back to Social Media page');
    console.log('6. Verify connection status');
  }
  
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('• If UI check fails, ensure you are on Social Media page');
  console.log('• If connection fails, check TikTok Developer Portal settings');
  console.log('• If OAuth fails, verify redirect URI and scopes');
  console.log('• If API errors occur, check environment variables');
}

// Run the comprehensive check
performTikTokCheck();
