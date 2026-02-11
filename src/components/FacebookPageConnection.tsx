import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FacebookPage {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramBusinessAccountId?: string;
  category?: string;
  fanCount?: number;
  hasInstagram: boolean;
}

interface PageConnection {
  id: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  hasInstagram: boolean;
  instagramBusinessAccountId?: string;
  isConnected: boolean;
}

export default function FacebookPageConnection() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageConnection | null>(null);

  useEffect(() => {
    loadFacebookPages();
  }, []);

  const loadFacebookPages = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get existing page connections
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
      
      const { data: connections, error: connError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('account_type', 'page')
        .eq('connection_status', 'connected');

      if (connError) {
        throw connError;
      }

      if (connections && connections.length > 0) {
        // Transform connections to page format
        const pageConnections: FacebookPage[] = connections.map(conn => ({
          pageId: conn.account_id,
          pageName: conn.display_name,
          pageAccessToken: conn.access_token || '',
          instagramBusinessAccountId: conn.platform_data?.instagram_business_account_id,
          hasInstagram: !!conn.platform_data?.instagram_business_account_id,
          category: conn.platform_data?.category,
        }));

        setPages(pageConnections);
        console.log('✅ Loaded existing page connections:', pageConnections.length);
      } else {
        // No existing connections - need to connect via OAuth
        await fetchPagesFromOAuth();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load Facebook pages');
    } finally {
      setLoading(false);
    }
  };

  const fetchPagesFromOAuth = async () => {
    try {
      // Get user token from database first
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
      
      const response = await fetch(`/api/facebook?action=connections&workspaceId=${workspaceId}`);
      const data = await response.json();
      
      if (data.success && data.connections) {
        // Find profile connection to get user token
        const profileConn = data.connections.find((c: any) => c.accountType === 'profile');
        
        if (profileConn && profileConn.accessToken) {
          // Set token in localStorage for future use
          localStorage.setItem('facebook_access_token', profileConn.accessToken);
          
          // Use this token to fetch pages
          const userToken = profileConn.accessToken;
          
          const pagesResponse = await fetch('/api/facebook?action=list-pages', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            },
          });

          const pagesData = await pagesResponse.json();

          if (pagesData.success) {
            setPages(pagesData.pages);
            console.log('✅ Fetched pages from OAuth:', pagesData.pages.length);
          } else {
            setError(pagesData.error || 'Failed to fetch pages');
          }
        } else {
          setError('No Facebook profile connection found. Please connect to Facebook first.');
        }
      } else {
        setError('Failed to load Facebook connections');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch pages');
    }
  };

  const handleConnectPage = async (page: FacebookPage) => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

      const response = await fetch('/api/facebook?action=connect-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: page.pageId,
          pageAccessToken: page.pageAccessToken,
          workspaceId,
          pageName: page.pageName,
          instagramBusinessAccountId: page.instagramBusinessAccountId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedPage(data.pageConnection);
        localStorage.setItem('selected_facebook_page', JSON.stringify(data.pageConnection));
        console.log('✅ Connected to page:', page.pageName);
        
        // Reload pages to show updated connection status
        loadFacebookPages();
      } else {
        setError(data.error || 'Failed to connect to page');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to connect to page');
    }
  };

  const handleDisconnectPage = async (pageId: string) => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('account_id', pageId);

      if (error) {
        throw error;
      }

      // Remove from local storage
      localStorage.removeItem('selected_facebook_page');
      setSelectedPage(null);
      
      // Reload pages
      loadFacebookPages();
      console.log('✅ Disconnected page:', pageId);

    } catch (err: any) {
      setError(err.message || 'Failed to disconnect page');
    }
  };

  if (loading) {
    return <div className="p-8">Loading Facebook pages...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-red-800 font-semibold mb-2">❌ {error}</h3>
        <button 
          onClick={loadFacebookPages}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">📄 Facebook Page Connections</h2>
      
      {pages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No Facebook pages connected</p>
          <p className="text-sm text-gray-500">
            Connect to Facebook first to see your available pages
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            Available Facebook Pages ({pages.length})
          </h3>
          
          {pages.map((page) => (
            <div 
              key={page.pageId}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">FB</span>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">{page.pageName}</h4>
                    <p className="text-sm text-gray-600">Page ID: {page.pageId}</p>
                    {page.category && (
                      <p className="text-sm text-gray-500">Category: {page.category}</p>
                    )}
                    {page.fanCount !== undefined && (
                      <p className="text-sm text-gray-500">Fans: {page.fanCount.toLocaleString()}</p>
                    )}
                    {page.hasInstagram && (
                      <p className="text-sm text-purple-600">📷 Instagram Business Account Connected</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {selectedPage?.pageId === page.pageId ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                      ✅ Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnectPage(page)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Connect
                    </button>
                  )}
                  
                  {selectedPage?.pageId === page.pageId && (
                    <button
                      onClick={() => handleDisconnectPage(page.pageId)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t">
        <button
          onClick={loadFacebookPages}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Refresh Pages
        </button>
      </div>
    </div>
  );
}
