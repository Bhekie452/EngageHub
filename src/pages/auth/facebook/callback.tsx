import React, { useEffect, useState } from 'react';

interface OAuthState {
  workspaceId: string;
  origin: string;
}

interface FacebookPage {
  pageId: string;
  pageName: string;
  name?: string;
  accessToken?: string;
  pageAccessToken?: string;
  instagramBusinessAccount?: { id: string };
  instagramBusinessAccountId?: string;
  instagramBusinessAccountUsername?: string;
  instagramUsername?: string;
  category?: string;
  hasInstagram?: boolean;
}

export default function FacebookCallback() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [workspaceId, setWorkspaceId] = useState<string>('');

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
      
      // Store workspaceId for later use
      setWorkspaceId(state.workspaceId);
      
      // Call backend for OAuth processing and immediate page fetch
      const backendUrl = `/api/facebook-auth?action=simple&code=${encodeURIComponent(code)}&workspaceId=${encodeURIComponent(state.workspaceId)}&origin=${encodeURIComponent(state.origin || '')}`;
      console.log('🔍 Backend URL:', backendUrl);
      
      fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          workspaceId: state.workspaceId,
          origin: state.origin
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('✅ OAuth + Pages response:', data);
        if (data.debug) {
          console.log('🔍 DEBUG - Raw pages from Facebook API:', JSON.stringify(data.debug.rawPages, null, 2));
          console.log('🔍 DEBUG - Permissions granted:', data.debug.permissions);
        }
        if (data.pages) {
          data.pages.forEach((p: any) => {
            console.log(`📄 Page "${p.pageName}" → hasInstagram: ${p.hasInstagram}, igId: ${p.instagramBusinessAccountId}, igUsername: ${p.instagramBusinessAccountUsername}`);
          });
        }
        setLoading(false);
        
        if (data.success && data.pages) {
          setPages(data.pages);
          console.log(`📄 Received ${data.pages.length} Facebook pages`);
        } else {
          setError(data.error || 'Failed to fetch Facebook pages');
        }
      })
      .catch(err => {
        console.error('❌ Callback error:', err);
        setError(err.message || 'Failed to connect Facebook');
        setLoading(false);
      });
    } else {
      console.log('❌ Missing code or workspaceId in callback');
      console.log('🔍 Code present:', !!code);
      console.log('🔍 State present:', !!stateRaw);
      setError('Missing OAuth parameters');
      setLoading(false);
    }
  }, []);

  const handlePageSelection = () => {
    if (!selectedPage) {
      alert('Please select a Facebook page to connect');
      return;
    }

    const selectedPageData = pages.find(p => p.pageId === selectedPage);
    if (!selectedPageData) return;

    console.log('🔗 Connecting to page:', selectedPageData.pageName);
    
    // 🔍 DEBUG: Check what we're sending
    const accessToken = selectedPageData.accessToken || selectedPageData.pageAccessToken;
    const igAccountId = selectedPageData.instagramBusinessAccount?.id || selectedPageData.instagramBusinessAccountId;
    
    console.log('=== PAGE CONNECTION DEBUG ===');
    console.log('1. pageId:', selectedPageData.pageId);
    console.log('2. pageAccessToken:', accessToken ? 'Present' : 'Missing');
    console.log('3. pageName:', selectedPageData.pageName);
    console.log('4. workspaceId:', workspaceId);
    console.log('5. instagramBusinessAccountId:', igAccountId);
    
    // Call backend to connect selected page
    fetch('/api/facebook-auth?action=connect-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId: selectedPageData.pageId,
        pageAccessToken: accessToken,
        pageName: selectedPageData.pageName,
        workspaceId: workspaceId,
        instagramBusinessAccountId: igAccountId
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Save connected platform to localStorage
        const connectedPlatforms = JSON.parse(localStorage.getItem('connected_platforms') || '[]');
        if (!connectedPlatforms.includes('facebook')) {
          connectedPlatforms.push('facebook');
          localStorage.setItem('connected_platforms', JSON.stringify(connectedPlatforms));
        }
        alert(`✅ Connected to Facebook Page: ${selectedPageData.pageName}!`);
        // Force a full page reload to refresh the UI state
        window.location.href = '/#social';
      } else {
        alert(`Failed to connect page: ${data.error || 'Unknown error'}`);
      }
    })
    .catch(err => {
      console.error('❌ Page connection error:', err);
      alert(`Failed to connect page: ${err.message || 'Network error'}`);
    });
  };

  if (loading) {
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

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: 'red'
      }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Select a Facebook Page</h2>
      
      {pages.length === 0 && (
        <p>No Facebook pages found or permissions missing.</p>
      )}
      
      {pages.map(page => (
        <div key={page.pageId} style={{ 
          marginBottom: '10px',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="page"
              value={page.pageId}
              checked={selectedPage === page.pageId}
              onChange={(e) => setSelectedPage(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>{page.pageName}</div>
              {page.hasInstagram ? (
                <div style={{ fontSize: '12px', color: '#16a34a' }}>
                  📷 Instagram Connected{page.instagramBusinessAccountUsername ? ` — @${page.instagramBusinessAccountUsername}` : page.instagramBusinessAccountId ? ` (ID: ${page.instagramBusinessAccountId})` : ''}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#999' }}>
                  No Instagram Business Account linked
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#666' }}>
                Category: {page.category || 'Unknown'}
              </div>
            </div>
          </label>
        </div>
      ))}
      
      {pages.length > 0 && (
        <button
          onClick={handlePageSelection}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Connect Selected Page
        </button>
      )}
    </div>
  );
}
