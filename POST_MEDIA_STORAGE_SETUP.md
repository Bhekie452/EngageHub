# Post media bucket (for video/image upload like other platforms)

To let users **add a video or image in the Create Post UI** and have it publish to **all** platforms (including YouTube), the app uploads files to Supabase Storage and uses the public URL.

## One-time setup

1. In **Supabase Dashboard** → **Storage**, click **New bucket**.
2. Name: `post-media`.
3. **Public bucket**: turn **ON** (so the app can use public URLs for Facebook, Instagram, YouTube, etc.).
4. Create the bucket.

No RLS policy is required if the bucket is public and you’re fine with anyone with the link viewing files. To restrict uploads to logged-in users only, add a policy that allows `INSERT` for `auth.role() = 'authenticated'` (and optionally `SELECT` for public read).

After this, when users add a video or image in Content, it’s uploaded to `post-media` and the public URL is used for publishing to every selected platform, including YouTube.
