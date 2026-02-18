# Facebook Connection - Vercel Setup

## What Was Pushed to GitHub

1. **vercel.json** - Configures API routing so `/api/*` routes are handled by serverless functions
2. **API handlers** - Facebook OAuth endpoints in `api/auth/[...provider].ts`

## Required: Set Vercel Environment Variables

You need to add these environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard → Select "engage-hub-ten" → Settings → Environment Variables

2. Add for **Production** environment:

| Name | Value |
|------|-------|
| `FACEBOOK_APP_ID` | `2106228116796555` |
| `FACEBOOK_APP_SECRET` | `6d267de9ffa8e5eba4b84a06d790257e` |
| `VITE_FACEBOOK_APP_ID` | `2106228116796555` |

3. **Important:** After adding variables, go to Deployments and **Redeploy** the latest deployment (or push a small change to trigger redeploy)

## Expected Behavior After Setup

Once deployed with environment variables:

1. User visits https://engage-hub-ten.vercel.app
2. Goes to Social Media tab
3. Clicks "Connect Facebook"
4. Redirected to Facebook OAuth
5. After login, redirected back to app with Facebook connected

## Test Script

Run this to check status:
```bash
node check-vercel-facebook.cjs
```

## Troubleshooting

If still not working after setting env vars:
- Check Vercel deployment logs for errors
- Verify the `vercel.json` was deployed
- Make sure to trigger a redeploy after adding environment variables
