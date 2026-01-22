# 🔍 Facebook Connection Troubleshooting Guide

If you're still getting "Feature Unavailable" after following the setup guide, use this comprehensive troubleshooting checklist.

---

## 🔴 Critical Checks (Do These First)

### 1. Check Your Exact Redirect URI

The redirect URI must match **EXACTLY** in Facebook App settings. 

**To see what redirect URI your app is using:**

1. Open your browser console (F12)
2. Go to the Network tab
3. Click "Connect" on Facebook
4. Look at the OAuth request URL
5. Find the `redirect_uri` parameter - this is what you need to add to Facebook

**Common redirect URIs:**
- `https://engage-hub-ten.vercel.app/`
- `https://engage-hub-ten.vercel.app/#`
- `https://engage-hub-ten.vercel.app/#/` (if using hash routing)

**Action:** Copy the EXACT redirect URI from the network request and add it to Facebook App settings.

---

### 2. Verify App Mode Status

**This is the #1 cause of "Feature Unavailable" errors!**

1. Go to https://developers.facebook.com/apps/
2. Click your app (ID: `1621732999001688`)
3. Go to **Settings** → **Basic**
4. Scroll to the very bottom
5. Check the **App Mode** toggle:

   - ✅ **If it says "Development":**
     - You MUST add yourself as a test user
     - Go to **Roles** → **Test Users**
     - Add your Facebook account email
     - OR switch to **Live Mode** (recommended for production)

   - ✅ **If it says "Live":**
     - Make sure you've accepted all terms
     - Some permissions may require App Review

---

### 3. Verify All Required Fields Are Filled

Go to **Settings** → **Basic** and check:

- [ ] **App Name** - Must be filled
- [ ] **App Contact Email** - Must be a valid email
- [ ] **Privacy Policy URL** - **REQUIRED** (even if placeholder)
  - Can use: `https://engage-hub-ten.vercel.app/privacy`
  - Or create a simple page with privacy policy text
- [ ] **Category** - Must be selected
- [ ] **App Icon** - Must be uploaded (1024x1024px minimum)

**If any are missing, Facebook will show "Feature Unavailable"**

---

### 4. Verify Redirect URIs Match Exactly

1. Go to **Settings** → **Basic**
2. Scroll to **Valid OAuth Redirect URIs**
3. Check that you have added:

   ```
   https://engage-hub-ten.vercel.app
   https://engage-hub-ten.vercel.app/
   https://engage-hub-ten.vercel.app/#
   https://engage-hub-ten.vercel.app/#/
   ```

4. **Important:** The URI must match EXACTLY (including trailing slashes, hash, etc.)

5. **Check for typos:**
   - No extra spaces
   - Correct protocol (https:// not http://)
   - Correct domain spelling

---

### 5. Check App Domains

1. Go to **Settings** → **Basic**
2. Scroll to **App Domains**
3. Make sure you have:
   - `engage-hub-ten.vercel.app` (without https://)
   - `localhost` (for development)

---

### 6. Verify Permissions Are Available

1. Go to **App Review** → **Permissions and Features**
2. Check these permissions:
   - `pages_manage_posts` - Should be available
   - `pages_read_engagement` - Should be available
   - `public_profile` - Should be available

**If they show "Requires Review":**
- For Development mode: They should still work for test users
- For Live mode: You may need to submit for review

---

## 🔧 Step-by-Step Fix Process

### Step 1: Get the Exact Redirect URI

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Type this and press Enter:
   ```javascript
   console.log('Redirect URI:', window.location.origin + window.location.pathname + (window.location.hash || ''))
   ```
4. Copy the output - this is your exact redirect URI

### Step 2: Add to Facebook

1. Go to Facebook App settings
2. **Settings** → **Basic**
3. Scroll to **Valid OAuth Redirect URIs**
4. Click **Add URI**
5. Paste the EXACT URI from Step 1
6. Click **Save Changes**

### Step 3: Switch to Live Mode (or Add Test User)

**Option A: Switch to Live Mode**
1. **Settings** → **Basic** → Scroll to bottom
2. Toggle **App Mode** to **Live**
3. Accept terms if prompted
4. Click **Save Changes**

**Option B: Add Test User (if staying in Development)**
1. **Roles** → **Test Users**
2. Click **Add Test Users**
3. Enter your Facebook account email
4. Click **Add**

### Step 4: Wait and Test

1. **Wait 5-10 minutes** for changes to propagate
2. Clear your browser cache
3. Try connecting again

---

## 🐛 Common Issues & Solutions

### Issue: "Feature Unavailable" persists

**Solution:**
1. Check if you're logged into Facebook with the same account that owns the app
2. Try in an incognito/private window
3. Clear browser cookies for facebook.com
4. Check Facebook App status in dashboard for any warnings

### Issue: Redirect URI mismatch

**Solution:**
1. Check the Network tab in DevTools when clicking Connect
2. Look at the OAuth URL - find `redirect_uri=`
3. Copy that EXACT value
4. Add it to Facebook App settings

### Issue: App still in Development mode

**Solution:**
- Either switch to Live mode
- OR add yourself as a test user in **Roles** → **Test Users**

### Issue: Missing Privacy Policy

**Solution:**
- Create a simple privacy policy page
- Or use a placeholder: `https://engage-hub-ten.vercel.app/privacy`
- Add it in **Settings** → **Basic** → **Privacy Policy URL**

---

## ✅ Final Verification Checklist

Before trying to connect again, verify ALL of these:

- [ ] App Name is filled
- [ ] Contact Email is added
- [ ] Privacy Policy URL is added (required!)
- [ ] App Icon is uploaded
- [ ] Category is selected
- [ ] App Domains includes `engage-hub-ten.vercel.app`
- [ ] Valid OAuth Redirect URIs includes the EXACT URI from your app
- [ ] App is in **Live Mode** OR you're added as a test user
- [ ] All changes are saved
- [ ] You've waited 5-10 minutes after saving
- [ ] You've cleared browser cache
- [ ] You're using the same Facebook account that owns the app

---

## 🆘 Still Not Working?

### Check Facebook App Status

1. Go to **Settings** → **Basic**
2. Look for any **red warning messages** at the top
3. Check **App Review** tab for pending reviews
4. Check **App Dashboard** for any alerts

### Get Help

1. **Facebook Developer Support:** https://developers.facebook.com/support/
2. **Facebook Login Docs:** https://developers.facebook.com/docs/facebook-login/web
3. **Check App Status:** Look for any restrictions or limitations in your app dashboard

### Debug Information to Collect

If still not working, collect this info:

1. **Exact redirect URI** (from browser console)
2. **App Mode** (Development or Live)
3. **Test User status** (if in Development mode)
4. **Any error messages** from Facebook
5. **Screenshot** of Facebook App Basic Settings page

---

## 💡 Pro Tips

1. **Use Live Mode for Production** - Development mode has limitations
2. **Privacy Policy is Required** - Even a simple one works
3. **Redirect URIs are Case-Sensitive** - Must match exactly
4. **Changes Take Time** - Wait 5-10 minutes after saving
5. **Clear Cache** - Browser cache can cause issues
6. **Check Network Tab** - See the exact OAuth request being made

---

**After completing all checks, try connecting again!** 🚀
