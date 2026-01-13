-- Add currency preference columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(5) DEFAULT '$';

-- Update existing profiles to have default values (optional, as DEFAULT handles new rows)
UPDATE profiles SET currency = 'USD', currency_symbol = '$' WHERE currency IS NULL;
