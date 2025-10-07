-- Create lab tests table
CREATE TABLE public.lab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  result TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical scans table
CREATE TABLE public.medical_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  scan_date DATE NOT NULL,
  findings TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_scans ENABLE ROW LEVEL SECURITY;

-- RLS policies for lab_tests
CREATE POLICY "Users can view their patients lab tests"
ON public.lab_tests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create lab tests for their patients"
ON public.lab_tests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their patients lab tests"
ON public.lab_tests
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their patients lab tests"
ON public.lab_tests
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for medical_scans
CREATE POLICY "Users can view their patients scans"
ON public.medical_scans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create scans for their patients"
ON public.medical_scans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their patients scans"
ON public.medical_scans
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their patients scans"
ON public.medical_scans
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_lab_tests_updated_at
BEFORE UPDATE ON public.lab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_scans_updated_at
BEFORE UPDATE ON public.medical_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();