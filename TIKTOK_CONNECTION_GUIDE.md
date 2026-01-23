# 🎵 TikTok OAuth Connection Guide

This guide will help you set up TikTok OAuth integration for EngageHub.

---

## 📋 Prerequisites

1. A TikTok Developer Account
2. A TikTok App created in the TikTok Developer Portal
3. Access to Vercel Dashboard for environment variables

---

## 🔧 Step 1: Create TikTok App

1. Go to **TikTok Developer Portal**: https://developers.tiktok.com/apps/
2. Sign in with your TikTok account
3. Click **"Create App"** or select an existing app
4. Fill in the required information:
   - **App name**: EngageHub (or your preferred name)
   - **App description**: Social media management platform
   - **Website URL**: `https://engage-hub-ten.vercel.app`
   - **Redirect URI**: 
     - `http://localhost:3000` (for local development)
     - `https://engage-hub-ten.vercel.app` (for production)
   - **Scopes**: Select **user.info.basic** and **video.upload** (minimum required)

---

## 🔑 Step 2: Get OAuth 2.0 Credentials

1. In your TikTok App settings, go to **"Basic Information"** tab
2. Under **"OAuth 2.0"** section:
   - Copy the **Client Key** (this is your Client ID)
   - Copy the **Client Secret** (keep this secure!)

**Important Notes:**
- TikTok uses OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- The Client Secret is only used server-side (backend)
- Never expose the Client Secret in frontend code

---

## ⚙️ Step 3: Configure TikTok App Settings

1. Go to **"Basic Information"** → **"OAuth 2.0"**
2. Enable **OAuth 2.0**
3. Set **Scopes** to:
   - `user.info.basic` (read user profile)
   - `video.upload` (upload videos)
4. Add **Redirect URIs**:
   - `http://localhost:3000`
   - `https://engage-hub-ten.vercel.app`
5. Click **"Save"**

---

## 🔐 Step 4: Add Environment Variables to Vercel

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **EngageHub project**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

### Frontend Variables (VITE_ prefix):
- **Name**: `VITE_TIKTOK_CLIENT_KEY`
- **Value**: Your TikTok Client Key
- **Environments**: Production, Preview, Development

### Backend Variables (no prefix):
- **Name**: `TIKTOK_CLIENT_KEY`
- **Value**: Your TikTok Client Key (same as above)
- **Environments**: Production, Preview, Development

- **Name**: `TIKTOK_CLIENT_SECRET`
- **Value**: Your TikTok Client Secret
- **Environments**: Production, Preview, Development
- **⚠️ Important**: This is sensitive - never commit to git!

---

## 🚀 Step 5: Redeploy Your Application

1. After adding environment variables, go to **Deployments** tab
2. Click **"⋯"** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (status: "Ready")

---

## ✅ Step 6: Test the Connection

1. Go to your EngageHub app
2. Navigate to **Social Media** → **Accounts** tab
3. Find **"TikTok"** card
4. Click **"+ CONNECT"**
5. You'll be redirected to TikTok to authorize
6. After authorization, you'll be redirected back
7. You should see **"Connected"** status with your TikTok username

---

## 🔍 Troubleshooting

### Error: "TikTok Client Key not configured"

**Solution:**
- Verify `VITE_TIKTOK_CLIENT_KEY` is set in Vercel
- Make sure you redeployed after adding the variable
- Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Try incognito/private window

### Error: "Redirect URI mismatch"

**Solution:**
- Verify redirect URIs in TikTok App settings match exactly:
  - `http://localhost:3000` (no trailing slash)
  - `https://engage-hub-ten.vercel.app` (no trailing slash)
- Make sure there are no extra paths or trailing slashes
- TikTok requires exact matches

### Error: "Invalid client credentials"

**Solution:**
- Verify `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` are set in Vercel
- Make sure they match the values from TikTok Developer Portal
- Check that you selected all environments (Production, Preview, Development)
- Redeploy after adding variables

### Error: "Token exchange failed"

**Solution:**
- Check Vercel function logs for detailed error messages
- Verify backend environment variables are set correctly
- Make sure the TikTok App has OAuth 2.0 enabled
- Verify App scopes include "user.info.basic" and "video.upload"

### Error: "Code verifier not found"

**Solution:**
- This usually means the OAuth flow was interrupted
- Try connecting again from the beginning
- Clear browser cache and try again

---

## 📝 Important Notes

1. **PKCE**: TikTok OAuth 2.0 requires PKCE (Proof Key for Code Exchange) with S256 method. The implementation handles this automatically.

2. **Scopes**: The app requests these scopes:
   - `user.info.basic` - Read user profile
   - `video.upload` - Upload videos

3. **Token Storage**: Access tokens are stored securely in Supabase `social_accounts` table with Row-Level Security (RLS).

4. **Refresh Tokens**: TikTok provides refresh tokens for long-term access. The implementation stores these for automatic token renewal.

5. **Rate Limits**: Be aware of TikTok API rate limits when making API calls.

---

## 🔗 Useful Links

- **TikTok Developer Portal**: https://developers.tiktok.com/apps/
- **TikTok API Documentation**: https://developers.tiktok.com/doc/
- **OAuth 2.0 Guide**: https://developers.tiktok.com/doc/oauth2-overview/
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Checklist

- [ ] TikTok App created
- [ ] OAuth 2.0 enabled
- [ ] Redirect URIs configured
- [ ] Client Key and Secret obtained
- [ ] Environment variables added to Vercel
- [ ] Application redeployed
- [ ] Connection tested successfully

---

**Need Help?** Check the browser console for detailed error messages and logs.
