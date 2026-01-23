# 🔗 LinkedIn Frontend Redirect URI Code

This document shows all the frontend code that handles LinkedIn OAuth redirect URIs.

---

## 📍 Location 1: `src/lib/linkedin.ts`

### 1. `getRedirectURI()` Function (Lines 13-42)

```typescript
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
    // For production, use just the origin (root path) - LinkedIn requires exact match
    // DO NOT include pathname or hash - LinkedIn redirects to root with query params
    const isDevelopment = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (isDevelopment) {
        // Remove trailing slash if present to ensure exact match
        return origin.replace(/\/$/, '');
    }
    
    // For production, use just the origin (root path)
    // LinkedIn will redirect to the root with ?code=...&state=...
    // The redirect URI must match exactly what's registered in LinkedIn app settings
    // Remove trailing slash if present to ensure exact match
    return origin.replace(/\/$/, '');
};
```

**Key Points:**
- Normalizes `127.0.0.1` → `localhost` for development
- Returns just the origin (no pathname, no hash)
- Removes trailing slashes
- Examples:
  - `http://localhost:3000` (development)
  - `https://engage-hub-ten.vercel.app` (production)

---

### 2. `loginWithLinkedIn()` - Storing Redirect URI (Lines 96-109)

```typescript
// Redirect to LinkedIn OAuth
const scope = 'openid profile email w_member_social';
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
// CRITICAL: Store the exact redirect URI used in authorization request
// This must match exactly when exchanging the token
sessionStorage.setItem('linkedin_oauth_redirect_uri', redirectUri);

// Redirect to LinkedIn immediately
console.log('🔄 Redirecting to LinkedIn OAuth...');
console.log('Full redirect URL:', authUrl);
console.log('Stored redirect URI:', redirectUri);

// Immediately redirect - this will navigate away from the page
window.location.href = authUrl;
```

**Key Points:**
- Calculates redirect URI using `getRedirectURI()`
- **Stores it in `sessionStorage`** as `linkedin_oauth_redirect_uri`
- Uses it in the authorization URL
- This stored value is **critical** for token exchange

---

### 3. `exchangeCodeForToken()` - Retrieving Stored Redirect URI (Lines 128-186)

```typescript
/**
 * Exchange authorization code for access token
 * NOTE: This MUST be done server-side for security (client secret required)
 */
const exchangeCodeForToken = async (code: string): Promise<any> => {
    try {
        // CRITICAL: Use the EXACT redirect URI that was used in the authorization request
        // This must match exactly, or LinkedIn will reject the token exchange
        const storedRedirectUri = sessionStorage.getItem('linkedin_oauth_redirect_uri');
        const redirectUri = storedRedirectUri || getRedirectURI();
        
        console.log('🔄 Exchanging code for token...');
        console.log('Using redirect URI:', redirectUri);
        console.log('Stored redirect URI:', storedRedirectUri);
        
        // Check if we have a backend endpoint for token exchange
        const backendUrl = import.meta.env.VITE_API_URL || '';
        
        if (backendUrl) {
            // Use backend endpoint (recommended)
            const response = await fetch(`${backendUrl}/api/linkedin/token`, {
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
            const returnUrl = sessionStorage.getItem('linkedin_oauth_return') || window.location.pathname;
            window.history.replaceState({}, '', returnUrl);
            sessionStorage.removeItem('linkedin_oauth_return');
            sessionStorage.removeItem('linkedin_oauth_redirect_uri');
            
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
```

**Key Points:**
- **Retrieves stored redirect URI** from `sessionStorage.getItem('linkedin_oauth_redirect_uri')`
- Falls back to `getRedirectURI()` if not stored (safety)
- Sends it to backend: `POST /api/linkedin/token` with `{ code, redirectUri }`
- **Cleans up** `sessionStorage` after successful exchange

---

## 📍 Location 2: `components/SocialMedia.tsx`

### 4. `handleLinkedInCallback()` - Using Stored Redirect URI (Lines 595-626)

```typescript
// LinkedIn uses backend for token exchange
const backendUrl = import.meta.env.VITE_API_URL || '';
let accessToken: string;
let refreshToken: string;
let expiresIn: number;

if (backendUrl) {
  // CRITICAL: Use the EXACT redirect URI that was used in the authorization request
  // This must match exactly, or LinkedIn will reject the token exchange
  const storedRedirectUri = sessionStorage.getItem('linkedin_oauth_redirect_uri');
  // Fallback to calculated URI if not stored (shouldn't happen, but safety)
  const redirectUri = storedRedirectUri || window.location.origin.replace(/\/$/, '');
  
  console.log('🔍 LinkedIn Token Exchange Debug:');
  console.log('  - Backend URL:', backendUrl);
  console.log('  - API Endpoint:', `${backendUrl.replace(/\/$/, '')}/api/linkedin/token`);
  console.log('  - Stored redirect URI:', storedRedirectUri);
  console.log('  - Final redirect URI:', redirectUri);
  console.log('  - Code received:', code ? `${code.substring(0, 20)}...` : 'MISSING');
  console.log('  - Current URL:', window.location.href);
  
  // Ensure backendUrl doesn't have trailing slash
  const apiUrl = `${backendUrl.replace(/\/$/, '')}/api/linkedin/token`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      code, 
      redirectUri: redirectUri
    })
  });
  
  // ... error handling ...
}
```

**Key Points:**
- Same pattern: retrieves from `sessionStorage.getItem('linkedin_oauth_redirect_uri')`
- Falls back to `window.location.origin.replace(/\/$/, '')` if not stored
- Sends to backend with the same redirect URI

---

## 🔄 Complete Flow

```
1. User clicks "Connect LinkedIn"
   ↓
2. loginWithLinkedIn() called
   ↓
3. getRedirectURI() calculates: "https://engage-hub-ten.vercel.app"
   ↓
4. Stored in sessionStorage: "linkedin_oauth_redirect_uri"
   ↓
5. Used in authorization URL: redirect_uri=https://engage-hub-ten.vercel.app
   ↓
6. User authorizes on LinkedIn
   ↓
7. LinkedIn redirects back: https://engage-hub-ten.vercel.app/?code=ABC123&state=linkedin_oauth
   ↓
8. handleLinkedInCallback() or exchangeCodeForToken() called
   ↓
9. Retrieves stored redirect URI from sessionStorage
   ↓
10. Sends to backend: POST /api/linkedin/token { code, redirectUri }
   ↓
11. Backend uses same redirectUri for token exchange
   ↓
12. Success! ✅
```

---

## 🎯 Why This Matters

**LinkedIn requires the redirect URI to match EXACTLY:**
- ✅ Authorization request: `redirect_uri=https://engage-hub-ten.vercel.app`
- ✅ Token exchange: `redirect_uri=https://engage-hub-ten.vercel.app`
- ❌ If they don't match → LinkedIn rejects with error

**The `sessionStorage` approach ensures:**
1. We use the **exact same value** in both requests
2. We handle edge cases (127.0.0.1 → localhost normalization)
3. We avoid recalculating from `window.location` (which might have changed)

---

## 📝 Summary

| Function | File | Purpose |
|----------|------|---------|
| `getRedirectURI()` | `src/lib/linkedin.ts` | Calculates redirect URI (normalizes, removes trailing slashes) |
| `loginWithLinkedIn()` | `src/lib/linkedin.ts` | Stores redirect URI in `sessionStorage` before redirect |
| `exchangeCodeForToken()` | `src/lib/linkedin.ts` | Retrieves stored redirect URI for token exchange |
| `handleLinkedInCallback()` | `components/SocialMedia.tsx` | Retrieves stored redirect URI for token exchange |

**All redirect URI handling ensures exact matching for LinkedIn OAuth!** ✅
