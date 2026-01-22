# 🔧 LinkedIn OAuth Troubleshooting Guide

## Error: "appid/redirect uri/code verifier does not match authorization code"

This error means LinkedIn rejected the token exchange because one of these doesn't match:
1. **Client ID** - Doesn't match what was used in authorization
2. **Redirect URI** - Doesn't match exactly what was used in authorization
3. **Authorization code expired** - Codes expire quickly (usually 10 minutes)

---

## ✅ Step-by-Step Fix

### Step 1: Verify Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Required Variables:**
```
✅ VITE_LINKEDIN_CLIENT_ID = 7760ifhjg06le0 (Frontend)
✅ LINKEDIN_CLIENT_ID = 7760ifhjg06le0 (Backend - CRITICAL!)
✅ LINKEDIN_CLIENT_SECRET = your_secret_here (Backend - CRITICAL!)
✅ VITE_API_URL = https://engage-hub-ten.vercel.app (Frontend)
```

**⚠️ IMPORTANT:**
- `VITE_LINKEDIN_CLIENT_ID` = Used by frontend (during build)
- `LINKEDIN_CLIENT_ID` = Used by backend serverless function (at runtime)
- **You need BOTH!** The backend can't access `VITE_` prefixed variables.

### Step 2: Verify LinkedIn App Settings

1. Go to: **https://www.linkedin.com/developers/apps**
2. Select your app
3. Go to **"Auth"** tab
4. Check **"Authorized redirect URLs"** - Must have EXACTLY:
   ```
   https://engage-hub-ten.vercel.app
   ```
   **Important:**
   - ✅ No trailing slash
   - ✅ No path (just root URL)
   - ✅ Must be HTTPS (not HTTP)
   - ✅ Must match exactly (case-sensitive)

### Step 3: Redeploy After Adding Variables

1. Go to **Vercel → Deployments**
2. Click **"⋯"** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Clear Browser Cache

1. **Hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or use **Incognito/Private window**
3. Try connecting LinkedIn again

---

## 🔍 Debugging Steps

### Check Vercel Function Logs

1. Go to **Vercel Dashboard → Your Project → Deployments**
2. Click on the latest deployment
3. Click **"Functions"** tab
4. Click on `/api/linkedin/token`
5. Check the **"Logs"** tab

Look for:
- `LinkedIn token exchange request:` - Shows what's being sent
- `LinkedIn token exchange error:` - Shows LinkedIn's response
- Check if `clientIdPrefix` shows the correct Client ID
- Check if `redirectUri` matches exactly

### Check Browser Console

1. Open browser console (F12)
2. Look for:
   - `🔄 Exchanging code for token...`
   - `Using redirect URI: ...`
   - `Stored redirect URI: ...`
3. Check the network tab for the `/api/linkedin/token` request
4. Look at the request payload - verify `redirectUri` is correct

---

## 🚨 Common Issues

### Issue 1: "Client ID not configured" in backend

**Solution:**
- Add `LINKEDIN_CLIENT_ID` (without `VITE_`) to Vercel
- Backend can't access `VITE_` prefixed variables
- Redeploy after adding

### Issue 2: Redirect URI mismatch

**Symptoms:**
- Error: "redirect uri does not match"
- Works sometimes but not always

**Solution:**
- Check LinkedIn app settings - redirect URI must be exactly: `https://engage-hub-ten.vercel.app`
- No trailing slash, no path
- Must match what's stored in `sessionStorage` during authorization

### Issue 3: Authorization code expired

**Symptoms:**
- Error: "authorization code expired"
- Takes too long between authorization and token exchange

**Solution:**
- Authorization codes expire quickly (usually 10 minutes)
- Try connecting again immediately after authorization
- Don't wait between steps

### Issue 4: Client Secret wrong or missing

**Symptoms:**
- Error: "invalid_client" or "unauthorized_client"

**Solution:**
- Verify `LINKEDIN_CLIENT_SECRET` is set in Vercel
- Make sure it's the correct secret from LinkedIn app
- No extra spaces or characters
- Redeploy after adding/updating

---

## 📋 Verification Checklist

Before trying to connect:

- [ ] `VITE_LINKEDIN_CLIENT_ID` added to Vercel (frontend)
- [ ] `LINKEDIN_CLIENT_ID` added to Vercel (backend) - **CRITICAL!**
- [ ] `LINKEDIN_CLIENT_SECRET` added to Vercel (backend) - **CRITICAL!**
- [ ] `VITE_API_URL` set to `https://engage-hub-ten.vercel.app`
- [ ] All variables added to Production, Preview, AND Development
- [ ] Project redeployed after adding variables
- [ ] LinkedIn app has redirect URI: `https://engage-hub-ten.vercel.app` (exact match, no trailing slash)
- [ ] Browser cache cleared (hard refresh or incognito)
- [ ] Tried connecting immediately (don't wait between steps)

---

## 🆘 Still Not Working?

1. **Check Vercel Function Logs:**
   - Look for the actual error from LinkedIn
   - Verify what redirect URI is being sent
   - Verify Client ID is being read correctly

2. **Test with curl/Postman:**
   ```bash
   curl -X POST https://engage-hub-ten.vercel.app/api/linkedin/token \
     -H "Content-Type: application/json" \
     -d '{"code":"test_code","redirectUri":"https://engage-hub-ten.vercel.app"}'
   ```
   (This will fail, but you'll see the error message)

3. **Verify LinkedIn App Status:**
   - Make sure your LinkedIn app is approved
   - Check if app is in "Development" or "Production" mode
   - Verify required products are added (Share on LinkedIn)

4. **Contact Support:**
   - Share Vercel function logs
   - Share browser console logs
   - Share LinkedIn app settings (screenshot, hide secrets)

---

## 📚 Related Guides

- `LINKEDIN_QUICK_FIX.md` - Quick setup steps
- `LINKEDIN_CONNECTION_GUIDE.md` - Complete setup guide
- `VERCEL_ENV_VARS_SETUP.md` - General environment variable setup
