# 🧪 Facebook SDK Testing Guide

## ✅ What Was Installed

1. **TypeScript Types:** `@types/facebook-js-sdk`
   - Provides type definitions for Facebook SDK
   - Improves IDE autocomplete and type checking

2. **Improved SDK Implementation:**
   - Better error handling
   - Enhanced logging for debugging
   - TypeScript type safety

---

## 🚀 How to Test Facebook SDK

### Option 1: Test on Production (HTTPS)

The SDK works automatically on HTTPS (production):

1. **Deploy to Vercel:**
   ```bash
   git push
   ```

2. **Visit your production URL:**
   ```
   https://engage-hub-ten.vercel.app
   ```

3. **Open browser console** (F12)
4. **Go to Social Media page**
5. **Click "Connect Facebook"**
6. **Check console logs:**
   - Should see: `✅ Facebook SDK Initialized successfully`
   - Should see: `📱 App ID: 1621732999001688`

---

### Option 2: Test on Localhost (HTTP)

By default, the SDK is **skipped on localhost** (HTTP) because Facebook requires HTTPS. However, you can enable it for testing:

1. **Add to `.env.local`:**
   ```env
   VITE_FACEBOOK_SDK_LOCALHOST=true
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Note:** Even with this enabled, Facebook may still require HTTPS for login. The SDK will load, but login might redirect to OAuth.

---

## 🔍 Testing Checklist

### SDK Initialization:
- [ ] SDK loads successfully (check console for `✅ Facebook SDK Initialized`)
- [ ] App ID is correct (`1621732999001688`)
- [ ] No errors in console

### Login Flow:
- [ ] Click "Connect Facebook" button
- [ ] Facebook login dialog appears (or redirects to OAuth)
- [ ] User can authorize the app
- [ ] Access token is received
- [ ] Connection is saved to database

### Error Handling:
- [ ] SDK fallback works if SDK fails to load
- [ ] Redirect OAuth works as fallback
- [ ] Error messages are clear and helpful

---

## 🐛 Debugging

### Check SDK Status:

Open browser console and run:

```javascript
// Check if SDK is loaded
console.log('FB SDK:', window.FB);

// Check SDK initialization
if (window.FB) {
    window.FB.getLoginStatus(function(response) {
        console.log('Login Status:', response);
    });
}
```

### Common Issues:

#### Issue 1: "SDK not loading"
**Check:**
- Is the page on HTTPS? (required for SDK)
- Is the script tag loading? (check Network tab)
- Are there any CORS errors?

**Solution:**
- Use production URL (HTTPS)
- Or enable localhost testing with `VITE_FACEBOOK_SDK_LOCALHOST=true`

---

#### Issue 2: "SDK loads but login fails"
**Check:**
- Is App ID correct?
- Are redirect URIs configured in Facebook App?
- Is the app in Development mode? (needs test users)

**Solution:**
- Verify App ID: `1621732999001688`
- Check Facebook App settings
- Add test users if in Development mode

---

#### Issue 3: "SDK timeout"
**Check:**
- Is internet connection working?
- Is Facebook CDN accessible?
- Are there firewall/blocking issues?

**Solution:**
- Check network connectivity
- Try in different browser
- SDK will fallback to redirect OAuth automatically

---

## 📊 Expected Console Output

### Successful SDK Initialization:
```
🔍 Facebook OAuth Debug Info:
App ID: 1621732999001688
Redirect URI: https://engage-hub-ten.vercel.app
Full URL: https://engage-hub-ten.vercel.app/
Origin: https://engage-hub-ten.vercel.app
Pathname: /
Hash: 

✅ Facebook SDK Initialized successfully
📱 App ID: 1621732999001688
```

### SDK Fallback (if SDK fails):
```
⚠️ Facebook SDK loading timeout - will use redirect OAuth fallback
⚠️ Falling back to redirect OAuth method
```

---

## 🧪 Test Scenarios

### Scenario 1: Production HTTPS
1. Visit: `https://engage-hub-ten.vercel.app`
2. Go to Social Media
3. Click "Connect Facebook"
4. **Expected:** SDK initializes, login dialog appears

---

### Scenario 2: Localhost HTTP (Default)
1. Visit: `http://localhost:3000`
2. Go to Social Media
3. Click "Connect Facebook"
4. **Expected:** SDK skipped, redirects to OAuth

---

### Scenario 3: Localhost HTTP (SDK Enabled)
1. Add `VITE_FACEBOOK_SDK_LOCALHOST=true` to `.env.local`
2. Restart dev server
3. Visit: `http://localhost:3000`
4. Go to Social Media
5. Click "Connect Facebook"
6. **Expected:** SDK loads, but login may still redirect to OAuth

---

## 🔧 Configuration

### Environment Variables:

```env
# Required
VITE_FACEBOOK_APP_ID=1621732999001688

# Optional (for localhost SDK testing)
VITE_FACEBOOK_SDK_LOCALHOST=true

# Backend (Vercel only)
FACEBOOK_APP_SECRET=your_secret_here
VITE_API_URL=https://engage-hub-ten.vercel.app
```

---

## 📚 Resources

- [Facebook SDK Documentation](https://developers.facebook.com/docs/javascript)
- [Facebook Login Guide](https://developers.facebook.com/docs/facebook-login/web)
- [App Dashboard](https://developers.facebook.com/apps/1621732999001688)

---

## ✅ Quick Test Commands

```bash
# Check if types are installed
npm list @types/facebook-js-sdk

# Run dev server
npm run dev

# Check console for SDK logs
# Open browser console (F12) and look for:
# - "Facebook SDK Initialized"
# - "App ID: 1621732999001688"
```

---

**After installation, the Facebook SDK is ready for testing!** 🚀

**For best results, test on production (HTTPS) URL.** ✅
