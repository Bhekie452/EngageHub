# Facebook Integration Setup Guide

## 🔧 Quick Fix for Localhost Development

The Facebook integration requires HTTPS for the SDK login method. For localhost development, you need to configure your Facebook App.

## 📋 Setup Steps

### 1. Configure Facebook App for Localhost

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app (or create a new one)
3. Go to **Settings** → **Basic**
4. Add to **App Domains**: `localhost`
5. Scroll down to **Valid OAuth Redirect URIs** and add:
   - `http://localhost:3000`
   - `http://localhost:3000/`
6. Click **Save Changes**

### 2. Environment Variables

#### For Local Development:

Create a `.env.local` file in the project root:

```env
# Facebook App ID
VITE_FACEBOOK_APP_ID=1621732999001688

# Backend API URL (Required for OAuth token exchange)
# If you have a local backend server:
VITE_API_URL=http://localhost:8000

# Or if using a remote backend:
VITE_API_URL=https://your-backend-api.com
```

#### For Production (Vercel):

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

   - **Name:** `VITE_FACEBOOK_APP_ID`
   - **Value:** `1621732999001688` (or your App ID)
   - **Environment:** Production, Preview, Development

   - **Name:** `VITE_API_URL` ⭐ **Required**
   - **Value:** Your backend API URL
     - Vercel serverless: `https://engage-hub-ten.vercel.app`
     - Separate backend: `https://your-backend-api.com`
   - **Environment:** Production, Preview, Development

   - **Name:** `FACEBOOK_APP_SECRET` (for backend only, not exposed to frontend)
   - **Value:** Your Facebook App Secret
   - **Environment:** Production, Preview, Development

5. Click **Save** and **Redeploy** your application

**📖 See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete setup guide.**

### 3. For Production (Vercel/HTTPS)

**Important:** Your production domain must be configured in Facebook App settings.

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Add to **App Domains**: `engage-hub-ten.vercel.app` (or your production domain)
5. Add to **Valid OAuth Redirect URIs**:
   - `https://engage-hub-ten.vercel.app`
   - `https://engage-hub-ten.vercel.app/`
   - `https://engage-hub-ten.vercel.app/#`
6. **Important:** Make sure your app is in **Live Mode** or add yourself as a test user
7. Click **Save Changes**

**Note:** The app will automatically use redirect OAuth if SDK login fails, which is more reliable for production.

## ⚠️ Common Issues

### ❌ "Feature Unavailable - Facebook Login is currently unavailable for this app"

**This is the most common error!** It means your Facebook App needs additional configuration.

**Step-by-Step Fix:**

1. **Go to Facebook Developers Console:**
   - Visit: https://developers.facebook.com/apps/
   - Click on your app (ID: `1621732999001688`)

2. **Complete App Details:**
   - Go to **Settings** → **Basic**
   - Fill in ALL required fields:
     - **App Name** ✅
     - **App Contact Email** ✅
     - **Privacy Policy URL** ✅ (Required for production)
     - **Terms of Service URL** (if applicable)
     - **Category** ✅
     - **App Icon** ✅ (at least 1024x1024px)

3. **Add App Domains:**
   - In **Settings** → **Basic**
   - Scroll to **App Domains**
   - Add: `engage-hub-ten.vercel.app` (your production domain)
   - Add: `localhost` (for development)

4. **Configure OAuth Redirect URIs:**
   - Scroll down to **Valid OAuth Redirect URIs**
   - Add these URLs (one per line):
     ```
     https://engage-hub-ten.vercel.app
     https://engage-hub-ten.vercel.app/
     https://engage-hub-ten.vercel.app/#
     http://localhost:3000
     http://localhost:3000/
     ```

5. **Switch to Live Mode (or Add Test Users):**
   - Go to **Settings** → **Basic**
   - Scroll to the bottom
   - Toggle **App Mode** from **Development** to **Live**
   - **OR** if you want to keep it in Development mode:
     - Go to **Roles** → **Test Users**
     - Add yourself as a test user
     - Add your Facebook account email

6. **Add Required Permissions:**
   - Go to **App Review** → **Permissions and Features**
   - Request these permissions (if not already approved):
     - `pages_manage_posts`
     - `pages_read_engagement`
     - `public_profile`

7. **Save All Changes:**
   - Click **Save Changes** on each page
   - Wait 5-10 minutes for changes to propagate

8. **Test Again:**
   - Try connecting Facebook again
   - If still not working, check the **App Review** section for any pending reviews

**Quick Checklist:**
- ✅ App Name filled in
- ✅ Contact Email added
- ✅ Privacy Policy URL added (can be a placeholder for testing)
- ✅ App Domains configured
- ✅ OAuth Redirect URIs added
- ✅ App is in Live mode OR you're added as a test user
- ✅ All changes saved

**Note:** If your app is in Development mode, only test users can use it. For production, you need to switch to Live mode or submit for App Review.

---

### "The method FB.login can no longer be called from http pages"

**Solution:** This is expected on localhost. The app now uses a redirect-based OAuth flow for HTTP/localhost. Make sure you've configured your Facebook App as described above.

### "The domain of this URL isn't included in the app's domains"

**Solution:** Add `localhost` and your production domain to your Facebook App's **App Domains** in Facebook Developer settings.

### "Connection error: User cancelled login"

**Solution:** 
- Make sure your production domain is in your Valid OAuth Redirect URIs
- Check that your Facebook App is in **Live Mode** or add yourself as a test user
- Verify the App ID is correct in your environment variables
- The app will automatically fall back to redirect OAuth if SDK fails

**For Production:**
- Add `https://engage-hub-ten.vercel.app` (or your domain) to Valid OAuth Redirect URIs
- Make sure the App ID matches in your Vercel environment variables
- Check that your Facebook App has the required permissions: `pages_manage_posts`, `pages_read_engagement`, `public_profile`

## 🔐 Backend Setup for Token Exchange (Required for Production)

Facebook OAuth requires a **server-side token exchange** for security. You cannot exchange the code for a token in the frontend.

### Option 1: Backend API Endpoint (Recommended)

Create a backend endpoint that exchanges the code:

```javascript
// Example: /api/facebook/token
POST /api/facebook/token
Body: { code: string, redirectUri: string }

// Backend code (Node.js example):
const response = await fetch(
  `https://graph.facebook.com/v21.0/oauth/access_token?` +
  `client_id=${FB_APP_ID}&` +
  `client_secret=${FB_APP_SECRET}&` +
  `redirect_uri=${redirectUri}&` +
  `code=${code}`
);
const data = await response.json();
return { access_token: data.access_token };
```

Then set `VITE_API_URL` in your Vercel environment variables.

### Option 2: Supabase Edge Functions

Create a Supabase Edge Function to handle token exchange.

### Option 3: Vercel Serverless Function

Create a Vercel API route at `/api/facebook/token` to handle the exchange.

## 🚀 Alternative: Use ngrok for HTTPS on Localhost

If you want to use the SDK method on localhost:

1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3000`
3. Use the HTTPS URL provided by ngrok
4. Add that URL to Facebook App's Valid OAuth Redirect URIs

## 📚 Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Facebook App Settings](https://developers.facebook.com/apps/)
- [OAuth Redirect URI Guide](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
