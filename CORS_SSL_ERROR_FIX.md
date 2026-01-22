# 🔧 CORS & SSL Error Fix

## ⚠️ Current Error: `ERR_SSL_PROTOCOL_ERROR`

This error suggests the API endpoint might not be deployed yet or there's a missing dependency.

---

## ✅ Step 1: Install Vercel Runtime

Vercel serverless functions require `@vercel/node` package.

**Add to package.json:**

```bash
npm install @vercel/node --save-dev
```

Or add manually to `package.json`:

```json
{
  "devDependencies": {
    "@vercel/node": "^3.0.0"
  }
}
```

---

## ✅ Step 2: Verify Deployment

1. **Go to Vercel Dashboard** → Deployments
2. **Check latest deployment** shows "Ready" status
3. **Check build logs** for any errors

---

## ✅ Step 3: Test Endpoint Directly

After deployment, test the endpoint:

```bash
curl -X POST https://engage-hub-ten.vercel.app/api/linkedin/token \
  -H "Content-Type: application/json" \
  -d '{"code":"test","redirectUri":"http://localhost:3000"}'
```

**Expected:** Should return an error about missing code, not SSL error.

---

## ✅ Step 4: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Check if `/api/linkedin/token` appears in the list
4. Check logs for any errors

---

## 🔍 Common Issues

### Issue 1: Missing @vercel/node
**Symptom:** Functions don't deploy or fail

**Fix:** Install `@vercel/node` package

---

### Issue 2: Endpoint Not Deployed
**Symptom:** SSL protocol error

**Fix:** Wait for deployment to complete, then test

---

### Issue 3: Wrong API Path
**Symptom:** 404 errors

**Fix:** Verify the file is at `api/linkedin/token.ts` (not `.js`)

---

## 🚀 Quick Fix Steps

1. **Install dependency:**
   ```bash
   npm install @vercel/node --save-dev
   ```

2. **Commit and push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Add @vercel/node for serverless functions"
   git push
   ```

3. **Wait for Vercel deployment** (1-2 minutes)

4. **Test endpoint** (see Step 3 above)

5. **Try LinkedIn connection again**

---

**After installing @vercel/node and redeploying, the SSL error should be resolved!** ✅
