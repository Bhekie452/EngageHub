# 🔐 How to Get LinkedIn Client Secret

## ⚠️ IMPORTANT SECURITY NOTE

**LinkedIn Client Secret should NEVER be in frontend code or frontend `.env` files!**

- ✅ **Client ID** → Can be in frontend (`.env.local` with `VITE_` prefix)
- ❌ **Client Secret** → Must ONLY be in backend environment variables

---

## 📍 Where to Find Client Secret

### Step 1: Go to LinkedIn Developer Portal

1. Visit: **https://www.linkedin.com/developers/apps**
2. Click on your app: **"Engagehub"**

### Step 2: Navigate to Auth Tab

1. Click on **"Auth"** tab (in the top navigation)
2. You'll see your OAuth 2.0 settings

### Step 3: Find Client Secret

In the **"Auth"** tab, you'll see:

- **Client ID:** `776oifhjg06le0` (already visible)
- **Client Secret:** Hidden by default

**To reveal Client Secret:**

1. Look for the **"Client Secret"** field
2. Click **"Show"** or **"Reveal"** button next to it
3. Copy the secret (it will look like: `AbCdEf123456...`)

**⚠️ Important:** If you don't see a "Show" button, you may need to:
- Click **"Generate new secret"** to create one
- Or check if you have the right permissions (must be app admin)

---

## 🔧 Where to Add Client Secret

### ✅ Backend Environment Variables (Correct)

**For Local Development:**
- Add to your backend server's `.env` file:
  ```
  LINKEDIN_CLIENT_SECRET=your-secret-here
  ```

**For Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name:** `LINKEDIN_CLIENT_SECRET`
   - **Value:** Your client secret
   - **Environment:** Production, Preview, Development

**For Supabase Edge Functions:**
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add:
   - **Name:** `LINKEDIN_CLIENT_SECRET`
   - **Value:** Your client secret

### ❌ Frontend Environment Variables (WRONG - Don't Do This!)

**DO NOT add to:**
- ❌ `.env.local` (frontend)
- ❌ `VITE_LINKEDIN_CLIENT_SECRET` (would expose it in browser)
- ❌ Any file that gets bundled with frontend code

**Why?** Frontend code is visible to anyone. Client secrets must stay on the server.

---

## 🔄 Backend Token Exchange Endpoint

Your backend needs to handle LinkedIn token exchange. Here's an example:

### Example: Vercel Serverless Function

**File:** `api/linkedin/token.ts`

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
  const CLIENT_ID = process.env.VITE_LINKEDIN_CLIENT_ID; // From frontend env
  const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET; // From backend env (secret!)

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
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET, // Secret stays on server!
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

**Environment Variables in Vercel:**
- `VITE_LINKEDIN_CLIENT_ID` → Frontend (can be public)
- `LINKEDIN_CLIENT_SECRET` → Backend only (must be secret)

---

## ✅ Quick Checklist

- [ ] Found Client Secret in LinkedIn Developer Portal → Auth tab
- [ ] Copied Client Secret (keep it secure!)
- [ ] Added `VITE_LINKEDIN_CLIENT_ID=776oifhjg06le0` to `.env.local` (frontend)
- [ ] Added `LINKEDIN_CLIENT_SECRET` to backend environment variables (NOT frontend!)
- [ ] Created backend endpoint `/api/linkedin/token` for token exchange
- [ ] Tested the connection

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - `.env.local` is already in `.gitignore` ✅
   - Backend `.env` should also be in `.gitignore`

2. **Use different secrets for dev/prod**
   - Development: Local backend `.env`
   - Production: Vercel/Supabase environment variables

3. **Rotate secrets if exposed**
   - If you accidentally expose a secret, generate a new one immediately
   - Go to LinkedIn Developer Portal → Auth → Generate new secret

4. **Limit access**
   - Only give backend developers access to secrets
   - Use environment variable management tools

---

## 🆘 Troubleshooting

### "Client Secret not found"

**Solution:**
- Make sure you're in the **Auth** tab
- Check if you have admin permissions on the app
- Try generating a new secret

### "Token exchange failed"

**Possible causes:**
- Client Secret not set in backend environment
- Wrong Client ID/Secret combination
- Redirect URI mismatch

**Solution:**
- Verify Client Secret is in backend env vars (not frontend)
- Check redirect URI matches exactly in LinkedIn app settings
- Verify Client ID matches

---

## 📚 Related Documentation

- [LinkedIn Connection Guide](./LINKEDIN_CONNECTION_GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)

---

**Remember:** Client Secret = Backend Only! 🔒
