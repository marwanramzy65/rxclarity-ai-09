-- Create prescription_codes table to store valid prescription codes
CREATE TABLE IF NOT EXISTS public.prescription_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.prescription_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code exists (read-only access)
CREATE POLICY "Anyone can view active prescription codes"
ON public.prescription_codes
FOR SELECT
USING (is_active = true);

-- Insert sample prescription codes for testing
INSERT INTO public.prescription_codes (code, description, is_active) VALUES
  ('RX-2025-001', 'Standard prescription code', true),
  ('RX-2025-002', 'Emergency prescription code', true),
  ('RX-2025-003', 'Chronic care prescription code', true),
  ('RX-2025-004', 'Pediatric prescription code', true),
  ('RX-2025-005', 'Geriatric prescription code', true),
  ('RX-2025-006', 'Specialty medication code', true),
  ('RX-2025-007', 'Generic medication code', true),
  ('RX-2025-008', 'Brand medication code', true),
  ('RX-2025-009', 'Controlled substance code', true),
  ('RX-2025-010', 'Over-the-counter code', true),
  ('PRE-ABC123', 'Test prescription code Alpha', true),
  ('PRE-XYZ789', 'Test prescription code Beta', true),
  ('PRE-DEF456', 'Test prescription code Gamma', true),
  ('CODE-2025-A', 'Valid code A', true),
  ('CODE-2025-B', 'Valid code B', true);