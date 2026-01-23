# 🚨 URGENT: Fix Vercel Environment Variables

## ❌ Issues Found:

1. **Wrong Client ID Value:**
   - Current: `776oifhjg061e0` (has '1' and '0')
   - Correct: `776oifhjg06le0` (has 'l' and 'o')

2. **Wrong Environment Scope:**
   - `LINKEDIN_CLIENT_ID` is only set for "Preview"
   - Needs to be "All Environments"

---

## ✅ Fix Steps (5 minutes):

### Step 1: Edit `VITE_LINKEDIN_CLIENT_ID`

1. Find `VITE_LINKEDIN_CLIENT_ID` in Vercel
2. Click **"⋯"** → **"Edit"**
3. Change value from `776oifhjg061e0` to `776oifhjg06le0`
   - Replace '1' with 'l' (letter L)
   - Replace last '0' with 'o' (letter O)
4. Make sure Environment is **"All Environments"**
5. Click **"Save"**

### Step 2: Edit `LINKEDIN_CLIENT_ID`

1. Find `LINKEDIN_CLIENT_ID` in Vercel
2. Click **"⋯"** → **"Edit"**
3. Change value from `776oifhjg061e0` to `776oifhjg06le0`
   - Replace '1' with 'l' (letter L)
   - Replace last '0' with 'o' (letter O)
4. **CRITICAL:** Change Environment from "Preview" to **"All Environments"**
5. Click **"Save"**

### Step 3: Verify `LINKEDIN_CLIENT_SECRET`

1. Check if `LINKEDIN_CLIENT_SECRET` exists
2. If missing, add it:
   - Name: `LINKEDIN_CLIENT_SECRET`
   - Value: Your secret from LinkedIn (click "Show" in LinkedIn Developer Portal)
   - Environment: **All Environments**
3. If it exists, make sure it's set to **All Environments**

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"⋯"** on latest deployment
3. Click **"Redeploy"**
4. Wait for "Ready" status

### Step 5: Test

1. Clear browser cache (Ctrl+Shift+R)
2. Try connecting LinkedIn
3. Should work now! ✅

---

## 📋 Final Checklist:

- [ ] `VITE_LINKEDIN_CLIENT_ID` = `776oifhjg06le0` (letter 'l' and 'o')
- [ ] `VITE_LINKEDIN_CLIENT_ID` = All Environments
- [ ] `LINKEDIN_CLIENT_ID` = `776oifhjg06le0` (letter 'l' and 'o')
- [ ] `LINKEDIN_CLIENT_ID` = All Environments (not just Preview!)
- [ ] `LINKEDIN_CLIENT_SECRET` = Your secret
- [ ] `LINKEDIN_CLIENT_SECRET` = All Environments
- [ ] Project redeployed
- [ ] Browser cache cleared

---

**The Client ID typo (`776oifhjg061e0` vs `776oifhjg06le0`) is why LinkedIn is rejecting the connection!**
