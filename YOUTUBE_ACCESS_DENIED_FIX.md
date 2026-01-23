# 🔧 YouTube/Google OAuth Access Denied Fix

## ❌ Error You're Seeing

```
Access blocked: engage-hub-ten.vercel.app has not completed the Google verification process
Error 403: access_denied
```

## 🎯 The Problem

Your Google OAuth app is in **"Testing"** mode, which means only developer-approved test users can access it. Your account (`bhekitsabedze452@gmail.com`) is not added as a test user.

---

## ✅ Quick Fix: Add Yourself as Test User

### Step 1: Go to OAuth Consent Screen

1. Go to: **https://console.cloud.google.com/**
2. Select your project
3. Go to **"APIs & Services"** → **"OAuth consent screen"** (in left sidebar)

### Step 2: Add Test Users

1. Scroll down to **"Test users"** section
2. Click **"+ ADD USERS"** button
3. Add your email: `bhekitsabedze452@gmail.com`
4. Click **"Add"**
5. Click **"Save"** at the bottom of the page

### Step 3: Test Again

1. Clear browser cache: `Ctrl + Shift + R`
2. Try connecting YouTube again
3. Should work now! ✅

---

## 🚀 Alternative: Publish Your App (For Public Access)

If you want anyone to be able to connect (not just test users):

### Step 1: Complete OAuth Consent Screen

1. Go to **"OAuth consent screen"**
2. Make sure all required fields are filled:
   - **App name**: "EngageHub" (or your app name)
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **App domain**: `engage-hub-ten.vercel.app`
   - **Authorized domains**: `engage-hub-ten.vercel.app`
   - **Privacy policy URL**: (required for publishing)
   - **Terms of service URL**: (optional but recommended)

### Step 2: Add Scopes

Make sure these scopes are added:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/userinfo.email`

### Step 3: Publish App

1. Scroll to the bottom of the OAuth consent screen
2. Click **"PUBLISH APP"** button
3. Confirm the publishing
4. **Note**: Publishing may require Google verification if you request sensitive scopes

---

## 📋 Quick Checklist

**For Testing (Quick Fix):**
- [ ] Go to OAuth consent screen
- [ ] Add `bhekitsabedze452@gmail.com` as test user
- [ ] Save changes
- [ ] Test YouTube connection

**For Publishing (Public Access):**
- [ ] Complete all required fields in OAuth consent screen
- [ ] Add Privacy Policy URL
- [ ] Verify scopes are correct
- [ ] Click "PUBLISH APP"
- [ ] Wait for approval (if required)

---

## 🎯 Recommended Approach

**For now (quick fix):**
- Add yourself as a test user (takes 30 seconds)
- This allows you to test immediately

**Later (when ready for production):**
- Complete OAuth consent screen fully
- Add Privacy Policy URL
- Publish the app for public access

---

## ⚠️ Important Notes

1. **Test users**: Only the emails you add can use the app in Testing mode
2. **Publishing**: May require Google verification for sensitive scopes
3. **Privacy Policy**: Required for publishing - you can host it on your Vercel app or use a service like GitHub Pages

---

## 🔗 Quick Links

- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent
- **Your Project**: https://console.cloud.google.com/

---

**The quickest fix is to add yourself as a test user!** This takes 30 seconds and you can test immediately. 🚀
