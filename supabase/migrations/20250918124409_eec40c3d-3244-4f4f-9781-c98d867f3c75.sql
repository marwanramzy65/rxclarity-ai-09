-- Create storage bucket for grievance documents
INSERT INTO storage.buckets (id, name, public) VALUES ('grievance-documents', 'grievance-documents', false);

-- Create grievances table
CREATE TABLE public.grievances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  explanation TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for grievances
CREATE POLICY "Users can create grievances for their prescriptions" 
ON public.grievances 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.prescriptions 
    WHERE prescriptions.id = grievances.prescription_id 
    AND prescriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own grievances" 
ON public.grievances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own grievances" 
ON public.grievances 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create storage policies for grievance documents
CREATE POLICY "Users can upload their own grievance documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'grievance-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own grievance documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'grievance-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own grievance documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'grievance-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_grievances_updated_at
BEFORE UPDATE ON public.grievances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();