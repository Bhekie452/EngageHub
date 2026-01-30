-- Fix: "new row violates row-level security policy" when uploading to post-media
-- Run this in Supabase Dashboard → SQL Editor after creating the bucket "post-media" (Storage → New bucket, name: post-media, Public: ON).

-- 1. Allow authenticated users to upload (INSERT) to post-media
CREATE POLICY "Allow authenticated uploads to post-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-media');

-- 2. Allow public read so Facebook/Instagram/YouTube can fetch the URL
CREATE POLICY "Public read for post-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- 3. Allow authenticated users to update/delete their uploads (optional)
CREATE POLICY "Allow authenticated update/delete post-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post-media')
WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Allow authenticated delete post-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post-media');
