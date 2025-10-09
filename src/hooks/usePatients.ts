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

      // Fetch formal patient records
      const { data: patientRecords, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Fetch unique patients from prescriptions
      const { data: prescriptionPatients, error: prescError } = await supabase
        .from('prescriptions')
        .select('patient_id, patient_name')
        .eq('user_id', user.id);

      if (prescError) throw prescError;

      // Fetch unique patients from lab tests
      const { data: labTestPatients, error: labError } = await supabase
        .from('lab_tests')
        .select('patient_id, patient_name')
        .eq('user_id', user.id);

      if (labError) throw labError;

      // Fetch unique patients from medical scans
      const { data: scanPatients, error: scanError } = await supabase
        .from('medical_scans')
        .select('patient_id, patient_name')
        .eq('user_id', user.id);

      if (scanError) throw scanError;

      // Combine and deduplicate patients
      const patientMap = new Map<string, Patient>();

      // Add formal patient records first (they have complete info)
      patientRecords?.forEach(patient => {
        patientMap.set(patient.patient_id, patient);
      });

      // Add patients from prescriptions if not already in map
      prescriptionPatients?.forEach(p => {
        if (!patientMap.has(p.patient_id)) {
          patientMap.set(p.patient_id, {
            id: p.patient_id,
            user_id: user.id,
            patient_id: p.patient_id,
            patient_name: p.patient_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      // Add patients from lab tests if not already in map
      labTestPatients?.forEach(p => {
        if (!patientMap.has(p.patient_id)) {
          patientMap.set(p.patient_id, {
            id: p.patient_id,
            user_id: user.id,
            patient_id: p.patient_id,
            patient_name: p.patient_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      // Add patients from scans if not already in map
      scanPatients?.forEach(p => {
        if (!patientMap.has(p.patient_id)) {
          patientMap.set(p.patient_id, {
            id: p.patient_id,
            user_id: user.id,
            patient_id: p.patient_id,
            patient_name: p.patient_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      // Convert map to array and sort by name
      const allPatients = Array.from(patientMap.values()).sort((a, b) => 
        a.patient_name.localeCompare(b.patient_name)
      );

      setPatients(allPatients);
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
