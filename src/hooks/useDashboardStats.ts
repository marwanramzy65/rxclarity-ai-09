import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  todaysClaims: number;
  approvedCount: number;
  approvedPercentage: number;
  interactionsFound: number;
  avgProcessingTime: string;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaysClaims: 0,
    approvedCount: 0,
    approvedPercentage: 0,
    interactionsFound: 0,
    avgProcessingTime: '0s'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch today's prescriptions
      const { data: todaysPrescriptions, error: todayError } = await supabase
        .from('prescriptions')
        .select('id, insurance_decision, processing_time')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (todayError) throw todayError;

      // Fetch all user's prescriptions for overall stats
      const { data: allPrescriptions, error: allError } = await supabase
        .from('prescriptions')
        .select('id, insurance_decision, processing_time')
        .eq('user_id', user.id);

      if (allError) throw allError;

      // Fetch all drug interactions for this user
      const { data: interactions, error: interactionsError } = await supabase
        .from('drug_interactions')
        .select(`
          id,
          prescription_id,
          prescriptions!inner (user_id)
        `)
        .eq('prescriptions.user_id', user.id);

      if (interactionsError) throw interactionsError;

      // Calculate stats
      const todaysClaims = todaysPrescriptions?.length || 0;
      
      const approvedPrescriptions = allPrescriptions?.filter(p => 
        p.insurance_decision?.toLowerCase() === 'approved'
      ) || [];
      const approvedCount = approvedPrescriptions.length;
      const totalPrescriptions = allPrescriptions?.length || 0;
      const approvedPercentage = totalPrescriptions > 0 
        ? Math.round((approvedCount / totalPrescriptions) * 100) 
        : 0;
      
      const interactionsFound = interactions?.length || 0;
      
      // Calculate average processing time
      const prescriptionsWithTime = allPrescriptions?.filter(p => p.processing_time) || [];
      let avgProcessingTime = '0s';
      
      if (prescriptionsWithTime.length > 0) {
        // Convert interval strings to seconds and calculate average
        const totalSeconds = prescriptionsWithTime.reduce((sum, p) => {
          if (!p.processing_time) return sum;
          
          // Parse interval format like "00:00:02.345", "5552 milliseconds", or "2.345 seconds"
          const timeStr = p.processing_time.toString();
          
          // Handle "X milliseconds" format
          const msMatch = timeStr.match(/(\d+)\s*milliseconds?/i);
          if (msMatch) {
            return sum + (parseInt(msMatch[1]) / 1000);
          }
          
          if (timeStr.includes(':')) {
            // Format: "00:00:02.345"
            const parts = timeStr.split(':');
            const seconds = parseFloat(parts[2] || '0');
            const minutes = parseInt(parts[1] || '0');
            const hours = parseInt(parts[0] || '0');
            return sum + (hours * 3600 + minutes * 60 + seconds);
          } else {
            // Format: "2.345 seconds" - extract number
            const match = timeStr.match(/(\d+\.?\d*)/);
            return sum + (match ? parseFloat(match[1]) : 0);
          }
        }, 0);
        
        const avgSeconds = totalSeconds / prescriptionsWithTime.length;
        
        if (avgSeconds < 1) {
          avgProcessingTime = `${Math.round(avgSeconds * 1000)}ms`;
        } else if (avgSeconds < 60) {
          avgProcessingTime = `${avgSeconds.toFixed(1)}s`;
        } else {
          const minutes = Math.floor(avgSeconds / 60);
          const seconds = Math.round(avgSeconds % 60);
          avgProcessingTime = `${minutes}m ${seconds}s`;
        }
      }

      setStats({
        todaysClaims,
        approvedCount,
        approvedPercentage,
        interactionsFound,
        avgProcessingTime
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchDashboardStats };
};