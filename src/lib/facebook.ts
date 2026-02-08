
/**
 * Facebook OAuth & Graph API Utility
 * Uses redirect-based OAuth for localhost compatibility (Facebook requires HTTPS for SDK login)
 */

// TypeScript types for Facebook SDK
declare global {
    interface Window {
        FB?: {
            init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
            login: (callback: (response: any) => void, options?: { scope?: string }) => void;
            getLoginStatus: (callback: (response: any) => void) => void;
            api: {
                (path: string, callback: (response: any) => void): void;
                (path: string, method: string, callback: (response: any) => void): void;
                (path: string, method: string, params: any, callback: (response: any) => void): void;
            };
            AppEvents?: {
                logPageView: () => void;
                logEvent: (eventName: string, valueToSum?: number, parameters?: any) => void;
            };
        };
        fbAsyncInit?: () => void;
    }
}

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '2106228116796555';

/**
 * Scopes for Facebook Login. Default uses only permissions that work without App Review.
 * Requesting pages_show_list, pages_read_engagement, pages_manage_posts often returns
 * "Invalid Scopes" unless your app has those permissions enabled.
 *
 * Meta's current dashboard often does NOT show Page permissions under
 * Use cases → Facebook Login → Permissions and features — that list is usually
 * profile-only (email, public_profile, user_*). Page access may require a separate
 * use case (e.g. "Manage everything on your Page"), App Review, or Business
 * Verification. See FACEBOOK_PAGES_PERMISSIONS_SETUP.md and Meta's docs.
 */
const getLoginScope = (): string =>
    import.meta.env.VITE_FACEBOOK_SCOPES || 'public_profile,email,pages_show_list,pages_read_engagement';

/**
 * Get redirect URI (calculated at call time to avoid hydration issues)
 * Ensures consistent redirect URI across OAuth flow
 */
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000';
    }
    
    // Get origin and ensure consistent format
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // Remove any hash fragments and ensure trailing slash
    const cleanUri = `${origin}${pathname}`.replace(/#.*$/, '');
    
    // Ensure it ends with a slash for Facebook OAuth consistency
    return cleanUri.endsWith('/') ? cleanUri : `${cleanUri}/`;
};

// Token storage functions
const storeAccessToken = (token: string, expiresIn?: number): void => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('facebook_access_token', token);
    if (expiresIn) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        localStorage.setItem('facebook_token_expires', expiresAt.toString());
    }
    console.log('✅ Access token stored in localStorage');
};

const clearStoredData = (): void => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('facebook_access_token');
    localStorage.removeItem('facebook_token_expires');
    localStorage.removeItem('facebook_pages');
    console.log('🗑️ Facebook data cleared from localStorage');
};

export const getStoredAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('facebook_access_token');
    const expiresAt = localStorage.getItem('facebook_token_expires');
    
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
        console.log('⏰ Token expired, clearing stored data');
        clearStoredData();
        return null;
    }
    
    return token;
};

export const isConnectedToFacebook = (): boolean => {
    return !!getStoredAccessToken();
};

// Debug: Log the redirect URI being used (only in development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    // Use setTimeout to avoid hydration issues
    setTimeout(() => {
        console.log('🔍 Facebook OAuth Debug Info:');
        console.log('App ID:', FB_APP_ID);
        console.log('Redirect URI:', getRedirectURI());
        console.log('Full URL:', window.location.href);
        console.log('Origin:', window.location.origin);
        console.log('Pathname:', window.location.pathname);
        console.log('Hash:', window.location.hash);
    }, 0);
}

/**
 * Initialize Facebook SDK (for production/HTTPS environments).
 * We do NOT load the Facebook JS SDK by default to avoid the warning:
 * "You are overriding current access token... Please consider passing access_token
 * directly to API parameters instead of overriding the global settings."
 * This app uses redirect OAuth and passes access_token in every Graph API request;
 * loading the SDK is unnecessary and can conflict with other scripts on the page.
 * Set VITE_FACEBOOK_SDK_LOCALHOST=true to load the SDK on localhost for testing.
 */
export const initFacebookSDK = () => {
    return new Promise<boolean>((resolve) => {
        const allowLocalhostSDK = import.meta.env.VITE_FACEBOOK_SDK_LOCALHOST === 'true';
        const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        if (typeof window === 'undefined') {
            resolve(false);
            return;
        }

        // Only load SDK if explicitly enabled for localhost testing; otherwise skip to avoid token-override warning
        if (!allowLocalhostSDK || !isLocalhost) {
            if (import.meta.env.DEV && isHTTPS) {
                console.log('Facebook: using redirect OAuth only (SDK not loaded to avoid access token override warning).');
            }
            resolve(false);
            return;
        }

        // Optional: load SDK only when explicitly enabled for localhost
        if (window.FB) {
            resolve(true);
            return;
        }

        const loadTimeout = setTimeout(() => {
            resolve(false);
        }, 10000);

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

        const js = document.createElement('script');
        js.id = 'facebook-jssdk';
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        js.async = true;
        js.onerror = () => {
            clearTimeout(loadTimeout);
            resolve(false);
        };
        const fjs = document.getElementsByTagName('script')[0];
        if (fjs?.parentNode) fjs.parentNode.insertBefore(js, fjs);
        else document.body.appendChild(js);
    });
};

/**
 * Handle Facebook OAuth callback automatically on page load
 */
export const handleFacebookCallback = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
        console.error('❌ Facebook OAuth error:', error);
        throw new Error(`Facebook login error: ${error}`);
    }

    if (code && state === 'facebook_oauth') {
        console.log('🔄 Handling Facebook OAuth callback...');
        
        try {
            const result = await exchangeCodeForToken(code);
            
            // Store the token
            if (result.accessToken) {
                storeAccessToken(result.accessToken, result.expiresIn);
                
                // Store pages if available
                if (result.pages && result.pages.length > 0) {
                    localStorage.setItem('facebook_pages', JSON.stringify(result.pages));
                    console.log(`📄 Stored ${result.pages.length} Facebook pages`);
                }
                
                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
                
                console.log('✅ Facebook OAuth completed successfully');
                return result;
            }
        } catch (error) {
            console.error('❌ Facebook token exchange failed:', error);
            throw error;
        }
    }
    
    return null;
};

/**
 * Initiate Facebook OAuth flow
 */
export const initiateFacebookOAuth = (): void => {
    if (typeof window === 'undefined') return;
    
    const scope = getLoginScope();
    const oauthState = 'facebook_oauth';
    const redirectUri = getRedirectURI();
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${oauthState}&response_type=code`;

    console.log('🚀 Initiating Facebook OAuth flow...');
    console.log('📋 OAuth URL:', authUrl);
    
    window.location.href = authUrl;
};

/**
 * Legacy function for backward compatibility
 */
export const loginWithFacebook = () => {
    return new Promise((resolve, reject) => {
        // Check if we're handling a callback from Facebook
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            reject(`Facebook login error: ${error}`);
            return;
        }

        if (code && state === 'facebook_oauth') {
            // Exchange code for access token
            exchangeCodeForToken(code)
                .then(resolve)
                .catch(reject);
            return;
        }

        // Always use redirect OAuth so we never call FB.login(), which would set a global
        // access token and trigger: "You are overriding current access token..."
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isHTTP = window.location.protocol === 'http:';
        if (isLocalhost && isHTTP) {
            reject(new Error(
                'LOCALHOST_SETUP_REQUIRED: Facebook integration on localhost requires:\n\n' +
                '1. Add "localhost" to Facebook App Domains\n' +
                '2. Add "http://localhost:3000" to Valid OAuth Redirect URIs\n' +
                '3. Set up a backend endpoint for secure token exchange\n\n' +
                'OR use ngrok/HTTPS tunnel for development.\n\n' +
                'See: https://developers.facebook.com/docs/facebook-login/web'
            ));
            return;
        }

        initiateFacebookOAuth();
    });
};

/**
 * Exchange authorization code for access token
 * NOTE: This MUST be done server-side for security
 */
export const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        const fromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('facebook_oauth_redirect_uri') : null;
        const redirectUri = typeof window !== 'undefined'
            ? (fromStorage || getRedirectURI())
            : getRedirectURI();
        if (typeof window !== 'undefined') sessionStorage.removeItem('facebook_oauth_redirect_uri');

        console.log('🔄 Exchanging authorization code for access token...');
        console.log('📋 Code length:', code.length);
        console.log('📋 Redirect URI:', redirectUri);

        const response = await fetch(`/api/facebook-simple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const msg = data?.error?.message ?? data?.message ?? data?.error ?? (typeof data === 'string' ? data : 'Token exchange failed');
            throw new Error(typeof msg === 'string' ? msg : 'Token exchange failed');
        }

        console.log('✅ Token exchange successful');
        console.log('📋 Token length:', data.accessToken?.length || 0);
        console.log('📋 Expires in:', data.expiresIn);

        return {
            accessToken: data.accessToken,
            expiresIn: data.expiresIn,
            pages: data.pages || []
        };
    } catch (error: any) {
        console.error('❌ Token exchange failed:', error);
        throw new Error(error?.message || 'Token exchange failed');
    }
};

/**
 * Get Facebook user profile (id, name) using stored access token
 */
export const getFacebookProfile = async (userAccessToken?: string): Promise<{ id: string; name: string }> => {
    const token = userAccessToken || getStoredAccessToken();
    
    if (!token) {
        throw new Error('No Facebook access token available');
    }

    const response = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Failed to fetch profile');
    return { id: String(data.id), name: data.name || 'Facebook' };
};

/**
 * Get Facebook Pages for a user access token
 */
export const getPageTokens = async (userAccessToken?: string): Promise<any[]> => {
    try {
        // First try to get from localStorage
        if (typeof window !== 'undefined') {
            const cachedPages = localStorage.getItem('facebook_pages');
            if (cachedPages) {
                const pages = JSON.parse(cachedPages);
                console.log(`📄 Retrieved ${pages.length} cached Facebook pages`);
                return pages;
            }
        }

        // If no cached pages, fetch from API
        const token = userAccessToken || getStoredAccessToken();
        
        if (token) {
            // Use stored token to fetch pages
            const response = await fetch(
                `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`
            );
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Failed to fetch pages');
            }
            
            const pages = data.data || [];
            
            // Cache the pages
            if (typeof window !== 'undefined' && pages.length > 0) {
                localStorage.setItem('facebook_pages', JSON.stringify(pages));
                console.log(`📄 Fetched and cached ${pages.length} Facebook pages`);
            }
            
            return pages;
        } else {
            // Fallback to API endpoint
            const response = await fetch('/api/facebook-simple');
            const data = await response.json();
            
            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to fetch pages');
            }
            
            return data.pages || [];
        }
    } catch (error: any) {
        console.error('❌ Failed to get pages:', error);
        throw new Error(`Failed to get pages: ${error.message}`);
    }
};

/**
 * Disconnect from Facebook (clear stored data)
 */
export const disconnectFacebook = (): void => {
    clearStoredData();
    console.log('🔌 Disconnected from Facebook');
};

/**
 * Get Instagram Business account details for a Facebook Page
 */
export const getInstagramAccount = async (pageAccessToken: string, instagramBusinessAccountId: string): Promise<any> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${instagramBusinessAccountId}?fields=id,username,profile_picture_url&access_token=${pageAccessToken}`
        );
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Failed to fetch Instagram account');
        }

        return data;
    } catch (error: any) {
        throw new Error(`Failed to get Instagram account: ${error.message}`);
    }
};
