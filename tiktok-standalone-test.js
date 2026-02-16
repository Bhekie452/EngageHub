// Standalone TikTok Token Exchange Test - Uses new endpoint
console.log('🔧 STANDALONE TIKTOK TOKEN EXCHANGE TEST\n');

// Test the new standalone endpoint
async function testStandaloneTokenExchange() {
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
    
    // Call the NEW standalone endpoint
    console.log('🔄 Calling NEW standalone endpoint...');
    
    const response = await fetch('/api/tiktok-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code,
        code_verifier: codeVerifier
      })
    });
    
    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📊 Response data:', data);
    
    if (data.success) {
      console.log('🎉 TOKEN EXCHANGE SUCCESS!');
      console.log('✅ Access token obtained');
      console.log('✅ User info:', data.user?.display_name);
      console.log('✅ Refresh token:', !!data.refresh_token);
      console.log('💡 TikTok should now be connected');
      console.log('🔄 Refresh page to see connected status');
    } else {
      console.log('❌ TOKEN EXCHANGE FAILED:', data.error);
      console.log('📋 Details:', data.details);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
testStandaloneTokenExchange();
