# 🐦 Twitter/X OAuth Connection Guide

This guide will help you set up Twitter/X OAuth integration for EngageHub.

---

## 📋 Prerequisites

1. A Twitter Developer Account
2. A Twitter App created in the Twitter Developer Portal
3. Access to Vercel Dashboard for environment variables

---

## 🔧 Step 1: Create Twitter App

1. Go to **Twitter Developer Portal**: https://developer.twitter.com/en/portal/dashboard
2. Sign in with your Twitter account
3. Click **"Create App"** or select an existing app
4. Fill in the required information:
   - **App name**: EngageHub (or your preferred name)
   - **App description**: Social media management platform
   - **Website URL**: `https://engage-hub-ten.vercel.app`
   - **Callback URLs**: 
     - `http://localhost:3000` (for local development)
     - `https://engage-hub-ten.vercel.app` (for production)
   - **App permissions**: Select **Read** (minimum required)

---

## 🔑 Step 2: Get OAuth 2.0 Credentials

1. In your Twitter App settings, go to **"Keys and tokens"** tab
2. Under **"OAuth 2.0 Client ID and Client Secret"**:
   - Click **"Generate"** if you haven't already
   - Copy the **Client ID**
   - Copy the **Client Secret** (keep this secure!)

**Important Notes:**
- Twitter uses OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- The Client Secret is only used server-side (backend)
- Never expose the Client Secret in frontend code

---

## ⚙️ Step 3: Configure Twitter App Settings

1. Go to **"App settings"** → **"User authentication settings"**
2. Enable **OAuth 2.0**
3. Set **App permissions** to **Read** (or higher if needed)
4. Add **Callback URLs**:
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
- **Name**: `VITE_TWITTER_CLIENT_ID`
- **Value**: Your Twitter Client ID
- **Environments**: Production, Preview, Development

### Backend Variables (no prefix):
- **Name**: `TWITTER_CLIENT_ID`
- **Value**: Your Twitter Client ID (same as above)
- **Environments**: Production, Preview, Development

- **Name**: `TWITTER_CLIENT_SECRET`
- **Value**: Your Twitter Client Secret
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
3. Find **"X (Twitter)"** card
4. Click **"+ CONNECT"**
5. You'll be redirected to Twitter to authorize
6. After authorization, you'll be redirected back
7. You should see **"Connected"** status with your Twitter username

---

## 🔍 Troubleshooting

### Error: "Twitter Client ID not configured"

**Solution:**
- Verify `VITE_TWITTER_CLIENT_ID` is set in Vercel
- Make sure you redeployed after adding the variable
- Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Try incognito/private window

### Error: "Redirect URI mismatch"

**Solution:**
- Verify callback URLs in Twitter App settings match exactly:
  - `http://localhost:3000` (no trailing slash)
  - `https://engage-hub-ten.vercel.app` (no trailing slash)
- Make sure there are no extra paths or trailing slashes
- Twitter requires exact matches

### Error: "Invalid client credentials"

**Solution:**
- Verify `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are set in Vercel
- Make sure they match the values from Twitter Developer Portal
- Check that you selected all environments (Production, Preview, Development)
- Redeploy after adding variables

### Error: "Token exchange failed"

**Solution:**
- Check Vercel function logs for detailed error messages
- Verify backend environment variables are set correctly
- Make sure the Twitter App has OAuth 2.0 enabled
- Verify App permissions include "Read"

### Error: "Code verifier not found"

**Solution:**
- This usually means the OAuth flow was interrupted
- Try connecting again from the beginning
- Clear browser cache and try again

---

## 📝 Important Notes

1. **PKCE**: Twitter OAuth 2.0 requires PKCE (Proof Key for Code Exchange). The implementation handles this automatically.

2. **Scopes**: The app requests these scopes:
   - `tweet.read` - Read tweets
   - `users.read` - Read user profile
   - `offline.access` - Refresh token support

3. **Token Storage**: Access tokens are stored securely in Supabase `social_accounts` table with Row-Level Security (RLS).

4. **Refresh Tokens**: Twitter provides refresh tokens for long-term access. The implementation stores these for automatic token renewal.

5. **Rate Limits**: Be aware of Twitter API rate limits when making API calls.

---

## 🔗 Useful Links

- **Twitter Developer Portal**: https://developer.twitter.com/en/portal/dashboard
- **Twitter API Documentation**: https://developer.twitter.com/en/docs/twitter-api
- **OAuth 2.0 Guide**: https://developer.twitter.com/en/docs/authentication/oauth-2-0
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Checklist

- [ ] Twitter App created
- [ ] OAuth 2.0 enabled
- [ ] Callback URLs configured
- [ ] Client ID and Secret obtained
- [ ] Environment variables added to Vercel
- [ ] Application redeployed
- [ ] Connection tested successfully

---

**Need Help?** Check the browser console for detailed error messages and logs.
