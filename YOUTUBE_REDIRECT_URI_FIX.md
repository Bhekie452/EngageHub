# 🔧 YouTube Redirect URI Mismatch Fix

## ❌ Error You're Seeing

```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

## 🎯 The Problem

The redirect URI in your Google Cloud Console doesn't match what your app is sending.

---

## ✅ Quick Fix Steps

### Step 1: Check What Redirect URI Your App Uses

Your app uses these redirect URIs:

**For Production:**
- `https://engage-hub-ten.vercel.app` (root URL, no path, no trailing slash)

**For Development:**
- `http://localhost:3000` (root URL, no path, no trailing slash)

---

### Step 2: Update Google Cloud Console

1. Go to: **https://console.cloud.google.com/**
2. Select your project
3. Go to **"APIs & Services"** → **"Credentials"**
4. Find your OAuth 2.0 Client ID: `791815269190-vb8ufm3d2garusfpm51sjkjm20c5cg8g.apps.googleusercontent.com`
5. Click on it to edit
6. Under **"Authorized redirect URIs"**, you should have EXACTLY:

```
http://localhost:3000
https://engage-hub-ten.vercel.app
```

**CRITICAL:**
- ✅ No trailing slashes (`/`)
- ✅ No paths (just root URL)
- ✅ Must include `http://` or `https://`
- ✅ Must match exactly (case-sensitive)

**DELETE any of these if they exist:**
- ❌ `http://localhost:3000/`
- ❌ `https://engage-hub-ten.vercel.app/`
- ❌ `https://engage-hub-ten.vercel.app/?code=...`
- ❌ Any other variations

7. Click **"Save"**

---

### Step 3: Verify Your Redirect URIs

After saving, your "Authorized redirect URIs" should look like this:

```
http://localhost:3000
https://engage-hub-ten.vercel.app
```

That's it - just these two, nothing else.

---

### Step 4: Test Again

1. Clear your browser cache: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Go to your app: https://engage-hub-ten.vercel.app
3. Try connecting YouTube again
4. Should work now! ✅

---

## 🔍 How to Debug

If it still doesn't work, check the browser console:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for logs that say:
   - `🔄 Redirecting to Google OAuth for YouTube...`
   - `Redirect URI: ...`
4. Copy the exact redirect URI shown
5. Make sure it matches EXACTLY in Google Cloud Console

---

## 📝 Common Mistakes

❌ **Wrong:**
```
https://engage-hub-ten.vercel.app/
http://localhost:3000/
https://engage-hub-ten.vercel.app/social-media
```

✅ **Correct:**
```
https://engage-hub-ten.vercel.app
http://localhost:3000
```

---

## 🎯 Summary

**The redirect URI must be:**
- Just the root URL (no path, no trailing slash)
- Exactly matching what's in Google Cloud Console
- Case-sensitive

**Your app sends:** `https://engage-hub-ten.vercel.app`  
**Google Cloud must have:** `https://engage-hub-ten.vercel.app` (exact match)

Fix this in Google Cloud Console and try again! 🚀
