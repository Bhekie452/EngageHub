import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FacebookPage {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  category?: string;
  hasInstagram?: boolean;
  instagramBusinessAccountId?: string;
  fanCount?: number;
}

interface FacebookPageSelectorProps {
  onPageSelected: (page: FacebookPage) => void;
  onCancel: () => void;
  workspaceId: string;
}

export default function FacebookPageSelector({ onPageSelected, onCancel, workspaceId }: FacebookPageSelectorProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFacebookPages();
  }, []);

  const fetchFacebookPages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's Facebook token from most recent connection
      const { data: connections, error: connError } = await supabase
        .from('social_accounts')
        .select('access_token')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('account_type', 'profile')
        .eq('connection_status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1);

      if (connError) throw connError;

      const profileConnection = connections?.[0];
      if (!profileConnection?.access_token) {
        throw new Error('No Facebook profile connection found');
      }

      // Fetch pages using the profile token
      const response = await fetch('/api/facebook?action=list-pages', {
        headers: {
          'Authorization': `Bearer ${profileConnection.access_token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pages');
      }

      if (data.success && data.pages) {
        setPages(data.pages);
      } else {
        throw new Error('No pages found');
      }
    } catch (err: any) {
      console.error('Error fetching Facebook pages:', err);
      setError(err.message || 'Failed to load Facebook pages');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPage = async () => {
    if (!selectedPageId) {
      setError('Please select a Facebook page');
      return;
    }

    const selectedPage = pages.find(p => p.pageId === selectedPageId);
    
    // 🔍 CRITICAL DEBUGGING - Check each field individually
    console.log('=== CONNECT PAGE DEBUG ===');
    console.log('1. selectedPageId:', selectedPageId);
    console.log('2. selectedPage object:', selectedPage);
    console.log('3. workspaceId:', workspaceId);
    
    // Check if selectedPage exists
    if (!selectedPage) {
      console.error('❌ Selected page not found in pages array!');
      setError('Selected page not found');
      return;
    }
    
    // Check individual fields
    console.log('4. selectedPage.pageId:', selectedPage.pageId);
    console.log('5. selectedPage.pageAccessToken:', selectedPage.pageAccessToken);
    console.log('6. selectedPage.pageName:', selectedPage.pageName);
    console.log('7. selectedPage.instagramBusinessAccountId:', selectedPage.instagramBusinessAccountId);
    
    // Build payload
    const payload = {
      workspaceId: workspaceId,
      pageId: selectedPage.pageId,
      pageAccessToken: selectedPage.pageAccessToken,
      pageName: selectedPage.pageName,
      instagramBusinessAccountId: selectedPage.instagramBusinessAccountId,
    };
    
    console.log('8. Final Payload:', payload);
    console.log('9. Payload as JSON:', JSON.stringify(payload, null, 2));
    
    // Detailed validation
    const missingFields = [];
    if (!payload.workspaceId) {
      missingFields.push('workspaceId');
      console.error('❌ workspaceId is missing or undefined');
    }
    if (!payload.pageId) {
      missingFields.push('pageId');
      console.error('❌ pageId is missing or undefined');
    }
    if (!payload.pageAccessToken) {
      missingFields.push('pageAccessToken');
      console.error('❌ pageAccessToken is missing or undefined');
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('❌ VALIDATION FAILED:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    console.log('✅ All required fields present, making API call...');
    console.log('=== END DEBUG ===');

    setConnecting(true);
    setError('');

    try {
      const response = await fetch('/api/facebook?action=connect-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Backend response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to connect page');
      }

      alert(`✅ Successfully connected to ${selectedPage.pageName}!`);
      onPageSelected(selectedPage);

      setTimeout(() => {
        window.location.href = '/social-media';
      }, 1500);

    } catch (err: any) {
      console.error('❌ Connection error:', err);
      setError(err.message || 'Failed to connect page');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading your Facebook pages...</h2>
          <p className="text-gray-500 mt-2">Please wait while we fetch your pages.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Pages</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchFacebookPages}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Facebook Pages Found</h2>
          <p className="text-gray-600 mb-6">
            You don't have any Facebook pages to connect. You can create a page on Facebook first and then return here to connect it.
          </p>
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select a Facebook Page</h1>
            <p className="text-gray-600">
              Choose which Facebook page you want to connect to your ERP system
            </p>
          </div>

          {/* Pages List */}
          <div className="space-y-3 mb-8">
            {pages.map((page) => (
              <label
                key={page.pageId}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPageId === page.pageId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="facebook-page"
                    value={page.pageId}
                    checked={selectedPageId === page.pageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-gray-900">{page.pageName}</div>
                    <div className="text-sm text-gray-500">
                      Page ID: {page.pageId}
                      {page.category && ` • ${page.category}`}
                      {page.fanCount && ` • ${page.fanCount} fans`}
                    </div>
                    {page.hasInstagram && (
                      <div className="text-sm text-purple-600 mt-1">
                        📷 Instagram Connected
                      </div>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={handleConnectPage}
              disabled={!selectedPageId || connecting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {connecting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </span>
              ) : (
                'Connect This Page'
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={connecting}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
