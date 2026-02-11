import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FacebookConnection {
  id: string;
  account_type: 'profile' | 'page';
  display_name: string;
  access_token?: string;
  platform_data?: any;
  connection_status: string;
}

export default function FacebookConnection() {
  const [connections, setConnections] = useState<FacebookConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFacebookConnections();
  }, []);

  const loadFacebookConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = localStorage.getItem('current_workspace_id') || '26caa666-2797-40f9-aa99-399be01d57eb';
      
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('connection_status', 'connected')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else if (data && data.length > 0) {
        setConnections(data);
      } else {
        setError('No Facebook connections found');
      }
    } catch (err) {
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    // Clear any existing OAuth state
    Object.keys(sessionStorage).filter(key => key.startsWith('fb_')).forEach(key => sessionStorage.removeItem(key));
    
    // Generate unique state for OAuth
    const state = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem('fb_oauth_state', state);
    
    // Redirect to Facebook OAuth
    const facebookOAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${process.env.VITE_FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/facebook/callback')}` +
      `&scope=${encodeURIComponent('public_profile,email,pages_show_list,pages_read_engagement,instagram_basic')}` +
      `&response_type=code` +
      `&state=${state}`;
    
    window.location.href = facebookOAuthUrl;
  };

  const handleSelectPage = (pageId: string) => {
    // Store selected page ID
    localStorage.setItem('selected_facebook_page', pageId);
    console.log('✅ Selected Facebook page:', pageId);
  };

  if (loading) {
    return <div className="p-8">Loading Facebook connections...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">❌ {error}</h3>
        <button 
          onClick={loadFacebookConnections}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">🔗 Connect Facebook</h2>
        <p className="text-gray-600 mb-4">
          Connect your Facebook account to manage pages and publish content.
        </p>
        <button 
          onClick={handleConnectFacebook}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
        >
          Connect Facebook Account
        </button>
      </div>
    );
  }

  // Separate profile and page connections
  const profileConnection = connections.find(conn => conn.account_type === 'profile');
  const pageConnections = connections.filter(conn => conn.account_type === 'page');

  return (
    <div className="bg-white border rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔗 Facebook Connected</h2>
      
      {profileConnection && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-green-800 font-semibold mb-2">
            ✅ Profile: {profileConnection.display_name}
          </h3>
          <p className="text-green-600 text-sm">
            Connected {new Date(profileConnection.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {pageConnections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📄 Select Facebook Page</h3>
          <div className="space-y-2">
            {pageConnections.map((page) => (
              <div 
                key={page.id}
                onClick={() => handleSelectPage(page.id)}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">FB</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{page.display_name}</h4>
                    <p className="text-sm text-gray-600">Page ID: {page.id}</p>
                    {page.platform_data?.instagram_business_account_id && (
                      <p className="text-sm text-purple-600">
                        📷 Instagram Business Account Connected
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>
      )}

      <div className="mt-6 flex space-x-3">
        <button 
          onClick={loadFacebookConnections}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Refresh Connections
        </button>
        <button 
          onClick={handleConnectFacebook}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Another Account
        </button>
      </div>
    </div>
  );
}
