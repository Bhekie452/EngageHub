import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Instagram, LogOut, ExternalLink } from 'lucide-react';

interface InstagramConnection {
  id: string;
  account_type: 'profile' | 'business';
  display_name: string;
  access_token?: string;
  platform_data?: any;
  connection_status: string;
  account_id?: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  account_type: string;
  media_count?: number;
  follower_count?: number;
  follows_count?: number;
  profile_pic_url?: string;
  isConnected?: boolean;
  connectionId?: string;
}

export default function InstagramConnection() {
  const [connections, setConnections] = useState<InstagramConnection[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
      
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'instagram')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading Instagram connections:', error);
        return;
      }

      const instagramConnections = data || [];
      setConnections(instagramConnections);

      // For demo purposes, show some mock available accounts
      // In real implementation, this would come from Instagram API
      const mockAccounts: InstagramAccount[] = [
        {
          id: 'mock_1',
          username: 'your_business_account',
          account_type: 'business',
          media_count: 150,
          follower_count: 5000,
          follows_count: 250,
          profile_pic_url: 'https://via.placeholder.com/150',
          isConnected: false
        },
        {
          id: 'mock_2',
          username: 'your_creator_account',
          account_type: 'creator',
          media_count: 85,
          follower_count: 1200,
          follows_count: 180,
          profile_pic_url: 'https://via.placeholder.com/150',
          isConnected: false
        }
      ];

      setAvailableAccounts(mockAccounts);
    } catch (error) {
      console.error('Error in loadData:', error);
    }
  };

  const handleConnectInstagram = () => {
    window.open('https://www.instagram.com/accounts/login/', '_blank');
  };

  const handleConnectAccount = async (account: InstagramAccount) => {
    try {
      setProcessingId(account.id);
      
      // For now, this is a placeholder implementation
      // In real implementation, you would:
      // 1. Initiate Instagram OAuth flow
      // 2. Get access token
      // 3. Save connection to database
      
      console.log('Connecting to Instagram account:', account.username);
      
      // Simulate connection for demo
      setTimeout(() => {
        alert(`✅ Connected to Instagram: ${account.username}`);
        setProcessingId(null);
        
        // Update account connection status
        setAvailableAccounts(prev => 
          prev.map(acc => 
            acc.id === account.id 
              ? { ...acc, isConnected: true }
              : acc
          )
        );
      }, 1500);
      
    } catch (error) {
      console.error('Error connecting Instagram account:', error);
      alert('Failed to connect Instagram account');
      setProcessingId(null);
    }
  };

  const handleDisconnectAccount = async (account: InstagramAccount) => {
    if (!confirm(`Are you sure you want to disconnect ${account.username}?`)) return;

    try {
      setProcessingId(account.id);
      
      // For now, this is a placeholder implementation
      // In real implementation, you would remove the connection from database
      
      console.log('Disconnecting from Instagram account:', account.username);
      
      // Simulate disconnection for demo
      setTimeout(() => {
        alert(`✅ Disconnected from Instagram: ${account.username}`);
        setProcessingId(null);
        
        // Update account connection status
        setAvailableAccounts(prev => 
          prev.map(acc => 
            acc.id === account.id 
              ? { ...acc, isConnected: false }
              : acc
          )
        );
      }, 1000);
      
    } catch (error) {
      console.error('Error disconnecting Instagram account:', error);
      alert('Failed to disconnect Instagram account');
      setProcessingId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 rounded-2xl border flex flex-col gap-6 group transition-all duration-300 shadow-sm bg-white border-pink-100 ring-1 ring-pink-50/50 hover:shadow-lg hover:shadow-pink-100/50">
      {/* Header / Profile Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300 bg-white border border-pink-50">
            <Instagram size={28} className="text-pink-500" />
          </div>
          <div className="overflow-hidden">
            <h4 className="text-md font-black truncate leading-tight text-gray-500">
              Instagram
            </h4>
            <p className="text-xs text-gray-400 font-semibold mt-1 truncate uppercase tracking-wider">
              {connections.length > 0 ? 'Connected' : 'Not Connected'}
            </p>
          </div>
        </div>

        <button
          onClick={handleConnectInstagram}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
          title="Connect Instagram"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            Connected Accounts
            <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-md text-[9px] border border-pink-100">
              {availableAccounts.filter(acc => acc.isConnected).length}
            </span>
          </h5>
        </div>

        {availableAccounts.filter(acc => acc.isConnected).length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {availableAccounts
              .filter(account => account.isConnected)
              .map(account => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 group/account hover:border-pink-200 hover:bg-pink-50/30 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 text-pink-600 shadow-xs">
                      <Instagram size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-700 truncate line-clamp-1">{account.username}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                        <span>{account.account_type}</span>
                        <span>•</span>
                        <span>{account.follower_count?.toLocaleString() || '0'} followers</span>
                        <span>•</span>
                        <span>{account.media_count?.toLocaleString() || '0'} media</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnectAccount(account)}
                    className="p-1.5 text-gray-300 hover:text-pink-500 transition-colors bg-transparent opacity-0 group-hover/account:opacity-100"
                    title="Disconnect Account"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-4 text-center rounded-xl border border-dashed border-gray-200">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">No Accounts Connected</p>
          </div>
        )}
      </div>

      {/* Available Accounts to Connect */}
      {availableAccounts.filter(acc => !acc.isConnected).length > 0 && (
        <div className="pt-4 border-t border-gray-50">
          <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Available to Connect</h5>
          <div className="space-y-2">
            {availableAccounts
              .filter(account => !account.isConnected)
              .map(account => (
                <div key={account.id} className="flex items-center justify-between p-2 pl-3 rounded-xl border border-gray-100 bg-white hover:border-pink-200 transition-all">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <img 
                        src={account.profile_pic_url} 
                        alt={account.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-sm font-semibold text-gray-600 truncate">{account.username}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                        <span>{account.account_type}</span>
                        <span>•</span>
                        <span>{account.follower_count?.toLocaleString() || '0'} followers</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnectAccount(account)}
                    disabled={processingId === account.id}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {processingId === account.id ? '...' : 'Connect'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
