import React, { useState, useEffect } from 'react';
import { Instagram, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { getConnectedInstagramAccounts } from '../lib/facebook';
import { supabase } from '../lib/supabase';

interface InstagramAccount {
  pageId: string;
  pageName: string;
  pageToken: string;
  instagram: {
    id: string;
    username: string;
    profilePicture: string;
  };
}

interface ConnectedAccount {
  id: string;
  platform: string;
  account_type: string;
  display_name: string;
  username: string;
  access_token?: string;
  platform_data?: any;
  connection_status: string;
  account_id?: string;
}

export default function InstagramConnection() {
  const [availableAccounts, setAvailableAccounts] = useState<InstagramAccount[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);

  // Fetch available Instagram accounts from Facebook Pages
  useEffect(() => {
    fetchAvailableInstagramAccounts();
    fetchConnectedAccounts();
  }, []);

  const fetchAvailableInstagramAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // This uses Facebook token to get Instagram accounts
      const accounts = await getConnectedInstagramAccounts();
      
      console.log('📸 Available Instagram accounts:', accounts);
      setAvailableAccounts(accounts);
      
      if (accounts.length === 0) {
        setError('No Instagram Business accounts found. Please link Instagram to your Facebook Page first.');
      }
      
    } catch (err: any) {
      console.error('❌ Failed to fetch Instagram accounts:', err);
      setError(err.message || 'Failed to load Instagram accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id');
      if (!workspaceId) return;

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'instagram')
        .eq('connection_status', 'connected')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connected Instagram accounts:', error);
        return;
      }

      const instagramConnections = data || [];
      setConnectedAccounts(instagramConnections);
      
    } catch (err) {
      console.error('❌ Error fetching connected accounts:', err);
    }
  };

  const handleConnectInstagram = async (account: InstagramAccount) => {
    try {
      setConnecting(account.instagram.id);
      setError('');

      const workspaceId = localStorage.getItem('current_workspace_id');
      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      console.log('📸 Connecting Instagram account:', account);

      const payload = {
        workspaceId: workspaceId,
        platform: 'instagram',
        accountId: account.instagram.id,
        username: account.instagram.username,
        displayName: `@${account.instagram.username}`,
        accessToken: account.pageToken, // Use Facebook page token
        platformData: {
          connectedFacebookPageId: account.pageId,
          connectedFacebookPageName: account.pageName,
          profilePicture: account.instagram.profilePicture,
        },
      };

      console.log('📤 Instagram connection payload:', payload);

      const response = await fetch('/api/social-accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to connect Instagram');
      }

      console.log('✅ Instagram connected:', data);
      alert(`✅ Successfully connected @${account.instagram.username}!`);

      // Refresh connected accounts
      await fetchConnectedAccounts();

    } catch (err: any) {
      console.error('❌ Instagram connection error:', err);
      setError(err.message || 'Failed to connect Instagram account');
      alert(`❌ ${err.message}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this Instagram account?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('account_id', accountId);

      if (error) {
        throw new Error('Failed to disconnect account');
      }

      alert('✅ Instagram account disconnected');
      await fetchConnectedAccounts();

    } catch (err) {
      console.error('❌ Disconnect error:', err);
      alert('❌ Failed to disconnect account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Instagram accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
          <div>
            <p className="text-red-800 font-medium">Connection Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            {error.includes('No Instagram Business accounts') && (
              <div className="mt-3 text-sm text-red-700">
                <p className="font-medium">How to fix:</p>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Convert your Instagram to a Business account</li>
                  <li>Go to your Facebook Page settings</li>
                  <li>Link your Instagram Business account</li>
                  <li>Reconnect your Facebook account here</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg"
              >
                <div className="flex items-center">
                  <CheckCircle2 className="text-green-600 mr-3" size={24} />
                  <div>
                    <p className="font-medium">{account.display_name}</p>
                    <p className="text-sm text-gray-600">
                      via {account.platform_data?.connectedFacebookPageName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(account.account_id!)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Instagram Accounts */}
      {availableAccounts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Instagram Accounts</h3>
          <div className="space-y-3">
            {availableAccounts.map((account) => {
              const isConnected = connectedAccounts.some(
                (c) => c.account_id === account.instagram.id
              );
              const isConnecting = connecting === account.instagram.id;

              return (
                <div
                  key={account.instagram.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Instagram className="text-pink-500 mr-3" size={24} />
                    <div>
                      <p className="font-medium">@{account.instagram.username}</p>
                      <p className="text-sm text-gray-600">
                        Connected to {account.pageName}
                      </p>
                    </div>
                  </div>

                  {isConnected ? (
                    <span className="text-green-600 text-sm font-medium">
                      ✓ Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnectInstagram(account)}
                      disabled={isConnecting}
                      className="bg-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isConnecting ? (
                        <span className="flex items-center">
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Connecting...
                        </span>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Accounts Available */}
      {!loading && availableAccounts.length === 0 && !error && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Instagram className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-2">No Instagram Business accounts found</p>
          <p className="text-sm text-gray-500 mb-4">
            Connect a Facebook Page with a linked Instagram Business account first
          </p>
          <a
            href="/social-media"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ExternalLink className="mr-1" size={16} />
            Go to Social Media
          </a>
        </div>
      )}
    </div>
  );
}
