import React, { useEffect, useState, useRef } from 'react';

export default function FacebookCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Prevent double-firing with ref
  const hasProcessed = useRef(false);

  useEffect(() => {
    console.log('🔍 [CALLBACK] Facebook callback page loaded');
    console.log('🔍 [CALLBACK] URL:', window.location.href);
    console.log('🔍 [CALLBACK] Search params:', window.location.search);
    
    // 🔥 OBVIOUS DEBUG: Add alert to confirm page loads
    alert('🔥 FACEBOOK CALLBACK PAGE LOADED! Check console for details.');
    
    // 🔥 CRITICAL: Check if this callback was already processed
    const alreadyProcessed = sessionStorage.getItem('fb_callback_processed');
    if (alreadyProcessed) {
      console.log('🛑 Callback already processed - redirecting to home');
      setStatus("success");
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return;
    }

    // 🔥 CRITICAL: Immediately extract and clear code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('🔍 [CALLBACK] Extracted params:', { code: !!code, state });

    // 🔥 CRITICAL: Improved state validation
    let isFacebookOauth = state === 'facebook_oauth';
    if (!isFacebookOauth && state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        console.log('🔍 [CALLBACK] Parsed state data:', stateData);
        if (stateData && (stateData.workspaceId || stateData.origin)) {
          isFacebookOauth = true;
          console.log('✅ Recognized JSON state from backend');
        }
      } catch (e) { 
        console.log('🔍 [CALLBACK] State parse error:', e);
      }
    }
    
    console.log('🔍 [CALLBACK] Is Facebook OAuth:', isFacebookOauth);

    if (!code || !isFacebookOauth) {
      console.log('❌ No Facebook OAuth code found or invalid state', { code: !!code, state });
      setStatus("failed");
      setError('No authorization code found');
      return;
    }

    // 🔥 CRITICAL: Mark as processed IMMEDIATELY (before any async calls)
    sessionStorage.setItem('fb_callback_processed', 'true');

    // 🔥 CRITICAL: Clear code from URL IMMEDIATELY
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    console.log('🗑️ OAuth code cleared from URL');

    // CRITICAL: Only process once with useRef
    if (hasProcessed.current) {
      console.log('⚠️ Already processed this callback - skipping');
      return;
    }

    hasProcessed.current = true;
    console.log('✅ Starting Facebook callback processing...');

    const processCallback = async () => {
      try {
        // Redirect to backend to handle OAuth processing
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          setStatus("failed");
          setError('No authorization code found');
          return;
        }

        console.log('🔄 Redirecting to backend for OAuth processing...');
        
        // Build backend URL with all OAuth parameters
        const backendUrl = `/api/facebook?action=simple&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || 'facebook_oauth')}`;
        
        console.log('🔍 [CALLBACK] Backend URL:', backendUrl);
        console.log('🔍 [CALLBACK] About to redirect to backend...');
        
        // Redirect to backend for processing
        window.location.href = backendUrl;
        
      } catch (err: any) {
        setError(err.message || 'Failed to connect Facebook');
        setStatus("failed");
        console.error('Facebook callback error:', err);
      }
    };

    processCallback();
  }, []);

  if (status === "Processing...") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Connecting to Facebook...</h2>
          <p className="text-gray-500 mt-2">Please wait while we complete the connection.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Connected Successfully!</h2>
          <p className="text-gray-600">Your Facebook account has been connected.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting you back to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Connection Failed</h2>
        <p className="text-gray-600 mb-4">{error || "An unknown error occurred"}</p>

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Go Back to App
        </button>
      </div>
    </div>
  );
}
