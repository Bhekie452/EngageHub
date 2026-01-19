# 🔧 Quick Fix: "Feature Unavailable" Error

If you're seeing this error:
> **"Facebook Login is currently unavailable for this app, since we are updating additional details for this app."**

Follow these steps **in order**:

---

## ✅ Step 1: Go to Facebook Developers

1. Open: https://developers.facebook.com/apps/
2. Log in with your Facebook account
3. Find and click on your app (App ID: `1621732999001688`)

---

## ✅ Step 2: Complete App Basic Settings

1. Click **Settings** → **Basic** (left sidebar)
2. Fill in these **required** fields:

   - **App Name:** `EngageHub` (or your app name)
   - **App Contact Email:** Your email address
   - **Privacy Policy URL:** 
     - For testing: `https://engage-hub-ten.vercel.app/privacy`
     - Or create a simple privacy policy page
   - **Category:** Select "Business" or "Productivity"
   - **App Icon:** Upload an icon (at least 1024x1024px)

3. Scroll down to **App Domains** section
4. Add your domain: `engage-hub-ten.vercel.app`
5. Also add: `localhost` (for development)

---

## ✅ Step 3: Add OAuth Redirect URIs

Still in **Settings** → **Basic**:

1. Scroll to **Valid OAuth Redirect URIs**
2. Click **Add URI**
3. Add these URLs (one at a time):
   ```
   https://engage-hub-ten.vercel.app
   https://engage-hub-ten.vercel.app/
   https://engage-hub-ten.vercel.app/#
   http://localhost:3000
   http://localhost:3000/
   ```

---

## ✅ Step 4: Switch to Live Mode OR Add Test Users

### Option A: Switch to Live Mode (Recommended for Production)

1. Still in **Settings** → **Basic**
2. Scroll to the very bottom
3. Find **App Mode** toggle
4. Switch from **Development** to **Live**
5. You may need to accept terms and conditions

### Option B: Add Yourself as Test User (For Development)

1. Go to **Roles** → **Test Users** (left sidebar)
2. Click **Add Test Users**
3. Enter your Facebook account email
4. Click **Add**

---

## ✅ Step 5: Save and Wait

1. Click **Save Changes** button (top right)
2. **Wait 5-10 minutes** for Facebook to process the changes
3. Refresh your app and try connecting again

---

## ✅ Step 6: Verify Permissions

1. Go to **App Review** → **Permissions and Features**
2. Make sure these permissions are available:
   - ✅ `pages_manage_posts`
   - ✅ `pages_read_engagement`
   - ✅ `public_profile`

If any are missing, you may need to request them (for production apps).

---

## 🎯 Quick Checklist

Before trying to connect again, verify:

- [ ] App Name is filled in
- [ ] Contact Email is added
- [ ] Privacy Policy URL is added (even if placeholder)
- [ ] App Domains includes `engage-hub-ten.vercel.app` and `localhost`
- [ ] Valid OAuth Redirect URIs includes all 5 URLs above
- [ ] App is in **Live Mode** OR you're added as a test user
- [ ] All changes are saved
- [ ] You've waited 5-10 minutes after saving

---

## 🆘 Still Not Working?

### Check App Status:
1. Go to **Settings** → **Basic**
2. Look for any red warning messages
3. Check if there are pending reviews in **App Review**

### Common Issues:
- **"App is in Development Mode"** → Switch to Live or add test users
- **"Missing Privacy Policy"** → Add a privacy policy URL (can be placeholder)
- **"Invalid Redirect URI"** → Double-check the URIs match exactly
- **"App needs review"** → For production, you may need to submit for review

### Need Help?
- Facebook Developer Docs: https://developers.facebook.com/docs/facebook-login/web
- Facebook Support: https://developers.facebook.com/support/

---

## 📝 Notes

- **Development Mode:** Only test users can use the app
- **Live Mode:** Anyone can use the app (may require App Review for some permissions)
- **Changes take time:** Facebook can take 5-10 minutes to process configuration changes
- **Privacy Policy:** For production, you need a real privacy policy URL

---

**After completing these steps, try connecting to Facebook again!** 🚀
