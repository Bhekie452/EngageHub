import { createClient } from '@supabase/supabase-js';

// Extend Window for Facebook SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

// Initialize Supabase with fallback for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Only create client if we have valid credentials
const supabase = (supabaseUrl && supabaseUrl !== 'your-project-url-here')
  ? createClient(supabaseUrl, supabaseAnonKey || 'placeholder-key')
  : null;

// Facebook App Configuration
const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '2106228116796555';

// ------------------------------------------------------------------
//  Facebook OAuth and Connection Functions
// ------------------------------------------------------------------

export const getRedirectURI = (): string => {
    // Always use the FRONTEND callback URL which is whitelisted in Meta
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    return `${origin}/auth/facebook/callback`;
};

export const initiateFacebookOAuth = () => {
    console.log('🔍 Facebook OAuth Debug Info:');
    console.log('App ID:', FB_APP_ID);
    console.log('Redirect URI:', getRedirectURI());
    console.log('Full URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
};

export const loginWithFacebook = async () => {
    // This would initiate the Facebook OAuth flow
    try {
        const redirectUri = getRedirectURI();
        const appId = FB_APP_ID || 'your-facebook-app-id';
        
        // Get workspace ID for state parameter
        let workspaceId = localStorage.getItem('current_workspace_id');
        if (!workspaceId) {
            // Use default workspace if not found
            workspaceId = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
        }
        
        // Create state parameter with workspace info (plain JSON format for callback)
        const state = JSON.stringify({ 
            workspaceId, 
            origin: window.location.origin 
        });
        
        const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights&response_type=code&state=${encodeURIComponent(state)}`;
        window.location.href = authUrl;
    } catch (error) {
        console.error('Failed to initiate Facebook OAuth:', error);
        throw error;
    }
};

export const getFacebookProfile = async (accessToken: string) => {
    try {
        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Facebook profile');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching Facebook profile:', error);
        throw error;
    }
};

export const getInstagramAccount = async (accessToken: string, instagramBusinessId?: string) => {
    try {
        // If instagram business ID is provided, get that account directly
        if (instagramBusinessId) {
            const response = await fetch(`https://graph.facebook.com/${instagramBusinessId}?fields=id,username,followers_count,media_count&access_token=${accessToken}`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        }
        // Otherwise get Instagram business account from user
        const response = await fetch(`https://graph.facebook.com/me?fields=instagram_business_account&access_token=${accessToken}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        return data.instagram_business_account || null;
    } catch (error) {
        console.error('Error fetching Instagram account:', error);
        return null;
    }
};

export const getPageTokens = async (accessToken: string) => {
    try {
        const response = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Facebook pages');
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching page tokens:', error);
        throw error;
    }
};

export const handleFacebookCallback = async (passedCode?: string, passedState?: string) => {
    //  DEBUG: Log callback entry state
    console.log('🔍 [DEBUG] Facebook callback triggered:', {
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
        search: typeof window !== 'undefined' ? window.location.search : 'N/A',
        passedCode: !!passedCode,
        passedState: !!passedState,
        timestamp: new Date().toISOString(),
    });
    
    if (typeof window === 'undefined') return;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = passedCode || urlParams.get('code');
        const state = passedState || urlParams.get('state');

        if (!code) {
            console.error('❌ No authorization code found');
            return { success: false, error: 'No authorization code' };
        }

        // Parse state parameter
        let workspaceId;
        try {
            const parsedState = JSON.parse(decodeURIComponent(state || ''));
            workspaceId = parsedState?.workspaceId;
        } catch (e) {
            console.error('❌ Failed to parse state parameter:', e);
            return { success: false, error: 'Invalid state parameter' };
        }

        if (!workspaceId) {
            console.error('❌ No workspace ID in state');
            return { success: false, error: 'Missing workspace ID' };
        }

        console.log('🔍 [DEBUG] OAuth state parsed:', { workspaceId, state: passedState });

        // 🔥 CRITICAL: Remove code from URL IMMEDIATELY
        const cleanUrl = new URL(typeof window !== 'undefined' ? window.location.href : '');
        cleanUrl.searchParams.delete("code");
        cleanUrl.searchParams.delete("state");
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
        }
        console.log('🗑️ Code removed from URL');
        console.log('🔍 [DEBUG] Code removed from URL');

        // Call backend to handle OAuth
        const backendUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/facebook?action=simple&code=${encodeURIComponent(code)}&workspaceId=${encodeURIComponent(workspaceId)}`;
        
        console.log('🔍 [DEBUG] Backend OAuth URL:', backendUrl);
        
        const response = await fetch(backendUrl);
        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Backend OAuth error:', result);
            return { success: false, error: result.error || 'Backend error' };
        }

        if (result.error) {
            console.error('❌ OAuth processing error:', result.error);
            return { success: false, error: result.error };
        }

        console.log('✅ OAuth successful:', result);
        window.dispatchEvent(new CustomEvent('facebook:oauth-success', { 
            detail: { 
                success: true, 
                pages: result.pages || [],
                message: result.message 
            } 
        }));

        return { success: true, pages: result.pages || [], message: result.message };

    } catch (error) {
        console.error('❌ Facebook callback error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Exchange authorization code for access token
 * NOTE: This MUST be done server-side for security (client secret required)
 */
export const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        const redirectUri = getRedirectURI();

        // Use the API endpoint for token exchange
        const response = await fetch('/api/facebook/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Token exchange failed');
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in,
            refreshToken: data.refresh_token
        };
    } catch (error: any) {
        console.error('❌ Facebook token exchange error:', error);
        throw error;
    }
};

export const cleanupOAuthState = () => {
    if (typeof window === 'undefined') return;
    
    // Clear any OAuth-related state from localStorage/sessionStorage
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('facebook') || key.includes('oauth'))) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('🧹 OAuth state cleaned up');
};

export const getStoredFacebookPages = () => {
    if (typeof window === 'undefined') return [];

    try {
        const cached = localStorage.getItem('facebook_pages');
        if (cached) {
            const parsed = JSON.parse(cached);
            
            // Handle new data structure with timestamp
            let pages = [];
            if (parsed.pages && Array.isArray(parsed.pages)) {
                pages = parsed.pages;
                console.log(`✅ Using ${pages.length} pages from localStorage (timestamp: ${new Date(parsed.timestamp).toLocaleString()})`);
            } else if (Array.isArray(parsed)) {
                // Handle old format (backward compatibility)
                pages = parsed;
                console.log(`✅ Using ${pages.length} pages from localStorage (old format)`);
            }
                
            return pages;
        }
    } catch (error) {
        console.error('❌ Error parsing localStorage pages:', error);
    }
    
    console.log('❌ No Facebook pages found');
    return [];
};

export const storeFacebookPages = (pages: any[]) => {
    if (typeof window === 'undefined') return;

    try {
        const data = {
            pages: pages,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('facebook_pages', JSON.stringify(data));
        console.log(`✅ Stored ${pages.length} Facebook pages to localStorage`);
        
    } catch (error) {
        console.error('❌ Error storing Facebook pages:', error);
    }
};

export const getFacebookAccessToken = () => {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('facebook_access_token');
};

export const setFacebookAccessToken = (token: string) => {
    if (typeof window === 'undefined') return;
    
    try {
        localStorage.setItem('facebook_access_token', token);
        console.log('✅ Facebook access token stored');
    } catch (error) {
        console.error('❌ Error storing Facebook token:', error);
    }
};

export const clearFacebookAuth = () => {
    if (typeof window === 'undefined') return;
    
    try {
        localStorage.removeItem('facebook_access_token');
        localStorage.removeItem('facebook_user_id');
        localStorage.removeItem('facebook_pages');
        console.log('✅ Facebook auth cleared');
    } catch (error) {
        console.error('❌ Error clearing Facebook auth:', error);
    }
};

// ------------------------------------------------------------------
//  Facebook SDK Initialization
// ------------------------------------------------------------------

export const initFacebookSDK = () => {
    return new Promise<boolean>((resolve) => {
        const allowLocalhostSDK = import.meta.env.VITE_FACEBOOK_SDK_LOCALHOST === 'true';
        const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (typeof window === 'undefined' || !allowLocalhostSDK || !isLocalhost) {
            resolve(false);
            return;
        }

        if (window.FB) {
            resolve(true);
            return;
        }

        const loadTimeout = setTimeout(() => resolve(false), 10000);

        window.fbAsyncInit = function () {
            clearTimeout(loadTimeout);
            if (!window.FB) return;
            try {
                window.FB.init({
                    appId: FB_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: 'v21.0'
                });
                if (window.FB.AppEvents) window.FB.AppEvents.logPageView();
                resolve(true);
            } catch {
                resolve(false);
            }
        };

        // Load Facebook SDK
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        
        if (document.head) {
            document.head.appendChild(script);
        } else {
            document.body.appendChild(script);
        }
    });
};

// ------------------------------------------------------------------
//  Utility Functions
// ------------------------------------------------------------------

export const needsSecurityChallenge = (error: any): boolean => {
    return (
        error?.error === 'FACEBOOK_SECURITY_CHALLENGE' ||
        error?.message?.includes('security challenge') ||
        error?.message?.includes('reauth')
    );
};

export const formatFacebookError = (error: any): string => {
    if (!error) return 'Unknown error';
    
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    
    return JSON.stringify(error);
};

export const validateFacebookToken = async (token: string) => {
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`);
        const data = await response.json();
        
        return {
            valid: !data.error,
            user: data,
            error: data.error
        };
    } catch (error) {
        return {
            valid: false,
            user: null,
            error: error.message
        };
    }
};

export const getFacebookPagesFromAPI = async (accessToken: string) => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account,category&access_token=${accessToken}`
        );
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        return data.data || [];
    } catch (error) {
        console.error('❌ Error fetching Facebook pages:', error);
        throw error;
    }
};

export const connectFacebookPage = async (pageId: string, pageAccessToken: string, pageName: string) => {
    try {
        const response = await fetch('/api/facebook?action=connect-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                workspaceId: localStorage.getItem('current_workspace_id'),
                pageId,
                pageAccessToken,
                pageName,
            }),
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to connect page');
        }

        return result;
    } catch (error) {
        console.error('❌ Error connecting Facebook page:', error);
        throw error;
    }
};

export const getFacebookConnections = async () => {
    try {
        const workspaceId = localStorage.getItem('current_workspace_id');
        if (!workspaceId) return [];

        const response = await fetch(`/api/facebook?action=get-connections&workspaceId=${workspaceId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch connections');
        }

        return data.connections || [];
    } catch (error) {
        console.error('❌ Error fetching Facebook connections:', error);
        throw error;
    }
};

export const getFacebookEngagementMetrics = async () => {
    try {
        const workspaceId = localStorage.getItem('current_workspace_id');
        if (!workspaceId) return null;

        const response = await fetch(`/api/facebook?action=get-engagement-metrics&workspaceId=${workspaceId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch engagement metrics');
        }

        return data.metrics;
    } catch (error) {
        console.error('❌ Error fetching Facebook engagement:', error);
        throw error;
    }
};

// ------------------------------------------------------------------
//  Event Handlers
// ------------------------------------------------------------------

export const handleFacebookAuthSuccess = (result: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('facebook:auth-success', { 
            detail: result 
        }));
    }
};

// ------------------------------------------------------------------
//  Instagram via Facebook
// ------------------------------------------------------------------

/**
 * Get Instagram Business accounts linked to connected Facebook pages.
 * Requires a stored Facebook user access token.
 */
export const getConnectedInstagramAccounts = async (): Promise<any[]> => {
    const accessToken = getFacebookAccessToken();
    if (!accessToken) {
        throw new Error('No Facebook access token found. Connect Facebook first.');
    }

    const pages = await getFacebookPagesFromAPI(accessToken);
    if (!pages || pages.length === 0) {
        return [];
    }

    const accounts: any[] = [];
    for (const page of pages) {
        try {
            const igResponse = await fetch(
                `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${page.access_token}`
            );
            const igData = await igResponse.json();
            if (igData.instagram_business_account) {
                accounts.push({
                    pageId: page.id,
                    pageName: page.name,
                    pageToken: page.access_token,
                    instagram: {
                        id: igData.instagram_business_account.id,
                        username: igData.instagram_business_account.username,
                        profilePicture: igData.instagram_business_account.profile_picture_url || '',
                    },
                });
            }
        } catch (err) {
            console.warn(`Failed to fetch Instagram from page ${page.id}:`, err);
        }
    }
    return accounts;
};

export const handleFacebookAuthError = (error: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('facebook:auth-error', { 
            detail: { error } 
        }));
    }
};
