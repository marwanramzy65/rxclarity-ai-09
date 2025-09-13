-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  insurance_tier TEXT NOT NULL DEFAULT 'Standard',
  insurance_decision TEXT,
  insurance_message TEXT,
  processing_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drugs catalog table
CREATE TABLE public.drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  strength TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription_drugs junction table
CREATE TABLE public.prescription_drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drug_interactions table to store detected interactions
CREATE TABLE public.drug_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_pair TEXT[] NOT NULL,
  severity TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prescriptions
CREATE POLICY "Users can view their own prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prescriptions" 
ON public.prescriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescriptions" 
ON public.prescriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prescriptions" 
ON public.prescriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for drugs (public read access)
CREATE POLICY "Anyone can view drugs catalog" 
ON public.drugs 
FOR SELECT 
USING (true);

-- Create RLS policies for prescription_drugs
CREATE POLICY "Users can view prescription drugs for their prescriptions" 
ON public.prescription_drugs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM prescriptions 
    WHERE prescriptions.id = prescription_drugs.prescription_id 
    AND prescriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert prescription drugs for their prescriptions" 
ON public.prescription_drugs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prescriptions 
    WHERE prescriptions.id = prescription_drugs.prescription_id 
    AND prescriptions.user_id = auth.uid()
  )
);

-- Create RLS policies for drug_interactions
CREATE POLICY "Users can view interactions for their prescriptions" 
ON public.drug_interactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM prescriptions 
    WHERE prescriptions.id = drug_interactions.prescription_id 
    AND prescriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert interactions for their prescriptions" 
ON public.drug_interactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prescriptions 
    WHERE prescriptions.id = drug_interactions.prescription_id 
    AND prescriptions.user_id = auth.uid()
  )
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample drugs data
INSERT INTO public.drugs (name, strength, generic_name) VALUES
('Metformin', '500mg', 'Metformin HCl'),
('Lisinopril', '10mg', 'Lisinopril'),
('Atorvastatin', '20mg', 'Atorvastatin Calcium'),
('Amlodipine', '5mg', 'Amlodipine Besylate'),
('Levothyroxine', '50mcg', 'Levothyroxine Sodium'),
('Omeprazole', '20mg', 'Omeprazole'),
('Sertraline', '50mg', 'Sertraline HCl'),
('Losartan', '50mg', 'Losartan Potassium'),
('Gabapentin', '300mg', 'Gabapentin'),
('Tramadol', '50mg', 'Tramadol HCl'),
('Ibuprofen', '600mg', 'Ibuprofen'),
('Amoxicillin', '500mg', 'Amoxicillin'),
('Ciprofloxacin', '500mg', 'Ciprofloxacin HCl'),
('Warfarin', '5mg', 'Warfarin Sodium'),
('Clopidogrel', '75mg', 'Clopidogrel Bisulfate');

-- Create indexes for better performance
CREATE INDEX idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX idx_prescriptions_created_at ON public.prescriptions(created_at DESC);
CREATE INDEX idx_prescription_drugs_prescription_id ON public.prescription_drugs(prescription_id);
CREATE INDEX idx_drug_interactions_prescription_id ON public.drug_interactions(prescription_id);
CREATE INDEX idx_drugs_name ON public.drugs(name);