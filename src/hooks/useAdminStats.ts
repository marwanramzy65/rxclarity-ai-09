import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
    totalPrescriptions: number;
    approvedCount: number;
    deniedCount: number;
    limitedCount: number;
    pendingCount: number;
    approvedPercentage: number;
    deniedPercentage: number;
    limitedPercentage: number;
    totalPatients: number;
    totalPharmacies: number;
    totalAppeals: number;
    pendingAppeals: number;
    approvedAppeals: number;
    rejectedAppeals: number;
    interactionsFound: number;
}

export const useAdminStats = () => {
    const [stats, setStats] = useState<AdminStats>({
        totalPrescriptions: 0,
        approvedCount: 0,
        deniedCount: 0,
        limitedCount: 0,
        pendingCount: 0,
        approvedPercentage: 0,
        deniedPercentage: 0,
        limitedPercentage: 0,
        totalPatients: 0,
        totalPharmacies: 0,
        totalAppeals: 0,
        pendingAppeals: 0,
        approvedAppeals: 0,
        rejectedAppeals: 0,
        interactionsFound: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        try {
            setLoading(true);

            // Fetch all prescriptions
            const { data: allPrescriptions, error: presError } = await supabase
                .from('prescriptions')
                .select('id, insurance_decision, patient_id, user_id');

            if (presError) throw presError;

            // Fetch all grievances
            const { data: allGrievances, error: grievError } = await supabase
                .from('grievances')
                .select('id, status');

            if (grievError) throw grievError;

            // Fetch all drug interactions
            const { data: interactions, error: interactionsError } = await supabase
                .from('drug_interactions')
                .select('id');

            if (interactionsError) throw interactionsError;

            // Calculate prescription stats
            const totalPrescriptions = allPrescriptions?.length || 0;
            const approvedCount = allPrescriptions?.filter(p =>
                p.insurance_decision?.toLowerCase() === 'approved'
            ).length || 0;
            const deniedCount = allPrescriptions?.filter(p =>
                p.insurance_decision?.toLowerCase() === 'denied'
            ).length || 0;
            const limitedCount = allPrescriptions?.filter(p =>
                p.insurance_decision?.toLowerCase() === 'limited'
            ).length || 0;
            const pendingCount = allPrescriptions?.filter(p =>
                !p.insurance_decision || p.insurance_decision?.toLowerCase() === 'pending'
            ).length || 0;

            const approvedPercentage = totalPrescriptions > 0
                ? Math.round((approvedCount / totalPrescriptions) * 100)
                : 0;
            const deniedPercentage = totalPrescriptions > 0
                ? Math.round((deniedCount / totalPrescriptions) * 100)
                : 0;
            const limitedPercentage = totalPrescriptions > 0
                ? Math.round((limitedCount / totalPrescriptions) * 100)
                : 0;

            // Calculate unique patients and pharmacies
            const uniquePatients = new Set(allPrescriptions?.map(p => p.patient_id) || []);
            const uniquePharmacies = new Set(allPrescriptions?.map(p => p.user_id) || []);

            // Calculate grievance stats
            const totalAppeals = allGrievances?.length || 0;
            const pendingAppeals = allGrievances?.filter(g => g.status === 'pending').length || 0;
            const approvedAppeals = allGrievances?.filter(g => g.status === 'approved').length || 0;
            const rejectedAppeals = allGrievances?.filter(g => g.status === 'rejected').length || 0;

            const interactionsFound = interactions?.length || 0;

            setStats({
                totalPrescriptions,
                approvedCount,
                deniedCount,
                limitedCount,
                pendingCount,
                approvedPercentage,
                deniedPercentage,
                limitedPercentage,
                totalPatients: uniquePatients.size,
                totalPharmacies: uniquePharmacies.size,
                totalAppeals,
                pendingAppeals,
                approvedAppeals,
                rejectedAppeals,
                interactionsFound,
            });

        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading, error, refetch: fetchAdminStats };
};
