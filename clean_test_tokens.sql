-- Clean up any test tokens from youtube_accounts table
DELETE FROM public.youtube_accounts 
WHERE workspace_id = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9' 
AND (access_token = 'test-token' OR access_token LIKE '%test%');

-- Show what's left
SELECT workspace_id, channel_id, created_at, 
       CASE 
         WHEN access_token LIKE 'ya29.%' THEN 'REAL_TOKEN'
         ELSE 'FAKE_TOKEN'
       END as token_type
FROM public.youtube_accounts 
WHERE workspace_id = 'c9a454c5-a5f3-42dd-9fbd-cedd4c1c49a9';
