-- Add branding fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563EB',
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#ffffff';

-- Update the handle_new_user function to include default branding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, currency, currency_symbol, theme_mode, primary_color, sidebar_color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'USD',
    '$',
    'light',
    '#2563EB',
    '#ffffff'
  );
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Workspace'),
    regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'company_name', 'my-workspace')), '[^a-z0-9]', '-', 'g') || '-' || substring(NEW.id::text from 1 for 4),
    NEW.id
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
