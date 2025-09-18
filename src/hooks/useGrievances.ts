import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Grievance {
  id: string;
  prescription_id: string;
  user_id: string;
  explanation: string;
  document_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useGrievances = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchGrievances = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('grievances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setGrievances((data || []) as Grievance[]);
    } catch (err) {
      console.error('Error fetching grievances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grievances');
    } finally {
      setLoading(false);
    }
  };

  const submitGrievance = async (
    prescriptionId: string, 
    explanation: string, 
    file?: File
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      let documentUrl = null;

      // Upload file if provided
      if (file) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
          .from('grievance-documents')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        documentUrl = fileName;
      }

      // Create grievance record
      const { error: insertError } = await supabase
        .from('grievances')
        .insert({
          prescription_id: prescriptionId,
          user_id: user.id,
          explanation,
          document_url: documentUrl,
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh the grievances list
      await fetchGrievances();

      return { success: true };
    } catch (err) {
      console.error('Error submitting grievance:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to submit grievance' 
      };
    }
  };

  const getGrievanceByPrescription = (prescriptionId: string) => {
    return grievances.find(g => g.prescription_id === prescriptionId);
  };

  useEffect(() => {
    fetchGrievances();
  }, [user]);

  return {
    grievances,
    loading,
    error,
    submitGrievance,
    getGrievanceByPrescription,
    refreshGrievances: fetchGrievances,
  };
};