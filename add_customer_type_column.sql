-- Add customer_type column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'company'));

-- Update existing records: if company field is set, mark as 'company', otherwise 'individual'
UPDATE public.customers 
SET customer_type = CASE 
  WHEN company IS NOT NULL AND company != '' THEN 'company'
  ELSE 'individual'
END
WHERE customer_type IS NULL;
