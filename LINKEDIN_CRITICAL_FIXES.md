# 🚨 LinkedIn OAuth Critical Fixes Required

## Issue 1: Invalid Client ID

**Error:** "The passed in client_id is invalid '7760ifhjg06le0'"

**Root Cause:** The Client ID in your code has a **zero '0'** but LinkedIn shows **letter 'o'**!
- ❌ Wrong: `7760ifhjg06le0` (with zero)
- ✅ Correct: `776oifhjg06le0` (with letter 'o')

**Fix:**
1. Go to **https://www.linkedin.com/developers/apps**
2. Select your app "Engagehub"
3. Go to **"Auth"** tab
4. Check the **"Client ID"** shown at the top
5. **Verify it matches:** `776oifhjg06le0` (note: letter 'o', not zero '0')
6. If it's different, update your Vercel environment variables with the correct Client ID
7. If the app was deleted or recreated, you'll need to use the new Client ID

---

## Issue 2: LINKEDIN_CLIENT_ID Only in Preview Environment

**Problem:** `LINKEDIN_CLIENT_ID` is only set for Preview, but Production needs it too!

**Fix:**
1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Find `LINKEDIN_CLIENT_ID`
3. Click the **"⋯"** menu → **"Edit"**
4. Change **Environment** from `Preview` to **`All Environments`** (or select Production, Preview, AND Development)
5. Click **"Save"**
6. **Redeploy** your project

---

## Issue 3: Remove Duplicate Redirect URIs with Trailing Slashes

**Problem:** LinkedIn app has both:
- ✅ `https://engage-hub-ten.vercel.app` (correct)
- ❌ `https://engage-hub-ten.vercel.app/` (duplicate - remove this)

**Fix:**
1. Go to **https://www.linkedin.com/developers/apps**
2. Select your app "Engagehub"
3. Go to **"Auth"** tab
4. Under **"Authorized redirect URLs"**, **DELETE**:
   - `https://engage-hub-ten.vercel.app/` (the one with trailing slash)
   - `http://localhost:3000/` (optional, but recommended)
5. **KEEP ONLY:**
   - `https://engage-hub-ten.vercel.app` (no trailing slash)
   - `http://localhost:3000` (no trailing slash)
   - `http://127.0.0.1:3000` (if you use it)
6. Click **"Update"**

---

## ✅ Complete Fix Checklist

1. **Verify LinkedIn Client ID:**
   - [ ] Go to LinkedIn Developer Portal
   - [ ] Check Client ID matches `776oifhjg06le0` (letter 'o', not zero '0')
   - [ ] If different, update Vercel variables

2. **Fix Vercel Environment Variables:**
   - [ ] Edit `LINKEDIN_CLIENT_ID` → Set to **All Environments**
   - [ ] Verify `LINKEDIN_CLIENT_SECRET` is set for **All Environments**
   - [ ] Verify `VITE_LINKEDIN_CLIENT_ID` is set for **All Environments**

3. **Fix LinkedIn App Redirect URIs:**
   - [ ] Remove `https://engage-hub-ten.vercel.app/` (with trailing slash)
   - [ ] Keep only `https://engage-hub-ten.vercel.app` (no trailing slash)
   - [ ] Remove `http://localhost:3000/` (with trailing slash)
   - [ ] Keep only `http://localhost:3000` (no trailing slash)

4. **Redeploy:**
   - [ ] Go to Vercel → Deployments
   - [ ] Click **"⋯"** → **"Redeploy"**
   - [ ] Wait for deployment to complete

5. **Test:**
   - [ ] Clear browser cache (Ctrl+Shift+R)
   - [ ] Try connecting LinkedIn again

---

## 🔍 How to Verify Client ID

1. Go to: **https://www.linkedin.com/developers/apps**
2. Click on your app "Engagehub"
3. Go to **"Auth"** tab
4. Look at the top section - you'll see:
   - **Client ID:** `xxxxx`
   - **Client Secret:** `xxxxx` (click "Show" to reveal)
5. Copy the **exact** Client ID shown
6. Compare with what's in your Vercel environment variables
7. If they don't match, update Vercel with the correct Client ID

---

## ⚠️ If Client ID is Wrong

**IMPORTANT:** The correct Client ID is `776oifhjg06le0` (with letter 'o', NOT zero '0')!

If you need to update:

1. **Update Vercel Environment Variables:**
   - `VITE_LINKEDIN_CLIENT_ID` = (new Client ID from LinkedIn)
   - `LINKEDIN_CLIENT_ID` = (new Client ID from LinkedIn)

2. **Update LinkedIn App Settings:**
   - Make sure redirect URIs are correct
   - Remove trailing slashes

3. **Redeploy and test**

---

**After making these fixes, LinkedIn connection should work!** ✅
