/**
 * TikTok OAuth Handler - Fixed Version
 * Addresses: multiple callback processing, expired codes, invalid JSON responses
 */

class TikTokOAuthHandler {
  constructor(config) {
    this.clientKey = config.clientKey;
    this.redirectUri = config.redirectUri;
    this.apiEndpoint = config.apiEndpoint;
    this.workspaceId = config.workspaceId;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
  }

  /**
   * Initialize OAuth handler - call this on page load
   */
  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = urlParams.has('code') && urlParams.get('state') === 'tiktok_oauth';

    if (isOAuthCallback) {
      console.log('🚀 TikTok OAuth callback detected');
      await this.handleCallback();
    }
  }

  /**
   * Start OAuth flow - redirect to TikTok authorization
   */
  async startOAuthFlow() {
    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);

      // Store code verifier and redirect URI for consistency with tiktok.ts
      sessionStorage.setItem('tiktok_oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('tiktok_oauth_redirect_uri', this.redirectUri);

      // Build authorization URL
      const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      authUrl.searchParams.append('client_key', this.clientKey);
      authUrl.searchParams.append('scope', 'user.info.basic,video.list');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', this.redirectUri);
      authUrl.searchParams.append('state', 'tiktok_oauth');
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');

      console.log('🔐 Redirecting to TikTok authorization...');
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('❌ Failed to start OAuth flow:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback - process authorization code
   */
  async handleCallback() {
    // CRITICAL: Check if callback already processed
    const callbackProcessed = sessionStorage.getItem('tiktok_callback_processed');
    if (callbackProcessed) {
      console.log('✅ OAuth callback already processed, skipping');
      this.cleanupURL();
      return;
    }

    // Mark callback as being processed immediately
    sessionStorage.setItem('tiktok_callback_processing', 'true');

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      // Validate callback parameters
      if (!code || state !== 'tiktok_oauth') {
        throw new Error('Invalid OAuth callback parameters');
      }

      // Get stored code verifier (use same key as tiktok.ts for consistency)
      const codeVerifier = sessionStorage.getItem('tiktok_oauth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found. OAuth flow may have expired.');
      }

      console.log('🔑 Processing OAuth callback');
      console.log('🔑 PKCE Data:', {
        code: code.substring(0, 20) + '...',
        codeVerifier: 'PRESENT',
        redirectUri: this.redirectUri
      });

      // Exchange code for token
      const tokenData = await this.exchangeCodeForToken(code, codeVerifier);

      if (tokenData.error) {
        throw new Error(tokenData.error);
      }

      console.log('✅ Token exchange successful');

      // Save connection state
      await this.saveConnection(tokenData);

      // Mark callback as processed
      sessionStorage.setItem('tiktok_callback_processed', 'true');
      sessionStorage.removeItem('tiktok_callback_processing');

      // Clean up stored data (use same key as tiktok.ts for consistency)
      sessionStorage.removeItem('tiktok_oauth_code_verifier');
      sessionStorage.removeItem('tiktok_oauth_started');

      // Clean up URL
      this.cleanupURL();

      // Refresh the page to show connected state
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('❌ OAuth callback failed:', error);
      sessionStorage.removeItem('tiktok_callback_processing');
      
      // Show error to user
      this.showError('Failed to connect TikTok account: ' + error.message);
      
      // Clean up URL even on error
      this.cleanupURL();
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, codeVerifier) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Exchanging code for token...');

      const response = await fetch(
        `${this.apiEndpoint}/api/oauth?provider=tiktok&action=token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            codeVerifier,
            redirectUri: this.redirectUri,
            workspaceId: this.workspaceId,
          }),
        }
      );

      const duration = Date.now() - startTime;
      console.log(`⏱️ API call took ${duration}ms`);

      // Handle non-200 responses
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;

        // Check if response is JSON
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // Handle plain text error responses from TikTok API
          const textResponse = await response.text();
          console.error('📊 Non-JSON response:', textResponse);
          errorData = {
            error: 'Token exchange failed',
            details: textResponse,
            status: response.status
          };
        }

        console.log('📊 Token exchange response:', errorData);
        return errorData;
      }

      // Parse successful response
      const data = await response.json();
      console.log('📊 Token exchange response:', { success: true });
      
      return data;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`⏱️ API call took ${duration}ms`);
      
      console.error('❌ Token exchange error:', error);
      
      return {
        error: 'Token exchange failed',
        details: error.message
      };
    }
  }

  /**
   * Save connection to localStorage and backend
   */
  async saveConnection(tokenData) {
    try {
      // Save to localStorage
      const connectionData = {
        connected: true,
        timestamp: Date.now(),
        workspaceId: this.workspaceId,
        ...tokenData
      };
      
      localStorage.setItem('tiktok_connection', JSON.stringify(connectionData));
      console.log('💾 Saved connection state to localStorage');

      // Optional: Save to backend
      // await this.syncConnectionToBackend(tokenData);
      
    } catch (error) {
      console.error('❌ Failed to save connection:', error);
      throw error;
    }
  }

  /**
   * Clean up URL parameters after processing callback
   */
  cleanupURL() {
    // Remove OAuth parameters from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('scopes');
    url.searchParams.delete('state');
    
    window.history.replaceState({}, document.title, url.pathname + url.search);
    console.log('🧹 Cleaned up URL parameters');
  }

  /**
   * Show error message to user
   */
  showError(message) {
    // Implement your error UI here
    console.error('Error:', message);
    // Example: Display a toast notification or error banner
    alert(message); // Replace with your UI component
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(hash));
  }

  /**
   * Base64 URL encode
   */
  base64URLEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Disconnect TikTok account
   */
  async disconnect() {
    try {
      // Clear localStorage
      localStorage.removeItem('tiktok_connection');
      sessionStorage.clear();
      
      console.log('✅ Disconnected TikTok account');
      
      // Optional: Notify backend
      // await this.notifyBackendDisconnect();
      
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
      throw error;
    }
  }

  /**
   * Check if TikTok is connected
   */
  isConnected() {
    try {
      const connectionData = localStorage.getItem('tiktok_connection');
      if (!connectionData) return false;
      
      const data = JSON.parse(connectionData);
      return data.connected === true;
    } catch (error) {
      console.error('❌ Failed to check connection status:', error);
      return false;
    }
  }
}

// Export for use in your app
export default TikTokOAuthHandler;
