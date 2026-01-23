# 🔍 How to Add Test Users in New Google Cloud Console

## 🎯 The Issue

When you go to `https://console.cloud.google.com/apis/credentials/consent`, it redirects to `https://console.cloud.google.com/auth/overview` (the OAuth overview page).

**This is normal!** Google has updated their console structure.

---

## ✅ Correct Way to Add Test Users

### Step 1: You're Already in the Right Place!

You're on: `https://console.cloud.google.com/auth/overview?project=engagehub-484307`

### Step 2: Use the Left Sidebar

In the left sidebar, you should see:

```
Google Auth Platform
├── Overview (you're here)
├── Branding
├── Audience  ← CLICK THIS!
├── Clients
├── Data access
├── Verification centre
└── Settings
```

### Step 3: Click "Audience"

1. Click **"Audience"** in the left sidebar
2. This will take you to the Audience/Consent screen page
3. Scroll down to find **"Test users"** section
4. Click **"+ ADD USERS"**
5. Add: `bhekitsabedze452@gmail.com`
6. Click **"Add"** then **"Save"**

---

## 🎯 Direct Link to Audience Page

Try this direct link:

**https://console.cloud.google.com/auth/audience?project=engagehub-484307**

This should take you directly to the Audience page where you can add test users.

---

## 📍 What You Should See

After clicking "Audience", you should see:

1. **App information** section (at the top)
2. **Scopes** section
3. **Test users** section (scroll down to find this)
   - Should show: "Add test users to allow them to access your app while it's in testing mode"
   - **"+ ADD USERS"** button

---

## 🔄 If "Audience" Doesn't Show Test Users

If you click "Audience" and still don't see test users, try:

1. **Check the URL**: Should be `console.cloud.google.com/auth/audience`
2. **Scroll down**: Test users section might be further down the page
3. **Look for tabs**: There might be tabs like "Branding", "Audience", "Scopes" - make sure "Audience" tab is selected

---

## 🎯 Alternative: Via Main Menu

1. Go to main Google Cloud Console: https://console.cloud.google.com/
2. Make sure project `engagehub-484307` is selected
3. In the main left sidebar (not the Google Auth Platform submenu):
   - Click **"APIs & Services"**
   - Look for **"OAuth consent screen"** or **"Google Auth Platform"**
   - Click it
   - Then click **"Audience"** in the submenu

---

## 📝 Quick Summary

**From where you are now:**
1. Look at left sidebar
2. Click **"Audience"** (under "Google Auth Platform")
3. Scroll to **"Test users"**
4. Click **"+ ADD USERS"**
5. Add `bhekitsabedze452@gmail.com`
6. Save

**Or use direct link:**
- https://console.cloud.google.com/auth/audience?project=engagehub-484307

---

**The redirect is normal - Google updated their console. Just click "Audience" in the sidebar!** 🎯
