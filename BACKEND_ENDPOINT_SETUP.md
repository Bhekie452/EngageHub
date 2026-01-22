# 🔧 Backend Endpoint Setup Guide

## ✅ What I've Created

I've created two backend endpoints for OAuth token exchange:

1. **`api/linkedin/token.ts`** - LinkedIn token exchange
2. **`api/facebook/token.ts`** - Facebook token exchange (bonus!)

Both endpoints are Vercel serverless functions that will automatically deploy when you push to Vercel.

---

## 📋 Next Steps

### Step 1: Install Dependencies (If Needed)

The `@vercel/node` package should be installed. If you get errors, run:

```bash
npm install --save-dev @vercel/node
```

### Step 2: Add Environment Variables to Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables:

#### For LinkedIn:
- **Name:** `VITE_LINKEDIN_CLIENT_ID`
- **Value:** `776oifhjg06le0`
- **Environment:** All (Production, Preview, Development)

- **Name:** `LINKEDIN_CLIENT_SECRET`
- **Value:** (Your LinkedIn Client Secret from Auth tab)
- **Environment:** All

#### For Facebook (if you need it):
- **Name:** `VITE_FACEBOOK_APP_ID`
- **Value:** `1621732999001688`
- **Environment:** All

- **Name:** `FACEBOOK_APP_SECRET`
- **Value:** (Your Facebook App Secret)
- **Environment:** All

### Step 3: Set API URL

Add to Vercel Environment Variables:

- **Name:** `VITE_API_URL`
- **Value:** `https://engage-hub-ten.vercel.app` (or your Vercel URL)
- **Environment:** All

### Step 4: Deploy

1. **Commit and push** your changes:
   ```bash
   git add .
   git commit -m "Add LinkedIn and Facebook OAuth token exchange endpoints"
   git push
   ```

2. **Vercel will automatically deploy** the new API endpoints

3. **Or manually redeploy:**
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment

---

## 🧪 Testing the Endpoints

### Test LinkedIn Endpoint:

```bash
curl -X POST https://engage-hub-ten.vercel.app/api/linkedin/token \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","redirectUri":"https://engage-hub-ten.vercel.app"}'
```

### Test Facebook Endpoint:

```bash
curl -X POST https://engage-hub-ten.vercel.app/api/facebook/token \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","redirectUri":"https://engage-hub-ten.vercel.app"}'
```

**Note:** These will return errors with test codes, but they'll confirm the endpoints are working.

---

## 📁 File Structure

```
engagehub---unified-business-command/
├── api/
│   ├── linkedin/
│   │   └── token.ts          ← LinkedIn token exchange
│   └── facebook/
│       └── token.ts          ← Facebook token exchange
├── vercel.json               ← Updated to handle API routes
└── ...
```

---

## 🔒 Security Features

✅ **Client secrets stay on server** - Never exposed to frontend
✅ **Input validation** - Checks for required parameters
✅ **Error handling** - Proper error messages
✅ **Method validation** - Only POST requests allowed
✅ **Environment variable validation** - Checks if secrets are configured

---

## 🎯 How It Works

1. **User clicks "Connect LinkedIn"** in your app
2. **Frontend redirects** to LinkedIn OAuth
3. **User authorizes** on LinkedIn
4. **LinkedIn redirects back** with authorization code
5. **Frontend sends code** to `/api/linkedin/token`
6. **Backend exchanges code** for access token (using Client Secret)
7. **Backend returns token** to frontend
8. **Frontend stores token** and connects LinkedIn account

---

## ✅ Verification Checklist

After deploying:

- [ ] Environment variables added to Vercel
- [ ] Code pushed to repository
- [ ] Vercel deployment successful
- [ ] Test endpoint (should return error with test code, but endpoint should respond)
- [ ] Try connecting LinkedIn in your app

---

## 🆘 Troubleshooting

### "Endpoint not found"

- Check that `api/` directory is in root of project
- Verify `vercel.json` has API route rewrite
- Redeploy on Vercel

### "Client Secret not configured"

- Verify `LINKEDIN_CLIENT_SECRET` is in Vercel environment variables
- Check spelling (case-sensitive)
- Redeploy after adding variables

### "Method not allowed"

- Make sure you're using POST request
- Check Content-Type header is `application/json`

---

## 📚 Related Documentation

- [LinkedIn Connection Guide](./LINKEDIN_CONNECTION_GUIDE.md)
- [LinkedIn Client Secret Guide](./LINKEDIN_CLIENT_SECRET_GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)

---

**Your backend endpoints are ready! Just add the environment variables to Vercel and deploy.** 🚀
