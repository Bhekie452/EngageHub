# 🔧 Vercel Environment Variables Setup Guide

## 🎯 Overview

This guide shows you how to add environment variables to your Vercel deployment so that LinkedIn, YouTube, and other integrations work on your live site.

---

## ✅ Quick Steps

### Step 1: Go to Vercel Dashboard

1. Visit: **https://vercel.com/dashboard**
2. Sign in to your account
3. Select your project (e.g., "engage-hub-ten")

### Step 2: Navigate to Environment Variables

1. Click on your project
2. Go to **"Settings"** tab (top navigation)
3. Click **"Environment Variables"** in the left sidebar

### Step 3: Add Environment Variables

Click **"Add New"** and add each variable:

#### For LinkedIn:
```
Name: VITE_LINKEDIN_CLIENT_ID
Value: 776oifhjg06le0
Environment: Production, Preview, Development (select all)
```

#### For YouTube:
```
Name: VITE_YOUTUBE_CLIENT_ID
Value: your_google_client_id_here
Environment: Production, Preview, Development (select all)
```

OR use Google Client ID (works for both):
```
Name: VITE_GOOGLE_CLIENT_ID
Value: your_google_client_id_here
Environment: Production, Preview, Development (select all)
```

#### For Backend API (if you have one):
```
Name: VITE_API_URL
Value: https://your-backend-url.com
Environment: Production, Preview, Development (select all)
```

#### For Facebook Backend (Server-side only - NEVER in frontend):
```
Name: FACEBOOK_APP_SECRET
Value: your_facebook_app_secret_here
Environment: Production, Preview, Development (select all)
```

**⚠️ IMPORTANT:** 
- `FACEBOOK_APP_SECRET` is used ONLY in your backend API endpoint (`/api/facebook/token`)
- NEVER add this to frontend environment variables (VITE_*)
- This secret is used server-side to securely exchange OAuth codes for access tokens

### Step 4: Redeploy

**IMPORTANT:** After adding environment variables, you MUST redeploy:

1. Go to **"Deployments"** tab
2. Find your latest deployment
3. Click the **"⋯"** (three dots) menu
4. Click **"Redeploy"**
5. Wait for deployment to complete (status shows "Ready")

### Step 5: Clear Browser Cache

After redeployment:

1. **Hard refresh** your browser:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Or use **Incognito/Private window** to test
3. Wait 1-2 minutes after redeployment completes

---

## 🔍 Verify Environment Variables

To check if variables are loaded:

1. Open browser console (F12)
2. Go to your live site
3. Try connecting LinkedIn/YouTube
4. Check console logs - you should see debug info showing if Client ID is found

---

## 🚨 Common Issues

### Issue 1: "Variable not found after adding"

**Solutions:**
- ✅ Make sure you selected all environments (Production, Preview, Development)
- ✅ Redeploy after adding variables
- ✅ Wait 1-2 minutes for deployment to complete
- ✅ Clear browser cache or use incognito mode

### Issue 2: "Still showing old error"

**Solutions:**
- ✅ Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
- ✅ Clear browser cache completely
- ✅ Try incognito/private window
- ✅ Wait a few minutes - Vercel CDN may cache old build

### Issue 3: "Variable works locally but not in production"

**Solutions:**
- ✅ Check that variable name matches exactly (case-sensitive)
- ✅ Make sure variable is added to Production environment
- ✅ Redeploy after adding variable
- ✅ Check Vercel deployment logs for errors

---

## 📋 Checklist

Before testing on live site:

- [ ] Environment variables added to Vercel
- [ ] All environments selected (Production, Preview, Development)
- [ ] Variables saved successfully
- [ ] Project redeployed after adding variables
- [ ] Deployment status shows "Ready"
- [ ] Browser cache cleared (hard refresh)
- [ ] Tested in incognito/private window

---

## 🎯 Required Variables Summary

### LinkedIn Integration:
```
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
VITE_API_URL=https://your-backend-url.com (optional, for token exchange)
```

### YouTube Integration:
```
VITE_YOUTUBE_CLIENT_ID=your_google_client_id
# OR
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=https://your-backend-url.com (required for token exchange)
```

### Facebook Integration:
```
VITE_FACEBOOK_APP_ID=1621732999001688 (frontend - safe to expose)
FACEBOOK_APP_SECRET=your_facebook_app_secret (backend only - NEVER expose!)
VITE_API_URL=https://engage-hub-ten.vercel.app (frontend)
```

### Backend Secrets (Server-side only):
```
FACEBOOK_APP_SECRET=your_facebook_app_secret (backend only!)
YOUTUBE_CLIENT_SECRET=your_google_client_secret (backend only!)
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret (backend only!)
```

**⚠️ CRITICAL SECURITY RULES:**
- ❌ NEVER add secrets to frontend variables (VITE_*)
- ✅ Only add secrets to backend environment variables (no VITE_ prefix)
- ✅ Secrets are used in API endpoints (`/api/facebook/token`, `/api/youtube/token`, etc.)
- ✅ Frontend only uses Client IDs (safe to expose)

---

## 📚 Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**After setup, your integrations should work on the live site!** 🚀
