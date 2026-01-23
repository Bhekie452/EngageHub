/**
 * YouTube OAuth & API Utility
 * Uses OAuth 2.0 for YouTube authentication via Google
 */

const YOUTUBE_CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const YOUTUBE_CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET || import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ''; // Only used server-side

/**
 * Get redirect URI (calculated at call time to avoid hydration issues)
 * Normalizes 127.0.0.1 to localhost for development
 */
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000';
    }
    
    // Normalize 127.0.0.1 to localhost for development
    let origin = window.location.origin;
    if (origin.includes('127.0.0.1')) {
        origin = origin.replace('127.0.0.1', 'localhost');
    }
    
    // For development, use just the origin (root path)
    // For production, use the full path
    const isDevelopment = origin.includes('localhost');
    if (isDevelopment) {
        return origin;
    }
    
    return `${origin}${window.location.pathname}${window.location.hash || ''}`;
};

/**
 * Connect to YouTube (redirects to Google OAuth)
 * YouTube uses Google OAuth, so we authenticate via Google
 */
export const connectYouTube = () => {
    return new Promise((resolve, reject) => {
        if (!YOUTUBE_CLIENT_ID) {
            const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
            const errorMessage = isProduction
                ? 'YouTube/Google Client ID is not configured.\n\n' +
                  '🔧 Setup Steps:\n\n' +
                  '1. Go to Vercel Dashboard: https://vercel.com/dashboard\n' +
                  '2. Select your project\n' +
                  '3. Go to Settings → Environment Variables\n' +
                  '4. Add: VITE_YOUTUBE_CLIENT_ID = your_google_client_id\n' +
                  '   OR: VITE_GOOGLE_CLIENT_ID = your_google_client_id\n' +
                  '5. Redeploy your application\n\n' +
                  'Or for local development:\n' +
                  'Add VITE_YOUTUBE_CLIENT_ID to your .env.local file'
                : 'YouTube/Google Client ID not configured.\n\n' +
                  'Please set VITE_YOUTUBE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID in your .env.local file:\n\n' +
                  'VITE_YOUTUBE_CLIENT_ID=your_client_id_here\n\n' +
                  'See YOUTUBE_CONNECTION_GUIDE.md for detailed setup instructions.';
            reject(new Error(errorMessage));
            return;
        }

        // Check if we're handling a callback from Google
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const urlState = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
            reject(new Error(`YouTube OAuth error: ${errorDescription || error}`));
            return;
        }

        if (code && urlState === 'youtube_oauth') {
            // Exchange code for access token (requires backend)
            exchangeCodeForToken(code)
                .then(resolve)
                .catch(reject);
            return;
        }

        // Redirect to Google OAuth for YouTube
        // Required scopes for YouTube:
        // - youtube.upload: Upload videos
        // - youtube.readonly: Read channel info
        // - youtube.force-ssl: Required for some operations
        const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
        const oauthState = 'youtube_oauth';
        const redirectUri = getRedirectURI();
        
        // Google OAuth 2.0 authorization endpoint
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${oauthState}&access_type=offline&prompt=consent`;
        
        // Store the current URL to return to after OAuth
        sessionStorage.setItem('youtube_oauth_return', window.location.href);
        // CRITICAL: Store the exact redirect URI used in authorization request
        // This must match exactly when exchanging the token
        sessionStorage.setItem('youtube_oauth_redirect_uri', redirectUri);
        
        console.log('🔄 Redirecting to Google OAuth for YouTube...');
        console.log('Redirect URI:', redirectUri);
        console.log('Auth URL:', authUrl);
        
        window.location.href = authUrl;
        // Note: This will redirect, so the promise won't resolve until callback
    });
};

/**
 * Exchange authorization code for access token
 * NOTE: This MUST be done server-side for security (client secret required)
 */
const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        // CRITICAL: Use the EXACT redirect URI that was used in the authorization request
        const storedRedirectUri = sessionStorage.getItem('youtube_oauth_redirect_uri');
        const redirectUri = storedRedirectUri || getRedirectURI();
        
        console.log('🔄 Exchanging YouTube code for token...');
        console.log('Using redirect URI:', redirectUri);
        console.log('Stored redirect URI:', storedRedirectUri);
        
        // Check if we have a backend endpoint for token exchange
        const backendUrl = import.meta.env.VITE_API_URL || '';
        
        if (backendUrl) {
            // Use backend endpoint (recommended)
            const response = await fetch(`${backendUrl}/api/youtube/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Token exchange failed');
            }
            
            const data = await response.json();
            
            // Clean up URL and stored data
            const returnUrl = sessionStorage.getItem('youtube_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('youtube_oauth_return');
            sessionStorage.removeItem('youtube_oauth_redirect_uri');
            
            return {
                accessToken: data.access_token,
                expiresIn: data.expires_in,
                refreshToken: data.refresh_token,
                idToken: data.id_token
            };
        } else {
            // For localhost development without backend, show helpful error
            const returnUrl = sessionStorage.getItem('youtube_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('youtube_oauth_return');
            
            throw new Error(
                'YouTube OAuth requires a backend server for security (client secret needed).\n\n' +
                'For localhost development, please:\n\n' +
                '1. Set up a backend endpoint at /api/youtube/token\n' +
                '2. Set VITE_API_URL in environment variables\n' +
                '3. Or use Supabase Edge Functions\n\n' +
                'See YOUTUBE_CONNECTION_GUIDE.md for setup instructions.'
            );
        }
    } catch (error: any) {
        throw new Error(`Token exchange failed: ${error.message}`);
    }
};

/**
 * Get YouTube channel information
 * Uses backend API to avoid CORS issues
 */
export const getYouTubeChannel = async (accessToken: string): Promise<any> => {
    try {
        // Use backend endpoint to avoid CORS issues
        const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const response = await fetch(`${backendUrl}/api/youtube/channel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessToken })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch YouTube channel');
        }
        
        return await response.json();
    } catch (error: any) {
        throw new Error(`Failed to get YouTube channel: ${error.message}`);
    }
};

/**
 * Upload video to YouTube
 * NOTE: This is a simplified example. Full implementation requires:
 * - Resumable upload for large files
 * - Progress tracking
 * - Error handling
 */
export const uploadYouTubeVideo = async (
    accessToken: string,
    videoFile: File,
    title: string,
    description: string,
    tags: string[] = [],
    privacyStatus: 'private' | 'unlisted' | 'public' = 'private'
): Promise<any> => {
    try {
        // Step 1: Create video metadata
        const metadata = {
            snippet: {
                title,
                description,
                tags,
                categoryId: '22' // People & Blogs (default)
            },
            status: {
                privacyStatus
            }
        };
        
        // Step 2: Upload video using resumable upload
        // For production, use resumable upload for large files
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('video', videoFile);
        
        const response = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to upload video');
        }
        
        return await response.json();
    } catch (error: any) {
        throw new Error(`Failed to upload YouTube video: ${error.message}`);
    }
};

/**
 * Get YouTube channel statistics
 */
export const getYouTubeStats = async (accessToken: string, channelId: string): Promise<any> => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch channel statistics');
        }
        
        const data = await response.json();
        return data.items?.[0]?.statistics || {};
    } catch (error: any) {
        throw new Error(`Failed to get YouTube stats: ${error.message}`);
    }
};
