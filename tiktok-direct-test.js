// Direct TikTok Token Exchange Test - Bypass frontend issues
console.log('🔧 DIRECT TIKTOK TOKEN EXCHANGE TEST\n');

// Test the working endpoint directly
async function testDirectTokenExchange() {
  try {
    // Get the authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) {
      console.log('❌ No authorization code found in URL');
      console.log('💡 Complete TikTok OAuth first');
      return;
    }
    
    console.log('✅ Authorization code found:', code.substring(0, 20) + '...');
    
    // Get code verifier from cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const codeVerifier = cookies.tiktok_oauth_code_verifier;
    console.log('🔑 Code verifier found:', !!codeVerifier);
    
    // Call the working endpoint directly
    console.log('🔄 Calling token exchange endpoint...');
    
    const response = await fetch('/api/auth?provider=tiktok&action=token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        code_verifier: codeVerifier
      })
    });
    
    const data = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', data);
    
    if (data.success) {
      console.log('🎉 TOKEN EXCHANGE SUCCESS!');
      console.log('✅ Access token obtained');
      console.log('✅ User info:', data.user?.display_name);
      console.log('💡 TikTok should now be connected');
    } else {
      console.log('❌ TOKEN EXCHANGE FAILED:', data.error);
      console.log('📋 Details:', data.details);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
testDirectTokenExchange();
