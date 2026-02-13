# 📸 Instagram Connection Verification Checklist

## ✅ Files Created/Updated

### 1. Frontend Component
- ✅ `src/components/InstagramConnection.tsx` - Complete rewrite
- ✅ Uses `getConnectedInstagramAccounts()` from Facebook lib
- ✅ Shows available vs connected accounts
- ✅ Proper error handling and loading states

### 2. Backend API
- ✅ `api/social-accounts/connect.ts` - New endpoint
- ✅ Handles POST requests for social account connections
- ✅ Validates required fields
- ✅ Saves to `social_accounts` table

### 3. Integration Points
- ✅ Facebook lib functions already exist:
  - `getConnectedInstagramAccounts()` (line 1132)
  - `getInstagramAccount()` (line 1112)
- ✅ Instagram uses Facebook page tokens (no separate OAuth needed)

---

## 🔍 How to Verify Instagram Connection

### Step 1: Check Facebook Connection First
1. Go to your deployed app
2. Navigate to Social Media → Facebook
3. Ensure you have at least one Facebook page connected
4. Make sure the Facebook page has an Instagram Business Account linked

### Step 2: Test Instagram Tab
1. Navigate to Social Media → Instagram tab
2. You should see:
   - Loading state initially
   - Either available Instagram accounts OR error message
   - Connected accounts section (if any)

### Step 3: Connect Instagram Account
1. Click "Connect" on any available Instagram account
2. Should see:
   - Loading state with spinner
   - Success message: "✅ Successfully connected @username!"
   - Account moves to "Connected Accounts" section

### Step 4: Verify Database
1. Check your Supabase database
2. Query the `social_accounts` table:
   ```sql
   SELECT * FROM social_accounts 
   WHERE platform = 'instagram' 
   AND connection_status = 'connected';
   ```
3. Should see the Instagram account with:
   - `platform: 'instagram'`
   - `account_type: 'business'`
   - `platform_data.connectedFacebookPageId`
   - `platform_data.connectedFacebookPageName`

---

## 🚨 Troubleshooting

### Issue: "No Instagram Business accounts found"
**Cause:** Facebook pages don't have Instagram Business accounts linked
**Solution:**
1. Convert Instagram to Business account
2. Link Instagram to Facebook Page in Facebook settings
3. Reconnect Facebook account in the app

### Issue: "Failed to connect Instagram"
**Cause:** Backend API error or missing fields
**Solution:**
1. Check browser console for errors
2. Verify `/api/social-accounts/connect` endpoint exists
3. Check Supabase connection and table structure

### Issue: "Missing required fields"
**Cause:** Frontend not sending proper payload
**Solution:**
1. Check browser network tab for request payload
2. Verify `workspaceId` is in localStorage
3. Ensure Instagram account data is properly formatted

---

## 📱 Expected Flow

```
User connects Facebook → Gets Facebook pages → Finds Instagram Business Accounts → Shows in Instagram tab → User clicks Connect → Saves to database → Shows as connected
```

## 🔧 Technical Verification

### Frontend Check
```javascript
// In browser console:
localStorage.getItem('current_workspace_id') // Should return workspace ID
```

### Backend Check
```javascript
// Test API endpoint:
fetch('/api/social-accounts/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workspaceId: 'your-workspace-id',
    platform: 'instagram',
    accountId: 'test-id',
    accessToken: 'test-token'
  })
})
```

### Database Check
```sql
-- Should return connected Instagram accounts:
SELECT platform, display_name, connection_status, platform_data 
FROM social_accounts 
WHERE platform = 'instagram' AND workspace_id = 'your-workspace-id';
```

---

## ✅ Success Indicators

- ✅ Instagram tab shows available accounts from Facebook pages
- ✅ Connect button works without errors
- ✅ Success message appears after connecting
- ✅ Account moves to "Connected Accounts" section
- ✅ Database shows Instagram connection with proper platform_data
- ✅ Disconnect button works correctly
- ✅ Error messages are helpful and actionable

---

## 🎯 Next Steps

Once verified, Instagram will be fully functional for:
- ✅ Connecting Instagram Business Accounts
- ✅ Publishing to Instagram (via Facebook Graph API)
- ✅ Managing Instagram connections
- ✅ Displaying Instagram account information

**Instagram connection is now ready for testing!** 📸✨
