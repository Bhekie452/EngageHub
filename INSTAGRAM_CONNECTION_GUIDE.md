# 📸 Instagram Connection Guide

## 🎯 Overview

Instagram Business accounts are connected through Facebook (Meta) since Instagram Business accounts must be linked to a Facebook Page. This guide will help you connect your Instagram account.

---

## ✅ Prerequisites

Before connecting Instagram, you need:

1. **Instagram Business or Creator Account**
   - Your Instagram account must be a Business or Creator account (not a personal account)
   - **You can only switch to Business or Creator in the Instagram mobile app** — not on instagram.com or any web browser. Open the Instagram app on your phone → Profile → ☰ Menu → **Settings and privacy** → **Account type and tools** → **Switch to professional account** → choose Business or Creator.

2. **Facebook Page**
   - You must have a Facebook Page
   - Your Instagram account must be linked to this Facebook Page
   - You must be an admin of both the Page and Instagram account

3. **Facebook App Configuration**
   - Your Facebook App must have Instagram permissions
   - See `FACEBOOK_FEATURE_UNAVAILABLE_FIX.md` for Facebook App setup

---

## 🔗 Step-by-Step Connection Process

### Step 1: Ensure Your Instagram Account is Set Up

1. **Convert to Business/Creator** (if not already) — **mobile app only** (not available on web):
   - Open the **Instagram app** on your phone (not instagram.com)
   - Profile → ☰ Menu → **Settings and privacy** → **Account type and tools** → **Switch to professional account**
   - Choose **Business** or **Creator**, pick a category, then follow the prompts

2. **Link Instagram to Facebook Page**:
   - In Instagram app: Settings → Account → Linked Accounts
   - Tap "Facebook"
   - Select your Facebook Page (or create one)
   - Confirm the link

### Step 2: Connect Facebook First (Required)

Instagram Business accounts require a Facebook Page connection. If you haven't connected Facebook yet:

1. Go to **Social Media** → **Connected accounts**
2. Click **"Connect"** on the Facebook Page card
3. Complete the Facebook OAuth flow
4. Wait for Facebook connection to complete

### Step 3: Connect Instagram

1. Go to **Social Media** → **Connected accounts**
2. Click **"Connect"** on the Instagram card
3. If you haven't connected Facebook, you'll be prompted to connect it first
4. Complete the OAuth flow (same as Facebook, but with Instagram permissions)
5. The app will automatically detect Instagram Business accounts linked to your Facebook Pages
6. Select which Instagram account(s) to connect

---

## 🔧 Facebook App Configuration for Instagram

Your Facebook App needs these permissions:

### Required Permissions:
- `pages_manage_posts` - For posting to Facebook Pages
- `pages_read_engagement` - For reading Page analytics
- `pages_show_list` - For listing user's Pages
- `instagram_basic` - **For Instagram access** ⭐
- `instagram_content_publish` - **For posting to Instagram** ⭐

### How to Add Instagram Permissions:

1. Go to **https://developers.facebook.com/apps/1621732999001688**
2. Go to **App Review** → **Permissions and Features**
3. Search for and request:
   - `instagram_basic`
   - `instagram_content_publish`
4. Fill in the required information:
   - **Use Case:** "Allow users to post content to their Instagram Business accounts"
   - **Instructions:** "Users can connect their Instagram Business accounts (linked to Facebook Pages) to manage and schedule posts"
5. Submit for review (or add as test permission for immediate testing)

### For Testing (Immediate Access):

1. Go to **Roles** → **Test Users**
2. Add yourself as a test user
3. Go to **App Review** → **Permissions and Features**
4. For `instagram_basic` and `instagram_content_publish`:
   - Click on the permission
   - Look for **"Add Test Users"** or **"Test Mode"**
   - Add your test user
   - These permissions will work for test users immediately

---

## 🚨 Common Issues and Solutions

### Issue 1: "No Instagram Business accounts found"

**Causes:**
- Instagram account is not a Business/Creator account
- Instagram account is not linked to a Facebook Page
- You're not an admin of the Facebook Page

**Solutions:**
1. Convert Instagram to Business account (see Step 1)
2. Link Instagram to Facebook Page (see Step 1)
3. Make sure you're an admin of the Facebook Page
4. Verify the link: Instagram App → Settings → Account → Linked Accounts → Facebook

### Issue 2: "Instagram permissions not available"

**Causes:**
- Facebook App doesn't have Instagram permissions
- Permissions not approved/tested

**Solutions:**
1. Add Instagram permissions to your Facebook App (see above)
2. Add yourself as a test user for immediate testing
3. Wait for App Review approval for production use

### Issue 3: "Feature Unavailable" Error

**Causes:**
- Facebook App configuration incomplete
- Pages product not added

**Solutions:**
1. Complete Facebook App setup (see `FACEBOOK_FEATURE_UNAVAILABLE_FIX.md`)
2. Add Pages product to your app
3. Wait 5-10 minutes after changes
4. Try again

### Issue 4: "You need to connect Facebook first"

**Solution:**
- Instagram requires Facebook connection
- Connect Facebook first, then Instagram
- The app will guide you through this

---

## 📋 Checklist

Before connecting Instagram, make sure:

- [ ] Instagram account is Business or Creator account
- [ ] Instagram account is linked to a Facebook Page
- [ ] You are admin of the Facebook Page
- [ ] Facebook App has `instagram_basic` permission
- [ ] Facebook App has `instagram_content_publish` permission
- [ ] Facebook is connected in the app (if not, connect it first)
- [ ] You've waited 5-10 minutes after adding permissions (if just added)

---

## 🎉 After Connection

Once connected, you can:

- ✅ Post to Instagram from the Content page
- ✅ Schedule Instagram posts
- ✅ View Instagram analytics (if available)
- ✅ Manage Instagram content alongside other platforms

---

## 📚 Resources

- [Instagram Business Account Setup](https://www.facebook.com/business/help/898752960195806)
- [Link Instagram to Facebook Page](https://www.facebook.com/business/help/898752960195806)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Facebook App Review Guide](https://developers.facebook.com/docs/app-review)

---

## 🆘 Still Having Issues?

1. **Check Instagram Account Type:**
   - Instagram App → Settings → Account
   - Should show "Professional Account" or "Business Account"

2. **Verify Facebook Page Link:**
   - Instagram App → Settings → Account → Linked Accounts
   - Should show your Facebook Page

3. **Check Facebook App Permissions:**
   - Go to App Review → Permissions and Features
   - Verify `instagram_basic` and `instagram_content_publish` are available

4. **Test with Test User:**
   - Add yourself as test user in Facebook App
   - Permissions work immediately for test users

---

**Ready to connect? Go to Social Media → Connected accounts and click "Connect" on Instagram!** 📸
