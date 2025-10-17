-- Add columns to track approved and denied medications in grievances
ALTER TABLE public.grievances 
ADD COLUMN approved_medications text[],
ADD COLUMN denied_medications text[];