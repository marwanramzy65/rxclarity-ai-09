-- Create storage buckets for lab tests and medical scans
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('lab-tests', 'lab-tests', false),
  ('medical-scans', 'medical-scans', false);

-- RLS policies for lab-tests bucket
CREATE POLICY "Users can view their own lab test files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own lab test files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own lab test files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own lab test files"
ON storage.objects FOR DELETE
USING (bucket_id = 'lab-tests' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for medical-scans bucket
CREATE POLICY "Users can view their own medical scan files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own medical scan files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own medical scan files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own medical scan files"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);