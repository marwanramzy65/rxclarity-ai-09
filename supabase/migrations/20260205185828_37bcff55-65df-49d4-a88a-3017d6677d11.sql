-- Create drugs table
CREATE TABLE public.drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  strength TEXT NOT NULL,
  generic_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription_codes table
CREATE TABLE public.prescription_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  prescription_code TEXT,
  insurance_id TEXT,
  insurance_tier TEXT DEFAULT 'Standard',
  insurance_decision TEXT,
  insurance_message TEXT,
  processing_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription_drugs junction table
CREATE TABLE public.prescription_drugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES public.drugs(id),
  quantity INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drug_interactions table
CREATE TABLE public.drug_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  drug1_name TEXT NOT NULL,
  drug2_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grievances table
CREATE TABLE public.grievances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  explanation TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_decision TEXT,
  ai_reasoning TEXT,
  ai_reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_medications TEXT[],
  denied_medications TEXT[],
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab_tests table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical_scans table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kidney_claims table (diagnosis claims)
CREATE TABLE public.kidney_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  current_stage INTEGER NOT NULL DEFAULT 1,
  stage_1_completed BOOLEAN DEFAULT false,
  stage_1_document_url TEXT,
  stage_2_completed BOOLEAN DEFAULT false,
  stage_2_document_url TEXT,
  stage_3_completed BOOLEAN DEFAULT false,
  stage_3_document_url TEXT,
  stage_4_completed BOOLEAN DEFAULT false,
  stage_4_document_url TEXT,
  final_diagnosis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kidney_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drugs (public read)
CREATE POLICY "Drugs are viewable by everyone" ON public.drugs FOR SELECT USING (true);

-- RLS Policies for prescription_codes (public read, service role write)
CREATE POLICY "Prescription codes are viewable by everyone" ON public.prescription_codes FOR SELECT USING (true);

-- RLS Policies for patients
CREATE POLICY "Users can view their own patients" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patients" ON public.patients FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for prescriptions
CREATE POLICY "Users can view their own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for prescription_drugs
CREATE POLICY "Users can view their prescription drugs" ON public.prescription_drugs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.prescriptions WHERE id = prescription_id AND user_id = auth.uid()));
CREATE POLICY "Users can create prescription drugs" ON public.prescription_drugs FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions WHERE id = prescription_id AND user_id = auth.uid()));

-- RLS Policies for drug_interactions
CREATE POLICY "Users can view their drug interactions" ON public.drug_interactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.prescriptions WHERE id = prescription_id AND user_id = auth.uid()));
CREATE POLICY "Users can create drug interactions" ON public.drug_interactions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.prescriptions WHERE id = prescription_id AND user_id = auth.uid()));

-- RLS Policies for grievances
CREATE POLICY "Users can view their own grievances" ON public.grievances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own grievances" ON public.grievances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own grievances" ON public.grievances FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for lab_tests
CREATE POLICY "Users can view their own lab tests" ON public.lab_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lab tests" ON public.lab_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lab tests" ON public.lab_tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lab tests" ON public.lab_tests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for medical_scans
CREATE POLICY "Users can view their own medical scans" ON public.medical_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own medical scans" ON public.medical_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medical scans" ON public.medical_scans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medical scans" ON public.medical_scans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for kidney_claims
CREATE POLICY "Users can view their own kidney claims" ON public.kidney_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own kidney claims" ON public.kidney_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own kidney claims" ON public.kidney_claims FOR UPDATE USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-tests', 'lab-tests', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-scans', 'medical-scans', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('grievance-documents', 'grievance-documents', false);

-- Storage policies for lab-tests
CREATE POLICY "Users can upload their own lab test files" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own lab test files" ON storage.objects FOR SELECT 
  USING (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own lab test files" ON storage.objects FOR DELETE 
  USING (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for medical-scans
CREATE POLICY "Users can upload their own medical scan files" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own medical scan files" ON storage.objects FOR SELECT 
  USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own medical scan files" ON storage.objects FOR DELETE 
  USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for grievance-documents
CREATE POLICY "Users can upload their own grievance documents" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'grievance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own grievance documents" ON storage.objects FOR SELECT 
  USING (bucket_id = 'grievance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescription_drugs_prescription_id ON public.prescription_drugs(prescription_id);
CREATE INDEX idx_drug_interactions_prescription_id ON public.drug_interactions(prescription_id);
CREATE INDEX idx_grievances_prescription_id ON public.grievances(prescription_id);
CREATE INDEX idx_lab_tests_patient_id ON public.lab_tests(patient_id);
CREATE INDEX idx_medical_scans_patient_id ON public.medical_scans(patient_id);
CREATE INDEX idx_kidney_claims_patient_id ON public.kidney_claims(patient_id);