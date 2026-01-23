# 🔐 How to Log In to EngageHub

## ⚠️ Current Issue

You're seeing "Please log in first" when trying to connect LinkedIn. This means you need to authenticate with EngageHub first.

---

## ✅ How to Log In

### Option 1: If You See the Landing Page

1. **Click "Sign In"** button (usually in the top right)
2. **Enter your email and password**
3. **Click "Sign In"**

### Option 2: If You're Already on the App

If you're seeing the app interface but getting "Please log in first":

1. **Refresh the page** (`F5` or `Ctrl + R`)
2. You should be redirected to the **Landing Page** or **Login Page**
3. **Enter your credentials** and sign in

### Option 3: Register a New Account

If you don't have an account yet:

1. **Click "Get Started"** or **"Sign Up"** on the landing page
2. **Enter your email and password**
3. **Click "Register"**
4. **Check your email** for verification (if email verification is enabled)
5. **Sign in** with your new account

---

## 🔍 Check Your Auth Status

Open browser console (`F12`) and type:

```javascript
// Check if you have a Supabase session
localStorage.getItem('sb-<your-project-ref>-auth-token')
```

Or check in console:

```javascript
// This will show your current auth state
console.log('Auth check:', window.location.href);
```

---

## 🚀 Quick Steps

1. **Go to:** `http://localhost:3000`
2. **If you see the landing page:**
   - Click **"Sign In"**
   - Enter email and password
   - Click **"Sign In"**
3. **If you see the app but get "Please log in first":**
   - **Refresh the page** (`F5`)
   - You'll be redirected to login
   - Sign in again

---

## 📋 What Happens After Login

Once logged in:
- ✅ You'll see the full app interface
- ✅ You can connect social media accounts
- ✅ All features will be available

---

## ⚠️ Common Issues

### Issue 1: Session Expired
**Symptom:** Was logged in, now getting "Please log in first"

**Fix:** Refresh page and sign in again

---

### Issue 2: Not Redirected to Login
**Symptom:** See app interface but user is null

**Fix:** 
1. Clear browser cache
2. Refresh page
3. You should be redirected to login

---

### Issue 3: Forgot Password
**Symptom:** Can't remember password

**Fix:** 
1. Go to login page
2. Click "Forgot password" (if available)
3. Or register a new account

---

**After logging in, you'll be able to connect LinkedIn and other social media accounts!** ✅
