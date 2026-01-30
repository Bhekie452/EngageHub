# Fix: "No YouTube channels found"

This is almost always a **Google/YouTube account setup issue**, not an app bug.

## Why it happens

1. **No YouTube channel yet** – You have a Google account but never created a channel.
2. **Wrong Google account** – You’re signed into a different account than the one with the channel.
3. **Brand Account channel** – The channel is a Brand Account; some flows only detect personal channels.
4. **Missing permissions** – The app wasn’t granted the right YouTube scopes when you connected.

---

## Step 1: Confirm you have a YouTube channel

Open this **while logged into the same Google account** you use to connect:

👉 **[https://www.youtube.com/channel_switcher](https://www.youtube.com/channel_switcher)**

- You should see **at least one channel**.
- If you see **“Create a channel”**, click it, create the channel, then try connecting again in the app.

---

## Step 2: Brand Account channels

If your channel is a **Brand Account**, the API may not list it.

1. Go to **[https://www.youtube.com/account](https://www.youtube.com/account)**.
2. Under **Your YouTube channel**, check if it says **“Brand Account”**.

**Options:**

- Make sure you’re **Owner or Manager** of that Brand account, **or**
- Create a **personal YouTube channel** (channel_switcher → Create a channel) and connect that in the app.

---

## Step 3: Re-authorize with full permissions

When connecting YouTube, you should see permissions like viewing and managing your YouTube data.

If it still fails:

1. Go to **[https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)**.
2. Find the app (e.g. EngageHub or your Google Cloud project name) and **Remove access**.
3. In the app, connect YouTube again and **accept all requested permissions**.

---

## Step 4: Quick checklist (covers most cases)

- [ ] Using the **correct Google account** (the one with the channel).
- [ ] **Channel exists** (check [channel_switcher](https://www.youtube.com/channel_switcher)).
- [ ] Not blocked by **Brand Account** (use a personal channel or correct Brand role).
- [ ] **Re-authorized** the app with full YouTube permissions.

---

## For developers

This app already uses:

- **Scopes:** `youtube.readonly`, `youtube.upload`, `userinfo.profile`, `userinfo.email`
- **API:** `GET https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true`

If that returns an empty `items` array, the user has **no channel visible to the API** (no channel, wrong account, or Brand Account not returned). The fix is on the Google/YouTube account side, not in the code.
