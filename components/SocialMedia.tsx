

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
import { initFacebookSDK, loginWithFacebook, getPageTokens, getInstagramAccount } from '../src/lib/facebook';
import { loginWithLinkedIn, getLinkedInProfile, getLinkedInOrganizations, getLinkedInOrganizationDetails } from '../src/lib/linkedin';
import { connectYouTube, getYouTubeChannel } from '../src/lib/youtube';

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
      } else if (code && state === 'instagram_oauth') {
        handleInstagramCallback(code);
      } else if (code && state === 'linkedin_oauth') {
        handleLinkedInCallback(code);
      } else if (code && state === 'youtube_oauth') {
        handleYouTubeCallback(code);
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

  const handleConnectInstagram = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      // Instagram Business accounts are connected through Facebook Pages
      // First, check if user has connected Facebook Pages
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      const { data: facebookAccounts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaces[0].id)
        .eq('platform', 'facebook')
        .eq('is_active', true);

      if (!facebookAccounts || facebookAccounts.length === 0) {
        const shouldConnectFacebook = confirm(
          'Instagram Business accounts must be linked to a Facebook Page.\n\n' +
          'You need to connect Facebook first to access Instagram.\n\n' +
          'Would you like to connect Facebook now?'
        );
        
        if (shouldConnectFacebook) {
          setIsLoading(false);
          handleConnectFacebook();
          return;
        } else {
          setIsLoading(false);
          return;
        }
      }

      // User has Facebook connected, now get Instagram accounts
      // Store that we're connecting Instagram
      sessionStorage.setItem('instagram_oauth_return', window.location.href);
      
      const authResponse: any = await loginWithFacebook();
      
      if (!authResponse || !authResponse.accessToken) {
        // OAuth redirect happened, callback will handle it
        return;
      }

      const pages: any = await getPageTokens(authResponse.accessToken);

      // Find pages with Instagram Business accounts
      const pagesWithInstagram = pages.filter((page: any) => page.instagram_business_account);

      if (pagesWithInstagram.length === 0) {
        alert(
          'No Instagram Business accounts found.\n\n' +
          'To connect Instagram:\n' +
          '1. Your Instagram account must be a Business or Creator account\n' +
          '2. It must be linked to a Facebook Page\n' +
          '3. You must be an admin of both the Page and Instagram account\n\n' +
          'See: https://www.facebook.com/business/help/898752960195806'
        );
        setIsLoading(false);
        return;
      }

      // Get Instagram account details for each page
      const instagramAccounts = [];
      for (const page of pagesWithInstagram) {
        try {
          const instagramAccount = await getInstagramAccount(page.access_token, page.instagram_business_account.id);
          instagramAccounts.push({
            ...instagramAccount,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token,
          });
        } catch (err) {
          console.warn(`Failed to get Instagram account for page ${page.name}:`, err);
        }
      }

      if (instagramAccounts.length === 0) {
        alert('Failed to retrieve Instagram account details. Please try again.');
        setIsLoading(false);
        return;
      }

      // Store Instagram accounts
      const { data: workspacesData } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspacesData?.length) throw new Error('No workspace found');

      for (const instagramAccount of instagramAccounts) {
        await supabase.from('social_accounts').upsert({
          workspace_id: workspacesData[0].id,
          platform: 'instagram',
          platform_account_id: instagramAccount.id,
          account_name: instagramAccount.username || `Instagram (${instagramAccount.page_name})`,
          access_token: instagramAccount.page_access_token, // Use page token for Instagram API calls
          is_active: true,
        }, { onConflict: 'workspace_id,platform,platform_account_id' });
      }

      alert(`✅ Connected to Instagram: ${instagramAccounts.map((acc: any) => acc.username || acc.page_name).join(', ')}!`);
      fetchConnectedAccounts();
    } catch (err: any) {
      console.error('Instagram connection error:', err);
      alert(`Failed to connect Instagram: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstagramCallback = async (code: string) => {
    setIsLoading(true);
    try {
      // Instagram uses the same OAuth flow as Facebook
      // Exchange code for token and then get Instagram accounts
      const backendUrl = import.meta.env.VITE_API_URL || '';
      let accessToken: string;

      if (backendUrl) {
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
        alert('Backend API URL not configured. Instagram connection requires a backend endpoint.');
        setIsLoading(false);
        const returnUrl = sessionStorage.getItem('instagram_oauth_return') || window.location.pathname;
        window.history.replaceState({}, '', returnUrl);
        sessionStorage.removeItem('instagram_oauth_return');
        return;
      }

      // Get pages with Instagram accounts
      const pages: any = await getPageTokens(accessToken);
      const pagesWithInstagram = pages.filter((page: any) => page.instagram_business_account);

      if (pagesWithInstagram.length === 0) {
        alert('No Instagram Business accounts found linked to your Facebook Pages.');
        setIsLoading(false);
        const returnUrl = sessionStorage.getItem('instagram_oauth_return') || window.location.pathname;
        window.history.replaceState({}, '', returnUrl);
        sessionStorage.removeItem('instagram_oauth_return');
        return;
      }

      // Get Instagram account details
      const instagramAccounts = [];
      for (const page of pagesWithInstagram) {
        try {
          const instagramAccount = await getInstagramAccount(page.access_token, page.instagram_business_account.id);
          instagramAccounts.push({
            ...instagramAccount,
            page_id: page.id,
            page_name: page.name,
            page_access_token: page.access_token,
          });
        } catch (err) {
          console.warn(`Failed to get Instagram account for page ${page.name}:`, err);
        }
      }

      if (instagramAccounts.length === 0) {
        alert('Failed to retrieve Instagram account details.');
        setIsLoading(false);
        return;
      }

      // Store Instagram accounts
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      for (const instagramAccount of instagramAccounts) {
        await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          platform: 'instagram',
          platform_account_id: instagramAccount.id,
          account_name: instagramAccount.username || `Instagram (${instagramAccount.page_name})`,
          access_token: instagramAccount.page_access_token,
          is_active: true,
        }, { onConflict: 'workspace_id,platform,platform_account_id' });
      }

      alert(`✅ Connected to Instagram: ${instagramAccounts.map((acc: any) => acc.username || acc.page_name).join(', ')}!`);
      fetchConnectedAccounts();
      
      // Clean up URL
      const returnUrl = sessionStorage.getItem('instagram_oauth_return') || window.location.pathname;
      window.history.replaceState({}, '', returnUrl);
      sessionStorage.removeItem('instagram_oauth_return');
    } catch (err: any) {
      console.error('Instagram callback error:', err);
      alert(`Failed to connect Instagram: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const authResponse: any = await loginWithLinkedIn();
      
      // If we got redirected, the callback handler will process it
      if (!authResponse || !authResponse.accessToken) {
        // OAuth redirect happened, callback will handle it
        return;
      }

      // Get LinkedIn profile
      // Note: Organizations require Marketing Developer Platform (partner-only)
      const profile = await getLinkedInProfile(authResponse.accessToken);
      const organizations = await getLinkedInOrganizations(authResponse.accessToken); // Will return empty for now

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store personal profile connection
      await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        platform: 'linkedin',
        platform_account_id: profile.sub || profile.id,
        account_name: profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn Profile',
        access_token: authResponse.accessToken,
        refresh_token: authResponse.refreshToken,
        expires_at: authResponse.expiresIn ? new Date(Date.now() + authResponse.expiresIn * 1000).toISOString() : null,
        is_active: true,
      }, { onConflict: 'workspace_id,platform,platform_account_id' });

      // Store organization connections if available
      if (organizations && organizations.length > 0) {
        for (const org of organizations) {
          try {
            const orgDetails = await getLinkedInOrganizationDetails(authResponse.accessToken, org.organizationalTarget);
            await supabase.from('social_accounts').upsert({
              workspace_id: workspaces[0].id,
              platform: 'linkedin',
              platform_account_id: orgDetails.id || org.organizationalTarget,
              account_name: orgDetails.name || 'LinkedIn Company Page',
              access_token: authResponse.accessToken,
              refresh_token: authResponse.refreshToken,
              expires_at: authResponse.expiresIn ? new Date(Date.now() + authResponse.expiresIn * 1000).toISOString() : null,
              is_active: true,
            }, { onConflict: 'workspace_id,platform,platform_account_id' });
          } catch (err) {
            console.warn(`Failed to get details for organization ${org.organizationalTarget}:`, err);
          }
        }
      }

      const accountNames = [
        profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn Profile',
        ...(organizations?.map((org: any) => org.name || 'Company Page') || [])
      ].filter(Boolean);

      alert(`✅ Connected to LinkedIn: ${accountNames.join(', ')}!`);
      fetchConnectedAccounts();
    } catch (err: any) {
      console.error('LinkedIn connection error:', err);
      
      // Debug: Check if environment variable is actually available
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      console.log('🔍 Debug - VITE_LINKEDIN_CLIENT_ID:', clientId ? `${clientId.substring(0, 4)}...` : 'NOT FOUND');
      console.log('🔍 Debug - All env vars:', Object.keys(import.meta.env).filter(k => k.includes('LINKEDIN')));
      
      let errorMessage = 'Failed to connect to LinkedIn.\n\n';
      
      if (err.message?.includes('Client ID not configured')) {
        errorMessage = `🔴 LinkedIn App Configuration Required\n\n`;
        errorMessage += `LinkedIn Client ID is not configured.\n\n`;
        
        // Check if we're in production and suggest cache clear
        const isProduction = window.location.hostname.includes('vercel.app');
        if (isProduction) {
          errorMessage += `⚠️ Production Environment Detected\n\n`;
          errorMessage += `If you just added the environment variable to Vercel:\n`;
          errorMessage += `1. ✅ Make sure you redeployed after adding the variable\n`;
          errorMessage += `2. 🔄 Clear your browser cache:\n`;
          errorMessage += `   • Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)\n`;
          errorMessage += `   • Or try incognito/private window\n`;
          errorMessage += `3. ⏱️ Wait 1-2 minutes for deployment to complete\n\n`;
        }
        
        errorMessage += `✅ Setup Steps:\n\n`;
        errorMessage += `1. Add to Vercel Environment Variables:\n`;
        errorMessage += `   • Go to: Vercel Dashboard → Your Project → Settings → Environment Variables\n`;
        errorMessage += `   • Add: VITE_LINKEDIN_CLIENT_ID = 776oifhjg06le0\n`;
        errorMessage += `   • Select all environments (Production, Preview, Development)\n`;
        errorMessage += `   • Click "Save"\n\n`;
        errorMessage += `2. Redeploy:\n`;
        errorMessage += `   • Go to Deployments tab\n`;
        errorMessage += `   • Click "⋯" on latest deployment\n`;
        errorMessage += `   • Click "Redeploy"\n`;
        errorMessage += `   • Wait for "Ready" status\n\n`;
        errorMessage += `3. Clear Browser Cache:\n`;
        errorMessage += `   • Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)\n`;
        errorMessage += `   • Or use incognito/private window\n\n`;
        errorMessage += `📖 See VERCEL_ENV_VARS_SETUP.md for detailed instructions.`;
        
        alert(errorMessage);
      } else if (err.message?.includes('LOCAL_DEV_API_ERROR')) {
        errorMessage = `🔴 Local Development API Issue\n\n`;
        errorMessage += err.message.replace('LOCAL_DEV_API_ERROR: ', '') + '\n\n';
        errorMessage += `✅ Quick Fix:\n\n`;
        errorMessage += `Update .env.local:\n`;
        errorMessage += `Change: VITE_API_URL=http://localhost:3000\n`;
        errorMessage += `To: VITE_API_URL=https://engage-hub-ten.vercel.app\n\n`;
        errorMessage += `Then restart your dev server.`;
        
        alert(errorMessage + '\n\nPlease update .env.local manually and restart your dev server.');
      } else if (err.message?.includes('backend')) {
        errorMessage = `🔴 Backend Setup Required\n\n`;
        errorMessage += `LinkedIn OAuth requires a backend server to securely exchange the authorization code for an access token.\n\n`;
        errorMessage += `Options:\n`;
        errorMessage += `1. Set up a backend API endpoint: POST /api/linkedin/token\n`;
        errorMessage += `2. Use Supabase Edge Functions\n`;
        errorMessage += `3. Set VITE_API_URL in environment variables\n\n`;
        errorMessage += `See LINKEDIN_CONNECTION_GUIDE.md for setup instructions.`;
        alert(errorMessage);
      } else if (err.message) {
        errorMessage = `LinkedIn connection error:\n\n${err.message}`;
        alert(errorMessage);
      } else {
        alert(errorMessage + 'Please check your LinkedIn App configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInCallback = async (code: string) => {
    setIsLoading(true);
    try {
      // LinkedIn uses backend for token exchange
      const backendUrl = import.meta.env.VITE_API_URL || '';
      let accessToken: string;
      let refreshToken: string;
      let expiresIn: number;

      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/linkedin/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code, 
            redirectUri: `${window.location.origin}${window.location.pathname}${window.location.hash || ''}` 
          })
        });
        
        if (!response.ok) {
          // Handle 404 (endpoint not found) with helpful message
          if (response.status === 404) {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalhost && backendUrl.includes('localhost')) {
              throw new Error(
                'LOCAL_DEV_API_ERROR: The API endpoint is not available locally.\n\n' +
                'Vercel serverless functions only work on Vercel, not in local development.\n\n' +
                'Solutions:\n' +
                '1. Use production URL: Set VITE_API_URL=https://engage-hub-ten.vercel.app in .env.local\n' +
                '2. Or deploy to Vercel first, then test\n' +
                '3. Or set up a local backend server\n\n' +
                'For now, update .env.local to use your Vercel URL.'
              );
            }
          }
          
          // Try to parse error response
          let errorMessage = 'Token exchange failed';
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || 'Token exchange failed';
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.statusText || 'Token exchange failed';
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        expiresIn = data.expires_in;
      } else {
        alert('Backend API URL not configured. LinkedIn connection requires a backend endpoint.');
        setIsLoading(false);
        const returnUrl = sessionStorage.getItem('linkedin_oauth_return') || window.location.pathname;
        window.history.replaceState({}, '', returnUrl);
        sessionStorage.removeItem('linkedin_oauth_return');
        return;
      }

      // Get LinkedIn profile and organizations
      const profile = await getLinkedInProfile(accessToken);
      const organizations = await getLinkedInOrganizations(accessToken);

      // Store connections
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store personal profile
      await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        platform: 'linkedin',
        platform_account_id: profile.sub || profile.id,
        account_name: profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn Profile',
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
        is_active: true,
      }, { onConflict: 'workspace_id,platform,platform_account_id' });

      // Store organizations
      if (organizations && organizations.length > 0) {
        for (const org of organizations) {
          try {
            const orgDetails = await getLinkedInOrganizationDetails(accessToken, org.organizationalTarget);
            await supabase.from('social_accounts').upsert({
              workspace_id: workspaces[0].id,
              platform: 'linkedin',
              platform_account_id: orgDetails.id || org.organizationalTarget,
              account_name: orgDetails.name || 'LinkedIn Company Page',
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
              is_active: true,
            }, { onConflict: 'workspace_id,platform,platform_account_id' });
          } catch (err) {
            console.warn(`Failed to get details for organization:`, err);
          }
        }
      }

      const accountNames = [
        profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn Profile',
        ...(organizations?.map((org: any) => org.name || 'Company Page') || [])
      ].filter(Boolean);

      alert(`✅ Connected to LinkedIn: ${accountNames.join(', ')}!`);
      fetchConnectedAccounts();
      
      // Clean up URL
      const returnUrl = sessionStorage.getItem('linkedin_oauth_return') || window.location.pathname;
      window.history.replaceState({}, '', returnUrl);
      sessionStorage.removeItem('linkedin_oauth_return');
    } catch (err: any) {
      console.error('LinkedIn callback error:', err);
      alert(`Failed to connect LinkedIn: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectYouTube = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const authResponse: any = await connectYouTube();
      
      // If we got redirected, the callback handler will process it
      if (!authResponse || !authResponse.accessToken) {
        // OAuth redirect happened, callback will handle it
        return;
      }

      // Get YouTube channel info
      const channelData = await getYouTubeChannel(authResponse.accessToken);
      
      if (!channelData.channels || channelData.channels.length === 0) {
        alert('No YouTube channels found. Please make sure you have a YouTube channel associated with your Google account.');
        setIsLoading(false);
        return;
      }

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store each YouTube channel
      for (const channel of channelData.channels) {
        await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          platform: 'youtube',
          platform_account_id: channel.id,
          account_name: channel.snippet?.title || 'YouTube Channel',
          access_token: authResponse.accessToken,
          refresh_token: authResponse.refreshToken,
          expires_at: authResponse.expiresIn ? new Date(Date.now() + authResponse.expiresIn * 1000).toISOString() : null,
          is_active: true,
        }, { onConflict: 'workspace_id,platform,platform_account_id' });
      }

      const channelNames = channelData.channels.map((ch: any) => ch.snippet?.title || 'YouTube Channel').join(', ');
      alert(`✅ Connected to YouTube: ${channelNames}!`);
      fetchConnectedAccounts();
    } catch (err: any) {
      console.error('YouTube connection error:', err);
      alert(`Failed to connect YouTube: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeCallback = async (code: string) => {
    setIsLoading(true);
    try {
      // YouTube uses Google OAuth, requires backend for token exchange
      const backendUrl = import.meta.env.VITE_API_URL || '';
      let accessToken: string;
      let refreshToken: string;
      let expiresIn: number;

      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/youtube/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code, 
            redirectUri: `${window.location.origin}${window.location.pathname}${window.location.hash || ''}` 
          })
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              'YouTube OAuth requires a backend endpoint.\n\n' +
              'Please set up: POST /api/youtube/token\n' +
              'Set VITE_API_URL in environment variables.\n\n' +
              'See YOUTUBE_CONNECTION_GUIDE.md for setup instructions.'
            );
          }
          
          let errorMessage = 'Token exchange failed';
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || 'Token exchange failed';
          } catch {
            errorMessage = response.statusText || 'Token exchange failed';
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        expiresIn = data.expires_in;
      } else {
        throw new Error(
          'YouTube OAuth requires a backend server for security (client secret needed).\n\n' +
          'Please:\n' +
          '1. Set up a backend endpoint at /api/youtube/token\n' +
          '2. Set VITE_API_URL in environment variables\n' +
          '3. Or use Supabase Edge Functions\n\n' +
          'See YOUTUBE_CONNECTION_GUIDE.md for setup instructions.'
        );
      }

      // Get YouTube channel info
      const channelData = await getYouTubeChannel(accessToken);
      
      if (!channelData.channels || channelData.channels.length === 0) {
        alert('No YouTube channels found. Please make sure you have a YouTube channel associated with your Google account.');
        setIsLoading(false);
        return;
      }

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store each YouTube channel
      for (const channel of channelData.channels) {
        await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          platform: 'youtube',
          platform_account_id: channel.id,
          account_name: channel.snippet?.title || 'YouTube Channel',
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
          is_active: true,
        }, { onConflict: 'workspace_id,platform,platform_account_id' });
      }

      const channelNames = channelData.channels.map((ch: any) => ch.snippet?.title || 'YouTube Channel').join(', ');
      alert(`✅ Connected to YouTube: ${channelNames}!`);
      fetchConnectedAccounts();
      
      // Clean up URL
      const returnUrl = sessionStorage.getItem('youtube_oauth_return') || window.location.pathname;
      window.history.replaceState({}, '', returnUrl);
      sessionStorage.removeItem('youtube_oauth_return');
    } catch (err: any) {
      console.error('YouTube callback error:', err);
      alert(`Failed to connect YouTube: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
      return 'http://localhost:3000';
    }
    return `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`;
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
                        onClick={() => {
                          if (account.platform === 'facebook') {
                            handleConnectFacebook();
                          } else if (account.platform === 'instagram') {
                            handleConnectInstagram();
                          } else if (account.platform === 'linkedin') {
                            handleConnectLinkedIn();
                          } else if (account.platform === 'youtube') {
                            handleConnectYouTube();
                          } else {
                            alert(`${account.name} integration coming soon!`);
                          }
                        }}
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
