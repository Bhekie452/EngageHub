/**
 * TikTok OAuth & API Utility
 * Uses OAuth 2.0 for TikTok authentication
 */

const TIKTOK_CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = import.meta.env.VITE_TIKTOK_CLIENT_SECRET || ''; // Only used server-side

/**
 * Get redirect URI (calculated at call time to avoid hydration issues)
 * Normalizes 127.0.0.1 to localhost for development to match TikTok app settings
 */
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000';
    }

    // Normalize 127.0.0.1 to localhost for development (TikTok requires exact match)
    let origin = window.location.origin;
    if (origin.includes('127.0.0.1')) {
        origin = origin.replace('127.0.0.1', 'localhost');
    }

    // Use just the origin (root URL) - TikTok redirects to root with query params
    // Remove trailing slash if present to ensure exact match
    return origin.replace(/\/$/, '');
};

/**
 * Generate a random code verifier for PKCE
 * Must be 43-128 characters, URL-safe
 */
function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    // Convert to base64url (URL-safe base64)
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate code challenge from verifier using S256 (SHA256)
 * TikTok OAuth 2.0 requires S256, not plain
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
    // Convert verifier to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);

    // Hash with SHA256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to base64url
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const base64 = btoa(String.fromCharCode(...hashArray));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Connect to TikTok (redirects to TikTok OAuth)
 */
export const connectTikTok = async () => {
    return new Promise(async (resolve, reject) => {
        if (!TIKTOK_CLIENT_KEY) {
            const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
            const errorMessage = isProduction
                ? 'TikTok Client Key not configured. Please set VITE_TIKTOK_CLIENT_KEY in Vercel environment variables.\n\nGo to: Vercel Dashboard → Your Project → Settings → Environment Variables\n\nAdd:\n- VITE_TIKTOK_CLIENT_KEY (for frontend)\n- TIKTOK_CLIENT_KEY (for backend)\n- TIKTOK_CLIENT_SECRET (for backend only)'
                : 'TikTok Client Key not configured. Please set VITE_TIKTOK_CLIENT_KEY in your .env file.';
            reject(new Error(errorMessage));
            return;
        }

        try {
            // TikTok OAuth 2.0 scopes
            const scope = 'user.info.basic video.upload';
            const oauthState = 'tiktok_oauth';
            const redirectUri = getRedirectURI();

            // Generate code verifier and challenge for PKCE (TikTok OAuth 2.0 requires PKCE with S256)
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Store code verifier for later use in token exchange
            sessionStorage.setItem('tiktok_oauth_code_verifier', codeVerifier);

            // TikTok OAuth 2.0 authorization endpoint
            const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${oauthState}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

            // Store the current URL to return to after OAuth
            sessionStorage.setItem('tiktok_oauth_return', window.location.href);
            // CRITICAL: Store the exact redirect URI used in authorization request
            sessionStorage.setItem('tiktok_oauth_redirect_uri', redirectUri);

            console.log('🔄 Redirecting to TikTok OAuth...');
            console.log('Redirect URI:', redirectUri);
            console.log('Auth URL:', authUrl);

            window.location.href = authUrl;
            resolve(true);
        } catch (error: any) {
            reject(new Error(`Failed to initiate TikTok OAuth: ${error.message}`));
        }
    });
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> => {
    try {
        // CRITICAL: Use the EXACT redirect URI that was used in the authorization request
        const storedRedirectUri = sessionStorage.getItem('tiktok_oauth_redirect_uri');
        const redirectUri = storedRedirectUri || getRedirectURI();
        const codeVerifier = sessionStorage.getItem('tiktok_oauth_code_verifier');

        if (!codeVerifier) {
            throw new Error('Code verifier not found. Please try connecting again.');
        }

        console.log('🔄 Exchanging TikTok code for token...');
        console.log('Using redirect URI:', redirectUri);
        console.log('Stored redirect URI:', storedRedirectUri);

        // Check if we have a backend endpoint for token exchange
        const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_VERCEL_URL || '';

        if (backendUrl) {
            const response = await fetch(`${backendUrl}/api/tiktok?action=token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri, codeVerifier })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(
                        'TikTok OAuth requires a backend endpoint.\n\n' +
                        'Please set up: POST /api/tiktok/token\n' +
                        'Set VITE_API_URL in environment variables.\n\n' +
                        'See TIKTOK_CONNECTION_GUIDE.md for setup instructions.'
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

            // Clean up session storage
            const returnUrl = sessionStorage.getItem('tiktok_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('tiktok_oauth_return');
            sessionStorage.removeItem('tiktok_oauth_redirect_uri');
            sessionStorage.removeItem('tiktok_oauth_code_verifier');

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in
            };
        } else {
            throw new Error('Backend URL not configured. Please set VITE_API_URL in environment variables.');
        }
    } catch (error: any) {
        throw new Error(`Failed to exchange TikTok code for token: ${error.message}`);
    }
};

/**
 * Get TikTok user profile (via backend to avoid CORS)
 */
export const getTikTokProfile = async (accessToken: string): Promise<any> => {
    try {
        const backendUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_VERCEL_URL || '';

        if (!backendUrl) {
            throw new Error('Backend URL not configured. Please set VITE_API_URL in environment variables.');
        }

        const response = await fetch(`${backendUrl}/api/tiktok?action=profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to fetch TikTok profile' }));
            throw new Error(error.message || error.error || 'Failed to fetch TikTok profile');
        }

        return await response.json();
    } catch (error: any) {
        throw new Error(`Failed to get TikTok profile: ${error.message}`);
    }
};
