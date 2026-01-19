# Environment Variables Setup Guide

This guide shows you exactly where and how to add environment variables for EngageHub.

---

## 📁 Local Development (.env.local)

### Step 1: Create the file

Create a file named `.env.local` in the **root directory** of your project (same level as `package.json`):

```
engagehub---unified-business-command/
├── .env.local          ← Create this file here
├── package.json
├── vite.config.ts
└── ...
```

### Step 2: Add your variables

Open `.env.local` and add:

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL (Required for Facebook OAuth)
# If you have a backend server running locally:
VITE_API_URL=http://localhost:8000

# Or if using a remote backend:
VITE_API_URL=https://your-backend-api.com

# Facebook Integration (Optional)
VITE_FACEBOOK_APP_ID=1621732999001688

# Gemini AI (Optional)
VITE_GEMINI_API_KEY=your-api-key-here
```

### Step 3: Restart your dev server

After adding variables, restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Note:** `.env.local` is already in `.gitignore`, so it won't be committed to git.

---

## 🚀 Production (Vercel)

### Step 1: Go to Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Log in to your account
3. Click on your project: **engage-hub-ten** (or your project name)

### Step 2: Navigate to Settings

1. Click on **Settings** tab (top navigation)
2. Click on **Environment Variables** (left sidebar)

### Step 3: Add Environment Variables

Click **Add New** and add each variable:

#### Required Variables:

1. **VITE_SUPABASE_URL**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://your-project.supabase.co`
   - **Environment:** Select all (Production, Preview, Development)

2. **VITE_SUPABASE_ANON_KEY**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon key (starts with `eyJhbGc...`)
   - **Environment:** Select all

3. **VITE_API_URL** ⭐ **Required for Facebook OAuth**
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend API URL
     - If using Vercel serverless functions: `https://engage-hub-ten.vercel.app`
     - If using separate backend: `https://your-backend-api.com`
     - If using Supabase Edge Functions: `https://your-project.supabase.co/functions/v1`
   - **Environment:** Select all

#### Optional Variables:

4. **VITE_FACEBOOK_APP_ID**
   - **Name:** `VITE_FACEBOOK_APP_ID`
   - **Value:** `1621732999001688` (or your Facebook App ID)
   - **Environment:** Select all

5. **VITE_GEMINI_API_KEY**
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environment:** Select all

### Step 4: Redeploy

After adding variables:

1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## 🔧 Backend API Setup Options

Since Facebook OAuth requires a backend for token exchange, you have these options:

### Option 1: Vercel Serverless Function (Recommended)

Create an API route in your project:

**File:** `api/facebook/token.ts` (or `.js`)

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
  const FB_APP_ID = process.env.VITE_FACEBOOK_APP_ID;
  const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET; // Add this to Vercel env vars

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FB_APP_ID}&` +
      `client_secret=${FB_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );

    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
```

Then set `VITE_API_URL=https://engage-hub-ten.vercel.app` in Vercel.

### Option 2: Supabase Edge Function

Create a Supabase Edge Function and set:
```
VITE_API_URL=https://your-project.supabase.co/functions/v1
```

### Option 3: Separate Backend Server

If you have a separate backend API, set:
```
VITE_API_URL=https://your-backend-api.com
```

---

## ✅ Verification

### Check if variables are loaded:

1. Open your app in the browser
2. Open Developer Console (F12)
3. Type: `console.log(import.meta.env.VITE_API_URL)`
4. You should see your API URL (or `undefined` if not set)

### Test Facebook Connection:

1. Go to Social Media section
2. Click "Connect" on Facebook
3. If `VITE_API_URL` is set correctly, it will use your backend for token exchange
4. If not set, you'll see a helpful error message with setup instructions

---

## 🔒 Security Notes

- **Never commit `.env.local`** to git (it's already in `.gitignore`)
- **Never expose** `FACEBOOK_APP_SECRET` in frontend code
- **Always use** environment variables for sensitive data
- **Vercel environment variables** are encrypted and secure

---

## 📚 Related Documentation

- [Facebook Setup Guide](./FACEBOOK_SETUP.md)
- [Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md)
- [README](./README.md)

---

## 🆘 Troubleshooting

### Variables not working?

1. **Restart dev server** after adding to `.env.local`
2. **Redeploy** on Vercel after adding environment variables
3. **Check spelling** - must start with `VITE_` for Vite to expose them
4. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

### Still not working?

- Check that variables are in the correct environment (Production/Preview/Development)
- Verify the variable names match exactly (case-sensitive)
- Make sure you're using `import.meta.env.VITE_*` in your code
