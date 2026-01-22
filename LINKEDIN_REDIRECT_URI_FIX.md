# 🔧 Fix LinkedIn Redirect URI Error

## ❌ The Error

**"The redirect_uri does not match the registered value"**

This happens because the redirect URI in your OAuth request doesn't match what's registered in your LinkedIn app.

---

## ✅ Solution: Add Redirect URIs to LinkedIn App

### Step 1: Go to LinkedIn Auth Settings

1. Go to: **https://www.linkedin.com/developers/apps**
2. Click: **"Engagehub"** app
3. Click: **"Auth"** tab (top navigation)

### Step 2: Add Authorized Redirect URLs

In the **"Auth"** tab, find **"Authorized redirect URLs"** section and add **ALL** of these:

```
http://localhost:3000
http://localhost:3000/
http://127.0.0.1:3000
http://127.0.0.1:3000/
https://engage-hub-ten.vercel.app
https://engage-hub-ten.vercel.app/
https://engage-hub-ten.vercel.app/#
```

**Important:** 
- Add each one separately
- Include both with and without trailing slash
- Include both `localhost` and `127.0.0.1` (even though code normalizes it)
- Include your production URL

### Step 3: Save Changes

Click **"Update"** or **"Save"** button

### Step 4: Wait a Few Minutes

LinkedIn may take 1-2 minutes to update the redirect URIs.

---

## 🔧 Code Fix Applied

I've also updated the code to normalize `127.0.0.1` to `localhost` automatically, but you still need to register both in LinkedIn.

---

## ✅ After Adding Redirect URIs

1. **Wait 1-2 minutes** for LinkedIn to update
2. **Try connecting LinkedIn again** in your app
3. The error should be resolved

---

## 📋 Quick Checklist

- [ ] Go to LinkedIn Developer Portal → Engagehub → Auth tab
- [ ] Find "Authorized redirect URLs" section
- [ ] Add `http://localhost:3000`
- [ ] Add `http://localhost:3000/`
- [ ] Add `http://127.0.0.1:3000`
- [ ] Add `http://127.0.0.1:3000/`
- [ ] Add `https://engage-hub-ten.vercel.app`
- [ ] Add `https://engage-hub-ten.vercel.app/`
- [ ] Click "Update" or "Save"
- [ ] Wait 1-2 minutes
- [ ] Try connecting again

---

## 🆘 Still Getting Error?

1. **Check exact URL** - Make sure the redirect URI matches EXACTLY (including trailing slash)
2. **Check spelling** - No typos in the URLs
3. **Wait longer** - Sometimes takes 5-10 minutes to propagate
4. **Clear browser cache** - Try in incognito mode

---

**The fix is simple: just add the redirect URIs to your LinkedIn app's Auth settings!** ✅
