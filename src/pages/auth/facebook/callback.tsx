import React, { useEffect } from 'react';

export default function FacebookCallback() {
  useEffect(() => {
    console.log("🔥 Callback page loaded ✅");
    
    // Extract URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('🔍 Extracted params:', { code: !!code, state });
    
    if (code) {
      console.log('🔄 Processing OAuth with backend...');
      
      // Redirect to backend for OAuth processing
      const backendUrl = `/api/facebook?action=simple&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || 'facebook_oauth')}`;
      console.log('🔍 Backend URL:', backendUrl);
      
      window.location.href = backendUrl;
    } else {
      console.log('❌ No code found in callback');
      window.location.href = '/#social';
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>
      Connecting Facebook...
    </div>
  );
}
