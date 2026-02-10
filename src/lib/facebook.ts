/**
 * Facebook OAuth & Graph API Utility - FINAL VERSION
 * Prevents duplicate token exchanges with triple guard system
 * Uses redirect-based OAuth for localhost compatibility
 */

// TypeScript types for Facebook SDK
declare global {
    interface Window {
        FB?: {
            init: (params: any) => void;
            login: (callback: (response: any) => void, options?: any) => void;
            logout: (callback: (response: any) => void) => void;
            getAuthResponse: () => any;
            getLoginStatus: (callback: (response: any) => void) => void;
            api: (path: string, callback: (response: any) => void) => void;
            ui: (params: any, callback: (response: any) => void) => void;
            Event: {
                subscribe: (eventName: string, callback: (response: any) => void) => void;
                unsubscribe: (eventName: string, callback: (response: any) => void) => void;
            };
            XFBML: {
                parse: (element?: HTMLElement) => void;
            };
            AppEvents?: {
                logPageView: () => void;
                logEvent: (eventName: string, valueToSum?: number, parameters?: any) => void;
            };
        };
        fbAsyncInit?: () => void;
        
        // 🔥 DEBUG: Attach Facebook functions to window for testing
        initiateFacebookOAuth?: () => void;
        handleFacebookCallback?: () => Promise<any>;
        cleanupOAuthState?: () => void;
        testFacebookConnection?: () => Promise<any>;
        verifyFacebookConnection?: () => Promise<any>;
        quickFacebookTest?: () => void;
    }
}

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '2106228116796555';

// Triple guard system// 🔥 CRITICAL: Global lock to prevent ANY duplicate processing
let globalProcessingLock = false;

// 🔥 CRITICAL: Prevent duplicate requests
let ongoingRequest: Promise<any[]> | null = null;
let lastFetchedUserId: string | null = null;

// 🔥 CRITICAL: Lock for OAuth callback processing
const FB_LOCK = 'facebook_oauth_lock';

/**
 * Scopes for Facebook Login
 */
const getLoginScope = (): string =>
    import.meta.env.VITE_FACEBOOK_SCOPES || 
    'public_profile,email,pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights';

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
 * Clean up any existing OAuth state
 */
export const cleanupOAuthState = (): void => {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 Cleaning up OAuth state...');
    
    // Clear all Facebook-related storage
    sessionStorage.removeItem('facebook_oauth_lock');
    sessionStorage.removeItem('fb_oauth_in_progress');
    
    // Clear any code keys
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('fb_code_')) {
            sessionStorage.removeItem(key);
        }
    }
    
    // Clear global processing lock
    globalProcessingLock = false;
    
    console.log('✅ OAuth state cleaned up');
};

/**
 * Handle Facebook OAuth callback with duplicate prevention
 */
export const handleFacebookCallback = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    // � DEBUG: Log callback entry state
    console.log('🔍 [DEBUG] Facebook callback triggered:', {
        url: window.location.href,
        search: window.location.search,
        timestamp: new Date().toISOString(),
        sessionStorageKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook'))
    });
    
    // �� CRITICAL: Global lock - prevent ANY duplicates
    if (globalProcessingLock) {
        console.warn("🛑 Global lock active - another process is handling Facebook callback");
        console.log('🔍 [DEBUG] Global lock blocked callback');
        return { success: false, skipped: true };
    }
    
    globalProcessingLock = true;
    console.log('🔒 Global lock engaged for Facebook callback');
    console.log('🔍 [DEBUG] Global lock engaged');
    
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('❌ Facebook OAuth error:', error);
            throw new Error(`Facebook login error: ${error}`);
        }

        if (!code || state !== 'facebook_oauth') {
            console.log('🔍 [DEBUG] Not a Facebook callback - ignoring');
            return null; // Not a Facebook callback
        }

        // 🔥 CRITICAL: Create a unique key for this specific code
        const codeKey = `fb_code_${code.substring(0, 20)}`;
        
        // Check if this exact code was already processed
        if (sessionStorage.getItem(codeKey) === "processed") {
            console.warn("🛑 This authorization code was already processed");
            console.log('🔍 [DEBUG] Code already processed - skipping');
            const existingToken = getStoredAccessToken();
            return { success: !!existingToken, accessToken: existingToken, skipped: true };
        }
        
        // Mark this code as being processed IMMEDIATELY
        sessionStorage.setItem(codeKey, "processing");
        
        console.log('🔄 Facebook OAuth callback detected, processing...');
        console.log('🔍 [DEBUG] Processing new code:', {
            codeKey,
            codeLength: code.length,
            timestamp: Date.now()
        });
        
        // 🔥 CRITICAL: Remove code from URL IMMEDIATELY
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("code");
        cleanUrl.searchParams.delete("state");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
        console.log('🗑️ Code removed from URL');
        console.log('🔍 [DEBUG] Code removed from URL');
        
        const result = await exchangeCodeForToken(code);
        
        // Store token
        if (result.accessToken) {
            storeAccessToken(result.accessToken, result.expiresIn);
            
            if (result.pages && result.pages.length > 0) {
                localStorage.setItem('facebook_pages', JSON.stringify(result.pages));
                console.log(`📄 Stored ${result.pages.length} Facebook pages`);
            }
            
            // Mark as successfully processed
            sessionStorage.setItem(codeKey, "processed");
            
            // Fire success event
            window.dispatchEvent(new CustomEvent('facebook-connected', {
                detail: { success: true, pages: result.pages }
            }));
            
            console.log('✅ Facebook connection successful!');
            console.log('🔍 [DEBUG] Connection completed successfully');
            return result;
        }
    } catch (error: any) {
        console.error('❌ Facebook token exchange failed:', error);
        console.log('🔍 [DEBUG] Token exchange failed:', {
            error: error.message,
            timestamp: Date.now()
        });
        throw error;
    } finally {
        // 🔥 CRITICAL: Release global lock after delay
        setTimeout(() => {
            globalProcessingLock = false;
            console.log('🔓 Global lock released');
            console.log('🔍 [DEBUG] Global lock released');
        }, 1000);
    }
    
    return null;
};

/**
 * Initiate Facebook OAuth flow with URL-based deduplication
 */
export const initiateFacebookOAuth = (): void => {
    if (typeof window === 'undefined') return;

    // 🔥 CRITICAL: Prevent multiple OAuth windows
    const oauthKey = 'facebook_oauth_in_progress';
    
    // 🔍 DEBUG: Log current state before check
    console.log('🔍 [DEBUG] Current OAuth state:', {
        hasExisting: !!sessionStorage.getItem(oauthKey),
        existingValue: sessionStorage.getItem(oauthKey),
        allKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook')),
        timestamp: new Date().toISOString()
    });
    
    if (sessionStorage.getItem(oauthKey)) {
        console.warn('🛑 Facebook OAuth already in progress - ignoring duplicate request');
        console.log('🔍 [DEBUG] Duplicate blocked - OAuth already in progress');
        return;
    }

    // Mark OAuth as in progress
    sessionStorage.setItem(oauthKey, Date.now().toString());
    console.log('🚀 Starting Facebook OAuth flow');
    console.log('🔍 [DEBUG] OAuth marked as in progress:', {
        timestamp: Date.now().toString(),
        key: oauthKey
    });

    const redirectUri = getRedirectURI();
    const scopes = getLoginScope();
    
    // Build OAuth URL with re-authentication
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
        `client_id=${FB_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&response_type=code` +
        `&state=facebook_oauth` +
        `&auth_type=rerequest` +  // Force re-approval
        `&display=popup`;  // Better UX

    console.log('🔗 Redirecting to Facebook OAuth:', authUrl.substring(0, 100) + '...');
    
    // 🔥 CRITICAL: Use redirect instead of popup to avoid blocking
    console.log('� Using redirect flow (more reliable than popup)');
    window.location.href = authUrl;
};

/**
 * Check if security challenge is needed
 */
export const needsSecurityChallenge = (error: any): boolean => {
    return (
        error?.error === 'FACEBOOK_SECURITY_CHALLENGE' ||
        error?.message?.includes('security challenge') ||
        error?.message?.includes('reauth')
    );
};

// 🔥 CRITICAL: Attach functions to window for testing and debugging
if (typeof window !== 'undefined') {
    window.initiateFacebookOAuth = initiateFacebookOAuth;
    window.handleFacebookCallback = handleFacebookCallback;
    window.cleanupOAuthState = cleanupOAuthState;
    
    // Add test function
    window.testFacebookConnection = async function() {
        console.log('🧪 Starting Facebook Connection Test...');
        
        // 1. Clear all state
        console.log('\n📋 Step 1: Clearing state...');
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('current_workspace_id', 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9');
        console.log('✅ State cleared');
        
        // 2. Check current state
        console.log('\n📋 Step 2: Checking current state...');
        console.log('🔑 localStorage:', Object.keys(localStorage));
        console.log('🔑 sessionStorage:', Object.keys(sessionStorage));
        console.log('🔑 URL:', window.location.href);
        
        // 3. Test OAuth initiation
        console.log('\n📋 Step 3: Testing OAuth initiation...');
        
        // Check if initiateFacebookOAuth exists
        if (typeof window.initiateFacebookOAuth === 'function') {
            console.log('✅ initiateFacebookOAuth function found');
            
            // Mock function to see if it's called multiple times
            let callCount = 0;
            const originalFunction = window.initiateFacebookOAuth;
            
            window.initiateFacebookOAuth = function() {
                callCount++;
                console.log(`🔄 initiateFacebookOAuth called ${callCount} times`);
                console.log('🔍 Call stack:', new Error().stack);
                
                // Check state before calling
                const oauthKey = 'facebook_oauth_in_progress';
                console.log('🔍 State before check:', {
                    hasExisting: !!sessionStorage.getItem(oauthKey),
                    existingValue: sessionStorage.getItem(oauthKey),
                    allKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook')),
                    timestamp: new Date().toISOString()
                });
                
                return originalFunction.apply(this, arguments);
            };
            
            console.log('🧪 Mocked initiateFacebookOAuth - ready to test');
            
        } else {
            console.log('❌ initiateFacebookOAuth function not found');
            console.log('🔍 Available window functions:', Object.keys(window).filter(k => k.includes('facebook')));
        }
        
        // 4. Test callback handling
        console.log('\n📋 Step 4: Testing callback handling...');
        
        if (typeof window.handleFacebookCallback === 'function') {
            console.log('✅ handleFacebookCallback function found');
            
            // Mock callback to see if it's called multiple times
            let callbackCount = 0;
            const originalCallback = window.handleFacebookCallback;
            
            window.handleFacebookCallback = async function() {
                callbackCount++;
                console.log(`🔄 handleFacebookCallback called ${callbackCount} times`);
                console.log('🔍 Call stack:', new Error().stack);
                
                // Check state before processing
                console.log('🔍 Callback state:', {
                    url: window.location.href,
                    search: window.location.search,
                    timestamp: new Date().toISOString(),
                    sessionStorageKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook'))
                });
                
                return originalCallback.apply(this, arguments);
            };
            
            console.log('🧪 Mocked handleFacebookCallback - ready to test');
            
        } else {
            console.log('❌ handleFacebookCallback function not found');
            console.log('🔍 Available window functions:', Object.keys(window).filter(k => k.includes('facebook')));
        }
        
        console.log('\n🎯 Test Complete!');
        console.log('📝 Instructions:');
        console.log('1. Click "Connect Facebook" button');
        console.log('2. Watch console for multiple calls');
        console.log('3. Complete OAuth flow');
        console.log('4. Check for duplicate processing');
        
        return {
            status: 'test_ready',
            functions: {
                initiateFacebookOAuth: typeof window.initiateFacebookOAuth === 'function',
                handleFacebookCallback: typeof window.handleFacebookCallback === 'function'
            }
        };
    };
    
    // Add verification function
    window.verifyFacebookConnection = async function() {
        console.log('🔍 Verifying Facebook Connection...');
        
        // 1. Check if we have a token
        const token = localStorage.getItem('facebook_access_token');
        console.log('🔑 Token exists:', !!token);
        
        if (!token) {
            console.log('❌ No Facebook token found. Please connect Facebook first.');
            return { success: false, error: 'No token found' };
        }
        
        // 2. Test token validity
        console.log('🧪 Testing token validity...');
        try {
            const response = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
            const data = await response.json();
            
            if (data.error) {
                console.log('❌ Token invalid:', data.error);
                return { success: false, error: data.error };
            }
            
            console.log('✅ Token valid for user:', data.name);
        } catch (error) {
            console.log('❌ Token test failed:', error);
            return { success: false, error: error.message };
        }
        
        // 3. Fetch Facebook Pages
        console.log('📄 Fetching Facebook Pages...');
        try {
            const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,instagram_business_account&access_token=${token}`);
            const pagesData = await pagesResponse.json();
            
            if (pagesData.error) {
                console.log('❌ Pages fetch failed:', pagesData.error);
                return { success: false, error: pagesData.error };
            }
            
            console.log('📋 Raw Facebook API Response:', pagesData);
            
            // 4. Analyze response
            const allItems = pagesData.data || [];
            console.log(`📊 Total items returned: ${allItems.length}`);
            
            // Filter for actual Facebook Pages (not personal profiles)
            const actualPages = allItems.filter(item => item.category);
            console.log(`✅ Actual Facebook Pages (with category): ${actualPages.length}`);
            
            // Filter for pages with Instagram accounts
            const pagesWithInstagram = actualPages.filter(page => page.instagram_business_account);
            console.log(`📸 Pages with Instagram linked: ${pagesWithInstagram.length}`);
            
            // 5. Display results
            if (actualPages.length === 0) {
                console.log('⚠️ No Facebook Pages found - only personal profiles');
                console.log('💡 Solution: Create Facebook Pages and link Instagram accounts');
                return { 
                    success: false, 
                    error: 'No Facebook Pages found',
                    type: 'personal_profile_only',
                    raw_data: allItems
                };
            }
            
            if (pagesWithInstagram.length === 0) {
                console.log('⚠️ Facebook Pages found but no Instagram accounts linked');
                console.log('💡 Solution: Link Instagram Business/Creator accounts to your Facebook Pages');
                return { 
                    success: false, 
                    error: 'No Instagram accounts linked',
                    type: 'no_instagram_linked',
                    pages: actualPages
                };
            }
            
            console.log('🎉 SUCCESS: Facebook Pages with Instagram found!');
            console.log('📄 Facebook Pages:');
            actualPages.forEach(page => {
                const hasInstagram = page.instagram_business_account ? '📸 Yes' : '❌ No';
                console.log(`  • ${page.name} (${page.category}) - Instagram: ${hasInstagram}`);
            });
            
            console.log('📸 Instagram Accounts:');
            pagesWithInstagram.forEach(page => {
                const ig = page.instagram_business_account;
                console.log(`  • ${ig.username || 'Unknown'} (Page: ${page.name})`);
            });
            
            return {
                success: true,
                total_pages: actualPages.length,
                instagram_pages: pagesWithInstagram.length,
                pages: actualPages,
                instagram_accounts: pagesWithInstagram.map(p => p.instagram_business_account)
            };
            
        } catch (error) {
            console.log('❌ Pages fetch failed:', error);
            return { success: false, error: error.message };
        }
    };
    
    // Add quick test function
    window.quickFacebookTest = function() {
        console.log('⚡ Quick Facebook Test...');
        
        const token = localStorage.getItem('facebook_access_token');
        const pages = localStorage.getItem('facebook_pages');
        
        console.log('🔑 Token:', token ? '✅ Found' : '❌ Not found');
        console.log('📄 Pages:', pages ? JSON.parse(pages).length + ' items' : '❌ Not found');
        
        if (token && pages) {
            console.log('🎯 Running full verification...');
            window.verifyFacebookConnection();
        } else {
            console.log('❌ Please connect Facebook first');
        }
    };
    
    console.log('🔥 Facebook functions attached to window for testing');
}
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

        // ✅ Get workspaceId from localStorage
        const workspaceId = localStorage.getItem('current_workspace_id') || 
                           'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9'; // Fallback from logs

        console.log('📋 Workspace ID:', workspaceId);

        const response = await fetch(`/api/facebook?action=simple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                code, 
                redirectUri,
                workspaceId
            })
        });

        const data = await response.json().catch(() => ({}));

        // ✅ Log the actual error response
        if (!response.ok) {
            console.error('❌ Backend error response:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });
            
            const msg = data?.error?.message ?? data?.message ?? data?.error ?? (typeof data === 'string' ? data : 'Token exchange failed');
            const error = new Error(typeof msg === 'string' ? msg : 'Token exchange failed');
            
            // Add more details to error for better handling
            (error as any).details = data?.details;
            (error as any).facebookError = data?.facebookError;
            
            throw error;
        }

        // ✅ Handle security challenge response
        if (data.error === 'FACEBOOK_SECURITY_CHALLENGE') {
            // Show user-friendly message
            throw new Error(
                '🔐 Facebook Security Check Required\n\n' +
                'Facebook needs to verify this action for security.\n\n' +
                'Please:\n' +
                '1. Disconnect your Facebook account\n' +
                '2. Reconnect and approve all permissions\n' +
                '3. Make sure you\'re logged into the correct Facebook account\n\n' +
                'Click "Connect Facebook" again to complete the process.'
            );
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
        // If same user and request already in progress, return existing promise
        if (ongoingRequest && lastFetchedUserId === userAccessToken) {
            return ongoingRequest;
        }

        // Create new request
        const request = (async () => {
            // Check cache first
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem('facebook_pages');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (parsed && parsed.length > 0) {
                            console.log('[getPageTokens] Using cached pages:', parsed.length);
                            return parsed;
                        }
                    } catch (e) {
                        console.warn('[getPageTokens] Invalid cache, fetching fresh');
                    }
                }
            }

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
                
                // ✅ NEW: Validate Instagram connection
                const pagesWithInstagram = pages.filter((page: any) => page.instagram_business_account);
                const pagesWithoutInstagram = pages.filter((page: any) => !page.instagram_business_account);
                
                if (pagesWithoutInstagram.length > 0) {
                    console.warn('⚠️ Some pages have no Instagram account:', 
                        pagesWithoutInstagram.map((p: any) => p.name));
                }
                
                if (pagesWithInstagram.length === 0) {
                    throw new Error(
                        'No Instagram Business accounts found. Please:\n' +
                        '1. Convert your Instagram to a Business account\n' +
                        '2. Link it to your Facebook Page\n' +
                        '3. Reconnect your Facebook account'
                    );
                }
                
                console.log(`✅ Found ${pagesWithInstagram.length} pages with Instagram`);
                
                // Cache ALL pages (even without Instagram)
                if (typeof window !== 'undefined' && pages.length > 0) {
                    localStorage.setItem('facebook_pages', JSON.stringify(pages));
                }
                
                return pages;
            } else {
                const response = await fetch('/api/facebook?action=simple');
                const data = await response.json();
                if (!response.ok || data.error) throw new Error(data.error || 'Failed to fetch pages');
                return data.pages || [];
            }
        })();

        // Store as ongoing request
        ongoingRequest = request;
        lastFetchedUserId = userAccessToken || '';
        
        return request;
    } catch (error: any) {
        console.error('❌ Failed to get pages:', error);
        throw error;
    }
};
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

/**
 * Get all Instagram accounts from connected Facebook pages
 */
export const getConnectedInstagramAccounts = async (userAccessToken?: string): Promise<any[]> => {
    try {
        const pages = await getPageTokens(userAccessToken);
        const instagramAccounts = [];
        
        for (const page of pages) {
            if (page.instagram_business_account) {
                try {
                    const igAccount = await getInstagramAccount(
                        page.access_token,
                        page.instagram_business_account.id
                    );
                    
                    instagramAccounts.push({
                        pageId: page.id,
                        pageName: page.name,
                        pageToken: page.access_token,
                        instagram: {
                            id: igAccount.id,
                            username: igAccount.username,
                            profilePicture: igAccount.profile_picture_url
                        }
                    });
                } catch (error) {
                    console.warn(`⚠️ Failed to fetch Instagram for page ${page.name}:`, error);
                }
            }
        }
        
        if (instagramAccounts.length === 0) {
            throw new Error('No Instagram Business accounts found on your Facebook pages');
        }
        
        return instagramAccounts;
    } catch (error: any) {
        console.error('❌ Failed to get Instagram accounts:', error);
        throw error;
    }
};

/**
 * Debug Instagram connection
 */
export const debugInstagramConnection = async (): Promise<void> => {
    console.log('🔍 Debugging Instagram Connection...\n');
    
    // Check 1: Token exists
    const token = getStoredAccessToken();
    console.log('1. Access Token:', token ? '✅ Found' : '❌ Missing');
    
    if (!token) {
        console.log('→ Run initiateFacebookOAuth() first');
        return;
    }
    
    // Check 2: Fetch pages
    try {
        const pages = await getPageTokens();
        console.log(`2. Facebook Pages: ✅ ${pages.length} found`);
        
        // Check 3: Instagram accounts
        const pagesWithIG = pages.filter(p => p.instagram_business_account);
        console.log(`3. Pages with Instagram: ${pagesWithIG.length > 0 ? '✅' : '❌'} ${pagesWithIG.length}`);
        
        if (pagesWithIG.length === 0) {
            console.log('❌ No Instagram Business accounts linked!');
            console.log('\nSetup required:');
            console.log('1. Convert Instagram to Business account');
            console.log('2. Link Instagram to Facebook Page');
            console.log('3. Reconnect with proper scopes');
            return;
        }
        
        // Check 4: Fetch Instagram details
        for (const page of pagesWithIG) {
            const igAccount = await getInstagramAccount(
                page.access_token,
                page.instagram_business_account.id
            );
            console.log(`\n✅ Instagram Account Found:`);
            console.log(`   Page: ${page.name}`);
            console.log(`   Instagram: @${igAccount.username}`);
            console.log(`   ID: ${igAccount.id}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
};
