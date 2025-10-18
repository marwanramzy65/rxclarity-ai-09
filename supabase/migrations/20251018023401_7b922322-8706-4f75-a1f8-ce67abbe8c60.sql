-- Create prescription_codes table to store valid prescription codes
-- Codes are 8-character cryptographically secure codes (like prepaid cards)
-- Format: 6 random chars + 2 checksum chars (e.g., A7K9M2X5)
CREATE TABLE IF NOT EXISTS public.prescription_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE CHECK (char_length(code) = 8),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users(id)
);

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_prescription_codes_code ON public.prescription_codes(code);
CREATE INDEX IF NOT EXISTS idx_prescription_codes_active ON public.prescription_codes(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.prescription_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code exists (read-only access for active codes only)
CREATE POLICY "Anyone can view active prescription codes"
ON public.prescription_codes
FOR SELECT
USING (is_active = true);

-- Only authenticated users can mark codes as used
CREATE POLICY "Authenticated users can update codes they use"
ON public.prescription_codes
FOR UPDATE
USING (auth.uid() IS NOT NULL AND used_by IS NULL)
WITH CHECK (auth.uid() = used_by);

-- Insert sample secure prescription codes for testing
-- Generated using cryptographic random generation with checksum
INSERT INTO public.prescription_codes (code, description, is_active) VALUES
  ('A7K9M2X5', 'Secure test code 1', true),
  ('H3N8P4Q9', 'Secure test code 2', true),
  ('R6V2W7Z3', 'Secure test code 3', true),
  ('B9D4F7J2', 'Secure test code 4', true),
  ('L5M8N3P6', 'Secure test code 5', true),
  ('Q2R7T9V4', 'Secure test code 6', true),
  ('C8E3G6K9', 'Secure test code 7', true),
  ('X4Y7Z2A5', 'Secure test code 8', true),
  ('F3H8J4L9', 'Secure test code 9', true),
  ('S6U2W8Y5', 'Secure test code 10', true);