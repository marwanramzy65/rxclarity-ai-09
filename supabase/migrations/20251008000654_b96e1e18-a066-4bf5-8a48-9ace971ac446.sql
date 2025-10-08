-- Create patients table to store patient details
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  age integer,
  address text,
  phone text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, patient_id)
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own patients"
  ON public.patients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
  ON public.patients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();