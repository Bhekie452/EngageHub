# Post media bucket (for video/image upload like other platforms)

To let users **add a video or image in the Create Post UI** and have it publish to **all** platforms (including YouTube), the app uploads files to Supabase Storage and uses the public URL.

If you see **"Storage upload failed: new row violates row-level security policy"**, follow the steps below.

## One-time setup

### Step 1: Create the bucket

1. In **Supabase Dashboard** → **Storage**, click **New bucket**.
2. Name: `post-media`.
3. **Public bucket**: turn **ON** (so the app can use public URLs for Facebook, Instagram, YouTube, etc.).
4. Create the bucket.

### Step 2: Add Storage RLS policies

Supabase Storage uses RLS; without policies, uploads are rejected.

1. In **Supabase Dashboard** → **SQL Editor**, open a new query.
2. Paste and run the contents of **`supabase_storage_post_media_policies.sql`** (in this repo), or run the SQL from that file.
3. Click **Run**.

After this, when users add a video or image in Content, it uploads to `post-media` and the public URL is used for publishing to every selected platform, including YouTube.
