import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DetailedStats {
  // Trends
  weeklyTrends: {
    week: string;
    prescriptions: number;
    approvalRate: number;
  }[];
  
  // Top medications
  topMedications: {
    name: string;
    count: number;
    strength: string;
  }[];
  
  // Insurance analysis
  insuranceTierDistribution: {
    tier: string;
    count: number;
    approvalRate: number;
  }[];
  
  // Processing insights
  processingInsights: {
    averageByTier: {
      tier: string;
      avgTime: string;
    }[];
    peakHours: {
      hour: number;
      count: number;
    }[];
  };
  
  // Interaction analysis
  interactionAnalysis: {
    bySeverity: {
      severity: string;
      count: number;
    }[];
    commonPairs: {
      drugPair: string;
      count: number;
      severity: string;
    }[];
  };
  
  // Performance metrics
  performanceMetrics: {
    totalProcessed: number;
    avgProcessingTime: string;
    quickestProcess: string;
    slowestProcess: string;
  };
}

export const useDetailedStats = () => {
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDetailedStats();
    }
  }, [user]);

  const fetchDetailedStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch prescriptions with related data
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_drugs(
            quantity,
            drugs(name, strength, generic_name)
          ),
          drug_interactions(
            severity,
            interaction_type,
            drug_pair
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        throw prescriptionsError;
      }

      // Calculate weekly trends (last 4 weeks)
      const weeklyTrends = calculateWeeklyTrends(prescriptions || []);
      
      // Calculate top medications
      const topMedications = calculateTopMedications(prescriptions || []);
      
      // Calculate insurance tier distribution
      const insuranceTierDistribution = calculateInsuranceTierDistribution(prescriptions || []);
      
      // Calculate processing insights
      const processingInsights = calculateProcessingInsights(prescriptions || []);
      
      // Calculate interaction analysis
      const interactionAnalysis = calculateInteractionAnalysis(prescriptions || []);
      
      // Calculate performance metrics
      const performanceMetrics = calculatePerformanceMetrics(prescriptions || []);

      setStats({
        weeklyTrends,
        topMedications,
        insuranceTierDistribution,
        processingInsights,
        interactionAnalysis,
        performanceMetrics
      });

    } catch (err) {
      console.error('Error fetching detailed stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch detailed statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchDetailedStats };
};

// Helper functions for calculations
function calculateWeeklyTrends(prescriptions: any[]) {
  const weeks = [];
  const now = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7 + 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekPrescriptions = prescriptions.filter(p => {
      const createdAt = new Date(p.created_at);
      return createdAt >= weekStart && createdAt <= weekEnd;
    });
    
    const approvedCount = weekPrescriptions.filter(p => p.insurance_decision === 'approved').length;
    const approvalRate = weekPrescriptions.length > 0 ? Math.round((approvedCount / weekPrescriptions.length) * 100) : 0;
    
    weeks.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      prescriptions: weekPrescriptions.length,
      approvalRate
    });
  }
  
  return weeks;
}

function calculateTopMedications(prescriptions: any[]) {
  const medicationCount: { [key: string]: { count: number; strength: string; name: string } } = {};
  
  prescriptions.forEach(prescription => {
    prescription.prescription_drugs?.forEach((pd: any) => {
      const drug = pd.drugs;
      if (drug) {
        const key = `${drug.name}-${drug.strength}`;
        if (!medicationCount[key]) {
          medicationCount[key] = {
            name: drug.name,
            strength: drug.strength,
            count: 0
          };
        }
        medicationCount[key].count += pd.quantity || 1;
      }
    });
  });
  
  return Object.values(medicationCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculateInsuranceTierDistribution(prescriptions: any[]) {
  const tierStats: { [key: string]: { count: number; approved: number } } = {};
  
  prescriptions.forEach(prescription => {
    const tier = prescription.insurance_tier || 'Unknown';
    if (!tierStats[tier]) {
      tierStats[tier] = { count: 0, approved: 0 };
    }
    tierStats[tier].count++;
    if (prescription.insurance_decision === 'approved') {
      tierStats[tier].approved++;
    }
  });
  
  return Object.entries(tierStats).map(([tier, stats]) => ({
    tier,
    count: stats.count,
    approvalRate: Math.round((stats.approved / stats.count) * 100)
  }));
}

function calculateProcessingInsights(prescriptions: any[]) {
  const tierTimes: { [key: string]: number[] } = {};
  const hourCounts: { [key: number]: number } = {};
  
  prescriptions.forEach(prescription => {
    // Processing time by tier
    if (prescription.processing_time && prescription.insurance_tier) {
      const tier = prescription.insurance_tier;
      const timeMatch = prescription.processing_time.match(/(\d+):(\d+):(\d+\.?\d*)/);
      if (timeMatch) {
        const seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
        if (!tierTimes[tier]) tierTimes[tier] = [];
        tierTimes[tier].push(seconds);
      }
    }
    
    // Peak hours
    const hour = new Date(prescription.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const averageByTier = Object.entries(tierTimes).map(([tier, times]) => {
    const avgSeconds = times.reduce((a, b) => a + b, 0) / times.length;
    return {
      tier,
      avgTime: `${Math.floor(avgSeconds)}s`
    };
  });
  
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return { averageByTier, peakHours };
}

function calculateInteractionAnalysis(prescriptions: any[]) {
  const severityCounts: { [key: string]: number } = {};
  const pairCounts: { [key: string]: { count: number; severity: string } } = {};
  
  prescriptions.forEach(prescription => {
    prescription.drug_interactions?.forEach((interaction: any) => {
      // By severity
      const severity = interaction.severity || 'Unknown';
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      
      // Common pairs
      const pairKey = Array.isArray(interaction.drug_pair) 
        ? interaction.drug_pair.join(' + ')
        : String(interaction.drug_pair);
      
      if (!pairCounts[pairKey]) {
        pairCounts[pairKey] = { count: 0, severity };
      }
      pairCounts[pairKey].count++;
    });
  });
  
  const bySeverity = Object.entries(severityCounts).map(([severity, count]) => ({
    severity,
    count
  }));
  
  const commonPairs = Object.entries(pairCounts)
    .map(([drugPair, data]) => ({
      drugPair,
      count: data.count,
      severity: data.severity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return { bySeverity, commonPairs };
}

function calculatePerformanceMetrics(prescriptions: any[]) {
  const times: number[] = [];
  
  prescriptions.forEach(prescription => {
    if (prescription.processing_time) {
      const timeMatch = prescription.processing_time.match(/(\d+):(\d+):(\d+\.?\d*)/);
      if (timeMatch) {
        const seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
        times.push(seconds);
      }
    }
  });
  
  if (times.length === 0) {
    return {
      totalProcessed: prescriptions.length,
      avgProcessingTime: '0s',
      quickestProcess: '0s',
      slowestProcess: '0s'
    };
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const quickest = Math.min(...times);
  const slowest = Math.max(...times);
  
  return {
    totalProcessed: prescriptions.length,
    avgProcessingTime: `${Math.floor(avgTime)}s`,
    quickestProcess: `${Math.floor(quickest)}s`,
    slowestProcess: `${Math.floor(slowest)}s`
  };
}