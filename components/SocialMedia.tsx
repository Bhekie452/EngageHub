

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
  Share2,
  X,
  Power
} from 'lucide-react';
import YouTubeContextualConnect from './YouTubeContextualConnect';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import { initFacebookSDK, loginWithFacebook, getPageTokens, getFacebookProfile, getInstagramAccount, exchangeCodeForToken as exchangeFacebookCodeForToken } from '../src/lib/facebook';
import { loginWithLinkedIn, getLinkedInProfile, getLinkedInOrganizations, getLinkedInOrganizationDetails, exchangeCodeForToken as exchangeLinkedInCodeForToken } from '../src/lib/linkedin';
import { connectYouTube, getYouTubeChannel, exchangeCodeForToken as exchangeYouTubeCodeForToken } from '../src/lib/youtube';
import { connectTwitter, exchangeCodeForToken as exchangeTwitterCodeForToken, getTwitterProfile } from '../src/lib/twitter';
import { connectTikTok, exchangeCodeForToken as exchangeTikTokCodeForToken, getTikTokProfile } from '../src/lib/tiktok';

type SocialTab = 'accounts' | 'schedule' | 'engagement' | 'mentions' | 'comments' | 'dms';

const SocialMedia: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SocialTab>('accounts');
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthRedirect, setIsOAuthRedirect] = useState(false);

  React.useEffect(() => {
    if (user) {
      // Initialize Facebook SDK (non-blocking - will use redirect OAuth if SDK fails)
      initFacebookSDK().catch((err) => {
        console.warn('Facebook SDK initialization failed, will use redirect OAuth:', err);
      });
      fetchConnectedAccounts();

      // Handle Facebook OAuth callback and errors
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const errorCode = urlParams.get('error_code');
      const errorMessage = urlParams.get('error_message');

      // Handle Facebook OAuth errors
      if (errorCode || errorMessage) {
        const decodedMessage = errorMessage ? decodeURIComponent(errorMessage) : '';

        // Facebook Error 1349220: Feature Unavailable
        if (errorCode === '1349220' || decodedMessage.includes('Feature Unavailable')) {
          const setupMessage = `🔴 Facebook App Configuration Required\n\n` +
            `Error Code: ${errorCode}\n` +
            `Facebook Login is currently unavailable because your Facebook App needs additional configuration.\n\n` +
            `✅ Quick Fix Steps:\n\n` +
            `1. Go to: https://developers.facebook.com/apps/1621732999001688\n` +
            `2. Complete Basic Settings:\n` +
            `   • Fill in all required fields (App Name, Contact Email, Privacy Policy URL)\n` +
            `   • Add App Domain: engage-hub-ten.vercel.app\n` +
            `   • Add Website: https://engage-hub-ten.vercel.app\n\n` +
            `3. Configure Facebook Login and permissions:\n` +
            `   • Go to Use cases → add or configure a use case that includes Facebook Login\n` +
            `   • Add Valid OAuth Redirect URIs (in the use case or App settings):\n` +
            `     - https://engage-hub-ten.vercel.app\n` +
            `     - http://localhost:3000\n\n` +
            `4. Page/Instagram access:\n` +
            `   • In Use cases → Facebook Login → Permissions and features you often see only profile permissions (email, public_profile, user_*). Page permissions (pages_show_list, etc.) are not shown there in Meta's current UI.\n` +
            `   • Page access may require a separate use case (e.g. "Manage everything on your Page"), App Review, or Business Verification. See FACEBOOK_PAGES_PERMISSIONS_SETUP.md or Meta's docs for options.\n\n` +
            `5. Wait 5-10 minutes after making changes\n\n` +
            `📖 See FACEBOOK_FEATURE_UNAVAILABLE_FIX.md for detailed instructions.`;

          alert(setupMessage);

          // Clean up URL
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, '', cleanUrl);
          return;
        }

        // Other Facebook errors
        if (errorCode || errorMessage) {
          alert(`Facebook OAuth Error:\n\nCode: ${errorCode || 'Unknown'}\nMessage: ${decodedMessage || 'Unknown error'}\n\nPlease check your Facebook App configuration.`);

          // Clean up URL
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, '', cleanUrl);
          return;
        }
      }

      if (code && state === 'facebook_oauth') {
        handleFacebookCallback(code);
      } else if (code && state === 'instagram_oauth') {
        handleInstagramCallback(code);
      } else if (code && state === 'linkedin_oauth') {
        handleLinkedInCallback(code);
      } else if (code && state === 'youtube_oauth') {
        handleYouTubeCallback(code);
      } else if (code && state === 'twitter_oauth') {
        handleTwitterCallback(code);
      } else if (code && state === 'tiktok_oauth') {
        handleTikTokCallback(code);
      }
    }
  }, [user]);

  async function handleConnectFacebook() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const authResponse: any = await loginWithFacebook();

      if (!authResponse || !authResponse.accessToken) {
        setIsOAuthRedirect(true);
        return;
      }

      let pages: any[] = [];
      try {
        pages = (await getPageTokens(authResponse.accessToken)) || [];
      } catch {
        // Token has no Page permission — connect as profile instead
      }

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      if (pages?.length) {
        const page = pages[0];
        const { error } = await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          connected_by: user!.id,
          platform: 'facebook',
          account_id: page.id,
          display_name: page.name,
          account_type: 'page',
          access_token: page.access_token,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
        if (error) throw error;
        alert(`✅ Connected to Facebook Page: ${page.name}!`);
      } else {
        const profile = await getFacebookProfile(authResponse.accessToken);
        const { error } = await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          connected_by: user!.id,
          platform: 'facebook',
          account_id: `profile_${profile.id}`,
          display_name: profile.name,
          account_type: 'profile',
          access_token: authResponse.accessToken,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
        if (error) throw error;
        alert(`✅ Connected to Facebook as ${profile.name}. To publish posts from EngageHub, connect a Facebook Page (Facebook no longer allows apps to post to personal timelines). Create a Page at facebook.com/pages/create`);
      }
      fetchConnectedAccounts();
    } catch (err: any) {
      console.error('Connection error:', err);
      alert(`Failed to connect to Facebook: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFacebookCallback(code: string) {
    setIsOAuthRedirect(false); // Reset flag - we're back from redirect
    setIsLoading(true);
    try {
      // Exchange code for access token using centralized library
      const tokenData = await exchangeFacebookCodeForToken(code);
      const accessToken = tokenData.accessToken;

      let pages: any[] = [];
      try {
        pages = (await getPageTokens(accessToken)) || [];
      } catch {
        // Token has no Page permission — connect as profile instead
      }

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      if (pages?.length) {
        const page = pages[0];
        const { error } = await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          connected_by: user!.id,
          platform: 'facebook',
          account_id: page.id,
          display_name: page.name,
          account_type: 'page',
          access_token: page.access_token,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
        if (error) throw error;
        alert(`✅ Connected to Facebook Page: ${page.name}!`);
      } else {
        const profile = await getFacebookProfile(accessToken);
        const { error } = await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          connected_by: user!.id,
          platform: 'facebook',
          account_id: `profile_${profile.id}`,
          display_name: profile.name,
          account_type: 'profile',
          access_token: accessToken,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
        if (error) throw error;
        alert(`✅ Connected to Facebook as ${profile.name}. To publish posts from EngageHub, connect a Facebook Page (Facebook no longer allows apps to post to personal timelines). Create a Page at facebook.com/pages/create`);
      }
      fetchConnectedAccounts();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6077bdfd-a86e-4561-b354-d446ad749d41',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SocialMedia.tsx:handleFacebookCallback:success',message:'Facebook callback completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion

      // If user was connecting Instagram, try to save Instagram from same token (we already have pages)
      const instagramReturn = sessionStorage.getItem('instagram_oauth_return');
      if (instagramReturn) {
        try {
          const pagesWithIg = pages.filter((p: any) => p.instagram_business_account);
          if (pagesWithIg.length > 0) {
            for (const p of pagesWithIg) {
              try {
                const ig = await getInstagramAccount(p.access_token, p.instagram_business_account.id);
                await supabase.from('social_accounts').upsert({
                  workspace_id: workspaces[0].id,
                  connected_by: user!.id,
                  platform: 'instagram',
                  account_id: ig.id,
                  display_name: ig.username || `Instagram (${p.name})`,
                  username: ig.username,
                  account_type: 'business',
                  access_token: p.access_token,
                  is_active: true,
                  connection_status: 'connected',
                }, { onConflict: 'workspace_id,platform,account_id' });
              } catch (err) {
                console.warn('Instagram account fetch failed for page', p.name, err);
              }
            }
            fetchConnectedAccounts();
            alert('✅ Connected to Facebook and Instagram!');
          }
        } finally {
          sessionStorage.removeItem('instagram_oauth_return');
          const base = instagramReturn.indexOf(window.location.origin) === 0
            ? instagramReturn.replace(window.location.origin, '')
            : window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, '', base);
        }
      }
    } catch (err: any) {
      console.error('Facebook callback error:', err);
      alert(`Failed to connect to Facebook: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnectTwitter() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Starting Twitter connection...');

      // Check if Client ID is configured before attempting connection
      const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
      if (!clientId) {
        console.error('❌ Twitter Client ID not found');
        setIsLoading(false);
        // Error will be shown by connectTwitter
        await connectTwitter();
        return;
      }

      console.log('✅ Twitter Client ID found:', clientId.substring(0, 4) + '...');

      // connectTwitter will redirect to Twitter OAuth
      await connectTwitter();

      // If we get here, OAuth redirect happened
      setIsLoading(false);
    } catch (err: any) {
      console.error('Twitter connection error:', err);

      let errorMessage = 'Failed to connect to Twitter.\n\n';

      if (err.message?.includes('Client ID not configured')) {
        errorMessage = `🔴 Twitter App Configuration Required\n\n`;
        errorMessage += `Twitter Client ID is not configured.\n\n`;

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
        errorMessage += `1. Create Twitter App:\n`;
        errorMessage += `   • Go to: https://developer.twitter.com/en/portal/dashboard\n`;
        errorMessage += `   • Create a new app or use existing\n`;
        errorMessage += `   • Get Client ID and Client Secret\n\n`;
        errorMessage += `2. Add to Vercel Environment Variables:\n`;
        errorMessage += `   • Go to: Vercel Dashboard → Your Project → Settings → Environment Variables\n`;
        errorMessage += `   • Add: VITE_TWITTER_CLIENT_ID = your_client_id\n`;
        errorMessage += `   • Add: TWITTER_CLIENT_ID = your_client_id (backend)\n`;
        errorMessage += `   • Add: TWITTER_CLIENT_SECRET = your_client_secret (backend only)\n`;
        errorMessage += `   • Select all environments (Production, Preview, Development)\n`;
        errorMessage += `   • Click "Save"\n\n`;
        errorMessage += `3. Configure Twitter App:\n`;
        errorMessage += `   • Add Callback URL: http://localhost:3000 (for dev)\n`;
        errorMessage += `   • Add Callback URL: https://engage-hub-ten.vercel.app (for production)\n`;
        errorMessage += `   • Enable OAuth 2.0\n`;
        errorMessage += `   • Set App permissions: Read\n\n`;
        errorMessage += `4. Redeploy and Clear Cache:\n`;
        errorMessage += `   • Redeploy your Vercel app\n`;
        errorMessage += `   • Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)\n\n`;
        errorMessage += `📖 See TWITTER_CONNECTION_GUIDE.md for detailed instructions.`;

        alert(errorMessage);
      } else if (err.message) {
        errorMessage = `Twitter connection error:\n\n${err.message}`;
        alert(errorMessage);
      } else {
        alert(errorMessage + 'Please check your Twitter App configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTwitterCallback(code: string) {
    setIsLoading(true);
    try {
      // Exchange code for token using centralized library
      const tokenData = await exchangeTwitterCodeForToken(code);


      // Get Twitter profile
      const profileData = await getTwitterProfile(tokenData.accessToken);

      if (!profileData.data) {
        alert('Failed to fetch Twitter profile. Please try again.');
        setIsLoading(false);
        return;
      }

      const profile = profileData.data;
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store Twitter connection
      await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        connected_by: user!.id,
        platform: 'twitter',
        account_id: profile.id,
        display_name: profile.name || 'Twitter Account',
        username: profile.username || profile.username,
        avatar_url: profile.profile_image_url,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000).toISOString() : null,
        is_active: true,
        connection_status: 'connected',
      }, { onConflict: 'workspace_id,platform,account_id' });

      const accountName = profile.name || profile.username || 'Twitter Account';
      alert(`✅ Connected to Twitter: ${accountName}!`);
      fetchConnectedAccounts();

      // Clean up URL
      const returnUrl = sessionStorage.getItem('twitter_oauth_return') || window.location.pathname;
      window.history.replaceState({}, '', returnUrl);
      sessionStorage.removeItem('twitter_oauth_return');
    } catch (err: any) {
      console.error('Twitter callback error:', err);
      alert(`Failed to connect Twitter: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleConnectTikTok() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Starting TikTok connection...');

      // Check if Client Key is configured before attempting connection
      const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
      if (!clientKey) {
        console.error('❌ TikTok Client Key not found');
        setIsLoading(false);
        // Error will be shown by connectTikTok
        await connectTikTok();
        return;
      }

      console.log('✅ TikTok Client Key found:', clientKey.substring(0, 4) + '...');

      // connectTikTok will redirect to TikTok OAuth
      await connectTikTok();

      // If we get here, OAuth redirect happened
      setIsLoading(false);
    } catch (err: any) {
      console.error('TikTok connection error:', err);

      let errorMessage = 'Failed to connect to TikTok.\n\n';

      if (err.message?.includes('Client Key not configured')) {
        errorMessage = `🔴 TikTok App Configuration Required\n\n`;
        errorMessage += `TikTok Client Key is not configured.\n\n`;

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
        errorMessage += `1. Create TikTok App:\n`;
        errorMessage += `   • Go to: https://developers.tiktok.com/apps/\n`;
        errorMessage += `   • Create a new app or use existing\n`;
        errorMessage += `   • Get Client Key and Client Secret\n\n`;
        errorMessage += `2. Add to Vercel Environment Variables:\n`;
        errorMessage += `   • Go to: Vercel Dashboard → Your Project → Settings → Environment Variables\n`;
        errorMessage += `   • Add: VITE_TIKTOK_CLIENT_KEY = your_client_key\n`;
        errorMessage += `   • Add: TIKTOK_CLIENT_KEY = your_client_key (backend)\n`;
        errorMessage += `   • Add: TIKTOK_CLIENT_SECRET = your_client_secret (backend only)\n`;
        errorMessage += `   • Select all environments (Production, Preview, Development)\n`;
        errorMessage += `   • Click "Save"\n\n`;
        errorMessage += `3. Configure TikTok App:\n`;
        errorMessage += `   • Add Callback URL: http://localhost:3000 (for dev)\n`;
        errorMessage += `   • Add Callback URL: https://engage-hub-ten.vercel.app (for production)\n`;
        errorMessage += `   • Enable OAuth 2.0\n`;
        errorMessage += `   • Set App permissions: user.info.basic, video.upload\n\n`;
        errorMessage += `4. Redeploy and Clear Cache:\n`;
        errorMessage += `   • Redeploy your Vercel app\n`;
        errorMessage += `   • Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)\n\n`;
        errorMessage += `📖 See TIKTOK_CONNECTION_GUIDE.md for detailed instructions.`;

        alert(errorMessage);
      } else if (err.message) {
        errorMessage = `TikTok connection error:\n\n${err.message}`;
        alert(errorMessage);
      } else {
        alert(errorMessage + 'Please check your TikTok App configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTikTokCallback(code: string) {
    setIsOAuthRedirect(false);
    setIsLoading(true);
    try {
      // Exchange code for token
      const tokenData = await exchangeTikTokCodeForToken(code);
      // Get TikTok profile
      const profileData = await getTikTokProfile(tokenData.accessToken);

      if (!profileData.data) {
        alert('Failed to fetch TikTok profile. Please try again.');
        setIsLoading(false);
        return;
      }

      const profile = profileData.data.user;
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store TikTok connection
      await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        connected_by: user!.id,
        platform: 'tiktok',
        account_id: profile.open_id || profile.union_id,
        display_name: profile.display_name || 'TikTok Account',
        username: profile.username,
        avatar_url: profile.avatar_url,
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000).toISOString() : null,
        is_active: true,
        connection_status: 'connected',
      }, { onConflict: 'workspace_id,platform,account_id' });

      const accountName = profile.display_name || profile.username || 'TikTok Account';
      alert(`✅ Connected to TikTok: ${accountName}!`);
      fetchConnectedAccounts();

      // Clean up URL
      const returnUrl = sessionStorage.getItem('tiktok_oauth_return') || window.location.pathname;
      window.history.replaceState({}, '', returnUrl);
      sessionStorage.removeItem('tiktok_oauth_return');
    } catch (err: any) {
      console.error('TikTok callback error:', err);
      alert(`Failed to connect TikTok: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchConnectedAccounts() {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1);
      if (!workspaces?.length) return;

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaces[0].id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching connected accounts:', error);
      } else {
        console.log('Fetched connected accounts:', data);
        // Log LinkedIn account specifically
        const linkedInAccount = data?.find((acc: any) => acc.platform === 'linkedin');
        if (linkedInAccount) {
          console.log('LinkedIn account data:', {
            id: linkedInAccount.id,
            display_name: linkedInAccount.display_name,
            username: linkedInAccount.username,
            platform: linkedInAccount.platform,
            full_data: linkedInAccount
          });
        }
      }

      setConnectedAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function tryConnectInstagramWithToken(accessToken: string): Promise<boolean> {
    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
    if (!workspaces?.length) return false;

    let pages: any[] = [];
    try {
      pages = (await getPageTokens(accessToken)) || [];
    } catch {
      return false;
    }
    const pagesWithInstagram = pages.filter((p: any) => p.instagram_business_account);
    if (pagesWithInstagram.length === 0) return false;

    const instagramAccounts: any[] = [];
    for (const page of pagesWithInstagram) {
      try {
        const ig = await getInstagramAccount(page.access_token, page.instagram_business_account.id);
        instagramAccounts.push({
          ...ig,
          page_id: page.id,
          page_name: page.name,
          page_access_token: page.access_token,
        });
      } catch (err) {
        console.warn(`Failed to get Instagram for page ${page.name}:`, err);
      }
    }
    if (instagramAccounts.length === 0) return false;

    for (const acc of instagramAccounts) {
      await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        connected_by: user!.id,
        platform: 'instagram',
        account_id: acc.id,
        display_name: acc.username || `Instagram (${acc.page_name})`,
        username: acc.username,
        account_type: 'business',
        access_token: acc.page_access_token,
        is_active: true,
        connection_status: 'connected',
      }, { onConflict: 'workspace_id,platform,account_id' });
    }
    fetchConnectedAccounts();
    return true;
  }


  async function handleConnectInstagram() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

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
        } else {
          setIsLoading(false);
        }
        return;
      }

      // User has Facebook connected, now try to connect Instagram using the same token
      sessionStorage.setItem('instagram_oauth_return', window.location.href);
      const authResponse: any = await loginWithFacebook();

      if (!authResponse?.accessToken) {
        // OAuth redirect happened, callback will finish the flow
        setIsOAuthRedirect(true);
        return;
      }

      const ok = await tryConnectInstagramWithToken(authResponse.accessToken);
      if (ok) {
        alert('✅ Connected to Instagram!');
        return;
      }

      alert(
        'No Instagram Business accounts found.\n\n' +
        '• Your Instagram must be a Business or Creator account (switch in the Instagram mobile app).\n' +
        '• Link it to a Facebook Page: business.facebook.com → Settings → Accounts → Instagram accounts.\n' +
        '• You must be an admin of both the Page and the Instagram account.\n\n' +
        'Help: https://www.facebook.com/business/help/898752960195806'
      );
    } catch (err: any) {
      console.error('Instagram connection error:', err);
      alert(`Failed to connect Instagram: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInstagramCallback(code: string) {
    setIsOAuthRedirect(false);
    setIsLoading(true);
    try {
      // Exchange code for token using centralized library (same as Facebook)
      const tokenData = await exchangeFacebookCodeForToken(code);
      const accessToken = tokenData.accessToken;

      // Get pages with Instagram accounts
      let pages: any[] = [];
      try {
        pages = (await getPageTokens(accessToken)) || [];
      } catch {
        /* token has no Page permission */
      }
      if (!pages?.length) {
        alert(
          'No Facebook Pages were returned. Instagram connects via a Facebook Page.\n\n' +
          '• Create a Page at facebook.com/pages/create and connect it to your Instagram Business/Creator account.\n\n' +
          "• Meta's dashboard often doesn't show Page permissions under Use cases → Facebook Login → Permissions and features (that list is usually profile-only). Page access may need a different use case, App Review, or Business Verification. See FACEBOOK_PAGES_PERMISSIONS_SETUP.md or Meta's docs."
        );
        setIsLoading(false);
        const returnUrl = sessionStorage.getItem('instagram_oauth_return') || window.location.pathname;
        window.history.replaceState({}, '', returnUrl);
        sessionStorage.removeItem('instagram_oauth_return');
        return;
      }
      const pagesWithInstagram = pages.filter((page: any) => page.instagram_business_account);

      if (pagesWithInstagram.length === 0) {
        alert(
          'No Instagram Business accounts found linked to your Facebook Pages.\n\n' +
          '• Your Instagram must be a Business or Creator account (switch in the Instagram **mobile app** only — not on web).\n' +
          '• Link it to a Facebook Page: business.facebook.com → Settings → Accounts → Instagram accounts.\n' +
          '• You must be admin of both the Page and the Instagram account.\n\n' +
          'Help: https://www.facebook.com/business/help/898752960195806'
        );
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
          connected_by: user!.id,
          platform: 'instagram',
          account_id: instagramAccount.id,
          display_name: instagramAccount.username || `Instagram (${instagramAccount.page_name})`,
          username: instagramAccount.username,
          account_type: 'business',
          access_token: instagramAccount.page_access_token,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
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

  async function handleConnectLinkedIn() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Starting LinkedIn connection...');

      // Check if Client ID is configured before attempting connection
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      if (!clientId) {
        console.error('❌ LinkedIn Client ID not found');
        setIsLoading(false);
        // Error will be shown by loginWithLinkedIn
        await loginWithLinkedIn();
        return;
      }

      console.log('✅ LinkedIn Client ID found:', clientId.substring(0, 4) + '...');

      // loginWithLinkedIn will redirect to LinkedIn OAuth
      // When redirect happens, window.location.href changes and page navigates away
      // If we get a response, it means we're handling a callback
      const authResponse: any = await loginWithLinkedIn();

      // If we got here, we're handling a callback (code in URL)
      // The callback handler will process it, but we can also handle it here
      if (!authResponse || !authResponse.accessToken) {
        // OAuth redirect happened or callback is being processed
        console.log('🔄 LinkedIn OAuth redirect initiated or callback processing');
        setIsLoading(false);
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
        connected_by: user!.id,
        platform: 'linkedin',
        account_id: profile.sub || profile.id,
        display_name: profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn Profile',
        username: profile.email || profile.preferred_username,
        access_token: authResponse.accessToken,
        refresh_token: authResponse.refreshToken,
        token_expires_at: authResponse.expiresIn ? new Date(Date.now() + authResponse.expiresIn * 1000).toISOString() : null,
        is_active: true,
        connection_status: 'connected',
      }, { onConflict: 'workspace_id,platform,account_id' });

      // Store organization connections if available
      if (organizations && organizations.length > 0) {
        for (const org of organizations) {
          try {
            const orgDetails = await getLinkedInOrganizationDetails(authResponse.accessToken, org.organizationalTarget);
            await supabase.from('social_accounts').upsert({
              workspace_id: workspaces[0].id,
              connected_by: user!.id,
              platform: 'linkedin',
              account_id: orgDetails.id || org.organizationalTarget,
              display_name: orgDetails.name || 'LinkedIn Company Page',
              account_type: 'business',
              access_token: authResponse.accessToken,
              refresh_token: authResponse.refreshToken,
              token_expires_at: authResponse.expiresIn ? new Date(Date.now() + authResponse.expiresIn * 1000).toISOString() : null,
              is_active: true,
              connection_status: 'connected',
            }, { onConflict: 'workspace_id,platform,account_id' });
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

  async function handleLinkedInCallback(code: string) {
    setIsOAuthRedirect(false);
    setIsLoading(true);
    try {
      // Exchange code for token using centralized library
      const tokenData = await exchangeLinkedInCodeForToken(code);
      const accessToken = tokenData.accessToken;
      const refreshToken = tokenData.refreshToken;
      const expiresIn = tokenData.expiresIn;

      // Get LinkedIn profile and organizations
      const profile = await getLinkedInProfile(accessToken);
      const organizations = await getLinkedInOrganizations(accessToken);

      // Store connections
      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store personal profile
      await supabase.from('social_accounts').upsert({
        workspace_id: workspaces[0].id,
        connected_by: user!.id,
        platform: 'linkedin',
        account_id: profile.sub || profile.id,
        display_name: profile.name || `${profile.given_name} ${profile.family_name}` || 'LinkedIn Profile',
        username: profile.email || profile.preferred_username,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
        is_active: true,
        connection_status: 'connected',
      }, { onConflict: 'workspace_id,platform,account_id' });

      // Store organizations (if any managed)
      if (organizations && organizations.length > 0) {
        for (const org of organizations) {
          try {
            const orgDetails = await getLinkedInOrganizationDetails(accessToken, org.organizationalTarget);
            await supabase.from('social_accounts').upsert({
              workspace_id: workspaces[0].id,
              connected_by: user!.id,
              platform: 'linkedin',
              account_id: orgDetails.id || org.organizationalTarget,
              display_name: orgDetails.name || 'LinkedIn Company Page',
              account_type: 'business',
              access_token: accessToken,
              refresh_token: refreshToken,
              token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
              is_active: true,
              connection_status: 'connected',
            }, { onConflict: 'workspace_id,platform,account_id' });
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
  }

  async function handleConnectYouTube() {
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
        alert(
          'No YouTube channels found. Usually an account setup issue:\n\n' +
          '1. Check channel: youtube.com/channel_switcher (same Google account). If you see "Create a channel", create it.\n' +
          '2. Brand Account? Use a personal channel or ensure you\'re Owner/Manager of the Brand account.\n' +
          '3. Re-authorize: myaccount.google.com/permissions → remove this app → connect YouTube again and accept all permissions.'
        );
        setIsLoading(false);
        return;
      }

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store each YouTube channel
      for (const channel of channelData.channels) {
        await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          connected_by: user!.id,
          platform: 'youtube',
          account_id: channel.id,
          display_name: channel.snippet?.title || 'YouTube Channel',
          username: channel.snippet?.customUrl || channel.snippet?.title,
          avatar_url: channel.snippet?.thumbnails?.default?.url || channel.snippet?.thumbnails?.high?.url,
          access_token: authResponse.accessToken,
          refresh_token: authResponse.refreshToken,
          token_expires_at: authResponse.expiresIn ? new Date(Date.now() + authResponse.expiresIn * 1000).toISOString() : null,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
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

  async function handleYouTubeCallback(code: string) {
    setIsOAuthRedirect(false);
    setIsLoading(true);
    try {
      // Exchange code for token using centralized library
      const tokenData = await exchangeYouTubeCodeForToken(code);
      const accessToken = tokenData.accessToken;
      const refreshToken = tokenData.refreshToken;
      const expiresIn = tokenData.expiresIn;

      // Get YouTube channel info
      const channelData = await getYouTubeChannel(accessToken);

      if (!channelData.channels || channelData.channels.length === 0) {
        alert(
          'No YouTube channels found. Usually an account setup issue:\n\n' +
          '1. Check channel: youtube.com/channel_switcher (same Google account). If you see "Create a channel", create it.\n' +
          '2. Brand Account? Use a personal channel or ensure you\'re Owner/Manager of the Brand account.\n' +
          '3. Re-authorize: myaccount.google.com/permissions → remove this app → connect YouTube again and accept all permissions.'
        );
        setIsLoading(false);
        return;
      }

      const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user!.id).limit(1);
      if (!workspaces?.length) throw new Error('No workspace found');

      // Store each YouTube channel
      for (const channel of channelData.channels) {
        await supabase.from('social_accounts').upsert({
          workspace_id: workspaces[0].id,
          connected_by: user!.id,
          platform: 'youtube',
          account_id: channel.id,
          display_name: channel.snippet?.title || 'YouTube Channel',
          username: channel.snippet?.customUrl || channel.snippet?.title,
          avatar_url: channel.snippet?.thumbnails?.default?.url || channel.snippet?.thumbnails?.high?.url,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
          is_active: true,
          connection_status: 'connected',
        }, { onConflict: 'workspace_id,platform,account_id' });
      }

      const channelNames = channelData.channels.map((ch: any) => ch.snippet?.title || 'YouTube Channel').join(', ');
      alert(`✅ Connected to YouTube: ${channelNames}!`);
      fetchConnectedAccounts();

      // Clean up URL and stored data
      const returnUrl = sessionStorage.getItem('youtube_oauth_return') || window.location.pathname;
      window.history.replaceState({}, '', returnUrl);
      sessionStorage.removeItem('youtube_oauth_return');
      sessionStorage.removeItem('youtube_oauth_redirect_uri');
    } catch (err: any) {
      console.error('YouTube callback error:', err);

      let errorMessage = 'Failed to connect to YouTube.\n\n';

      if (err.message?.includes('Client ID not configured') || err.message?.includes('requires a backend')) {
        errorMessage = `🔴 YouTube Setup Required\n\n`;
        errorMessage += err.message + '\n\n';

        const isProduction = window.location.hostname.includes('vercel.app');
        if (isProduction) {
          errorMessage += `⚠️ Production Environment Detected\n\n`;
          errorMessage += `Setup Steps:\n\n`;
          errorMessage += `1. Add Environment Variables in Vercel:\n`;
          errorMessage += `   • VITE_YOUTUBE_CLIENT_ID = your_google_client_id\n`;
          errorMessage += `   • VITE_API_URL = https://your-backend-url.com\n\n`;
          errorMessage += `2. Set up Backend Endpoint:\n`;
          errorMessage += `   • Create POST /api/youtube/token endpoint\n`;
          errorMessage += `   • Add YOUTUBE_CLIENT_SECRET to backend env vars\n\n`;
          errorMessage += `3. Redeploy and clear cache\n\n`;
        }

        errorMessage += `📖 See YOUTUBE_CONNECTION_GUIDE.md for detailed instructions.`;
      } else {
        errorMessage += err.message || 'Unknown error';
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }


  async function handleDisconnect(accountId: string) {
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
              { name: 'X (Twitter)', handle: '@engagehub', platform: 'twitter', icon: <X className="text-black" /> },
              { name: 'TikTok', handle: '@engagehub_official', platform: 'tiktok', icon: <Music className="text-black" /> },
              { name: 'YouTube', handle: 'Engagehub Tutorials', platform: 'youtube', icon: <Youtube className="text-red-600" /> },
              { name: 'Pinterest', handle: 'Engagehub Design', platform: 'pinterest', icon: <Pin className="text-red-700" /> },
            ].map((account, idx) => {
              const connectedAccount = connectedAccounts.find(ca => ca.platform === account.platform);
              const isConnected = !!connectedAccount;

              // Get the actual name (page name or person name) from connected account
              const connectedName = isConnected
                ? (connectedAccount.display_name || connectedAccount.username || null)
                : null;

              // Subtitle: for Facebook use account_type so Page shows "Facebook Page", profile shows "Personal profile"
              const connectedSubtitle = isConnected && account.platform === 'facebook' && connectedAccount?.account_type
                ? (connectedAccount.account_type === 'page' ? 'Facebook Page' : 'Personal profile')
                : (isConnected ? (connectedName ? account.name : 'Connected') : account.handle);

              // Debug logging
              if (isConnected && account.platform === 'linkedin') {
                console.log('LinkedIn connected account data:', {
                  display_name: connectedAccount.display_name,
                  username: connectedAccount.username,
                  full_account: connectedAccount
                });
              }


              return (
                <div key={idx} className={`p-5 rounded-xl border flex items-center justify-between group transition-all shadow-sm ${isConnected ? 'bg-white border-blue-200 ring-1 ring-blue-50' : 'bg-gray-50/50 border-gray-200 filter grayscale-[0.5]'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isConnected ? 'bg-white' : 'bg-gray-100'}`}>
                      {React.cloneElement(account.icon as React.ReactElement, { size: 24, className: isConnected ? (account.icon as React.ReactElement).props.className : 'text-gray-400' })}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className={`text-sm font-bold truncate ${isConnected ? 'text-gray-900' : 'text-gray-500'}`}>
                        {isConnected && connectedName ? connectedName : account.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {connectedSubtitle}
                      </p>
                      {isConnected && account.platform === 'facebook' && connectedAccount?.account_type === 'profile' && (
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Can&apos;t publish—disconnect and connect again, then pick your Page.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {account.platform === 'youtube' ? (
                      <YouTubeContextualConnect compact />
                    ) : (
                      isConnected ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live
                          </span>
                          <button
                            onClick={() => handleDisconnect(connectedAccount.id)}
                            className="p-1 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                            title="Disconnect account"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (account.platform === 'facebook') handleConnectFacebook();
                            else if (account.platform === 'instagram') handleConnectInstagram();
                            else if (account.platform === 'linkedin') handleConnectLinkedIn();
                            else if (account.platform === 'youtube') handleConnectYouTube();
                            else if (account.platform === 'twitter') handleConnectTwitter();
                            else if (account.platform === 'tiktok') handleConnectTikTok();
                            else alert(`${account.name} integration coming soon!`);
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 px-4 py-2 rounded-full uppercase tracking-wider shadow-lg shadow-blue-200/50 transition-all"
                        >
                          Connect
                        </button>
                      )
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

  // Prevent rendering during OAuth redirect to avoid React error #418 (invalid HTML nesting)
  if (isOAuthRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting to Facebook...</p>
        </div>
      </div>
    );
  }

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
