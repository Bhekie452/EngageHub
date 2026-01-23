# 🔧 LinkedIn Auth Tab Configuration

## ⚠️ Important: Configure OAuth Redirect URIs

The "Verify company" modal you're seeing is about **LinkedIn Page verification** (optional for company pages). 

**The real issue is likely in the "Auth" tab** - you need to configure OAuth redirect URIs there.

---

## ✅ Step-by-Step: Configure Auth Tab

### Step 1: Go to Auth Tab

1. In LinkedIn Developers portal, click the **"Auth"** tab (next to "Settings")
2. You should see a section for **"Authorized redirect URLs for your app"**

### Step 2: Add Redirect URIs

Click **"Add redirect URL"** and add **ALL** of these:

```
http://localhost:3000
http://localhost:3000/
http://127.0.0.1:3000
http://127.0.0.1:3000/
https://engage-hub-ten.vercel.app
https://engage-hub-ten.vercel.app/
```

**Important:** LinkedIn requires **exact matches**, so include both with and without trailing slashes.

### Step 3: Save Changes

Click **"Update"** or **"Save"** to save the redirect URIs.

---

## 🔍 What to Check in Auth Tab

1. **Authorized redirect URLs:**
   - Should include your production URL: `https://engage-hub-ten.vercel.app`
   - Should include localhost for development: `http://localhost:3000`

2. **OAuth 2.0 settings:**
   - **Client ID:** Should show `776oifhjg06le0` ✅
   - **Client Secret:** Should be visible (you'll need this for backend)

3. **Scopes:**
   - Make sure these are available:
     - `openid` ✅
     - `profile` ✅
     - `email` ✅
     - `w_member_social` (if you have "Share on LinkedIn" product)

---

## ⚠️ Common Issues

### Issue 1: Redirect URI Not Added
**Symptom:** "redirect_uri does not match" error

**Fix:** Add the exact URL to "Authorized redirect URLs" in Auth tab

---

### Issue 2: App Not Approved for Production
**Symptom:** OAuth works in development but not production

**Fix:** 
- Make sure your app is in "Live" mode (not just "Development")
- Or add your domain to "Authorized domains"

---

### Issue 3: Missing Scopes
**Symptom:** Can authenticate but can't access certain features

**Fix:** 
- Check which scopes are available in Auth tab
- Request additional scopes if needed (may require app review)

---

## 🚀 After Configuring Auth Tab

1. **Save the redirect URIs**
2. **Wait 1-2 minutes** for changes to propagate
3. **Try connecting LinkedIn again** in your app
4. **Clear browser cache** if still not working

---

## 📋 Quick Checklist

- [ ] Opened "Auth" tab in LinkedIn Developers portal
- [ ] Added `https://engage-hub-ten.vercel.app` to redirect URIs
- [ ] Added `http://localhost:3000` to redirect URIs
- [ ] Clicked "Update" or "Save"
- [ ] Verified Client ID matches: `776oifhjg06le0`
- [ ] Checked that scopes are available
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Tried connecting again

---

**The "Verify company" modal is optional** - you can click "Cancel" or "I'm done" for now. The important part is configuring the **Auth tab** with the correct redirect URIs! 🔧
