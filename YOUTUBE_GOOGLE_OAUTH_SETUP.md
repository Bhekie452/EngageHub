# 📺 YouTube/Google OAuth Setup Guide

This guide shows you how to get YouTube/Google OAuth credentials (Client ID and Client Secret) from Google Cloud Console.

---

## 🎯 Step 1: Go to Google Cloud Console

1. Open: **https://console.cloud.google.com/**
2. Sign in with your Google account

---

## 🎯 Step 2: Create or Select a Project

1. Click the **project dropdown** at the top (next to "Google Cloud")
2. Either:
   - **Create New Project**: Click "New Project" → Enter name (e.g., "EngageHub") → Click "Create"
   - **Select Existing Project**: Click on an existing project

---

## 🎯 Step 3: Enable YouTube Data API v3

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for: **"YouTube Data API v3"**
3. Click on it
4. Click **"Enable"** button
5. Wait for it to enable (usually a few seconds)

**Why?** This API allows your app to access YouTube channel information.

---

## 🎯 Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"** (in left sidebar)
2. Click **"+ CREATE CREDENTIALS"** button (at the top)
3. Select **"OAuth client ID"**

**If you see "Configure Consent Screen" first:**
- Click it and complete the consent screen setup:
  - **User Type**: External (for public use) or Internal (for Google Workspace)
  - **App name**: "EngageHub" (or your app name)
  - **User support email**: Your email
  - **Developer contact**: Your email
  - Click **"Save and Continue"**
  - **Scopes**: Click "Add or Remove Scopes" → Search and add:
    - `https://www.googleapis.com/auth/youtube.upload`
    - `https://www.googleapis.com/auth/youtube.readonly`
    - `https://www.googleapis.com/auth/userinfo.profile`
    - `https://www.googleapis.com/auth/userinfo.email`
  - Click **"Save and Continue"**
  - **Test users** (if External): Add your email
  - Click **"Save and Continue"**
  - Click **"Back to Dashboard"**

4. Now create OAuth Client ID:
   - **Application type**: Select **"Web application"**
   - **Name**: "EngageHub Web Client" (or any name)
   - **Authorized JavaScript origins**: Add:
     - `http://localhost:3000`
     - `https://engage-hub-ten.vercel.app`
   - **Authorized redirect URIs**: Add:
     - `http://localhost:3000`
     - `https://engage-hub-ten.vercel.app`
   - Click **"Create"**

5. **IMPORTANT**: A popup will show your credentials:
   - **Your Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Your Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
   - **Copy both immediately!** (You won't see the secret again)

---

## 🎯 Step 5: Add to Vercel Environment Variables

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project: **"engage-hub-ten"**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

### Frontend Variables (VITE_ prefix):

**Variable 1:**
- **Name**: `VITE_YOUTUBE_CLIENT_ID`
- **Value**: `123456789-abcdefghijklmnop.apps.googleusercontent.com` (your Client ID)
- **Environment**: **All Environments**

**OR use:**
- **Name**: `VITE_GOOGLE_CLIENT_ID`
- **Value**: Same Client ID
- **Environment**: **All Environments**

### Backend Variables (NO VITE_ prefix):

**Variable 2:**
- **Name**: `YOUTUBE_CLIENT_ID`
- **Value**: `123456789-abcdefghijklmnop.apps.googleusercontent.com` (same Client ID)
- **Environment**: **All Environments**

**OR use:**
- **Name**: `GOOGLE_CLIENT_ID`
- **Value**: Same Client ID
- **Environment**: **All Environments**

**Variable 3 (CRITICAL - Backend Only):**
- **Name**: `YOUTUBE_CLIENT_SECRET`
- **Value**: `GOCSPX-abcdefghijklmnopqrstuvwxyz` (your Client Secret)
- **Environment**: **All Environments**

**OR use:**
- **Name**: `GOOGLE_CLIENT_SECRET`
- **Value**: Same Client Secret
- **Environment**: **All Environments**

---

## 🎯 Step 6: Redeploy

1. After adding environment variables, go to **Deployments** tab
2. Click **"⋯"** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## 📋 Quick Checklist

- [ ] Google Cloud project created/selected
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created (Web application)
- [ ] Authorized redirect URIs added:
  - [ ] `http://localhost:3000`
  - [ ] `https://engage-hub-ten.vercel.app`
- [ ] Client ID and Secret copied
- [ ] Vercel environment variables added:
  - [ ] `VITE_YOUTUBE_CLIENT_ID` (or `VITE_GOOGLE_CLIENT_ID`)
  - [ ] `YOUTUBE_CLIENT_ID` (or `GOOGLE_CLIENT_ID`)
  - [ ] `YOUTUBE_CLIENT_SECRET` (or `GOOGLE_CLIENT_SECRET`)
- [ ] All variables set to **"All Environments"**
- [ ] Project redeployed

---

## 🔍 Where to Find Your Credentials Later

If you need to view your credentials again:

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Select your project
3. Go to **"APIs & Services"** → **"Credentials"**
4. Find your OAuth 2.0 Client ID
5. Click on it to view:
   - **Client ID**: Visible (you can copy it)
   - **Client Secret**: Click **"Show"** to reveal it (you'll need to authenticate)

**Note**: If you lost the Client Secret, you can:
- Click **"Reset Secret"** to generate a new one
- Update it in Vercel environment variables
- Redeploy

---

## 🎯 Example Values

Your credentials will look like:

**Client ID:**
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**Client Secret:**
```
GOCSPX-abcdefghijklmnopqrstuvwxyz123456
```

---

## ⚠️ Important Notes

1. **Client Secret is sensitive**: Never commit it to Git or expose it in frontend code
2. **Redirect URIs must match exactly**: 
   - No trailing slashes
   - Must include protocol (`http://` or `https://`)
   - Must match what's in your code
3. **Use same Client ID for both**: Frontend and backend use the same Client ID, but only backend uses the Secret
4. **Environment scope**: Set all variables to **"All Environments"** in Vercel

---

## 🚀 After Setup

Once you've added the credentials and redeployed:

1. Go to your app: https://engage-hub-ten.vercel.app
2. Navigate to **Social Media** → **Connected accounts**
3. Click **"Connect"** on YouTube
4. You'll be redirected to Google to authorize
5. After authorization, your YouTube channel name will appear!

---

**Need help?** Check the browser console for any errors, or see `YOUTUBE_CONNECTION_GUIDE.md` for more details.
