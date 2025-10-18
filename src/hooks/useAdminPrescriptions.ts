import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminPrescription {
    id: string;
    patient_name: string;
    patient_id: string;
    insurance_tier: string;
    insurance_decision: string | null;
    insurance_message: string | null;
    processing_time: string | null;
    created_at: string;
    user_id: string;
    prescription_drugs: Array<{
        drugs: {
            name: string;
            strength: string;
        };
        quantity: number;
    }>;
    drug_interactions: Array<{
        drug_pair: string[];
        severity: string;
        interaction_type: string;
        description: string;
        recommendation: string;
    }>;
    grievances: Array<{
        id: string;
        explanation: string;
        status: string;
        ai_decision: string | null;
        ai_reasoning: string | null;
        created_at: string;
    }>;
}

export const useAdminPrescriptions = (filterStatus?: 'all' | 'denied' | 'approved' | 'limited' | 'pending') => {
    const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
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
          user_id,
          prescription_drugs (
            quantity,
            drugs (
              name,
              strength
            )
          ),
          drug_interactions (
            drug_pair,
            severity,
            interaction_type,
            description,
            recommendation
          ),
          grievances (
            id,
            explanation,
            status,
            ai_decision,
            ai_reasoning,
            created_at
          )
        `)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filterStatus === 'denied') {
                query = query.eq('insurance_decision', 'denied');
            } else if (filterStatus === 'approved') {
                query = query.eq('insurance_decision', 'approved');
            } else if (filterStatus === 'limited') {
                query = query.eq('insurance_decision', 'limited');
            } else if (filterStatus === 'pending') {
                query = query.is('insurance_decision', null);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            setPrescriptions((data || []) as AdminPrescription[]);
        } catch (err) {
            console.error('Error fetching admin prescriptions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch prescriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [filterStatus]);

    return {
        prescriptions,
        loading,
        error,
        refreshPrescriptions: fetchPrescriptions,
    };
};
