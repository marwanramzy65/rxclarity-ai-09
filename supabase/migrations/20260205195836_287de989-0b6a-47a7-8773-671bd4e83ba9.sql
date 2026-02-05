-- Add unique constraint for patient upsert to work (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'patients_user_id_patient_id_key'
  ) THEN
    ALTER TABLE public.patients 
    ADD CONSTRAINT patients_user_id_patient_id_key UNIQUE (user_id, patient_id);
  END IF;
END $$;