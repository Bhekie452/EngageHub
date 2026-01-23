# 🔍 How to Find Test Users in Google Cloud Console

## 🎯 You're Currently On

**"OAuth overview"** page (shows metrics and token grant rates)

This is NOT where you add test users!

---

## ✅ Correct Path to Test Users

### Option 1: Via Left Sidebar (New Google Console)

1. You're currently on: **"OAuth overview"** (Overview is highlighted)
2. In the left sidebar, look for **"Audience"** (under "Google Auth Platform")
3. Click **"Audience"**
4. Scroll down to find **"Test users"** section
5. Click **"+ ADD USERS"**
6. Add: `bhekitsabedze452@gmail.com`
7. Click **"Add"** then **"Save"**

---

### Option 2: Direct Link

1. Go directly to: **https://console.cloud.google.com/apis/credentials/consent**
2. Make sure your project is selected (top dropdown)
3. Scroll down to **"Test users"** section
4. Click **"+ ADD USERS"**
5. Add: `bhekitsabedze452@gmail.com`
6. Click **"Add"** then **"Save"**

---

### Option 3: Via Main Navigation

1. In the main Google Cloud Console (not the OAuth overview):
   - Click the **hamburger menu** (☰) at the top left
   - Go to **"APIs & Services"** → **"OAuth consent screen"**
   - This should take you to the consent screen page (not overview)
   - Scroll down to **"Test users"** section

---

## 🔍 What to Look For

The **"Test users"** section should look like this:

```
Test users
───────────
Add test users to allow them to access your app while it's in testing mode.

+ ADD USERS

[Email addresses list - empty if no users added]
```

---

## 📍 If You Still Can't Find It

1. **Check the URL**: The consent screen URL should be:
   - `console.cloud.google.com/apis/credentials/consent`
   - NOT `console.cloud.google.com/auth/overview`

2. **Try the direct link**:
   - https://console.cloud.google.com/apis/credentials/consent?project=engagehub-484307
   - (Replace `engagehub-484307` with your actual project ID if different)

3. **Alternative navigation**:
   - Go to main Google Cloud Console: https://console.cloud.google.com/
   - Click **"APIs & Services"** in the left sidebar (main menu, not under Google Auth Platform)
   - Click **"OAuth consent screen"**
   - This should show the consent screen with Test users section

---

## 🎯 Quick Steps Summary

**Fastest way:**
1. Click this link: https://console.cloud.google.com/apis/credentials/consent
2. Select your project if prompted
3. Scroll to **"Test users"**
4. Click **"+ ADD USERS"**
5. Add `bhekitsabedze452@gmail.com`
6. Save

---

**The "OAuth overview" page you're on is for metrics, not configuration. You need the "OAuth consent screen" page to add test users!** 🎯
