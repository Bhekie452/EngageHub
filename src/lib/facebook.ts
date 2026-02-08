/**
 * Facebook OAuth & Graph API Utility - FINAL VERSION
 * Prevents duplicate token exchanges with triple guard system
 * Uses redirect-based OAuth for localhost compatibility
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

// Triple guard system to prevent duplicate token exchanges
let isProcessingCallback = false;
let exchangeStarted = false;

// Session storage lock for cross-tab protection
const FB_LOCK = "fb_callback_lock";

/**
 * Scopes for Facebook Login
 */
const getLoginScope = (): string =>
    import.meta.env.VITE_FACEBOOK_SCOPES || 'public_profile,email,pages_show_list,pages_read_engagement';

/**
 * Get redirect URI - use dedicated callback route for consistency
 */
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000/auth/facebook/callback';
    }
    
    // Always use the dedicated callback route for OAuth
    const origin = window.location.origin;
    return `${origin}/auth/facebook/callback`;
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
    localStorage.removeItem('facebook_processing');
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

// Debug logging in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    setTimeout(() => {
        console.log('🔍 Facebook OAuth Debug Info:');
        console.log('App ID:', FB_APP_ID);
        console.log('Redirect URI:', getRedirectURI());
        console.log('Full URL:', window.location.href);
    }, 0);
}

/**
 * Initialize Facebook SDK (optional)
 */
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
 * Handle Facebook OAuth callback with duplicate prevention
 */
export const handleFacebookCallback = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    // 🔥 CRITICAL: Block duplicates across tabs/reloads using sessionStorage
    if (sessionStorage.getItem(FB_LOCK) === "1") {
        console.warn("🛑 Facebook callback already in progress (blocked duplicate)");
        return { success: false, skipped: true };
    }
    
    // Set lock immediately
    sessionStorage.setItem(FB_LOCK, "1");
    
    // Guard 1: In-memory flag
    if (isProcessingCallback) {
        console.log('🔄 Already processing Facebook callback, skipping...');
        return { success: false, skipped: true };
    }
    
    // Guard 2: localStorage flag
    const processingFlag = localStorage.getItem('facebook_processing');
    if (processingFlag === 'true') {
        console.log('🔄 Facebook callback already processing (localStorage), skipping...');
        return { success: false, skipped: true };
    }
    
    // Guard 3: Check if already connected
    const existingToken = getStoredAccessToken();
    if (existingToken) {
        console.log('✅ Already connected to Facebook, skipping callback');
        return { success: true, accessToken: existingToken };
    }
    
    // Guard 4: Prevent double exchange
    if (exchangeStarted) {
        console.log('🔄 Exchange already started, skipping...');
        return { success: false, skipped: true };
    }
    exchangeStarted = true;
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
        console.error('❌ Facebook OAuth error:', error);
        throw new Error(`Facebook login error: ${error}`);
    }

    if (code && state === 'facebook_oauth') {
        console.log('🔄 Facebook OAuth callback detected, processing...');
        
        // 🔥 CRITICAL FIX: Remove code from URL IMMEDIATELY before exchange
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("code");
        cleanUrl.searchParams.delete("state");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
        console.log('🗑️ Code removed from URL immediately');
        
        // Set processing flags
        isProcessingCallback = true;
        localStorage.setItem('facebook_processing', 'true');
        
        try {
            const result = await exchangeCodeForToken(code);
            
            // Store token and pages
            if (result.accessToken) {
                storeAccessToken(result.accessToken, result.expiresIn);
                
                if (result.pages && result.pages.length > 0) {
                    localStorage.setItem('facebook_pages', JSON.stringify(result.pages));
                    console.log(`📄 Stored ${result.pages.length} Facebook pages`);
                }
                
                // Fire success event
                window.dispatchEvent(new CustomEvent('facebook-connected', {
                    detail: { success: true, pages: result.pages }
                }));
                
                console.log('✅ Facebook connection successful!');
                return result;
            }
        } catch (error: any) {
            console.error('❌ Facebook token exchange failed:', error);
            
            // Handle "code already used" gracefully
            if (error.message && error.message.includes('already been used')) {
                console.log('🔄 Code already used, checking if another instance succeeded...');
                
                // Wait a bit and check if token was stored by another instance
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const token = getStoredAccessToken();
                if (token) {
                    console.log('✅ Token found from another instance, treating as success');
                    
                    // Fire success event
                    window.dispatchEvent(new CustomEvent('facebook-connected', {
                        detail: { success: true, pages: [] }
                    }));
                    
                    return { success: true, accessToken: token };
                }
            }
            
            throw error;
        } finally {
            // Clear processing flags
            isProcessingCallback = false;
            localStorage.removeItem('facebook_processing');
            exchangeStarted = false;
            // 🔥 IMPORTANT: Keep sessionStorage lock to prevent refresh re-run
            // Only clear it if you want to allow re-authentication
        }
    }
    
    return null;
};

/**
 * Initiate Facebook OAuth flow
 */
export const initiateFacebookOAuth = (): void => {
    if (typeof window === 'undefined') return;
    
    console.log('🚀 Initiating Facebook OAuth flow...');
    
    const scope = getLoginScope();
    const oauthState = 'facebook_oauth';
    const redirectUri = getRedirectURI();
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${oauthState}&response_type=code`;

    console.log('📋 OAuth URL:', authUrl);
    window.location.href = authUrl;
};

/**
 * Legacy function for backward compatibility
 */
export const loginWithFacebook = () => {
    return new Promise((resolve, reject) => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            reject(`Facebook login error: ${error}`);
            return;
        }

        // DON'T call handleFacebookCallback here - it's already called by the callback page
        // This prevents double exchange when loginWithFacebook is used on callback page
        if (code && state === 'facebook_oauth') {
            // Just resolve with existing result or let callback page handle it
            const existingToken = getStoredAccessToken();
            if (existingToken) {
                resolve({ success: true, accessToken: existingToken });
            } else {
                // Let the callback page handle the exchange
                resolve({ success: false, message: 'Callback processing...' });
            }
            return;
        }

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isHTTP = window.location.protocol === 'http:';
        if (isLocalhost && isHTTP) {
            reject(new Error(
                'LOCALHOST_SETUP_REQUIRED: Facebook integration on localhost requires:\n\n' +
                '1. Add "localhost" to Facebook App Domains\n' +
                '2. Add "http://localhost:3000" to Valid OAuth Redirect URIs\n' +
                '3. Set up a backend endpoint for secure token exchange\n\n' +
                'OR use ngrok/HTTPS tunnel for development.'
            ));
            return;
        }

        initiateFacebookOAuth();
    });
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        const redirectUri = getRedirectURI();

        console.log('🔄 Exchanging authorization code for access token...');
        console.log('📋 Code length:', code.length);
        console.log('📋 Redirect URI:', redirectUri);

        const response = await fetch(`/api/facebook?action=simple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const msg = data?.error?.message ?? data?.message ?? data?.error ?? (typeof data === 'string' ? data : 'Token exchange failed');
            const error = new Error(typeof msg === 'string' ? msg : 'Token exchange failed');
            
            // Add more details to error for better handling
            (error as any).details = data?.details;
            (error as any).facebookError = data?.facebookError;
            
            throw error;
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
        throw error;
    }
};

/**
 * Get Facebook user profile
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
 * Get Facebook Pages with caching
 */
export const getPageTokens = async (userAccessToken?: string): Promise<any[]> => {
    try {
        // Try localStorage first
        if (typeof window !== 'undefined') {
            const cachedPages = localStorage.getItem('facebook_pages');
            if (cachedPages) {
                const pages = JSON.parse(cachedPages);
                console.log(`📄 Retrieved ${pages.length} cached Facebook pages`);
                return pages;
            }
        }

        // Fetch from API
        const token = userAccessToken || getStoredAccessToken();
        
        if (token) {
            const response = await fetch(
                `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`
            );
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Failed to fetch pages');
            }
            
            const pages = data.data || [];
            
            // Cache pages
            if (typeof window !== 'undefined' && pages.length > 0) {
                localStorage.setItem('facebook_pages', JSON.stringify(pages));
                console.log(`📄 Fetched and cached ${pages.length} Facebook pages`);
            }
            
            return pages;
        } else {
            // Fallback to API endpoint
            const response = await fetch('/api/facebook?action=simple');
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
 * Disconnect from Facebook
 */
export const disconnectFacebook = (): void => {
    clearStoredData();
    
    // Fire disconnect event
    window.dispatchEvent(new CustomEvent('facebook-disconnected'));
    
    console.log('🔌 Disconnected from Facebook');
};

/**
 * Get Instagram Business account details
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
