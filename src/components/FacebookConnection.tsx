import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Facebook, Instagram } from 'lucide-react';
import { initiateFacebookOAuth } from '../lib/facebook';

interface FacebookConnection {
  id: string;
  account_type: 'profile' | 'page';
  display_name: string;
  access_token?: string;
  platform_data?: any;
  connection_status: string;
  account_id?: string;
}

interface FacebookPage {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramBusinessAccountId?: string;
  category?: string;
  fanCount?: number;
  hasInstagram: boolean;
  isConnected?: boolean;
  connectionId?: string;
}

export default function FacebookConnection() {
  const [connections, setConnections] = useState<FacebookConnection[]>([]);
  const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    // Listen for connection success event
    const handleConnectionSuccess = () => {
      loadData();
    };

    window.addEventListener('facebookConnected', handleConnectionSuccess);
    return () => window.removeEventListener('facebookConnected', handleConnectionSuccess);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadFacebookConnections();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load Facebook data');
    } finally {
      setLoading(false);
    }
  };

  const loadFacebookConnections = async () => {
    let workspaceId = localStorage.getItem('current_workspace_id');

    // If not in local storage, try to get from logged in user
    if (!workspaceId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);
        if (workspaces && workspaces.length > 0) {
          workspaceId = workspaces[0].id;
          // Cache it
          localStorage.setItem('current_workspace_id', workspaceId);
        }
      }
    }

    if (!workspaceId) {
      console.warn('No workspace ID found, defaulting to fallback or error');
      // Fallback or error handling
      workspaceId = '26caa666-2797-40f9-aa99-399be01d57eb';
    }

    // 1. Get connected accounts from DB
    const { data: dbConnections, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setConnections(dbConnections || []);

    // 2. If profile is connected, fetch available pages from Facebook API
    const profile = dbConnections?.find(c => c.account_type === 'profile');
    if (profile && profile.access_token) {
      await fetchAvailablePages(profile.access_token, dbConnections || []);
    }
  };

  const fetchAvailablePages = async (userToken: string, currentConnections: FacebookConnection[]) => {
    try {
      const response = await fetch('/api/facebook?action=list-pages', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const data = await response.json();

      if (data.success && data.pages) {
        // Merge with connection status
        const pagesWithStatus = data.pages.map((page: any) => {
          const existingConn = currentConnections.find(
            c => c.account_type === 'page' && c.account_id === page.pageId
          );
          return {
            ...page,
            isConnected: !!existingConn,
            connectionId: existingConn?.id
          };
        });
        setAvailablePages(pagesWithStatus);
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      // Don't block UI, just show connected ones
    }
  };

  const handleConnectFacebook = () => {
    // Use the centralized OAuth initiator from the library
    // This ensures state matches what the callback handler expects ('facebook_oauth')
    initiateFacebookOAuth();
  };

  const handleConnectPage = async (page: FacebookPage) => {
    try {
      setProcessingId(page.pageId);
      const workspaceId = localStorage.getItem('current_workspace_id') || '26caa666-2797-40f9-aa99-399be01d57eb';

      const response = await fetch('/api/facebook?action=connect-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: page.pageId,
          pageAccessToken: page.pageAccessToken,
          workspaceId,
          pageName: page.pageName,
          instagramBusinessAccountId: page.instagramBusinessAccountId
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh data
        await loadData();
      } else {
        alert('Failed to connect page: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error connecting page:', err);
      alert('Failed to connect page');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisconnectPage = async (page: FacebookPage) => {
    if (!confirm(`Are you sure you want to disconnect ${page.pageName}?`)) return;

    try {
      setProcessingId(page.pageId);
      const workspaceId = localStorage.getItem('current_workspace_id') || '26caa666-2797-40f9-aa99-399be01d57eb';

      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('account_id', page.pageId);

      if (error) throw error;

      // Refresh data
      await loadData();
    } catch (err) {
      console.error('Error disconnecting page:', err);
      alert('Failed to disconnect page');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisconnectProfile = async () => {
    if (!confirm('Disconnecting your profile will also disconnect all associated pages. Continue?')) return;

    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('current_workspace_id') || '26caa666-2797-40f9-aa99-399be01d57eb';

      // Delete all facebook connections for this workspace
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook');

      if (error) throw error;

      setConnections([]);
      setAvailablePages([]);
    } catch (err) {
      console.error('Error disconnecting profile:', err);
      alert('Failed to disconnect profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Facebook connections...</div>;
  }

  // Separate profile connection
  const profileConnection = connections.find(conn => conn.account_type === 'profile');

  if (!profileConnection) {
    return (
      <div className="bg-white border rounded-lg p-6 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Connect Facebook</h2>
        <p className="text-gray-600 mb-6">
          Connect your Facebook account to manage pages and publish content.
          You'll be able to select which pages to connect in the next step.
        </p>
        <button
          onClick={handleConnectFacebook}
          className="w-full bg-[#1877F2] text-white py-3 px-4 rounded-lg hover:bg-[#166fe5] font-semibold flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Connect Facebook Profile
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profileConnection.display_name}</h2>
            <p className="text-green-600 text-sm font-medium flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Connected
            </p>
          </div>
        </div>
        <button
          onClick={handleDisconnectProfile}
          className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded"
        >
          Disconnect Profile
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="text-xl mr-2">📄</span>
        Manage Pages
      </h3>

      {availablePages.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pages found for this profile.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availablePages.map((page) => (
            <div
              key={page.pageId}
              className={`p-4 border rounded-lg transition-all ${page.isConnected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${page.isConnected ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                    <span className="font-bold text-sm">P</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{page.pageName}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>ID: {page.pageId}</span>
                      {page.hasInstagram && (
                        <span className="flex items-center text-purple-600 font-medium">
                          • 📸 Instagram Linked
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => page.isConnected ? handleDisconnectPage(page) : handleConnectPage(page)}
                  disabled={processingId === page.pageId}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${processingId === page.pageId
                    ? 'bg-gray-300 text-gray-500 cursor-wait'
                    : page.isConnected
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {processingId === page.pageId ? 'Processing...' : (page.isConnected ? 'Disconnect' : 'Connect')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t flex justify-end">
        <button
          onClick={loadData}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Refresh List
        </button>
      </div>
    </div>
  );
}

