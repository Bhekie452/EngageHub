-- Check if youtube_accounts table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'youtube_accounts';

-- Check table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'youtube_accounts'
ORDER BY ordinal_position;

-- Check RLS policies on youtube_accounts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'youtube_accounts';

-- Check if service role can bypass RLS
SELECT rolname, rolbypassrls 
FROM pg_roles 
WHERE rolname = 'service_role';
