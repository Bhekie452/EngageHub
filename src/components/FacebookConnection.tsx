import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Facebook, Instagram, LogOut } from 'lucide-react';
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
      workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    }

    // Optimistic: Set loading false immediately, then handle data
    setLoading(false);
    setError(null);

    try {
      // 1. Get connected accounts from DB (parallel with page fetch)
      const results = await Promise.allSettled([
        supabase
          .from('social_accounts')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('platform', 'facebook')
          .eq('connection_status', 'connected')
          .order('created_at', { ascending: false }),

        // Check if profile exists for page fetch
        (async () => {
          const { data: tempConnections } = await supabase
            .from('social_accounts')
            .select('access_token')
            .eq('workspace_id', workspaceId)
            .eq('platform', 'facebook')
            .eq('account_type', 'profile')
            .eq('connection_status', 'connected')
            .limit(1);

          const profile = tempConnections?.[0];
          if (profile?.access_token) {
            return fetch('/api/facebook?action=list-pages', {
              headers: {
                'Authorization': `Bearer ${profile.access_token}`
              }
            });
          }
          return { success: false, pages: [] };
        })()
      ]);

      const dbConnections = results[0].status === 'fulfilled' ? results[0].value.data : [];
      const pagesData = results[1].status === 'fulfilled'
        ? (results[1].value as any)
        : { success: false, pages: [] };

      setConnections(dbConnections || []);

      // 2. If profile is connected, merge available pages
      if (pagesData.success && pagesData.pages) {
        // Merge with connection status
        const pagesWithStatus = pagesData.pages.map((page: any) => {
          const existingConn = dbConnections.find(
            c => c.account_type === 'page' && c.account_id === page.pageId
          );
          return {
            ...page,
            connected: !!existingConn,
            connectionId: existingConn?.id
          };
        });

        setAvailablePages(pagesWithStatus);
        console.log(`📄 Loaded ${pagesWithStatus.length} available pages`);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load Facebook data');
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
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

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
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

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
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

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
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  // Separate profile connection
  const profileConnection = connections.find(conn => conn.account_type === 'profile');

  if (!profileConnection) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-xl shadow-blue-50/50 border-b-4 border-b-blue-500 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-20 h-20 bg-gradient-to-br from-[#1877F2] to-[#0d62d1] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-200">
          <Facebook size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Connect Facebook</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed font-medium">
          Manage your Facebook Pages and Instagram Business accounts directly from EngageHub.
        </p>
        <button
          onClick={handleConnectFacebook}
          className="w-full max-w-xs mx-auto bg-gradient-to-r from-[#1877F2] to-[#166fe5] text-white py-4 px-8 rounded-xl hover:from-[#166fe5] hover:to-[#1464cc] font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-200/50 hover:scale-[1.02] active:scale-95 group"
        >
          <Facebook className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
          Connect Facebook Account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-100">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-blue-200/50">
            <Facebook className="text-blue-600 w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profileConnection.display_name}</h2>
            <div className="flex items-center mt-1">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100 shadow-sm">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Profile Connected
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleDisconnectProfile}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
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

