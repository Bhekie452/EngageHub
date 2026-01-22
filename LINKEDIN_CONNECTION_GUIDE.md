# 💼 LinkedIn Connection Guide

## 🎯 Overview

LinkedIn integration allows you to post to your LinkedIn profile and Company Pages. LinkedIn has strict requirements and requires proper OAuth setup.

---

## ✅ Prerequisites

Before connecting LinkedIn, you need:

1. **LinkedIn Developer Account**
   - Go to https://www.linkedin.com/developers/apps
   - Sign in with your LinkedIn account
   - Create a new app

2. **LinkedIn App Created**
   - App must be approved by LinkedIn (can take 1-2 business days)
   - App must have the required permissions

3. **Backend Server** (Required)
   - LinkedIn OAuth requires server-side token exchange
   - Client secret must be kept secure (never in frontend)

---

## 🔧 Step 1: Create LinkedIn App

### 1.1 Go to LinkedIn Developer Portal

1. Visit: **https://www.linkedin.com/developers/apps**
2. Click **"Create app"**
3. Sign in if prompted

### 1.2 Fill in App Details

**Required Information:**
- **App name**: Your app name (e.g., "EngageHub")
- **LinkedIn Page**: Select or create a LinkedIn Page for your business
- **Privacy policy URL**: Required (e.g., `https://engage-hub-ten.vercel.app/privacy`)
- **App logo**: Upload a logo (300x300px recommended)
- **App use case**: Select "Sign in with LinkedIn using OpenID Connect"
- **Website URL**: Your website (e.g., `https://engage-hub-ten.vercel.app`)

### 1.3 Configure OAuth Settings

1. Go to **"Auth"** tab in your app settings
2. **Authorized redirect URLs** - Add these:
   ```
   https://engage-hub-ten.vercel.app
   https://engage-hub-ten.vercel.app/
   http://localhost:3000
   http://localhost:3000/
   http://127.0.0.1:3000
   http://127.0.0.1:3000/
   ```
   **Note:** The code automatically normalizes `127.0.0.1` to `localhost`, but it's good to have both registered.

3. **Requested scopes** - LinkedIn uses OpenID Connect scopes:
   
   **Basic scopes (work immediately - no approval):**
   - ✅ `openid` - OpenID Connect authentication
   - ✅ `profile` - Read basic profile (replaces old `r_liteprofile`)
   - ✅ `email` - Read email address (replaces old `r_emailaddress`)
   
   **Advanced scopes (require approval):**
   - ⚠️ `w_member_social` - Post on behalf of user (requires "Share on LinkedIn" product approval)
   - ❌ `r_organization_social` - Post as company (requires Marketing Developer Platform - partner-only)
   
   **⚠️ Important:** LinkedIn restricted marketing APIs in 2023-2025. Most developers can only use basic scopes. Full automation requires LinkedIn Partner Program approval.

4. **Save** your changes

### 1.4 Get Your Credentials

1. In the **"Auth"** tab, you'll see:
   - **Client ID** - Copy this (needed for frontend)
   - **Client Secret** - Copy this (needed for backend only - keep secret!)

2. **Important**: Never expose Client Secret in frontend code!

---

## 🔧 Step 2: Configure Environment Variables

### Frontend (Vercel/Environment)

Add to your environment variables:

```bash
VITE_LINKEDIN_CLIENT_ID=your_client_id_here
VITE_API_URL=https://your-backend-url.com
```

### Backend Setup

Your backend needs to handle token exchange. Create an endpoint:

**POST /api/linkedin/token**

```javascript
// Example backend endpoint (Node.js/Express)
app.post('/api/linkedin/token', async (req, res) => {
  const { code, redirectUri } = req.body;
  
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
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
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

**Backend Environment Variables:**
```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

---

## 🔧 Step 3: Request App Review (Required for Production)

LinkedIn requires app review for production use:

1. Go to **"Products"** tab in your LinkedIn app
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn** (for posting)
   - **Company Pages API** (for posting to Company Pages)

3. Fill in the review form:
   - **Use case description**: "Allow users to post content to their LinkedIn profiles and Company Pages"
   - **Instructions**: "Users can connect their LinkedIn accounts to schedule and publish posts"
   - **Screenshots**: Provide screenshots of your app

4. **Submit for review** (can take 1-2 business days)

### For Testing (Immediate Access)

While waiting for review:
- You can test with your own LinkedIn account
- Add yourself as a developer/admin of the app
- Test permissions work for your account immediately

---

## 🔗 Step 4: Connect LinkedIn in the App

1. Go to **Social Media** → **Connected accounts**
2. Click **"Connect"** on the LinkedIn card
3. You'll be redirected to LinkedIn
4. Authorize the app
5. You'll be redirected back
6. The app will connect:
   - Your LinkedIn profile
   - Any Company Pages you manage (if you have `r_organization_social` permission)

---

## 🚨 Common Issues and Solutions

### Issue 1: "Client ID not configured"

**Solution:**
- Add `VITE_LINKEDIN_CLIENT_ID` to your environment variables
- Restart your development server
- For production, add to Vercel environment variables

### Issue 2: "Backend setup required"

**Solution:**
- Create backend endpoint: `POST /api/linkedin/token`
- Set `VITE_API_URL` environment variable
- Backend must have `LINKEDIN_CLIENT_SECRET` (never expose in frontend)

### Issue 3: "Invalid redirect URI"

**Solution:**
- Check that your redirect URI matches exactly in LinkedIn app settings
- Include trailing slashes if needed
- For production, use HTTPS URLs

### Issue 4: "App not approved"

**Solution:**
- Submit app for review in LinkedIn Developer Portal
- Wait for approval (1-2 business days)
- For testing, use your own account as developer

### Issue 5: "Insufficient permissions"

**Solution:**
- Check that you requested all required scopes:
  - `w_member_social`
  - `r_organization_social`
  - `r_liteprofile`
  - `r_emailaddress`
- Re-authorize the app after adding permissions

---

## 📋 Checklist

Before connecting LinkedIn:

- [ ] LinkedIn app created
- [ ] OAuth redirect URIs configured
- [ ] Required scopes requested
- [ ] Client ID obtained
- [ ] Client Secret obtained (for backend)
- [ ] Backend endpoint created (`/api/linkedin/token`)
- [ ] `VITE_LINKEDIN_CLIENT_ID` set in environment
- [ ] `VITE_API_URL` set in environment
- [ ] Backend has `LINKEDIN_CLIENT_SECRET`
- [ ] App submitted for review (for production)

---

## 🎉 After Connection

Once connected, you can:

- ✅ Post to your LinkedIn profile
- ✅ Post to Company Pages you manage
- ✅ Schedule LinkedIn posts
- ✅ View LinkedIn analytics (if available)

---

## 📚 Resources

- [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
- [LinkedIn OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [LinkedIn Share API](https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)
- [LinkedIn Company Pages API](https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/organizations/organization-lookup-api)

---

## 🔒 Security Notes

1. **Never expose Client Secret** in frontend code
2. **Always use HTTPS** in production
3. **Store tokens securely** in your database
4. **Implement token refresh** (LinkedIn tokens expire)
5. **Validate redirect URIs** on backend

---

## 🆘 Still Having Issues?

1. **Check LinkedIn App Status:**
   - Go to LinkedIn Developer Portal
   - Check if app is approved
   - Verify redirect URIs match exactly

2. **Test Backend Endpoint:**
   - Use Postman/curl to test token exchange
   - Verify Client ID and Secret are correct

3. **Check Browser Console:**
   - Look for OAuth errors
   - Check network requests

4. **Verify Environment Variables:**
   - Ensure `VITE_LINKEDIN_CLIENT_ID` is set
   - Ensure `VITE_API_URL` points to your backend

---

**Ready to connect? Go to Social Media → Connected accounts and click "Connect" on LinkedIn!** 💼
