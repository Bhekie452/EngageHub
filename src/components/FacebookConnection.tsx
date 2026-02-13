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

      let pagesData = { success: false, pages: [] };
      if (results[1].status === 'fulfilled') {
        const val = results[1].value as any;
        if (val instanceof Response) {
          if (val.ok) {
            pagesData = await val.json();
          } else {
            const errorText = await val.text();
            console.error('❌ Failed to fetch available pages:', val.status, errorText);
            // Don't throw, just proceed with DB connections
          }
        } else {
          pagesData = val;
        }
      }

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
      <div className="p-6 rounded-2xl border flex flex-col justify-between group transition-all duration-300 shadow-sm min-h-[160px] bg-gray-50/50 border-gray-100 filter grayscale-[0.2] hover:bg-white">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300 bg-gray-100">
            <Facebook size={28} className="text-gray-400" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-md font-black truncate leading-tight text-gray-500">
              Facebook
            </h4>
            <p className="text-xs text-gray-400 font-semibold mt-1 truncate uppercase tracking-wider">
              Not Connected
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex-1">
            <button
              onClick={handleConnectFacebook}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-wait w-full"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 rounded-2xl border flex flex-col justify-between group transition-all duration-300 shadow-sm min-h-[160px] bg-white border-blue-100 ring-1 ring-blue-50/50 hover:shadow-lg hover:shadow-blue-100/50">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300 bg-white border border-gray-50">
          <Facebook size={28} className="text-blue-600" />
        </div>
        <div className="overflow-hidden">
          <h4 className="text-md font-black truncate leading-tight text-gray-900">
            {profileConnection.display_name || 'Facebook'}
          </h4>
          <p className="text-xs text-gray-400 font-semibold mt-1 truncate uppercase tracking-wider">
            Connected
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex-1">
          <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100 shadow-sm w-fit">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <button
          onClick={handleDisconnectProfile}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
