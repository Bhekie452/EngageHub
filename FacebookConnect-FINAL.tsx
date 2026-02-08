import React, { useState, useEffect, useCallback } from 'react';
import {
  handleFacebookCallback,
  isConnectedToFacebook,
  getPageTokens,
  disconnectFacebook,
  getStoredAccessToken
} from './facebook-FINAL';

interface FacebookPage {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: any;
}

export const FacebookConnectFinal: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Handle Facebook connection event
  const handleConnected = useCallback((event: CustomEvent) => {
    console.log('🎉 Facebook connected event received:', event.detail);
    setIsConnected(true);
    setLoading(false);
    setError(null);
    
    if (event.detail?.pages) {
      setPages(event.detail.pages);
    }
  }, []);

  // Handle Facebook disconnection event
  const handleDisconnected = useCallback(() => {
    console.log('🔌 Facebook disconnected event received');
    setIsConnected(false);
    setPages([]);
    setLoading(false);
    setError(null);
  }, []);

  // Initialize component and handle OAuth callback
  useEffect(() => {
    let mounted = true;

    const initializeFacebook = async () => {
      if (initialized) return; // Prevent multiple initializations
      
      try {
        setLoading(true);
        console.log('🔄 Initializing Facebook connection...');
        
        // Add event listeners
        window.addEventListener('facebook-connected', handleConnected as EventListener);
        window.addEventListener('facebook-disconnected', handleDisconnected as EventListener);
        
        // Handle OAuth callback if present
        const callbackResult = await handleFacebookCallback();
        if (callbackResult && mounted) {
          console.log('✅ Facebook callback processed successfully');
          setIsConnected(true);
          setPages(callbackResult.pages || []);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // Check existing connection
        const connected = isConnectedToFacebook();
        console.log('📋 Existing connection status:', connected);
        
        if (mounted) {
          setIsConnected(connected);
          setInitialized(true);
          
          if (connected) {
            // Load pages if already connected
            try {
              const userPages = await getPageTokens();
              if (mounted) {
                setPages(userPages);
                console.log(`📄 Loaded ${userPages.length} existing Facebook pages`);
              }
            } catch (err: any) {
              console.error('❌ Failed to load existing pages:', err);
              if (mounted) {
                setError(err.message);
              }
            }
          }
        }
        
      } catch (err: any) {
        console.error('❌ Facebook initialization error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeFacebook();

    // Cleanup
    return () => {
      mounted = false;
      window.removeEventListener('facebook-connected', handleConnected as EventListener);
      window.removeEventListener('facebook-disconnected', handleDisconnected as EventListener);
    };
  }, [initialized, handleConnected, handleDisconnected]);

  const handleConnect = () => {
    setError(null);
    setLoading(true);
    
    // Import and call the OAuth initiation function
    import('./facebook-FINAL').then(({ initiateFacebookOAuth }) => {
      initiateFacebookOAuth();
    }).catch(err => {
      console.error('❌ Failed to load Facebook module:', err);
      setError('Failed to initialize Facebook connection');
      setLoading(false);
    });
  };

  const handleDisconnect = () => {
    setError(null);
    setLoading(true);
    
    disconnectFacebook();
    
    // State will be updated by the event listener
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleRefreshPages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear cached pages to force refresh
      if (typeof window !== 'undefined') {
        localStorage.removeItem('facebook_pages');
      }
      
      const userPages = await getPageTokens();
      setPages(userPages);
      console.log(`📄 Refreshed ${userPages.length} Facebook pages`);
    } catch (err: any) {
      console.error('❌ Failed to refresh pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Initializing Facebook connection...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Facebook Integration</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-start">
            <div>
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={handleClearError}
              className="ml-2 text-red-500 hover:text-red-700"
              aria-label="Clear error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600">
            Connect your Facebook account to manage pages and publish content.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              'Connect Facebook'
            )}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700 font-semibold">Connected to Facebook</span>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="text-red-600 hover:text-red-800 disabled:text-gray-400 text-sm"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Your Facebook Pages</h3>
              <button
                onClick={handleRefreshPages}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 text-sm"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {pages.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pages.map((page) => (
                  <div key={page.id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium">{page.name}</div>
                    <div className="text-sm text-gray-600">ID: {page.id}</div>
                    {page.instagram_business_account && (
                      <div className="text-sm text-green-600">✓ Instagram Business Account</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                {loading ? 'Loading pages...' : 'No Facebook pages found. Make sure you have admin access to at least one Facebook page.'}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 border-t pt-4">
            <div>Token Status: {getStoredAccessToken() ? '✓ Valid' : '✗ Missing'}</div>
            <div>Pages Cached: {pages.length} pages</div>
            <div>Connection Status: {isConnected ? '✓ Connected' : '✗ Disconnected'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookConnectFinal;
