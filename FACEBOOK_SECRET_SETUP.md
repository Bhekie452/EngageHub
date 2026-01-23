# 🔐 Facebook App Secret Setup Guide

## 🎯 Overview

The Facebook App Secret is used **ONLY** in your backend API endpoint to securely exchange OAuth codes for access tokens. It must **NEVER** be exposed in frontend code.

---

## ✅ Step 1: Get Your Facebook App Secret

1. Go to **Facebook Developers**: https://developers.facebook.com/apps
2. Select your app (App ID: `1621732999001688`)
3. Go to **"Settings"** → **"Basic"**
4. Find **"App Secret"** section
5. Click **"Show"** next to App Secret
6. You may need to enter your Facebook password
7. **Copy the App Secret** (it's a long string like `abc123def456...`)

**⚠️ Important:** 
- Keep this secret secure
- Never commit it to git
- Never expose it in frontend code
- Only use it in backend/server-side code

---

## ✅ Step 2: Add to Vercel Environment Variables

### 2.1 Go to Vercel Dashboard

1. Visit: **https://vercel.com/dashboard**
2. Sign in to your account
3. Select your project (e.g., "engage-hub-ten")

### 2.2 Navigate to Environment Variables

1. Click on your project
2. Go to **"Settings"** tab (top navigation)
3. Click **"Environment Variables"** in the left sidebar

### 2.3 Add Facebook App Secret

Click **"Add New"** and add:

```
Name: FACEBOOK_APP_SECRET
Value: your_facebook_app_secret_here (paste the secret you copied)
Environment: Production, Preview, Development (select all)
```

**⚠️ CRITICAL:** 
- Variable name is `FACEBOOK_APP_SECRET` (NOT `VITE_FACEBOOK_APP_SECRET`)
- This is a **server-side only** variable
- It's used in your backend API endpoint (`/api/facebook/token`)
- Frontend code should NEVER access this

### 2.4 Verify Other Facebook Variables

Make sure you also have:

```
VITE_FACEBOOK_APP_ID=1621732999001688
VITE_API_URL=https://engage-hub-ten.vercel.app
```

These are **frontend** variables (start with `VITE_`).

---

## ✅ Step 3: Redeploy

**IMPORTANT:** After adding the secret, you MUST redeploy:

1. Go to **"Deployments"** tab
2. Find your latest deployment
3. Click the **"⋯"** (three dots) menu
4. Click **"Redeploy"**
5. Wait for deployment to complete (status shows "Ready")

---

## ✅ Step 4: Test Facebook Connection

1. Go to your live site
2. Navigate to **Social Media** → **Connected accounts**
3. Click **"Connect"** on Facebook
4. Authorize the app
5. It should now successfully connect!

---

## 🔍 How It Works

### Frontend (Public):
- Uses `VITE_FACEBOOK_APP_ID` (safe to expose)
- Redirects user to Facebook OAuth
- Receives authorization code from Facebook

### Backend (Secure):
- Uses `FACEBOOK_APP_SECRET` (kept secret)
- Exchanges authorization code for access token
- Returns access token to frontend
- Secret never leaves the server

---

## 🚨 Security Notes

1. **Never expose App Secret in frontend:**
   - ❌ Don't add `VITE_FACEBOOK_APP_SECRET`
   - ✅ Only use `FACEBOOK_APP_SECRET` (no VITE_ prefix)

2. **Backend endpoint location:**
   - File: `api/facebook/token.ts`
   - Uses: `process.env.FACEBOOK_APP_SECRET`
   - This is a Vercel serverless function

3. **If secret is leaked:**
   - Go to Facebook Developers
   - Reset your App Secret
   - Update it in Vercel
   - Redeploy

---

## 📋 Checklist

- [ ] Facebook App Secret obtained from Facebook Developers
- [ ] `FACEBOOK_APP_SECRET` added to Vercel (server-side)
- [ ] `VITE_FACEBOOK_APP_ID` added to Vercel (frontend)
- [ ] `VITE_API_URL` set to your Vercel URL
- [ ] Project redeployed after adding variables
- [ ] Facebook connection tested successfully

---

## 🆘 Troubleshooting

### Issue: "Facebook App Secret is not configured"

**Solution:**
- ✅ Check variable name is exactly `FACEBOOK_APP_SECRET` (case-sensitive)
- ✅ Make sure it's added to all environments (Production, Preview, Development)
- ✅ Redeploy after adding the variable
- ✅ Check Vercel function logs for errors

### Issue: "Token exchange failed"

**Solutions:**
- ✅ Verify App Secret is correct (no extra spaces)
- ✅ Check that App ID matches (1621732999001688)
- ✅ Verify redirect URI matches in Facebook App settings
- ✅ Check Vercel function logs for detailed error messages

---

## 📚 Resources

- [Facebook Developers Dashboard](https://developers.facebook.com/apps)
- [Facebook App Settings](https://developers.facebook.com/apps/1621732999001688/settings/basic/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**After setup, your Facebook OAuth token exchange will work securely!** 🔐
