-- Add missing updated_at column to grievances table
ALTER TABLE public.grievances 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for automatic timestamp updates on grievances
DROP TRIGGER IF EXISTS update_grievances_updated_at ON public.grievances;

CREATE TRIGGER update_grievances_updated_at
BEFORE UPDATE ON public.grievances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();