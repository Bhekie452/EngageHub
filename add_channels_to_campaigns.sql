-- Add channels column to campaigns table if it doesn't exist
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT '{}';

-- Add budget_currency column if it doesn't exist (just largely to be safe based on previous work)
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(3) DEFAULT 'USD';
