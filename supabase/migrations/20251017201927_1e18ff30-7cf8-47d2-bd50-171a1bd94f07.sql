-- Add AI review fields to grievances table
ALTER TABLE public.grievances 
ADD COLUMN ai_decision text,
ADD COLUMN ai_reasoning text,
ADD COLUMN ai_reviewed_at timestamp with time zone;