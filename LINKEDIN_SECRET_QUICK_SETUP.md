# 🔐 LinkedIn Client Secret - Quick Setup

## ⚠️ CRITICAL: Never Put Secret in Frontend!

**Client Secret = Backend Only!**

---

## 📍 Step 1: Get Your Client Secret

1. Go to: **https://www.linkedin.com/developers/apps**
2. Click: **"Engagehub"**
3. Click: **"Auth"** tab
4. Find: **"Client Secret"** field
5. Click: **"Show"** or **"Reveal"** button
6. **Copy the secret** (keep it safe!)

---

## 📍 Step 2: Add to Vercel (Production)

### For Your Live App:

1. **Go to Vercel:**
   - https://vercel.com/dashboard
   - Click on your project: **"engage-hub-ten"**

2. **Navigate to Environment Variables:**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** (left sidebar)

3. **Add the Secret:**
   - Click **"Add New"**
   - **Name:** `LINKEDIN_CLIENT_SECRET`
   - **Value:** Paste your secret from Step 1
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

4. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click **"⋯"** (three dots) on latest deployment
   - Click **"Redeploy"**

---

## 📍 Step 3: Create Backend Endpoint (Required)

You need a backend endpoint to exchange the OAuth code for an access token.

### Option A: Vercel Serverless Function

**Create file:** `api/linkedin/token.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri } = req.body;
  const CLIENT_ID = process.env.VITE_LINKEDIN_CLIENT_ID;
  const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET; // From Vercel env vars

  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return res.status(400).json({ 
        message: data.error_description || data.error || 'Token exchange failed' 
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}
```

**Then set in Vercel:**
- `VITE_API_URL=https://engage-hub-ten.vercel.app` (or your Vercel URL)

---

## ✅ Summary

**Frontend (.env.local):**
```
VITE_LINKEDIN_CLIENT_ID=776oifhjg06le0  ✅ Already added
```

**Backend (Vercel Environment Variables):**
```
LINKEDIN_CLIENT_SECRET=your-secret-here  ⚠️ Add this!
```

**Backend Endpoint:**
```
POST /api/linkedin/token  ⚠️ Create this!
```

---

## 🆘 Quick Checklist

- [ ] Got Client Secret from LinkedIn Auth tab
- [ ] Added `LINKEDIN_CLIENT_SECRET` to Vercel environment variables
- [ ] Created backend endpoint `/api/linkedin/token`
- [ ] Set `VITE_API_URL` in Vercel (if not already set)
- [ ] Redeployed app

---

**Remember:** Client Secret stays on the server, never in frontend! 🔒
