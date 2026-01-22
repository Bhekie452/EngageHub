

import React, { useState } from 'react';
import {
  Link2,
  Calendar,
  BarChart2,
  AtSign,
  MessageCircle,
  Mail,
  Plus,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  CheckCircle2,
  ExternalLink,
  MoreVertical,
  Youtube,
  Music,
  Pin,
  Store,
  Share2
} from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { initFacebookSDK, loginWithFacebook, getPageTokens } from '../src/lib/facebook';

type SocialTab = 'accounts' | 'schedule' | 'engagement' | 'mentions' | 'comments' | 'dms';

const SocialMedia: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SocialTab>('accounts');
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      // Initialize Facebook SDK (non-blocking - will use redirect OAuth if SDK fails)
      initFacebookSDK().catch((err) => {
        console.warn('Facebook SDK initialization failed, will use redirect OAuth:', err);
      });
      fetchConnectedAccounts();
      
      // Handle Facebook OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state === 'facebook_oauth') {
        handleFacebookCallback(code);
      }
    }
  }, [user]);

  const handleFacebookCallback = async (code: string) => {
    setIsLoading(true);
    try {
      // Exchange code for access token using backend or direct method
      const backendUrl = import.meta.env.VITE_API_URL || '';
      let accessToken: string;

      if (backendUrl) {
        // Use backend endpoint (recommended for production)
        const response = await fetch(`${backendUrl}/api/facebook/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code, 
            redirectUri: `${window.location.origin}${window.location.pathname}${window.location.hash || ''}` 
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Token exchange failed');
        }
        
        const data = await response.json();
        accessToken = data.access_token;
      } else {
        // No backend configured - show setup instructions
        const setupMsg = `🔧 Facebook OAuth Setup Required

For production, you need a backend server to securely exchange the OAuth code for an access token.

Options:
1. Set up a backend API endpoint (recommended)
   - Create endpoint: POST /api/facebook/token
   - Set VITE_API_URL in Vercel environment variables
   
2. Use Supabase Edge Functions
   - Create a function to handle token exchange
   
3. Configure Facebook App properly
   - Make sure your domain is in Valid OAuth Redirect URIs
   - App should be in Live mode or add test users

Current domain: ${window.location.origin}
Facebook App ID: ${import.meta.env.VITE_FACEBOOK_APP_ID || '1621732999001688'}

See FACEBOOK_SETUP.md for detailed instructions.`;

        alert(setupMsg);
        setIsLoading(false);
        // Clean up URL
        const returnUrl = sessionStorage.getItem('facebook_oauth_return') || window.location.pathname;
        window.history.replaceState({}, '', returnUrl);
        sessionStorage.removeItem('facebook_oauth_return');
        return;
      }

      const pages: any = await getPageTokens(accessToken);

      if (!pages?.length) {
        alert('No Facebook Pages found. Please make sure you have at least one Facebook Page.');
        return;
      }

      const page = pages[0];
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      const { error } = await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        platform: 'facebook',
        platform_account_id: page.id,
        account_name: page.name,
        access_token: page.access_token,
        is_active: true
      }, { onConflict: 'workspace_id,platform,platform_account_id' });

      if (error) throw error;

      alert(`✅ Connected to Facebook Page: ${page.name}!`);
      fetchConnectedAccounts();
    } catch (err: any) {
      console.error('Facebook callback error:', err);
      alert(`Failed to connect to Facebook: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) return;

      const { data } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaces[0].id)
        .eq('is_active', true);

      setConnectedAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectFacebook = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    // Note: We'll show the permissions info only if there's an error
    // For now, just proceed with the connection attempt

    setIsLoading(true);
    try {
      const authResponse: any = await loginWithFacebook();
      
      // If we got redirected, the callback handler will process it
      if (!authResponse || !authResponse.accessToken) {
        // OAuth redirect happened, callback will handle it
        return;
      }

      const pages: any = await getPageTokens(authResponse.accessToken);

      if (!pages?.length) {
        alert('No Facebook Pages found. Please make sure you have at least one Facebook Page associated with your account.');
        return;
      }

      const page = pages[0];
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      const { error } = await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        platform: 'facebook',
        platform_account_id: page.id,
        account_name: page.name,
        access_token: page.access_token,
        is_active: true
      }, { onConflict: 'workspace_id,platform,platform_account_id' });

      if (error) throw error;

      alert(`✅ Connected to Facebook Page: ${page.name}!`);
      fetchConnectedAccounts();
    } catch (err: any) {
      console.error('Connection error:', err);
      
      // Provide helpful error messages with setup instructions
      let errorMessage = 'Failed to connect to Facebook.\n\n';
      
      // Check for "Feature Unavailable" error (App configuration issue)
      if (err.message?.includes('Feature Unavailable') || 
          err.message?.includes('unavailable') || 
          err.message?.includes('updating additional details') ||
          err.message?.includes('currently unavailable')) {
        errorMessage = `🔴 Facebook App Configuration Required\n\n`;
        errorMessage += `The "Feature Unavailable" error means your Facebook App needs configuration.\n\n`;
        errorMessage += `This usually happens when:\n`;
        errorMessage += `• App is in development mode and needs setup\n`;
        errorMessage += `• Pages product is not added\n`;
        errorMessage += `• App settings are incomplete\n\n`;
        errorMessage += `✅ Quick Fix Steps:\n\n`;
        errorMessage += `1. Go to: https://developers.facebook.com/apps/1621732999001688\n\n`;
        errorMessage += `2. Complete App Setup:\n`;
        errorMessage += `   • Go to Settings → Basic\n`;
        errorMessage += `   • Fill in all required fields (App Name, Contact Email, etc.)\n`;
        errorMessage += `   • Add your domain to "App Domains"\n`;
        errorMessage += `   • Add redirect URI to "Valid OAuth Redirect URIs"\n\n`;
        errorMessage += `3. Add Pages Product:\n`;
        errorMessage += `   • Go to Products → + Add Product\n`;
        errorMessage += `   • Click "Set Up" on "Pages"\n\n`;
        errorMessage += `4. For Testing (Immediate Access):\n`;
        errorMessage += `   • Go to Roles → Test Users\n`;
        errorMessage += `   • Add yourself as a test user\n\n`;
        errorMessage += `📖 See FACEBOOK_FEATURE_UNAVAILABLE_FIX.md for detailed instructions.\n\n`;
        errorMessage += `⏱️ Wait 5-10 minutes after making changes, then try again.`;
        
        const shouldOpen = confirm(errorMessage + '\n\nOpen Facebook Developer Console now?');
        if (shouldOpen) {
          window.open('https://developers.facebook.com/apps/1621732999001688', '_blank');
        }
      } else if (err.message?.includes('LOCALHOST_SETUP_REQUIRED')) {
        errorMessage = err.message.replace('LOCALHOST_SETUP_REQUIRED: ', '') + '\n\n';
        errorMessage += '📋 Quick Setup Steps:\n';
        errorMessage += '1. Go to https://developers.facebook.com/apps/\n';
        errorMessage += '2. Select your app\n';
        errorMessage += '3. Settings → Basic → Add "localhost" to App Domains\n';
        errorMessage += '4. Add "http://localhost:3000" to Valid OAuth Redirect URIs\n';
        errorMessage += '5. For production, deploy with HTTPS\n\n';
        errorMessage += 'Would you like to open Facebook Developer docs?';
        
        if (confirm(errorMessage)) {
          window.open('https://developers.facebook.com/docs/facebook-login/web', '_blank');
        }
      } else if (err.message?.includes('App Domains')) {
        errorMessage = 'Facebook App configuration error:\n\nPlease add "localhost" to your Facebook App\'s App Domains in Facebook Developer settings.\n\n';
        errorMessage += 'Go to: Settings → Basic → App Domains';
      } else if (err.message?.includes('HTTPS') || err.message?.includes('http pages')) {
        errorMessage = 'Facebook requires HTTPS for the SDK login method.\n\n';
        errorMessage += 'For localhost development:\n';
        errorMessage += '• Configure your Facebook App for localhost (see instructions above)\n';
        errorMessage += '• Or use ngrok to create an HTTPS tunnel\n';
        errorMessage += '• Or deploy to production (HTTPS required)';
        alert(errorMessage);
      } else if (err.message) {
        errorMessage = `Facebook connection error:\n\n${err.message}`;
        alert(errorMessage);
      } else {
        alert(errorMessage + 'Please check your Facebook App configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;
      fetchConnectedAccounts();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };


  const tabs: { id: SocialTab; label: string; icon: React.ReactNode }[] = [
    { id: 'accounts', label: 'Connected accounts', icon: <Link2 size={16} /> },
    { id: 'schedule', label: 'Posting schedule', icon: <Calendar size={16} /> },
    { id: 'engagement', label: 'Engagement', icon: <BarChart2 size={16} /> },
    { id: 'mentions', label: 'Mentions', icon: <AtSign size={16} /> },
    { id: 'comments', label: 'Comments', icon: <MessageCircle size={16} /> },
    { id: 'dms', label: 'Direct messages', icon: <Mail size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'accounts':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { name: 'Facebook Page', handle: 'Engagehub Community', platform: 'facebook', icon: <Facebook className="text-blue-600" /> },
              { name: 'Instagram', handle: '@engagehub_creations', platform: 'instagram', icon: <Instagram className="text-pink-600" /> },
              { name: 'LinkedIn Profile', handle: 'John Doe', platform: 'linkedin', icon: <Linkedin className="text-blue-700" /> },
              { name: 'X (Twitter)', handle: '@engagehub', platform: 'twitter', icon: <Twitter className="text-sky-500" /> },
              { name: 'TikTok', handle: '@engagehub_official', platform: 'tiktok', icon: <Music className="text-black" /> },
              { name: 'YouTube', handle: 'Engagehub Tutorials', platform: 'youtube', icon: <Youtube className="text-red-600" /> },
              { name: 'Pinterest', handle: 'Engagehub Design', platform: 'pinterest', icon: <Pin className="text-red-700" /> },
            ].map((account, idx) => {
              const connectedAccount = connectedAccounts.find(ca => ca.platform === account.platform);
              const isConnected = !!connectedAccount;

              return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between group hover:border-blue-300 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      {account.icon}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold truncate">{account.name}</h4>
                      <p className="text-xs text-gray-500 truncate">
                        {isConnected ? connectedAccount.account_name : account.handle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 size={10} /> Live
                      </span>
                    ) : (
                      <button
                        onClick={() => account.platform === 'facebook' ? handleConnectFacebook() : alert(`${account.name} integration coming soon!`)}
                        className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full uppercase shadow-sm transition-all"
                      >
                        <Plus size={12} /> Connect
                      </button>
                    )}
                    {isConnected && (
                      <button
                        onClick={() => handleDisconnect(connectedAccount.id)}
                        className="p-1 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <button className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all group min-h-[94px]">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600">
                <Plus size={18} />
              </div>
              <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 uppercase">Add Account</span>
            </button>
          </div>
        );
      case 'schedule':
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Queue</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md font-medium text-gray-600 shadow-sm">Calendar</button>
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md font-bold shadow-sm">+ New Post</button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { time: 'Today, 4:00 PM', platform: 'Instagram', content: 'Exciting news! Our summer collection is officially live.', status: 'scheduled' },
                { time: 'Tomorrow, 9:00 AM', platform: 'LinkedIn', content: 'Reflecting on 3 years of solo business ownership. #entrepreneur', status: 'scheduled' },
                { time: 'Friday, 12:00 PM', platform: 'X (Twitter)', content: 'Thread: Why minimalism in UI design leads to higher conversion rates 🧵', status: 'scheduled' },
                { time: 'Saturday, 10:00 AM', platform: 'TikTok', content: 'Behind the scenes: How I set up my morning workflow. 🎥', status: 'draft' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-all flex gap-4 items-center">
                  <div className="w-12 h-12 rounded bg-gray-100 shrink-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-100/50 rounded flex items-center justify-center text-blue-500">
                      <Share2 size={16} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.platform}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${item.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{item.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase">{item.time}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <ExternalLink size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'engagement':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Likes</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">12,402</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-green-500 font-bold">+14%</span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Shares</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">842</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-green-500 font-bold">+3%</span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Visits</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">3,200</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-red-500 font-bold">-2%</span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-12 rounded-xl border border-gray-200 h-64 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="p-4 bg-gray-50 rounded-full">
                <BarChart2 size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-600">Engagement Visualization</p>
                <p className="text-xs text-gray-400">Sync more accounts to see comparative metrics across platforms.</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto animate-pulse">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Connect your {activeTab === 'dms' ? 'Direct Messages' : activeTab === 'mentions' ? 'Mentions' : 'Comments'} feed to manage all platform interactions from one place.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-100">
                Setup Integration
              </button>
              <button className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all text-sm">
                Learn More
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200">
        <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 -mb-[2px] ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-300'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pb-3 hidden lg:block">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Real-time Sync Active</p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SocialMedia;
