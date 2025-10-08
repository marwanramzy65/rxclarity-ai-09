import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Patient {
  id: string;
  user_id: string;
  patient_id: string;
  patient_name: string;
  age?: number;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPatients = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('patient_name', { ascending: true });

      if (fetchError) throw fetchError;

      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const upsertPatient = async (patientData: Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error: upsertError } = await supabase
        .from('patients')
        .upsert([{
          patient_id: patientData.patient_id,
          patient_name: patientData.patient_name,
          age: patientData.age,
          address: patientData.address,
          phone: patientData.phone,
          email: patientData.email,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id,patient_id'
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      await fetchPatients();
      return { data, error: null };
    } catch (err) {
      console.error('Error upserting patient:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Failed to save patient' 
      };
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    upsertPatient
  };
};
