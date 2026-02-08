import React, { useState, useEffect } from 'react';
import {
  initiateFacebookOAuth,
  handleFacebookCallback,
  isConnectedToFacebook,
  getPageTokens,
  disconnectFacebook,
  getStoredAccessToken
} from './src/lib/facebook';

interface FacebookPage {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: any;
}

export const FacebookConnectExample: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check connection status and handle OAuth callback on component mount
  useEffect(() => {
    const initializeFacebook = async () => {
      try {
        setLoading(true);
        
        // Handle OAuth callback if present
        const callbackResult = await handleFacebookCallback();
        if (callbackResult) {
          setIsConnected(true);
          setPages(callbackResult.pages || []);
          return;
        }
        
        // Check existing connection
        const connected = isConnectedToFacebook();
        setIsConnected(connected);
        
        if (connected) {
          // Load pages
          const userPages = await getPageTokens();
          setPages(userPages);
        }
        
      } catch (err: any) {
        console.error('Facebook initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeFacebook();
  }, []);

  const handleConnect = () => {
    setError(null);
    initiateFacebookOAuth();
  };

  const handleDisconnect = () => {
    disconnectFacebook();
    setIsConnected(false);
    setPages([]);
  };

  const handleRefreshPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const userPages = await getPageTokens();
      setPages(userPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Facebook connection...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Facebook Integration</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isConnected ? (
        <div className="text-center">
          <p className="mb-4 text-gray-600">
            Connect your Facebook account to manage pages and publish content.
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Connect Facebook
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
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Disconnect
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Your Facebook Pages</h3>
              <button
                onClick={handleRefreshPages}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Refresh
              </button>
            </div>
            
            {pages.length > 0 ? (
              <div className="space-y-2">
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
                No Facebook pages found. Make sure you have admin access to at least one Facebook page.
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 border-t pt-4">
            <div>Token Status: {getStoredAccessToken() ? '✓ Valid' : '✗ Missing'}</div>
            <div>Pages Cached: {pages.length} pages</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookConnectExample;
