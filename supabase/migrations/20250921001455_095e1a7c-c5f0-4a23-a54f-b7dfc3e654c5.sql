-- Add insurance_id column to prescriptions table
ALTER TABLE public.prescriptions 
ADD COLUMN insurance_id text;