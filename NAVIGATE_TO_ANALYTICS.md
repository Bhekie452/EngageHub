# 🎯 How to Navigate to Analytics & Test Engagement Sync

## Step 1: Open Your App
- Go to your EngageHub application (your local/deployed instance)
- You'll see a **Sidebar on the left** with menu options

## Step 2: Click "Analytics" in the Sidebar
The sidebar has these main options:
- Dashboard
- Inbox
- AI Studio
- Social Media
- Content
- Campaigns
- CRM
- Customers
- Deals
- Tasks
- **👉 ANALYTICS ← Click here**
- Assets
- Automations
- Integrations
- Settings

---

## Step 3: You're Now in Analytics Dashboard
Once you click Analytics, you'll see several tabs at the top:

| Tab | Purpose |
|-----|---------|
| **Overview** | Summary metrics (posts, customers, reach, followers) |
| **Social performance** | Platform breakdown and engagement charts |
| **Campaign analytics** | Campaign performance metrics |
| **CRM metrics** | Sales & customer data |
| **Revenue reports** | Deal won revenue tracking |
| **👉 Engagement reports** | Post-level engagement & sync controls |

---

## Step 4: Click "Engagement reports" Tab
This is where you'll see:
- ✅ **Key Engagement Metrics** (Total Interactions, Avg Engagement Rate, Likes, Comments)
- 📊 **Engagement Trends** (Daily engagement chart)
- 🏆 **Top Performing Posts** (Your most engaged posts with stats)
- 📱 **Engagement by Platform** (Breakdown by Facebook, Instagram, YouTube, etc.)

---

## Step 5: Find the Post You Want to Sync

In the **"Top Performing Posts"** section, you'll see a list of your posts.

Look for posts that have:
- Comments or likes from social media
- Activity on Facebook, Instagram, YouTube, or TikTok
- Any post with real engagement you want to harvest into CRM contacts

**Each post shows:**
- 📝 Post content (first few lines)
- ❤️ Like count
- 💬 Comment count  
- 🔄 Share count
- 📊 Engagement rate (%)

---

## Step 6: 🚀 Trigger Engagement Sync

**Option A: From Engagement Reports (Recommended)**
1. In the "Engagement reports" tab
2. Look at the top metric cards that say:
   - "Total Interactions"
   - "Avg Engagement Rate"  
   - "Total Likes"
   - "Total Comments"
3. Below these metrics, there's a section showing posted list
4. **Look for a "•••" (three dots) or "Fetch Metrics" button** on each post
   - (If not visible, it may be in a sub-menu or you proceed to Option B)

**Option B: From "Social Performance" Tab**
1. Go to the "Social performance" tab  
2. You'll see all posts with platforms and engagement data
3. Each post should have an action button to fetch or refresh metrics

**Option C: Automatic Background Sync**
- If you have any posts on Facebook, Instagram, or YouTube
- The sync system will **automatically fetch engagement data** in the background
- You don't need to manually click a button - it happens automatically once the migration is applied!

---

## Step 7: Check Browser Console (Optional but Helpful)

Open your **Browser DevTools** to see what's happening:

### Windows/Linux:
- Press **F12** 
- Click the **"Console"** tab

### Mac:
- Press **Cmd + Option + I**
- Click the **"Console"** tab

You'll see logs like:
```
✅ Comments synced: 5
✅ Likes synced: 12
✅ Engagement actions saved
```

**No errors** should appear about "cannot insert non-DEFAULT value into column 'full_name'" ← This was the bug you just fixed!

---

## Step 8: Go to Contacts to See Harvested Engagers

After engagement data syncs:

1. Click **"CRM"** in the sidebar
2. Then click **"Contacts"** tab
3. Filter by:
   - **Lead Source**: "social_media"
   - **Status**: "new"
   - **Type**: "lead"

You'll see **new contacts auto-created** with names like:
- "John Doe (from Facebook)"
- "Jane Smith (from Instagram)"
- "YouTube User [channel name]"
- etc.

Each contact will have:
- ✅ Name (from social profile)
- ✅ Platform (facebook, instagram, youtube, tiktok)
- ✅ Engagement count (how many times they engaged)
- ✅ Engagement type (comments, likes, shares)
- ✅ Profile URL (link to their social profile)
- ✅ Lead source: "social_media"

---

## What Happens Behind the Scenes

```
Your Social Posts (Facebook, Instagram, YouTube, TikTok)
         ↓
   [Migration Applied] ← You just did this!
         ↓
Engagement Sync API (fetches comments, likes, shares)
         ↓
engagement_actions table (stores all engagement data) ← NOW WORKING
         ↓
Harvest Trigger (automatically triggered)
         ↓
Contacts table (new contacts created for each engager) ← You'll see them here!
         ↓
CRM Pipeline (ready for sales/marketing workflow)
```

---

## Troubleshooting

### "I don't see any posts in Engagement reports"
- ✅ Make sure you have posts published on Facebook, Instagram, or YouTube
- ✅ The sync happens automatically in the background
- ✅ It may take 30-60 seconds for data to appear
- ✅ Click the "Refresh" button in the Overview tab

### "I see engagement data but no new contacts"
- ✅ The automatic harvest should run - check CRM > Contacts
- ✅ New contacts appear with lead_source = "social_media"
- ✅ Filter Contacts by that field to find them

### "I still see the 'full_name' error"
- ✅ Make sure you ran the SQL migration on Supabase (you said you did!)
- ✅ Clear your browser cache (Ctrl+Shift+Delete)
- ✅ Restart your development server (if running locally)

### "No engagement data syncing at all"
- ✅ Check that your Facebook/Instagram/YouTube accounts are connected
- ✅ Go to Social Media > check connections are active
- ✅ Check browser console (F12) for any error messages
- ✅ Run: `node test-engagement-sync.cjs` in terminal to diagnose

---

## Summary

Your engagement sync is now **100% ready**! 🎉

1. ✅ Migration applied to Supabase
2. ✅ Code fixes deployed
3. 👉 **Now**: Navigate to Analytics > Engagement reports
4. 👉 **Watch**: Posts load with engagement data  
5. 👉 **Check**: Contacts auto-created in CRM > Contacts

The system is now fully operational for harvesting social media engagers into your CRM!
