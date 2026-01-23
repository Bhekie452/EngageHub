# 🎥 YouTube Connection Guide

## 🎯 Overview

YouTube integration allows you to upload videos, manage your YouTube channel, and schedule content. YouTube uses Google OAuth 2.0 for authentication.

---

## ✅ Prerequisites

Before connecting YouTube, you need:

1. **Google Cloud Console Account**
   - Go to https://console.cloud.google.com
   - Sign in with your Google account
   - Create a new project or select an existing one

2. **YouTube Data API v3 Enabled**
   - Enable YouTube Data API v3 in your Google Cloud project
   - This is required for channel management and video uploads

3. **Backend Server** (Required)
   - YouTube OAuth requires server-side token exchange
   - Client secret must be kept secure (never in frontend)

---

## 🔧 Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit: **https://console.cloud.google.com**
2. Select your project (or create a new one)
3. Go to **"APIs & Services"** → **"Credentials"**

### 1.2 Enable YouTube Data API v3

1. Go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click **"Enable"**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External (for public apps) or Internal (for Google Workspace)
   - **App name**: Your app name (e.g., "EngageHub")
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Add:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/userinfo.profile`
     - `https://www.googleapis.com/auth/userinfo.email`
   - **Test users**: Add your email for testing (if app is in testing mode)

4. Create OAuth Client ID:
   - **Application type**: Web application
   - **Name**: EngageHub YouTube Integration
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://engage-hub-ten.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000
     http://localhost:3000/
     http://127.0.0.1:3000
     http://127.0.0.1:3000/
     https://engage-hub-ten.vercel.app
     https://engage-hub-ten.vercel.app/
     ```
   - **Note:** The code automatically normalizes `127.0.0.1` to `localhost`, but it's good to have both registered.

5. Click **"Create"**
6. Copy your **Client ID** and **Client Secret**

---

## 🔧 Step 2: Configure Environment Variables

### Frontend (Vercel/Environment)

Add to your environment variables:

```bash
VITE_YOUTUBE_CLIENT_ID=your_client_id_here
# OR use Google Client ID (works for both)
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_API_URL=https://your-backend-url.com
```

### Backend Setup

Your backend needs to handle token exchange. Create an endpoint:

**POST /api/youtube/token**

```javascript
// Example backend endpoint (Node.js/Express)
app.post('/api/youtube/token', async (req, res) => {
  const { code, redirectUri } = req.body;
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(400).json({ message: data.error_description || 'Token exchange failed' });
    }
    
    res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

**Backend Environment Variables:**
```bash
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
# OR use Google credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 🔧 Step 3: OAuth Consent Screen (For Production)

For production use, you need to publish your OAuth consent screen:

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Complete all required fields:
   - App information
   - App domain
   - Authorized domains
   - Developer contact information
3. Add required scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
4. Add test users (for testing mode)
5. **Submit for verification** (required for production)

### For Testing (Immediate Access)

While in testing mode:
- You can test with your own Google account
- Add test users in OAuth consent screen
- Test permissions work immediately for test users

---

## 🔗 Step 4: Connect YouTube in the App

1. Go to **Social Media** → **Connected accounts**
2. Click **"Connect"** on the YouTube card
3. You'll be redirected to Google OAuth
4. Select your Google account
5. Authorize the app
6. You'll be redirected back
7. The app will connect:
   - Your YouTube channel(s)
   - Channel information and statistics

---

## 🚨 Common Issues and Solutions

### Issue 1: "Client ID not configured"

**Solution:**
- Add `VITE_YOUTUBE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID` to your environment variables
- Restart your development server
- For production, add to Vercel environment variables

### Issue 2: "Backend setup required"

**Solution:**
- Create backend endpoint: `POST /api/youtube/token`
- Set `VITE_API_URL` environment variable
- Backend must have `YOUTUBE_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET` (never expose in frontend)

### Issue 3: "Invalid redirect URI"

**Solution:**
- Check that your redirect URI matches exactly in Google Cloud Console
- Include trailing slashes if needed
- For production, use HTTPS URLs
- Make sure both `localhost` and `127.0.0.1` are registered

### Issue 4: "YouTube Data API v3 not enabled"

**Solution:**
- Go to Google Cloud Console
- Enable YouTube Data API v3 in your project
- Wait a few minutes for the API to activate

### Issue 5: "Access blocked: This app's request is invalid"

**Solution:**
- Check OAuth consent screen is configured
- Verify scopes are added correctly
- Make sure your app is published or you're a test user
- Check that redirect URIs match exactly

### Issue 6: "No YouTube channels found"

**Solution:**
- Make sure your Google account has a YouTube channel
- Create a YouTube channel at https://www.youtube.com/create_channel
- Verify you're using the correct Google account

---

## 📋 Checklist

Before connecting YouTube:

- [ ] Google Cloud project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth 2.0 credentials created
- [ ] OAuth consent screen configured
- [ ] Redirect URIs configured
- [ ] Required scopes added
- [ ] Client ID obtained
- [ ] Client Secret obtained (for backend)
- [ ] Backend endpoint created (`/api/youtube/token`)
- [ ] `VITE_YOUTUBE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID` set in environment
- [ ] `VITE_API_URL` set in environment
- [ ] Backend has `YOUTUBE_CLIENT_SECRET` or `GOOGLE_CLIENT_SECRET`
- [ ] OAuth consent screen published (for production)

---

## 🎉 After Connection

Once connected, you can:

- ✅ Upload videos to YouTube
- ✅ Manage your YouTube channel
- ✅ View channel statistics
- ✅ Schedule YouTube content (coming soon)
- ✅ View video analytics (coming soon)

---

## 📚 Resources

- [Google Cloud Console](https://console.cloud.google.com)
- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [YouTube API Quotas](https://developers.google.com/youtube/v3/getting-started#quota)

---

## 🔒 Security Notes

1. **Never expose Client Secret** in frontend code
2. **Always use HTTPS** in production
3. **Store tokens securely** in your database
4. **Implement token refresh** (Google tokens expire)
5. **Validate redirect URIs** on backend
6. **Use refresh tokens** to maintain long-term access

---

## 🆘 Still Having Issues?

1. **Check Google Cloud Console:**
   - Verify OAuth credentials are correct
   - Check redirect URIs match exactly
   - Ensure YouTube Data API v3 is enabled

2. **Test Backend Endpoint:**
   - Use Postman/curl to test token exchange
   - Verify Client ID and Secret are correct

3. **Check Browser Console:**
   - Look for OAuth errors
   - Check network requests

4. **Verify Environment Variables:**
   - Ensure `VITE_YOUTUBE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID` is set
   - Ensure `VITE_API_URL` points to your backend

---

**Ready to connect? Go to Social Media → Connected accounts and click "Connect" on YouTube!** 🎥
