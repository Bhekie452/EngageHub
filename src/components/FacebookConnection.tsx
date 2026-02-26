import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Facebook, LogOut, ExternalLink, MoreVertical, CheckCircle2 } from 'lucide-react';
import { loginWithFacebook, initiateFacebookOAuth } from '../lib/facebook';

export default function FacebookConnection() {
  const [connection, setConnection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnection();
    const handleUpdate = () => loadConnection();
    window.addEventListener('facebookConnected', handleUpdate);
    return () => window.removeEventListener('facebookConnected', handleUpdate);
  }, []);

  const loadConnection = async () => {
    try {
      setLoading(true);
      let workspaceId = localStorage.getItem('current_workspace_id');
      if (!workspaceId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: ws } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
          if (ws?.length) {
            workspaceId = ws[0].id;
            localStorage.setItem('current_workspace_id', workspaceId);
          }
        }
      }
      if (!workspaceId) workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';

      const { data } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .order('created_at', { ascending: false });

      // Find a connected account: prefer page, check both connection_status and is_active
      const connected = (data || []).filter((a: any) => a.connection_status === 'connected' || a.is_active);
      const page = connected.find((a: any) => a.account_type === 'page') ?? connected[0] ?? null;
      console.log('[FacebookConnection] Found accounts:', data?.length, 'connected:', connected.length, 'selected:', page?.id);
      setConnection(page);
    } catch (err) {
      console.error('Error loading Facebook connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    try {
      loginWithFacebook();
    } catch {
      initiateFacebookOAuth();
    }
  };

  const handleDisconnect = async () => {
    if (!connection?.id) return;
    if (!confirm('Disconnect Facebook?')) return;
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
      await supabase.from('social_accounts').update({ is_active: false, connection_status: 'disconnected' }).eq('workspace_id', workspaceId).eq('platform', 'facebook');
      setConnection(null);
    } catch (err) {
      console.error('Error disconnecting Facebook:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between min-h-[220px] animate-pulse">
        <div>
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
            <div className="h-6 w-12 bg-gray-100 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        </div>
      </div>
    );
  }

  const isConnected = !!connection;
  const displayName = connection?.display_name || 'Facebook';
  const username = connection?.username || connection?.account_id || '';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between group transition-all duration-300 hover:shadow-md min-h-[220px]">
      {/* Top row: icon + badges */}
      <div>
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <Facebook size={22} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Platform info */}
        <div className="mb-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-lg font-bold text-gray-900">Facebook</h4>
            {isConnected && <CheckCircle2 size={16} className="text-blue-500" />}
          </div>
          {isConnected ? (
            <>
              <p className="text-sm text-gray-600 truncate mt-0.5">{displayName}</p>
              <p className="text-xs text-gray-400 font-medium truncate uppercase tracking-wider mt-0.5">
                {username ? username.toString().replace(/^profile_/, '') : 'CONNECTED'}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">Not connected</p>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-auto pt-4">
        {isConnected ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDisconnect}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <LogOut size={15} className="rotate-180" />
              Disconnect
            </button>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
          >
            Connect Account
          </button>
        )}
      </div>
    </div>
  );
}
