import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Prescription {
  id: string;
  patient_name: string;
  patient_id: string;
  insurance_tier: string;
  insurance_decision: string | null;
  insurance_message: string | null;
  processing_time: string | null;
  created_at: string;
  prescription_drugs: Array<{
    drugs: {
      name: string;
      strength: string;
    };
    quantity: number;
  }>;
  drug_interactions: Array<{
    drug1_name: string;
    drug2_name: string;
    drug_pair: string[];
    severity: string;
    interaction_type: string;
    description: string;
    recommendation: string;
  }>;
}

export const usePrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPrescriptions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch prescriptions with related data
      const { data, error: fetchError } = await supabase
        .from('prescriptions')
        .select(`
          id,
          patient_name,
          patient_id,
          insurance_tier,
          insurance_decision,
          insurance_message,
          processing_time,
          created_at,
          prescription_drugs (
            quantity,
            drugs (
              name,
              strength
            )
          ),
          drug_interactions (
            drug1_name,
            drug2_name,
            drug_pair,
            severity,
            interaction_type,
            description,
            recommendation
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setPrescriptions((data || []) as Prescription[]);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const refreshPrescriptions = () => {
    fetchPrescriptions();
  };

  return {
    prescriptions,
    loading,
    error,
    refreshPrescriptions,
  };
};