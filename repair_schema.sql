-- 1. Ensure columns exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(5) DEFAULT '$';

-- 2. Drop the existing trigger to recreate it safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Redefine the function with robust handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, currency, currency_symbol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'USD',
    '$'
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
  -- Log the error (visible in Supabase logs) but don't stop the user creation if you want to be lenient
  -- RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  -- However, for data integrity, we usually WANT to fail if profile creation fails.
  RAISE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant necessary permissions (Just in case)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.workspaces TO postgres, anon, authenticated, service_role;
