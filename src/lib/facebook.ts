
/**
 * Facebook OAuth & Graph API Utility
 * Uses redirect-based OAuth for localhost compatibility (Facebook requires HTTPS for SDK login)
 */

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '1621732999001688';
const REDIRECT_URI = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`
    : 'http://localhost:3000';

// Debug: Log the redirect URI being used
if (typeof window !== 'undefined') {
    console.log('🔍 Facebook OAuth Debug Info:');
    console.log('App ID:', FB_APP_ID);
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Full URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Pathname:', window.location.pathname);
    console.log('Hash:', window.location.hash);
}

/**
 * Initialize Facebook SDK (for production/HTTPS environments)
 */
export const initFacebookSDK = () => {
    return new Promise((resolve, reject) => {
        // Only initialize SDK if we're on HTTPS or production
        if (window.location.protocol === 'https:' || window.location.hostname !== 'localhost') {
            // Check if SDK is already loaded
            if ((window as any).FB) {
                console.log('Facebook SDK already initialized');
                resolve(true);
                return;
            }

            (window as any).fbAsyncInit = function () {
                try {
                    (window as any).FB.init({
                        appId: FB_APP_ID,
                        cookie: true,
                        xfbml: true,
                        version: 'v21.0'
                    });
                    console.log('Facebook SDK Initialized');
                    resolve(true);
                } catch (err: any) {
                    console.error('Facebook SDK init error:', err);
                    reject(err);
                }
            };

            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {
                    // Script already exists, wait for it to load
                    if ((window as any).FB) {
                        resolve(true);
                    } else {
                        // Wait a bit for the existing script to initialize
                        setTimeout(() => {
                            if ((window as any).FB) {
                                resolve(true);
                            } else {
                                reject(new Error('Facebook SDK failed to load'));
                            }
                        }, 2000);
                    }
                    return;
                }
                js = d.createElement(s) as any; js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                js.async = true;
                fjs.parentNode?.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        } else {
            console.log('Facebook SDK skipped (HTTP localhost - using redirect OAuth)');
            resolve(true);
        }
    });
};

/**
 * Wait for Facebook SDK to be ready
 */
const waitForFacebookSDK = (timeout = 5000): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        if ((window as any).FB) {
            resolve(true);
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if ((window as any).FB) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error('Facebook SDK timeout - SDK not loaded'));
            }
        }, 100);
    });
};

/**
 * Login with Facebook
 * - Uses SDK for HTTPS/production
 * - Uses redirect OAuth for HTTP/localhost (requires backend for token exchange)
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

        // Check if we're on HTTPS (can use SDK) or HTTP (must use redirect)
        const isHTTPS = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isHTTPS && !isLocalhost) {
            // Use SDK method for HTTPS production, with fallback to redirect OAuth
            waitForFacebookSDK(3000)
                .then(() => {
                    if (!(window as any).FB) {
                        throw new Error('Facebook SDK not available');
                    }

                    try {
                        (window as any).FB.login((response: any) => {
                            if (response.authResponse) {
                                resolve(response.authResponse);
                            } else {
                                // SDK login failed or was cancelled - fall back to redirect OAuth
                                console.warn('Facebook SDK login failed or cancelled, using redirect OAuth');
                                const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile';
                                const state = 'facebook_oauth';
                                const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;
                                
                                sessionStorage.setItem('facebook_oauth_return', window.location.href);
                                window.location.href = authUrl;
                            }
                        }, {
                            scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile',
                            return_scopes: true
                        });
                    } catch (err: any) {
                        // Fall back to redirect OAuth if SDK call fails
                        console.warn('Facebook SDK login error, using redirect OAuth:', err);
                        const scope = 'pages_manage_posts,pages_read_engagement,public_profile';
                        const state = 'facebook_oauth';
                        const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;
                        
                        sessionStorage.setItem('facebook_oauth_return', window.location.href);
                        window.location.href = authUrl;
                    }
                })
                .catch((err) => {
                    // If SDK not available or timeout, use redirect OAuth
                    console.warn('Facebook SDK not ready, using redirect OAuth:', err);
                    const scope = 'pages_manage_posts,pages_read_engagement,public_profile';
                    const state = 'facebook_oauth';
                    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;
                    
                    sessionStorage.setItem('facebook_oauth_return', window.location.href);
                    window.location.href = authUrl;
                });
        } else {
            // For HTTP/localhost, show helpful message about setup requirements
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
            
            // Use redirect OAuth for HTTP (non-localhost)
            const scope = 'pages_manage_posts,pages_read_engagement,public_profile';
            const state = 'facebook_oauth';
            const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;
            
            // Store the current URL to return to after OAuth
            sessionStorage.setItem('facebook_oauth_return', window.location.href);
            
            window.location.href = authUrl;
            // Note: This will redirect, so the promise won't resolve until callback
        }
    });
};

/**
 * Exchange authorization code for access token
 * NOTE: In production, this MUST be done server-side for security
 * For localhost development, you'll need to set up a backend endpoint or use ngrok
 */
const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        // Check if we have a backend endpoint for token exchange
        const backendUrl = import.meta.env.VITE_API_URL || '';
        
        if (backendUrl) {
            // Use backend endpoint (recommended)
            const response = await fetch(`${backendUrl}/api/facebook/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri: REDIRECT_URI })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Token exchange failed');
            }
            
            const data = await response.json();
            
            // Clean up URL
            const returnUrl = sessionStorage.getItem('facebook_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('facebook_oauth_return');
            
            return {
                accessToken: data.access_token,
                expiresIn: data.expires_in
            };
        } else {
            // For localhost development without backend, show helpful error
            const returnUrl = sessionStorage.getItem('facebook_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('facebook_oauth_return');
            
            throw new Error(
                'Facebook OAuth requires a backend server for security. ' +
                'For localhost development, please:\n\n' +
                '1. Set up a backend endpoint at /api/facebook/token\n' +
                '2. Or use ngrok to create an HTTPS tunnel\n' +
                '3. Or configure your Facebook App to allow localhost in App Domains\n\n' +
                'See README.md for setup instructions.'
            );
        }
    } catch (error: any) {
        throw new Error(`Token exchange failed: ${error.message}`);
    }
};

/**
 * Get Facebook Pages for a user access token
 */
export const getPageTokens = async (userAccessToken: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
        );
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'Failed to fetch pages');
        }
        
        return data.data || [];
    } catch (error: any) {
        throw new Error(`Failed to get pages: ${error.message}`);
    }
};
