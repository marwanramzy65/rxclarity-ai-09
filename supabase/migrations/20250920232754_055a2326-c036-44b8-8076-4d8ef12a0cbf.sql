-- Create kidney_claims table for tracking kidney diagnosis claims
CREATE TABLE public.kidney_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  current_stage INTEGER NOT NULL DEFAULT 1,
  stage_1_completed BOOLEAN DEFAULT FALSE,
  stage_1_file_url TEXT,
  stage_1_completed_at TIMESTAMP WITH TIME ZONE,
  stage_2_completed BOOLEAN DEFAULT FALSE,
  stage_2_file_url TEXT,
  stage_2_completed_at TIMESTAMP WITH TIME ZONE,
  stage_3_completed BOOLEAN DEFAULT FALSE,
  stage_3_file_url TEXT,
  stage_3_completed_at TIMESTAMP WITH TIME ZONE,
  stage_4_completed BOOLEAN DEFAULT FALSE,
  stage_4_file_url TEXT,
  stage_4_completed_at TIMESTAMP WITH TIME ZONE,
  final_diagnosis TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.kidney_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own kidney claims" 
ON public.kidney_claims 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kidney claims" 
ON public.kidney_claims 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kidney claims" 
ON public.kidney_claims 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kidney claims" 
ON public.kidney_claims 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_kidney_claims_updated_at
BEFORE UPDATE ON public.kidney_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();