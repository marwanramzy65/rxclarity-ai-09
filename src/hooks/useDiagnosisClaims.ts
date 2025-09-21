import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DiagnosisClaim {
  id: string;
  user_id: string;
  patient_name: string;
  patient_id: string;
  current_stage: number;
  stage_1_completed: boolean;
  stage_1_file_url?: string;
  stage_1_completed_at?: string;
  stage_2_completed: boolean;
  stage_2_file_url?: string;
  stage_2_completed_at?: string;
  stage_3_completed: boolean;
  stage_3_file_url?: string;
  stage_3_completed_at?: string;
  stage_4_completed: boolean;
  stage_4_file_url?: string;
  stage_4_completed_at?: string;
  final_diagnosis?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useDiagnosisClaims = () => {
  const [claims, setClaims] = useState<DiagnosisClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClaims = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kidney_claims')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (err) {
      console.error('Error fetching kidney claims:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createClaim = async (patientName: string, patientId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('kidney_claims')
      .insert([
        {
          user_id: user.id,
          patient_name: patientName,
          patient_id: patientId,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    await fetchClaims();
    return data;
  };

  const updateStage = async (claimId: string, stage: number, fileUrl: string) => {
    const updateData: any = {};
    updateData[`stage_${stage}_completed`] = true;
    updateData[`stage_${stage}_file_url`] = fileUrl;
    updateData[`stage_${stage}_completed_at`] = new Date().toISOString();
    
    // Auto-advance to next stage if not at stage 4
    if (stage < 4) {
      updateData.current_stage = stage + 1;
    }
    
    // If completing stage 3, automatically complete stage 4 with final diagnosis
    if (stage === 3) {
      updateData.current_stage = 4;
      updateData.stage_4_completed = true;
      updateData.stage_4_completed_at = new Date().toISOString();
      updateData.status = 'completed';
      updateData.final_diagnosis = 'Kidney function analysis completed. Based on the submitted documentation and test results, the patient shows signs that require further evaluation. Please consult with a nephrologist for detailed interpretation of the results and recommended treatment plan. Consider monitoring kidney function parameters and implementing appropriate therapeutic interventions as needed.';
    }

    const { error } = await supabase
      .from('kidney_claims')
      .update(updateData)
      .eq('id', claimId);

    if (error) throw error;
    
    await fetchClaims();
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  return {
    claims,
    loading,
    error,
    createClaim,
    updateStage,
    refetch: fetchClaims
  };
};