-- Relax constraints on campaigns table to match the new UI
-- We are dropping strict enum checks and re-adding them with expanded options

-- 1. Update TYPE column constraints
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_type_check 
CHECK (type IN (
  -- Original values
  'social', 'email', 'sms', 'whatsapp', 'paid_ads', 'multi_channel',
  -- New UI values
  'marketing', 'sales', 'retention', 'onboarding', 'newsletter', 'event', 'other'
));

-- 2. Update OBJECTIVE column constraints (Adding 'retention')
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_objective_check;

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_objective_check 
CHECK (objective IN (
  -- Original values
  'awareness', 'engagement', 'traffic', 'leads', 'conversions', 'sales', 'app_installs', 'video_views',
  -- New UI values
  'retention'
));

-- 3. While we are here, let's ensure 'status' matches too (Just in case)
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check
CHECK (status IN (
  'draft', 'scheduled', 'active', 'paused', 'completed', 'archived', 'canceled'
));
