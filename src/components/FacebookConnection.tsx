import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Facebook, LogOut } from 'lucide-react';
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
        .eq('connection_status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1);

      // Prefer page account, then any connected account
      const page = data?.find((a: any) => a.account_type === 'page') ?? data?.[0] ?? null;
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
      <div className="p-6 rounded-2xl border flex flex-col justify-between shadow-sm min-h-[160px] bg-white border-gray-100 animate-pulse">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  const isConnected = !!connection;
  const displayName = connection?.display_name || 'Facebook';
  const username = connection?.username || connection?.account_id || '';

  return (
    <div
      className={`p-6 rounded-2xl border flex flex-col justify-between group transition-all duration-300 shadow-sm min-h-[160px] ${isConnected
          ? 'bg-white border-blue-100 ring-1 ring-blue-50/50 hover:shadow-lg hover:shadow-blue-100/50'
          : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
        }`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300 ${isConnected ? 'bg-white border border-gray-50' : 'bg-gray-50'
            }`}
        >
          <Facebook size={28} className={isConnected ? 'text-blue-600' : 'text-gray-600'} />
        </div>
        <div className="overflow-hidden">
          <h4 className={`text-md font-black truncate leading-tight ${isConnected ? 'text-gray-900' : 'text-gray-700'}`}>
            {isConnected ? displayName : 'Facebook'}
          </h4>
          <p className="text-xs text-gray-500 font-semibold mt-1 truncate uppercase tracking-wider">
            {isConnected ? (username ? username.toString().replace(/^profile_/, '') : 'Connected') : 'Not Connected'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex-1">
          {isConnected && (
            <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100 shadow-sm w-fit">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>

        {!isConnected && (
          <button
            onClick={handleConnect}
            className="flex items-center gap-1.5 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-lg shadow-blue-200/50 transition-all ml-auto"
          >
            Connect
          </button>
        )}

        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Disconnect Facebook"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
