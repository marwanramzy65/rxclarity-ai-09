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
  ai_decision: string | null;
  ai_reasoning: string | null;
  ai_reviewed_at: string | null;
  approved_medications: string[] | null;
  denied_medications: string[] | null;
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

      // Get prescription details for AI review
      const { data: prescription, error: prescError } = await supabase
        .from('prescriptions')
        .select(`
          id,
          insurance_decision,
          insurance_message,
          prescription_drugs (
            drugs (
              name,
              strength
            )
          )
        `)
        .eq('id', prescriptionId)
        .single();

      if (prescError) {
        throw new Error(`Failed to fetch prescription: ${prescError.message}`);
      }

      // Create grievance record
      const { data: grievanceData, error: insertError } = await supabase
        .from('grievances')
        .insert({
          prescription_id: prescriptionId,
          user_id: user.id,
          explanation,
          document_url: documentUrl,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Extract all medications from prescription
      const allMedications = prescription.prescription_drugs.map(
        (pd: any) => `${pd.drugs.name} ${pd.drugs.strength}`
      );

      // Trigger AI review (don't await to not block the response)
      supabase.functions.invoke('ai-appeal-review', {
        body: {
          grievanceId: grievanceData.id,
          prescriptionId: prescriptionId,
          deniedMedications: allMedications,
          insuranceDecision: prescription.insurance_decision,
          documentUrl: documentUrl,
          explanation: explanation,
        }
      }).then(() => {
        // Refresh after AI review completes
        fetchGrievances();
      }).catch(err => {
        console.error('AI review error (non-blocking):', err);
      });

      // Refresh the grievances list immediately
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