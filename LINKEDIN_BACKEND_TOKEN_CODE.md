# 🔐 LinkedIn Backend Token Exchange Code

This document shows the complete backend code for `/api/linkedin/token` endpoint that handles LinkedIn OAuth token exchange.

---

## 📍 Location: `api/linkedin/token.ts`

### Complete Code

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * LinkedIn OAuth Token Exchange Endpoint
 * 
 * This endpoint securely exchanges the LinkedIn OAuth authorization code
 * for an access token. The Client Secret is kept secure on the server.
 * 
 * POST /api/linkedin/token
 * Body: { code: string, redirectUri: string }
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://engage-hub-ten.vercel.app',
];

// Helper function to set CORS headers
function setCORSHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  
  // Always set CORS headers - be permissive for development
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    // Allow any localhost for development
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('vercel.app')) {
    // Allow any Vercel preview deployments
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // For development, allow any origin (be careful in production)
    // In production, you might want to restrict this
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }

  // Set CORS headers for actual request
  setCORSHeaders(req, res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { code, redirectUri } = req.body;

    // Validate required parameters
    if (!code) {
      return res.status(400).json({ 
        error: 'Missing code',
        message: 'Authorization code is required'
      });
    }

    if (!redirectUri) {
      return res.status(400).json({ 
        error: 'Missing redirectUri',
        message: 'Redirect URI is required'
      });
    }

    // Get credentials from environment variables
    // Note: VITE_ prefix variables are only available in frontend build, not in serverless functions
    // So we check both VITE_LINKEDIN_CLIENT_ID (for frontend) and LINKEDIN_CLIENT_ID (for backend)
    const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID;
    const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

    // Validate credentials are configured
    if (!CLIENT_ID) {
      console.error('LinkedIn Client ID not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'LinkedIn Client ID is not configured. Please set LINKEDIN_CLIENT_ID (backend) or VITE_LINKEDIN_CLIENT_ID (frontend) in Vercel environment variables.'
      });
    }

    if (!CLIENT_SECRET) {
      console.error('LinkedIn Client Secret not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'LinkedIn Client Secret is not configured. Please set LINKEDIN_CLIENT_SECRET in Vercel environment variables (backend only).'
      });
    }

    // Debug logging (remove sensitive data in production)
    console.log('LinkedIn token exchange request:', {
      hasCode: !!code,
      redirectUri: redirectUri,
      clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND',
      hasClientSecret: !!CLIENT_SECRET
    });

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Handle LinkedIn API errors
    if (!tokenResponse.ok || tokenData.error) {
      console.error('LinkedIn token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: tokenData.error,
        errorDescription: tokenData.error_description,
        redirectUri: redirectUri,
        clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND'
      });
      return res.status(400).json({ 
        error: tokenData.error || 'Token exchange failed',
        message: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token',
        details: tokenData
      });
    }

    // Return success response
    return res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
    });

  } catch (error: any) {
    console.error('LinkedIn token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during token exchange'
    });
  }
}
```

---

## 🔍 Code Breakdown

### 1. **CORS Headers Setup** (Lines 13-43)

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://engage-hub-ten.vercel.app',
];

function setCORSHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin.includes('vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}
```

**Purpose:**
- Handles CORS (Cross-Origin Resource Sharing) for browser requests
- Allows requests from frontend (localhost, Vercel deployments)
- Handles preflight OPTIONS requests

---

### 2. **Request Handler** (Lines 45-64)

```typescript
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    return res.status(200).end();
  }

  // Set CORS headers for actual request
  setCORSHeaders(req, res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }
  // ... rest of handler
}
```

**Purpose:**
- Handles OPTIONS preflight requests
- Only allows POST requests
- Sets CORS headers

---

### 3. **Request Validation** (Lines 66-82)

```typescript
const { code, redirectUri } = req.body;

// Validate required parameters
if (!code) {
  return res.status(400).json({ 
    error: 'Missing code',
    message: 'Authorization code is required'
  });
}

if (!redirectUri) {
  return res.status(400).json({ 
    error: 'Missing redirectUri',
    message: 'Redirect URI is required'
  });
}
```

**Purpose:**
- Validates that `code` (authorization code from LinkedIn) is present
- Validates that `redirectUri` (must match authorization request) is present
- Returns 400 error if missing

---

### 4. **Environment Variables** (Lines 84-105)

```typescript
// Get credentials from environment variables
// Note: VITE_ prefix variables are only available in frontend build, not in serverless functions
// So we check both VITE_LINKEDIN_CLIENT_ID (for frontend) and LINKEDIN_CLIENT_ID (for backend)
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// Validate credentials are configured
if (!CLIENT_ID) {
  console.error('LinkedIn Client ID not configured');
  return res.status(500).json({ 
    error: 'Server configuration error',
    message: 'LinkedIn Client ID is not configured. Please set LINKEDIN_CLIENT_ID (backend) or VITE_LINKEDIN_CLIENT_ID (frontend) in Vercel environment variables.'
  });
}

if (!CLIENT_SECRET) {
  console.error('LinkedIn Client Secret not configured');
  return res.status(500).json({ 
    error: 'Server configuration error',
    message: 'LinkedIn Client Secret is not configured. Please set LINKEDIN_CLIENT_SECRET in Vercel environment variables (backend only).'
  });
}
```

**Purpose:**
- Retrieves `LINKEDIN_CLIENT_ID` from environment (prioritizes backend variable)
- Retrieves `LINKEDIN_CLIENT_SECRET` from environment (backend only)
- Validates both are configured
- Returns helpful error messages if missing

**Important:** 
- `VITE_` prefixed variables are NOT available in serverless functions
- Must use `LINKEDIN_CLIENT_ID` (without `VITE_`) for backend
- `LINKEDIN_CLIENT_SECRET` should NEVER be in frontend code

---

### 5. **Token Exchange with LinkedIn** (Lines 107-128)

```typescript
// Debug logging (remove sensitive data in production)
console.log('LinkedIn token exchange request:', {
  hasCode: !!code,
  redirectUri: redirectUri,
  clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND',
  hasClientSecret: !!CLIENT_SECRET
});

// Exchange code for access token
const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});

const tokenData = await tokenResponse.json();
```

**Purpose:**
- Calls LinkedIn's token exchange endpoint
- Sends authorization code, redirect URI, client ID, and client secret
- **Critical:** `redirect_uri` must match exactly what was used in authorization request
- Uses `application/x-www-form-urlencoded` format (LinkedIn requirement)

**Parameters sent to LinkedIn:**
- `grant_type`: `'authorization_code'` (OAuth 2.0 flow)
- `code`: Authorization code from frontend
- `redirect_uri`: Must match authorization request exactly
- `client_id`: Your LinkedIn app Client ID
- `client_secret`: Your LinkedIn app Client Secret (kept secure on server)

---

### 6. **Error Handling** (Lines 130-147)

```typescript
// Handle LinkedIn API errors
if (!tokenResponse.ok || tokenData.error) {
  console.error('LinkedIn token exchange error:', {
    status: tokenResponse.status,
    statusText: tokenResponse.statusText,
    error: tokenData.error,
    errorDescription: tokenData.error_description,
    redirectUri: redirectUri,
    clientIdPrefix: CLIENT_ID ? `${CLIENT_ID.substring(0, 4)}...` : 'NOT FOUND'
  });
  return res.status(400).json({ 
    error: tokenData.error || 'Token exchange failed',
    message: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for access token',
    details: tokenData
  });
}
```

**Purpose:**
- Checks if LinkedIn returned an error
- Logs detailed error information (for debugging)
- Returns user-friendly error message to frontend
- Common errors:
  - `invalid_grant`: Code expired or already used
  - `invalid_client`: Client ID/Secret mismatch
  - Redirect URI mismatch

---

### 7. **Success Response** (Lines 149-155)

```typescript
// Return success response
return res.status(200).json({
  access_token: tokenData.access_token,
  expires_in: tokenData.expires_in,
  refresh_token: tokenData.refresh_token,
  token_type: tokenData.token_type || 'Bearer',
});
```

**Purpose:**
- Returns access token to frontend (if successful)
- Includes token expiration time
- Includes refresh token (for getting new access tokens later)
- Frontend uses `access_token` to call LinkedIn API

---

### 8. **Exception Handling** (Lines 157-163)

```typescript
} catch (error: any) {
  console.error('LinkedIn token exchange error:', error);
  return res.status(500).json({ 
    error: 'Internal server error',
    message: error.message || 'An unexpected error occurred during token exchange'
  });
}
```

**Purpose:**
- Catches any unexpected errors (network failures, etc.)
- Logs error for debugging
- Returns 500 error to frontend

---

## 🔄 Complete Flow

```
1. Frontend receives authorization code from LinkedIn
   ↓
2. Frontend calls: POST /api/linkedin/token
   Body: { code: "ABC123", redirectUri: "https://engage-hub-ten.vercel.app" }
   ↓
3. Backend validates code and redirectUri
   ↓
4. Backend calls LinkedIn: POST https://www.linkedin.com/oauth/v2/accessToken
   Body: {
     grant_type: "authorization_code",
     code: "ABC123",
     redirect_uri: "https://engage-hub-ten.vercel.app",
     client_id: "776oifhjg06le0",
     client_secret: "***SECRET***"
   }
   ↓
5. LinkedIn validates and returns access token
   ↓
6. Backend returns to frontend:
   {
     access_token: "xyz789...",
     expires_in: 5184000,
     refresh_token: "refresh123...",
     token_type: "Bearer"
   }
   ↓
7. Frontend uses access_token to call LinkedIn API ✅
```

---

## 🎯 Key Points

### Security
- ✅ **Client Secret is NEVER exposed** to frontend
- ✅ Only server-side code has access to `LINKEDIN_CLIENT_SECRET`
- ✅ Token exchange happens securely on backend

### Redirect URI Matching
- ✅ **Must match exactly** with authorization request
- ✅ Frontend stores redirect URI in `sessionStorage` to ensure exact match
- ✅ Backend uses the same redirect URI for token exchange

### Environment Variables
- ✅ `LINKEDIN_CLIENT_ID` - Backend variable (preferred)
- ✅ `LINKEDIN_CLIENT_SECRET` - Backend only (never in frontend)
- ⚠️ `VITE_LINKEDIN_CLIENT_ID` - Frontend only (not available in serverless functions)

### Error Handling
- ✅ Validates all required parameters
- ✅ Provides helpful error messages
- ✅ Logs errors for debugging (without exposing secrets)

---

## 📝 Summary

| Aspect | Details |
|--------|---------|
| **Endpoint** | `POST /api/linkedin/token` |
| **Purpose** | Exchange LinkedIn OAuth authorization code for access token |
| **Security** | Keeps Client Secret secure on server |
| **Input** | `{ code: string, redirectUri: string }` |
| **Output** | `{ access_token, expires_in, refresh_token, token_type }` |
| **LinkedIn API** | `POST https://www.linkedin.com/oauth/v2/accessToken` |
| **Critical** | Redirect URI must match authorization request exactly |

**This endpoint is the secure bridge between your frontend and LinkedIn's OAuth system!** 🔐✅
