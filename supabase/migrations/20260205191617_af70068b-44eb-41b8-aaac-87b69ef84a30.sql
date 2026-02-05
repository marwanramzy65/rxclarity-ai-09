-- Add missing columns to drug_interactions table
ALTER TABLE public.drug_interactions 
ADD COLUMN IF NOT EXISTS drug_pair text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interaction_type text DEFAULT 'pharmacodynamic',
ADD COLUMN IF NOT EXISTS recommendation text DEFAULT '';

-- Add missing columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text;