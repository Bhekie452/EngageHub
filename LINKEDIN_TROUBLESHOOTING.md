# 🔧 LinkedIn Connection Troubleshooting

## ⚠️ Current Issue: "LinkedIn Client ID not configured"

If you're seeing this error even after adding the environment variable to Vercel, try these steps:

---

## ✅ Step 1: Verify Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Check that `VITE_LINKEDIN_CLIENT_ID` exists
3. Value should be: `776oifhjg06le0`
4. Make sure it's enabled for **Production** environment

---

## ✅ Step 2: Check Deployment Status

1. Go to **Deployments** tab in Vercel
2. Find the **latest deployment**
3. Check if it shows **"Ready"** status
4. If it's still building, wait for it to complete

**Important:** Environment variables only take effect **after redeployment**.

---

## ✅ Step 3: Clear Browser Cache

The browser might be caching the old build without the environment variable.

### Option A: Hard Refresh
- **Windows/Linux:** Press `Ctrl + Shift + R`
- **Mac:** Press `Cmd + Shift + R`

### Option B: Incognito/Private Window
- Open a new incognito/private window
- Navigate to your site
- Try connecting LinkedIn again

### Option C: Clear Cache Manually
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

---

## ✅ Step 4: Verify in Browser Console

1. Open your site: https://engage-hub-ten.vercel.app
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Type: `console.log(import.meta.env.VITE_LINKEDIN_CLIENT_ID)`
5. Press Enter

**Expected result:** Should show `776oifhjg06le0`

**If it shows `undefined`:**
- The environment variable isn't being read
- You need to redeploy (see Step 2)

---

## ✅ Step 5: Force Redeploy

If the variable is set but still not working:

1. Go to **Deployments** tab
2. Click **"⋯"** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes for deployment to complete
5. Clear browser cache (Step 3)
6. Try again

---

## 🔍 Debug Information

The updated error message now includes debug logs. Check the browser console for:

```
🔍 Debug - VITE_LINKEDIN_CLIENT_ID: 776o...
🔍 Debug - All env vars: ['VITE_LINKEDIN_CLIENT_ID', ...]
```

If you see `NOT FOUND`, the variable isn't being read.

---

## ⚠️ Common Issues

### Issue 1: Variable Added But Not Redeployed
**Symptom:** Variable exists in Vercel but still getting error

**Fix:** Redeploy (Step 5)

---

### Issue 2: Browser Cache
**Symptom:** Works in incognito but not in regular window

**Fix:** Clear cache (Step 3)

---

### Issue 3: Wrong Environment
**Symptom:** Variable exists but only for Preview/Development

**Fix:** Make sure variable is enabled for **Production** environment

---

### Issue 4: Typo in Variable Name
**Symptom:** Variable exists but still not working

**Fix:** Check spelling - must be exactly: `VITE_LINKEDIN_CLIENT_ID` (case-sensitive)

---

## 🚀 Quick Checklist

- [ ] Environment variable added to Vercel
- [ ] Variable enabled for Production environment
- [ ] Latest deployment shows "Ready" status
- [ ] Browser cache cleared (hard refresh)
- [ ] Console shows correct Client ID value
- [ ] Tried in incognito window

---

**After completing all steps, LinkedIn connection should work!** ✅
