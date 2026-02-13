import React, { useEffect } from 'react';

interface OAuthState {
  workspaceId: string;
  origin: string;
}

export default function FacebookCallback() {
  useEffect(() => {
    console.log("🔥 Callback page loaded ✅");

    // Parse query params
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateRaw = params.get("state");

    // Decode state (workspaceId + origin)
    let state: Partial<OAuthState> = {};
    if (stateRaw) {
      try {
        state = JSON.parse(decodeURIComponent(stateRaw));
        console.log("🔍 Decoded state:", state);
      } catch (err) {
        console.error("❌ Failed to parse state:", err);
      }
    }

    if (code && state.workspaceId) {
      console.log('🔄 Processing OAuth with backend...');
      console.log('🔍 WorkspaceId:', state.workspaceId);
      console.log('🔍 Origin:', state.origin);
      
      // Redirect to backend for OAuth processing with workspace context
      const backendUrl = `/api/facebook?action=simple&code=${encodeURIComponent(code)}&workspaceId=${encodeURIComponent(state.workspaceId)}&origin=${encodeURIComponent(state.origin || '')}`;
      console.log('🔍 Backend URL:', backendUrl);
      
      window.location.href = backendUrl;
    } else {
      console.log('❌ Missing code or workspaceId in callback');
      console.log('🔍 Code present:', !!code);
      console.log('🔍 State present:', !!stateRaw);
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
      Connecting Facebook to your workspace...
    </div>
  );
}
