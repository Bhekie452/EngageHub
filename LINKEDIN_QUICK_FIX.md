# 🚨 LinkedIn Client ID Quick Fix

## Problem
Error: `LinkedIn Client ID not configured. Please set VITE_LINKEDIN_CLIENT_ID in environment variables.`

## Solution (5 Steps)

### Step 1: Go to Vercel Dashboard
1. Visit: **https://vercel.com/dashboard**
2. Sign in
3. Select your project: **engage-hub-ten**

### Step 2: Add Environment Variable
1. Click **"Settings"** tab (top navigation)
2. Click **"Environment Variables"** (left sidebar)
3. Click **"Add New"** button

### Step 3: Enter LinkedIn Client ID
```
Name: VITE_LINKEDIN_CLIENT_ID
Value: 776oifhjg06le0
Environment: ✅ Production ✅ Preview ✅ Development (select all three)
```

4. Click **"Save"**

### Step 4: Redeploy
1. Go to **"Deployments"** tab
2. Find your latest deployment
3. Click **"⋯"** (three dots) menu
4. Click **"Redeploy"**
5. Wait for status to show **"Ready"** (usually 1-2 minutes)

### Step 5: Clear Browser Cache
1. **Hard refresh**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or use **Incognito/Private window**
3. Try connecting LinkedIn again

---

## ✅ Verification

After redeploying, when you click "Connect LinkedIn":
- ✅ Should redirect to LinkedIn OAuth page
- ❌ Should NOT show "Client ID not configured" error

---

## 🔍 Still Not Working?

1. **Check variable name**: Must be exactly `VITE_LINKEDIN_CLIENT_ID` (case-sensitive)
2. **Check environments**: Must be added to Production, Preview, AND Development
3. **Wait 2-3 minutes**: Vercel CDN may cache old build
4. **Try incognito**: Rules out browser cache issues
5. **Check Vercel logs**: Go to Deployments → Click deployment → View Function Logs

---

## 📚 Full Guide

For detailed setup instructions, see:
- `VERCEL_ENV_VARS_SETUP.md` - General environment variable setup
- `LINKEDIN_CONNECTION_GUIDE.md` - Complete LinkedIn integration guide
