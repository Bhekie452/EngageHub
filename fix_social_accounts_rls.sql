-- Fix RLS on social_accounts to allow read access
-- Option 1: Disable RLS completely (for testing/development)
ALTER TABLE public.social_accounts DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, add these policies:
-- Allow anyone to read social_accounts
-- CREATE POLICY "Allow public read access to social_accounts" 
-- ON public.social_accounts FOR SELECT 
-- USING (true);

-- Allow authenticated users to insert/update/delete their own
-- CREATE POLICY "Allow authenticated users to manage social_accounts" 
-- ON public.social_accounts FOR ALL 
-- USING (auth.uid() = connected_by);
