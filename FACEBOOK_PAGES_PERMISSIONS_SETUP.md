# 🔧 Facebook Pages Permissions Setup Guide

Your Facebook App is configured, but you need to add **Pages permissions** to manage Facebook Pages.

---

## 🎯 The Problem

Your app currently has:
- ✅ `public_profile` - Ready
- ✅ `email` - Ready
- ❌ `pages_manage_posts` - **Missing** (Required for posting)
- ❌ `pages_read_engagement` - **Missing** (Required for analytics)

These permissions are needed to:
- Post to Facebook Pages
- Read Page engagement metrics
- Manage Page content

---

## ✅ Solution: Add Facebook Pages Use Case

### Step 1: Add Pages Product to Your App

1. Go to https://developers.facebook.com/apps/
2. Click on your app (ID: `1621732999001688`)
3. In the left sidebar, look for **"Add Product"** or go to **Products** → **+ Add Product**
4. Find **"Facebook Login"** (if not already added)
5. Find **"Pages"** product and click **"Set Up"** or **"Get Started"**

### Step 2: Configure Facebook Login for Pages

1. Go to **Products** → **Facebook Login** → **Settings**
2. Under **Valid OAuth Redirect URIs**, make sure you have:
   ```
   https://engage-hub-ten.vercel.app
   https://engage-hub-ten.vercel.app/#
   ```
3. Under **Deauthorize Callback URL**, add:
   ```
   https://engage-hub-ten.vercel.app
   ```

### Step 3: Request Pages Permissions

1. Go to **App Review** → **Permissions and Features**
2. Search for these permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list` (optional but recommended)
3. For each permission:
   - Click **"Request"** or **"Add Permission"**
   - Fill in the required information:
     - **Use Case:** "Allow users to post content to their Facebook Pages"
     - **Instructions:** "Users can connect their Facebook Pages to manage and schedule posts"
   - Submit for review

### Step 4: For Development/Testing (Immediate Access)

If you need to test immediately without waiting for review:

1. Go to **Roles** → **Test Users**
2. Add yourself as a test user
3. Go to **App Review** → **Permissions and Features**
4. For `pages_manage_posts` and `pages_read_engagement`:
   - Click on the permission
   - Look for **"Add Test Users"** or **"Test Mode"**
   - Add your test user
   - These permissions will work for test users immediately

### Step 5: Update Your App to Request Pages Permissions

The code already requests these permissions, but make sure your OAuth flow includes:

**Required Scopes:**
- `pages_manage_posts` - Post to Pages
- `pages_read_engagement` - Read Page analytics
- `pages_show_list` - List user's Pages
- `public_profile` - Basic profile info

---

## 🔍 Verify Permissions Are Available

1. Go to **App Review** → **Permissions and Features**
2. Search for `pages_manage_posts`
3. Check the status:
   - ✅ **"Ready for Testing"** - Works for test users
   - ✅ **"Approved"** - Works for all users (after review)
   - ❌ **"Not Available"** - Need to add Pages product first

---

## 📋 Quick Checklist

- [ ] Pages product is added to your app
- [ ] Facebook Login is configured with correct redirect URIs
- [ ] `pages_manage_posts` permission is requested
- [ ] `pages_read_engagement` permission is requested
- [ ] Test users are added (for immediate testing)
- [ ] Permissions show as "Ready for Testing" or "Approved"

---

## 🚀 After Adding Pages Product

Once you've added the Pages product:

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear browser cache**
3. Try connecting Facebook again
4. The OAuth dialog should now show Pages permissions
5. Users can select which Pages to connect

---

## ⚠️ Important Notes

1. **Business Verification:** For production use, you may need to verify your business with Meta
2. **App Review:** Some permissions require App Review for public use
3. **Test Mode:** Permissions work immediately for test users
4. **Page Access:** Users must be admins/editors of the Pages they want to connect

---

## 🆘 Still Having Issues?

### Check These:

1. **Pages Product Added?**
   - Go to **Products** → Check if "Pages" is listed
   - If not, add it from **+ Add Product**

2. **Permissions Available?**
   - Go to **App Review** → **Permissions and Features**
   - Search for `pages_manage_posts`
   - Should show "Ready for Testing" or "Approved"

3. **Test User Added?**
   - Go to **Roles** → **Test Users**
   - Make sure your Facebook account is listed

4. **OAuth Scopes Correct?**
   - The code requests: `pages_manage_posts,pages_read_engagement,public_profile`
   - These should match what's available in your app

---

## 📚 Resources

- [Facebook Pages API Docs](https://developers.facebook.com/docs/pages)
- [Facebook Login Permissions](https://developers.facebook.com/docs/permissions/reference)
- [App Review Guide](https://developers.facebook.com/docs/app-review)

---

**After adding the Pages product and permissions, try connecting again!** 🚀
