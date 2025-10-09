import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PatientData {
  patient_id: string;
  patient_name: string;
  age?: number;
  address?: string;
  phone?: string;
  email?: string;
  prescriptions: any[];
  labTests: any[];
  scans: any[];
  kidneyDiagnosis: any[];
}

export const usePatientHistory = (patientId: string) => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPatientData = async () => {
    if (!user || !patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch patient profile
      const { data: patientProfile, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .single();

      if (patientError && patientError.code !== 'PGRST116') throw patientError;

      // Fetch prescriptions
      const { data: prescriptions, error: prescError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_drugs (
            quantity,
            drugs (name, strength, generic_name)
          )
        `)
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (prescError) throw prescError;

      // Fetch lab tests
      const { data: labTests, error: labError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      if (labError) throw labError;

      // Fetch medical scans
      const { data: scans, error: scansError } = await supabase
        .from('medical_scans')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('scan_date', { ascending: false });

      if (scansError) throw scansError;

      // Fetch kidney diagnosis claims
      const { data: kidneyDiagnosis, error: kidneyError } = await supabase
        .from('kidney_claims')
        .select('*')
        .eq('user_id', user.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (kidneyError) throw kidneyError;

      const patient_name = patientProfile?.patient_name || 
                          prescriptions?.[0]?.patient_name || 
                          labTests?.[0]?.patient_name || 
                          scans?.[0]?.patient_name || 
                          kidneyDiagnosis?.[0]?.patient_name || 
                          'Unknown';

      setPatientData({
        patient_id: patientId,
        patient_name,
        age: patientProfile?.age,
        address: patientProfile?.address,
        phone: patientProfile?.phone,
        email: patientProfile?.email,
        prescriptions: prescriptions || [],
        labTests: labTests || [],
        scans: scans || [],
        kidneyDiagnosis: kidneyDiagnosis || []
      });

    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [user, patientId]);

  return {
    patientData,
    loading,
    error,
    refetch: fetchPatientData
  };
};
