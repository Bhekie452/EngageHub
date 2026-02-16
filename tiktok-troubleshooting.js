// TikTok OAuth Troubleshooting Guide
console.log('🔧 TIKTOK OAUTH TROUBLESHOOTING\n');

async function troubleshootTikTokOAuth() {
  console.log('='.repeat(50));
  console.log('📊 ERROR ANALYSIS');
  console.log('Error Code: 20260216193556A8C99717771FD1DCF1A8');
  console.log('Error Type: Something went wrong');
  console.log('Timestamp: 2026-02-16 19:35:56 UTC');
  
  console.log('\n🔍 COMMON CAUSES:');
  console.log('1. ❌ Mismatched Redirect URI');
  console.log('   - Redirect URI in TikTok vs in callback');
  console.log('   - Trailing slashes, protocol differences');
  console.log('   - Solution: Must match exactly');
  
  console.log('2. ❌ Missing Environment Variables');
  console.log('   - TIKTOK_CLIENT_SECRET not set');
  console.log('   - Solution: Add to Vercel environment');
  
  console.log('3. ❌ Expired Authorization Code');
  console.log('   - Codes expire in ~10 minutes');
  console.log('   - Solution: Try authorization quickly');
  
  console.log('4. ❌ Target User Not Added');
  console.log('   - Account not in Sandbox Target Users');
  console.log('   - Solution: Add your TikTok account as target');
  
  console.log('5. ❌ Scope Mismatch');
  console.log('   - Requested scopes not enabled');
  console.log('   - Solution: Enable scopes in TikTok Sandbox');
  
  console.log('6. ❌ Client Key Mismatch');
  console.log('   - Using Production key in Sandbox');
  console.log('   - Solution: Use Sandbox client key');
  
  console.log('7. ❌ Network/Server Issues');
  console.log('   - Callback endpoint not deployed');
  console.log('   - Server errors during token exchange');
  console.log('   - Solution: Check deployment and logs');

  console.log('\n🧪 STEP-BY-STEP FIX:');
  console.log('='.repeat(30));
  
  // Step 1: Verify Current Configuration
  console.log('\n📋 STEP 1: Check Current Setup');
  
  try {
    const config = {
      redirectUri: 'https://engage-hub-ten.vercel.app',
      clientKey: 'sbawvd31u17vw8ajd3',
      scopes: ['user.info.basic', 'video.upload']
    };
    
    console.log('✅ Current Config:');
    console.log(`   Redirect URI: ${config.redirectUri}`);
    console.log(`   Client Key: ${config.clientKey}`);
    console.log(`   Scopes: ${config.scopes.join(', ')}`);
    
    // Step 2: Test Callback Endpoint
    console.log('\n🔄 STEP 2: Test Callback Endpoint');
    
    const callbackTest = await fetch('/api/tiktok-callback?test=true');
    if (callbackTest.ok) {
      console.log('✅ Callback endpoint is deployed');
    } else {
      console.log('❌ Callback endpoint not available');
      console.log('💡 Deploy the callback endpoint first');
      return;
    }
    
    // Step 3: Check Environment Variables
    console.log('\n🔧 STEP 3: Check Environment');
    
    const envTest = await fetch('/api/tiktok-callback?check-env=true');
    if (envTest.ok) {
      const env = await envTest.json();
      console.log('✅ Environment Status:');
      console.log(`   TIKTOK_CLIENT_SECRET: ${env.hasSecret ? '✅ Set' : '❌ Missing'}`);
      console.log(`   SUPABASE_URL: ${env.hasSupabase ? '✅ Set' : '❌ Missing'}`);
    } else {
      console.log('❌ Environment check failed');
    }
    
    // Step 4: Generate Correct Authorization URL
    console.log('\n🔗 STEP 4: Generate Correct URL');
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
      `client_key=${config.clientKey}` +
      `&scope=${config.scopes.join('%20')}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
      `&state=tiktok_oauth_${Date.now()}`;
    
    console.log('✅ Correct Authorization URL:');
    console.log(`   ${authUrl}`);
    
    // Step 5: Instructions
    console.log('\n📋 STEP 5: Manual Instructions');
    
    console.log('🎯 SOLUTION BASED ON ERROR:');
    console.log('='.repeat(30));
    
    if (!envTest.ok) {
      console.log('❌ ISSUE: Callback endpoint not deployed');
      console.log('💡 SOLUTION: Deploy /api/tiktok-callback.js first');
      console.log('🚀 COMMAND: git add api/tiktok-callback.js && git push');
    } else if (!env.hasSecret) {
      console.log('❌ ISSUE: Missing TIKTOK_CLIENT_SECRET');
      console.log('💡 SOLUTION: Add to Vercel environment variables');
      console.log('🚀 COMMAND: In Vercel dashboard → Settings → Environment Variables');
    } else {
      console.log('✅ SETUP APPEARS CORRECT');
      console.log('💡 NEXT STEP: Try authorization manually');
      console.log(`🔗 URL: ${authUrl}`);
      console.log('📱 INSTRUCTIONS:');
      console.log('1. Click the link above or copy to browser');
      console.log('2. Login with your TikTok account');
      console.log('3. Click "Continue" or "Authorize"');
      console.log('4. Should redirect to: https://engage-hub-ten.vercel.app');
      console.log('5. Check Social Media page for "CONNECTED" status');
    }
    
    console.log('\n🔍 DEBUGGING TOOLS:');
    console.log('='.repeat(20));
    console.log('1. 📊 Check error logs in callback endpoint');
    console.log('2. 🧪 Verify TikTok Sandbox settings');
    console.log('3. 📡 Monitor network requests in browser dev tools');
    console.log('4. 💾 Check localStorage for connection data');
    
  } catch (error) {
    console.error('❌ Troubleshooting failed:', error);
  }
}

// Auto-run troubleshooting
troubleshootTikTokOAuth();
