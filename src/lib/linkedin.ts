/**
 * LinkedIn OAuth & API Utility
 * Uses OAuth 2.0 for LinkedIn authentication
 */

const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || ''; // Only used server-side

/**
 * Get redirect URI (calculated at call time to avoid hydration issues)
 * Normalizes 127.0.0.1 to localhost for development to match LinkedIn app settings
 */
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000';
    }
    
    // Normalize 127.0.0.1 to localhost for development (LinkedIn requires exact match)
    let origin = window.location.origin;
    // Convert 127.0.0.1 to localhost to match registered redirect URI
    if (origin.includes('127.0.0.1')) {
        origin = origin.replace('127.0.0.1', 'localhost');
    }
    if (origin.includes('127.0.0.1')) {
        origin = origin.replace('127.0.0.1', 'localhost');
    }
    
    // For development, use just the origin (root path)
    // For production, use the full path
    const isDevelopment = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (isDevelopment) {
        return origin;
    }
    
    return `${origin}${window.location.pathname}${window.location.hash || ''}`;
};

/**
 * Login with LinkedIn (redirects to LinkedIn OAuth)
 */
export const loginWithLinkedIn = () => {
    return new Promise((resolve, reject) => {
        if (!LINKEDIN_CLIENT_ID) {
            const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
            const errorMessage = isProduction
                ? 'LinkedIn Client ID is not configured.\n\n' +
                  '🔧 Setup Steps:\n\n' +
                  '1. Go to Vercel Dashboard: https://vercel.com/dashboard\n' +
                  '2. Select your project\n' +
                  '3. Go to Settings → Environment Variables\n' +
                  '4. Add: VITE_LINKEDIN_CLIENT_ID = your_client_id\n' +
                  '5. Redeploy your application\n\n' +
                  'Or for local development:\n' +
                  'Add VITE_LINKEDIN_CLIENT_ID to your .env.local file'
                : 'LinkedIn Client ID not configured.\n\n' +
                  'Please set VITE_LINKEDIN_CLIENT_ID in your .env.local file:\n\n' +
                  'VITE_LINKEDIN_CLIENT_ID=your_client_id_here\n\n' +
                  'See LINKEDIN_CONNECTION_GUIDE.md for detailed setup instructions.';
            reject(new Error(errorMessage));
            return;
        }

        // Check if we're handling a callback from LinkedIn
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const urlState = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
            reject(new Error(`LinkedIn login error: ${errorDescription || error}`));
            return;
        }

        if (code && urlState === 'linkedin_oauth') {
            // Exchange code for access token (requires backend)
            exchangeCodeForToken(code)
                .then(resolve)
                .catch(reject);
            return;
        }

        // Redirect to LinkedIn OAuth
        // Since "Share on LinkedIn" product is added, we can request w_member_social
        // Note: r_organization_social still requires Marketing Developer Platform (partner-only)
        const scope = 'openid profile email w_member_social'; // Basic + posting scopes
        // w_member_social allows posting on behalf of user (requires Share on LinkedIn product - which you have!)
        // For company pages, add: r_organization_social (requires Marketing Developer Platform - partner only)
        const oauthState = 'linkedin_oauth';
        const redirectUri = getRedirectURI();
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${oauthState}&scope=${encodeURIComponent(scope)}`;
        
        // Debug logging
        console.log('🔍 LinkedIn OAuth Debug:');
        console.log('Client ID:', LINKEDIN_CLIENT_ID ? `${LINKEDIN_CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND');
        console.log('Redirect URI:', redirectUri);
        console.log('Auth URL:', authUrl);
        
        // Store the current URL to return to after OAuth
        sessionStorage.setItem('linkedin_oauth_return', window.location.href);
        
        // Redirect to LinkedIn immediately
        console.log('🔄 Redirecting to LinkedIn OAuth...');
        console.log('Full redirect URL:', authUrl);
        
        // Immediately redirect - this will navigate away from the page
        window.location.href = authUrl;
        
        // Note: Code after this line won't execute due to redirect
        // The promise will resolve when LinkedIn redirects back with code
    });
};

/**
 * Exchange authorization code for access token
 * NOTE: This MUST be done server-side for security (client secret required)
 */
const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        // Check if we have a backend endpoint for token exchange
        const backendUrl = import.meta.env.VITE_API_URL || '';
        
        if (backendUrl) {
            // Use backend endpoint (recommended)
            const response = await fetch(`${backendUrl}/api/linkedin/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri: getRedirectURI() })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Token exchange failed');
            }
            
            const data = await response.json();
            
            // Clean up URL
            const returnUrl = sessionStorage.getItem('linkedin_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('linkedin_oauth_return');
            
            return {
                accessToken: data.access_token,
                expiresIn: data.expires_in,
                refreshToken: data.refresh_token
            };
        } else {
            // For localhost development without backend, show helpful error
            const returnUrl = sessionStorage.getItem('linkedin_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('linkedin_oauth_return');
            
            throw new Error(
                'LinkedIn OAuth requires a backend server for security (client secret needed).\n\n' +
                'For localhost development, please:\n\n' +
                '1. Set up a backend endpoint at /api/linkedin/token\n' +
                '2. Set VITE_API_URL in environment variables\n' +
                '3. Or use Supabase Edge Functions\n\n' +
                'See LINKEDIN_CONNECTION_GUIDE.md for setup instructions.'
            );
        }
    } catch (error: any) {
        throw new Error(`Token exchange failed: ${error.message}`);
    }
};

/**
 * Get LinkedIn user profile
 */
export const getLinkedInProfile = async (accessToken: string): Promise<any> => {
    try {
        const response = await fetch(
            'https://api.linkedin.com/v2/userinfo',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch profile');
        }
        
        return await response.json();
    } catch (error: any) {
        throw new Error(`Failed to get LinkedIn profile: ${error.message}`);
    }
};

/**
 * Get LinkedIn organizations (Company Pages) the user manages
 * NOTE: This requires r_organization_social permission which needs Marketing Developer Platform
 * This is partner-only access. For now, returns empty array.
 * Users can upgrade to partner program later for company page access.
 */
export const getLinkedInOrganizations = async (accessToken: string): Promise<any[]> => {
    try {
        // This endpoint requires r_organization_social which is partner-only
        // For now, we'll return empty array and show a message to users
        console.info('LinkedIn organization access requires Marketing Developer Platform (partner-only). Returning empty array.');
        return [];
        
        // Uncomment below when you have partner access:
        /*
        const response = await fetch(
            `https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~))`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch organizations');
        }
        
        const data = await response.json();
        return data.elements || [];
        */
    } catch (error: any) {
        // If organization API fails, return empty array (user might only have personal profile)
        console.warn('Failed to get LinkedIn organizations:', error);
        return [];
    }
};

/**
 * Get LinkedIn organization details
 */
export const getLinkedInOrganizationDetails = async (accessToken: string, organizationUrn: string): Promise<any> => {
    try {
        // Extract organization ID from URN (format: urn:li:organization:123456)
        const orgId = organizationUrn.split(':').pop();
        
        const response = await fetch(
            `https://api.linkedin.com/v2/organizations/${orgId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch organization details');
        }
        
        return await response.json();
    } catch (error: any) {
        throw new Error(`Failed to get organization details: ${error.message}`);
    }
};
