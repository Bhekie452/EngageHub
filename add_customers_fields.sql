-- Add missing fields to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'prospect', 'client'));

-- Update status to be clearer: active/inactive only
-- Note: lifecycle_stage now handles Lead, Prospect, Client
