# 🔗 Facebook OAuth Callback URLs Guide

## 🎯 Authorized Callback URLs for Facebook App Authentication

When using **embedded secret** (App Secret stored in backend), you need to configure these callback URLs in your Facebook App settings.

---

## ✅ Required Callback URLs

### For Production (Vercel):
```
https://engage-hub-ten.vercel.app
https://engage-hub-ten.vercel.app/
https://engage-hub-ten.vercel.app/#
```

### For Development (Localhost):
```
http://localhost:3000
http://localhost:3000/
http://localhost:3000/#
```

### For Development (127.0.0.1):
```
http://127.0.0.1:3000
http://127.0.0.1:3000/
```

---

## 📋 Where to Add These URLs

### Step 1: Go to Facebook App Settings
1. Visit: **https://developers.facebook.com/apps/1621732999001688**
2. Go to **Products** → **Facebook Login** → **Settings**

### Step 2: Add Valid OAuth Redirect URIs
In the **"Valid OAuth Redirect URIs"** section, add **ALL** of these URLs (one per line):

```
https://engage-hub-ten.vercel.app
https://engage-hub-ten.vercel.app/
https://engage-hub-ten.vercel.app/#
http://localhost:3000
http://localhost:3000/
http://localhost:3000/#
http://127.0.0.1:3000
http://127.0.0.1:3000/
```

### Step 3: Add Deauthorize Callback URL
In the **"Deauthorize Callback URL"** field, add:
```
https://engage-hub-ten.vercel.app
```

### Step 4: Save Changes
Click **"Save Changes"** at the bottom

---

## 🔍 How It Works

### OAuth Flow with Embedded Secret:

1. **User clicks "Connect Facebook"**
   - Frontend redirects to: `https://www.facebook.com/v21.0/dialog/oauth?client_id=...&redirect_uri=...`
   - `redirect_uri` is one of the URLs above (e.g., `https://engage-hub-ten.vercel.app`)

2. **User authorizes on Facebook**
   - Facebook redirects back to your callback URL with a `code` parameter
   - Example: `https://engage-hub-ten.vercel.app/?code=AQT9zRfNw7JMYkIZeOw6YsNcWVU4NR2uhCFN3xtlTq62e_5fMqM9IDLIcg8RCE2pzK_pZmCafLfIHU5Y0gQWiOgl-BVzKLxpuk8DeT-VJ9yXE0vGguSEH3V5slVoT2qlSmlnp5j2jUQjxJ6FVHt-15y3469W9WiciUyo8QyMBHUNyu_YM5qgAHVJhQYHUKa8j...&state=facebook_oauth`

3. **Frontend receives the code**
   - Your app detects the `code` parameter in the URL
   - Calls your backend endpoint: `POST /api/facebook/token`
   - Sends the `code` and `redirectUri` to backend

4. **Backend exchanges code for token**
   - Backend uses **App Secret** (embedded/secure) to exchange code for access token
   - Endpoint: `https://engage-hub-ten.vercel.app/api/facebook/token`
   - Uses `FACEBOOK_APP_SECRET` from environment variables

5. **Backend returns access token**
   - Frontend receives the access token
   - Stores it securely
   - Connection complete!

---

## ⚠️ Important Notes

### 1. Exact Match Required
Facebook requires **exact matches** for redirect URIs. Make sure:
- ✅ Include trailing slashes (`/` and without `/`)
- ✅ Include hash variants (`#` and without `#`)
- ✅ Match protocol (HTTP for localhost, HTTPS for production)

### 2. Embedded Secret Security
- ✅ App Secret is stored in **Vercel environment variables** (`FACEBOOK_APP_SECRET`)
- ✅ Secret is **NEVER** exposed to frontend
- ✅ Only backend endpoint (`/api/facebook/token`) uses the secret
- ✅ Frontend only uses App ID (`VITE_FACEBOOK_APP_ID`)

### 3. Backend Endpoint
Your backend endpoint for token exchange:
```
POST https://engage-hub-ten.vercel.app/api/facebook/token
```

This endpoint:
- Receives: `{ code: string, redirectUri: string }`
- Uses: `FACEBOOK_APP_SECRET` (from environment)
- Returns: `{ access_token: string, expires_in: number }`

---

## 📋 Complete Setup Checklist

### Facebook App Settings:
- [ ] All callback URLs added to "Valid OAuth Redirect URIs"
- [ ] Deauthorize Callback URL set
- [ ] All changes saved

### Vercel Environment Variables:
- [ ] `FACEBOOK_APP_SECRET` added (backend only, no VITE_ prefix)
- [ ] `VITE_FACEBOOK_APP_ID=1621732999001688` added (frontend)
- [ ] `VITE_API_URL=https://engage-hub-ten.vercel.app` added

### Backend Endpoint:
- [ ] `/api/facebook/token.ts` exists and is deployed
- [ ] Endpoint uses `process.env.FACEBOOK_APP_SECRET`
- [ ] CORS headers configured correctly

### Testing:
- [ ] Try connecting Facebook from production URL
- [ ] Try connecting Facebook from localhost
- [ ] Verify token exchange works

---

## 🔍 Verify Your Configuration

### Test 1: Check Redirect URI in Code
The redirect URI is calculated dynamically in `src/lib/facebook.ts`:
```typescript
const getRedirectURI = (): string => {
    if (typeof window === 'undefined') {
        return 'http://localhost:3000';
    }
    return `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`;
};
```

This means:
- **Production:** `https://engage-hub-ten.vercel.app` (or with path/hash)
- **Localhost:** `http://localhost:3000` (or with path/hash)

### Test 2: Check Facebook App Settings
1. Go to: https://developers.facebook.com/apps/1621732999001688/settings/basic/
2. Scroll to **"Facebook Login"** → **"Settings"**
3. Verify all URLs are listed in "Valid OAuth Redirect URIs"

---

## 🚨 Common Issues

### Issue 1: "Redirect URI Mismatch"
**Error:** `redirect_uri does not match the registered value`

**Solution:**
- Check that the exact URL is in "Valid OAuth Redirect URIs"
- Include both with and without trailing slashes
- Make sure protocol matches (HTTP vs HTTPS)

---

### Issue 2: "Invalid OAuth Access Token"
**Error:** Token exchange fails

**Solution:**
- Verify `FACEBOOK_APP_SECRET` is correct in Vercel
- Check that App ID matches (`1621732999001688`)
- Verify redirect URI sent to backend matches what's registered

---

### Issue 3: "CORS Error"
**Error:** CORS policy blocking request

**Solution:**
- Check that backend endpoint has CORS headers
- Verify `VITE_API_URL` is set correctly
- Make sure backend endpoint is deployed

---

## 📚 Quick Reference

**Your App ID:** `1621732999001688`  
**App Dashboard:** https://developers.facebook.com/apps/1621732999001688  
**Facebook Login Settings:** https://developers.facebook.com/apps/1621732999001688/fb-login/settings/  
**Production URL:** https://engage-hub-ten.vercel.app  
**Backend Endpoint:** https://engage-hub-ten.vercel.app/api/facebook/token

---

## 💡 Pro Tips

1. **Always include both variants:**
   - With trailing slash: `https://engage-hub-ten.vercel.app/`
   - Without trailing slash: `https://engage-hub-ten.vercel.app`
   - With hash: `https://engage-hub-ten.vercel.app/#`

2. **For localhost development:**
   - Use `http://localhost:3000` (not HTTPS)
   - Also add `http://127.0.0.1:3000` if you use that

3. **Test both environments:**
   - Test from production URL
   - Test from localhost
   - Make sure both work

---

**After adding these callback URLs and saving, wait 5-10 minutes for Facebook to process the changes!** 🚀
