-- Drop the foreign key constraint that's causing issues
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_connected_by_fkey;

-- Also make the column nullable if it isn't already
ALTER TABLE social_accounts ALTER COLUMN connected_by DROP NOT NULL;
