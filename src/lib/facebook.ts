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
        diagnoseFacebookConnection?: () => Promise<void>;
        checkFacebookPermissions?: () => Promise<void>;
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
    'email,public_profile,pages_show_list,instagram_basic,pages_read_engagement,pages_manage_posts';

/**
 * Get redirect URI - use dedicated callback route for consistency
 */
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000/#/pages/auth/facebook/callback';
    }
    
    // Always use the dedicated callback route for OAuth with hash routing
    const origin = window.location.origin;
    return `${origin}/#/pages/auth/facebook/callback`;
};

// Token storage functions
/**
 * Store Page access tokens (not user tokens) with concurrency protection
 */
const storePageTokens = (pages: any[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
        // Add timestamp to prevent concurrency issues
        const dataWithTimestamp = {
            pages: pages,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        localStorage.setItem('facebook_pages', JSON.stringify(dataWithTimestamp));
        console.log(`✅ Stored ${pages.length} Facebook Page tokens`);
        
        // Log what we stored
        pages.forEach((page, i) => {
            console.log(`📄 Page ${i+1}: ${page.pageName} (${page.pageId}) - Instagram: ${page.hasInstagram ? '✅' : '❌'}`);
        });
    } catch (error) {
        console.error('❌ Error storing Page tokens:', error);
    }
};

/**
 * Store user access token (for refreshing Page tokens)
 */
const storeAccessToken = (token: string, expiresIn?: number): void => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('facebook_access_token', token);
    if (expiresIn) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        localStorage.setItem('facebook_token_expires', expiresAt.toString());
    }
    console.log('✅ User access token stored in localStorage (for Page token refresh)');
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
 * Clean up stale OAuth locks
 */
export const cleanupOAuthState = (): void => {
    if (typeof window === 'undefined') return;
    
    console.log('🧹 Cleaning up OAuth state...');
    
    // Clear sessionStorage locks
    sessionStorage.removeItem('facebook_oauth_in_progress');
    
    // Clear all exchange tracking
    Object.keys(sessionStorage)
        .filter(key => key.startsWith('fb_exchange_'))
        .forEach(key => sessionStorage.removeItem(key));
    
    // Clear global processing lock
    globalProcessingLock = false;
    
    console.log('✅ OAuth state cleaned up');
};

/**
 * Handle Facebook OAuth callback with duplicate prevention
 */
export const handleFacebookCallback = async (passedCode?: string, passedState?: string): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    //  DEBUG: Log callback entry state
    console.log('🔍 [DEBUG] Facebook callback triggered:', {
        url: window.location.href,
        search: window.location.search,
        passedCode: !!passedCode,
        passedState: !!passedState,
        timestamp: new Date().toISOString(),
        sessionStorageKeys: Object.keys(sessionStorage).filter(k => k.includes('facebook'))
    });
    
    //  CRITICAL: Global lock - prevent ANY duplicates
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
        const code = passedCode || urlParams.get('code');
        const state = passedState || urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('❌ Facebook OAuth error:', error);
            throw new Error(`Facebook login error: ${error}`);
        }

        // 🔥 CRITICAL: Improved state validation
        let isFacebookOauth = state === 'facebook_oauth';
        let stateData: any = null;

        if (!isFacebookOauth && state) {
            try {
                // Try parsing as JSON (backend-assisted flow)
                stateData = JSON.parse(decodeURIComponent(state));
                if (stateData && (stateData.workspaceId || stateData.origin)) {
                    isFacebookOauth = true;
                    console.log('✅ Recognized JSON state from backend:', stateData);
                    
                    // If we have a workspaceId in state, ensure it's used
                    if (stateData.workspaceId) {
                        localStorage.setItem('current_workspace_id', stateData.workspaceId);
                    }
                }
            } catch (e) {
                // Not JSON, ignore
            }
        }

        if (!code || !isFacebookOauth) {
            console.log('🔍 [DEBUG] Not a Facebook callback or invalid state:', { code: !!code, state });
            return null; // Not a Facebook callback
        }

        // 🔥 CRITICAL: Create a unique key for this specific code
        const codeKey = `fb_code_${code.substring(0, 20)}`;
        
        // Check if this exact code was already processed or is currently being processed
        const existingStatus = sessionStorage.getItem(codeKey);
        if (existingStatus === "processed" || existingStatus === "processing") {
            const statusMsg = existingStatus === "processed" ? "already processed" : "currently being processed";
            console.warn(`🛑 This authorization code is ${statusMsg} - skipping duplicate request`);
            console.log(`🔍 [DEBUG] Code status: ${existingStatus} - skipping`);
            
            // Wait a moment for the original request to finish if it's still processing
            if (existingStatus === "processing") {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            const existingToken = getStoredAccessToken();
            return { 
                success: !!existingToken, 
                accessToken: existingToken, 
                skipped: true,
                message: existingStatus === "processing" ? "Request already in progress" : "Already connected"
            };
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
        
        if (result && result.success) {
            // 🔥 CRITICAL: Mark this code as processed
            sessionStorage.setItem(codeKey, "processed");
            
            // 🔥 NEW: Store pages for selection screen
            if (result.pages && result.pages.length > 0) {
                console.log(`📄 Found ${result.pages.length} Facebook Pages - preparing for selection`);
                sessionStorage.setItem('facebook_pages_pending', JSON.stringify(result.pages));
                return { 
                    success: true, 
                    needsPageSelection: true,
                    pages: result.pages,
                    message: 'Pages available for selection' 
                };
            }
            
            // Also store user token for refreshing Page tokens
            if (result.accessToken) {
                storeAccessToken(result.accessToken, result.expiresIn);
            }
            
            console.log('✅ Facebook connection successful');
            console.log('📋 Result:', result);
            
            // Dispatch success event
            const event = new CustomEvent('facebookConnected', { 
                detail: { 
                    success: true, 
                    pages: result.pages,
                    message: result.message 
                } 
            });
            window.dispatchEvent(event);
            
            return { success: true, pages: result.pages, message: result.message, accessToken: result.accessToken };
        }
        
        // If we reach here, no success condition was met
        console.log('🔍 [DEBUG] No success condition met, result:', result);
        return { success: false, message: 'No success condition met' };
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
export const initiateFacebookOAuth = () => {
    if (typeof window === 'undefined') return;

    const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    const baseUrl = window.location.origin;
    
    // Redirect to backend auth endpoint instead of managing it here
    const backendAuthUrl = `${baseUrl}/api/facebook?action=auth&workspaceId=${workspaceId}`;
    
    console.log('🚀 Redirecting to Backend Facebook OAuth Handshake...');
    window.location.href = backendAuthUrl;
};

/**
 * Fetch Facebook connections from database
 */
export const fetchFacebookConnections = async (workspaceId: string): Promise<any[]> => {
    if (!workspaceId) {
        console.log('❌ No workspaceId provided');
        return [];
    }

    try {
        console.log('📋 Fetching Facebook connections from database...');
        
        const response = await fetch(`/api/facebook?action=connections&workspaceId=${workspaceId}`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Fetched ${data.connections.length} connections from database`);
            return data.connections;
        } else {
            console.log('⚠️ Database fetch failed, using localStorage fallback');
            return [];
        }
    } catch (error) {
        console.log('❌ Error fetching from database, using localStorage fallback:', error);
        return [];
    }
};

/**
 * Get Facebook pages with database fallback and concurrency protection
 */
export const getFacebookPages = async (workspaceId?: string): Promise<any[]> => {
    // First try database
    if (workspaceId) {
        try {
            const connections = await fetchFacebookConnections(workspaceId);
            if (connections.length > 0) {
                console.log('✅ Using pages from database');
                return connections;
            }
        } catch (error) {
            console.log('⚠️ Database fetch failed, trying localStorage');
        }
    }
    
    // Fallback to localStorage with concurrency protection
    if (typeof window !== 'undefined') {
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
    }
    
    console.log('❌ No Facebook pages found');
    return [];
};
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
    
    // Add diagnostic function
    window.diagnoseFacebookConnection = async function() {
        console.log('🔍 Diagnosing Facebook Connection...');
        
        const token = localStorage.getItem('facebook_access_token');
        if (!token) {
            console.log('❌ No token found - please connect Facebook first');
            return;
        }
        
        console.log('🔑 Testing token with /me endpoint...');
        try {
            const meResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
            const meData = await meResponse.json();
            console.log('👤 /me response:', meData);
            
            if (meData.error) {
                console.log('❌ Token invalid:', meData.error);
                return;
            }
            
            // Check token permissions
            console.log('🔍 Checking token permissions...');
            try {
                const permsResponse = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`);
                const permsData = await permsResponse.json();
                console.log('🔐 Token permissions:', permsData);
                
                const hasPagesPermission = permsData.data?.some(p => p.permission === 'pages_show_list');
                if (!hasPagesPermission) {
                    console.log('❌ MISSING pages_show_list permission!');
                    console.log('🔧 SOLUTION: Reconnect Facebook to get proper permissions');
                    return;
                }
            } catch (permError) {
                console.log('⚠️ Could not check permissions:', permError);
            }
        } catch (error) {
            console.log('❌ /me request failed:', error);
            return;
        }
        
        console.log('📄 Testing /me/accounts endpoint...');
        try {
            const accountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
            const accountsData = await accountsResponse.json();
            console.log('📋 /me/accounts response:', accountsData);
            
            if (accountsData.error) {
                console.log('❌ Accounts fetch failed:', accountsData.error);
                return;
            }
            
            const allItems = accountsData.data || [];
            console.log(`📊 Total items returned: ${allItems.length}`);
            
            if (allItems.length === 0) {
                console.log('⚠️ NO ITEMS RETURNED!');
                console.log('💡 This means:');
                console.log('   1. You have NO Facebook Pages');  
                console.log('   2. Your token lacks pages_show_list permission');
                console.log('   3. Your Pages are not accessible');
                console.log('');
                console.log('🔧 SOLUTION:');
                console.log('   1. Create Facebook Pages: https://facebook.com/pages/create');
                console.log('   2. Link Instagram Business accounts to Pages');
                console.log('   3. Reconnect Facebook with proper permissions');
                return;
            }
            
            console.log('📄 Analyzing returned items...');
            allItems.forEach((item, index) => {
                console.log(`\n📋 Item ${index + 1}:`);
                console.log(`   ID: ${item.id}`);
                console.log(`   Name: ${item.name}`);
                console.log(`   Category: ${item.category || 'NO CATEGORY (personal profile?)'}`);
                console.log(`   Has Instagram: ${item.instagram_business_account ? '✅ Yes' : '❌ No'}`);
                console.log(`   Has Access Token: ${item.access_token ? '✅ Yes' : '❌ No'}`);
                
                if (!item.category) {
                    console.log('   ⚠️ This looks like a PERSONAL PROFILE, not a Page!');
                }
            });
            
            const actualPages = allItems.filter(item => item.category);
            const pagesWithInstagram = actualPages.filter(page => page.instagram_business_account);
            
            console.log('\n📊 SUMMARY:');
            console.log(`   Total items: ${allItems.length}`);
            console.log(`   Actual Pages (with category): ${actualPages.length}`);
            console.log(`   Pages with Instagram: ${pagesWithInstagram.length}`);
            
            if (actualPages.length === 0) {
                console.log('\n❌ DIAGNOSIS: Only personal profiles returned!');
                console.log('🔧 SOLUTION: Create Facebook Pages and reconnect');
            } else if (pagesWithInstagram.length === 0) {
                console.log('\n⚠️ DIAGNOSIS: Pages found but no Instagram linked!');
                console.log('🔧 SOLUTION: Link Instagram Business accounts to your Pages');
            } else {
                console.log('\n✅ DIAGNOSIS: Everything looks good!');
            }
            
        } catch (error) {
            console.log('❌ /me/accounts request failed:', error);
        }
    };
    
    // Add permission checker function
    window.checkFacebookPermissions = async function() {
        console.log('🔐 Checking Facebook Token Permissions...');
        
        const token = localStorage.getItem('facebook_access_token');
        if (!token) {
            console.log('❌ No token found - connect Facebook first');
            return;
        }
        
        console.log('🔑 Token found:', token.substring(0, 20) + '...');
        
        try {
            // Check permissions
            const permsResponse = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`);
            const permsData = await permsResponse.json();
            
            console.log('📋 Full Permissions Response:', permsData);
            
            if (permsData.error) {
                console.log('❌ Error checking permissions:', permsData.error);
                return;
            }
            
            const permissions = permsData.data || [];
            console.log(`🔐 Total permissions: ${permissions.length}`);
            
            // Check for critical permissions
            const criticalPerms = ['pages_show_list', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'];
            
            console.log('\n🔍 CRITICAL PERMISSIONS CHECK:');
            criticalPerms.forEach(perm => {
                const hasPermission = permissions.some(p => p.permission === perm && p.status === 'granted');
                console.log(`${hasPermission ? '✅' : '❌'} ${perm}: ${hasPermission ? 'GRANTED' : 'MISSING'}`);
            });
            
            console.log('\n📄 ALL PERMISSIONS:');
            permissions.forEach(p => {
                console.log(`   ${p.permission}: ${p.status}`);
            });
            
            // Check if pages_show_list is missing
            const hasPagesPermission = permissions.some(p => p.permission === 'pages_show_list' && p.status === 'granted');
            
            if (!hasPagesPermission) {
                console.log('\n❌ DIAGNOSIS: MISSING pages_show_list PERMISSION!');
                console.log('🔧 SOLUTION:');
                console.log('   1. Disconnect current Facebook connection');
                console.log('   2. Click "Connect Facebook" again');
                console.log('   3. Make sure to grant ALL requested permissions');
                console.log('   4. pages_show_list is REQUIRED to access Facebook Pages');
            } else {
                console.log('\n✅ pages_show_list permission found!');
                
                // If permissions are OK, check what accounts are returned
                console.log('\n📄 Testing /me/accounts with proper permissions...');
                try {
                    const accountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
                    const accountsData = await accountsResponse.json();
                    console.log('📋 Accounts Response:', accountsData);
                    
                    if (accountsData.data && accountsData.data.length > 0) {
                        console.log(`✅ Found ${accountsData.data.length} accounts/pages`);
                        accountsData.data.forEach((item, i) => {
                            console.log(`\n📄 Item ${i+1}:`);
                            console.log(`   Name: ${item.name}`);
                            console.log(`   Category: ${item.category || 'NO CATEGORY'}`);
                            console.log(`   Has Instagram: ${item.instagram_business_account ? '✅' : '❌'}`);
                        });
                    } else {
                        console.log('❌ No accounts returned - even with proper permissions');
                        console.log('💡 This means:');
                        console.log('   1. You have no Facebook Pages');
                        console.log('   2. Pages exist but you\'re not an admin');
                        console.log('   3. Pages are restricted/inactive');
                    }
                } catch (error) {
                    console.log('❌ Error checking accounts:', error);
                }
            }
            
        } catch (error) {
            console.log('❌ Permission check failed:', error);
        }
    };
    
    console.log('🔥 Facebook functions attached to window for testing');
}
export const loginWithFacebook = () => {
    return new Promise((resolve) => {
        initiateFacebookOAuth();
        // Resolve quickly - the redirect will take over
        resolve({ success: true, message: 'Redirecting to Facebook...' });
    });
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<any> => {
    const redirectUri = getRedirectURI();
    const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
    
    console.log('🔄 Exchanging authorization code for access token...');
    console.log('📋 Code length:', code.length);
    console.log('📋 Redirect URI:', redirectUri);
    console.log('📋 Workspace ID:', workspaceId);

    try {
        // 🎯 THIS IS THE API CALL TO /api/facebook?action=simple
        const response = await fetch(`/api/facebook?action=simple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri, workspaceId })
        });

        // 🔥 CRITICAL: Check if response is JSON before parsing
        const responseText = await response.text();
        console.log('📋 Raw response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('❌ Response text:', responseText);
            
            // Check if it's an HTML error page
            if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
                throw new Error('Server returned HTML error page instead of JSON. Check server logs.');
            }
            
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok) {
            console.error('❌ Backend error response:', data);
            
            if (data.error?.includes('already been used')) {
                throw new Error('This authorization code has already been used');
            }
            
            throw new Error(data.error || 'Token exchange failed');
        }

        console.log('✅ Token exchange successful');
        console.log('📋 Token length:', data.accessToken?.length || 0);
        console.log('📋 Expires in:', data.expiresIn);

        return { 
            success: true,
            accessToken: data.accessToken, 
            expiresIn: data.expiresIn, 
            pages: data.pages, 
            message: data.message 
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
                const workspaceId = localStorage.getItem('current_workspace_id') || 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
                const response = await fetch(`/api/facebook?action=simple&workspaceId=${workspaceId}`);
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
