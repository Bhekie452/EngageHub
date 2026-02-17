// Immediate TikTok Token Exchange - Bypass all delays
console.log('🚀 IMMEDIATE TIKTOK TOKEN EXCHANGE\n');

// Get the authorization code immediately
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

if (code && state === 'tiktok_oauth') {
  console.log('✅ TikTok OAuth callback detected');
  console.log('🔄 Exchanging code immediately...');
  
  // Get PKCE data
  const codeVerifier = sessionStorage.getItem('tiktok_oauth_code_verifier');
  const redirectUri = sessionStorage.getItem('tiktok_oauth_redirect_uri');
  
  console.log('🔑 PKCE Data:', {
    codeVerifier: codeVerifier ? 'PRESENT' : 'MISSING',
    redirectUri: redirectUri || 'MISSING'
  });
  
  // Exchange code immediately
  fetch('/api/oauth?provider=tiktok&action=token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri, codeVerifier })
  })
  .then(async response => {
    console.log('📊 Response Status:', response.status);
    const data = await response.json();
    console.log('📊 Response Data:', data);
    
    if (response.ok && data.success) {
      console.log('🎉 SUCCESS! Token exchange completed!');
      console.log('✅ Access Token:', data.access_token ? 'OBTAINED' : 'MISSING');
      console.log('✅ User Info:', data.user?.display_name || 'MISSING');
      
      // Save to localStorage for the app
      localStorage.setItem('tiktok_connected', 'true');
      localStorage.setItem('tiktok_tokens', JSON.stringify(data));
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Refresh the page to show connected state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } else {
      console.log('❌ Token exchange failed:', data.error);
      console.log('📋 Details:', data.details);
      
      if (data.details?.includes('expired')) {
        console.log('⏰ Code expired - trying again...');
        // Try again by redirecting to TikTok
        setTimeout(() => {
          window.location.href = 'https://www.tiktok.com/v2/auth/authorize?client_key=sbawvd31u17vw8ajd3&redirect_uri=https://engage-hub-ten.vercel.app&response_type=code&scope=user.info.basic&state=tiktok_oauth&code_challenge=DDkSZd1qCUbnh4qL15NPLXnj8C_uXVjN9nHXpPiFVA4&code_challenge_method=S256';
        }, 2000);
      }
    }
  })
  .catch(error => {
    console.error('💥 Network Error:', error);
  });
} else {
  console.log('❌ No TikTok OAuth callback detected');
}
