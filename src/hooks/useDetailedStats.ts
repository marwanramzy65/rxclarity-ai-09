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
  
  // Grievance stats
  grievanceStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
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
            drug1_name,
            drug2_name,
            severity,
            description
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        throw prescriptionsError;
      }

      // Fetch grievances data
      const { data: grievances, error: grievancesError } = await supabase
        .from('grievances')
        .select('*')
        .eq('user_id', user?.id);

      if (grievancesError) {
        console.error('Error fetching grievances:', grievancesError);
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
      
      // Calculate grievance stats
      const grievanceStats = calculateGrievanceStats(grievances || []);

      setStats({
        weeklyTrends,
        topMedications,
        insuranceTierDistribution,
        processingInsights,
        interactionAnalysis,
        performanceMetrics,
        grievanceStats
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

function parseProcessingTimeToSeconds(processingTime: string): number | null {
  // Handle "X milliseconds" format
  const msMatch = processingTime.match(/(\d+)\s*milliseconds?/i);
  if (msMatch) {
    return parseInt(msMatch[1]) / 1000;
  }
  
  // Handle "HH:MM:SS" format as fallback
  const timeMatch = processingTime.match(/(\d+):(\d+):(\d+\.?\d*)/);
  if (timeMatch) {
    return parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
  }
  
  // Handle "X seconds" format
  const secMatch = processingTime.match(/(\d+\.?\d*)\s*seconds?/i);
  if (secMatch) {
    return parseFloat(secMatch[1]);
  }
  
  return null;
}

function calculateProcessingInsights(prescriptions: any[]) {
  const tierTimes: { [key: string]: number[] } = {};
  const hourCounts: { [key: number]: number } = {};
  
  prescriptions.forEach(prescription => {
    // Processing time by tier
    if (prescription.processing_time && prescription.insurance_tier) {
      const tier = prescription.insurance_tier;
      const seconds = parseProcessingTimeToSeconds(prescription.processing_time);
      if (seconds !== null) {
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
      avgTime: formatProcessingTime(avgSeconds)
    };
  });
  
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  return { averageByTier, peakHours };
}

function formatProcessingTime(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  } else if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else {
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  }
}

function calculateInteractionAnalysis(prescriptions: any[]) {
  const severityCounts: { [key: string]: number } = {};
  const pairCounts: { [key: string]: { count: number; severity: string } } = {};
  
  prescriptions.forEach(prescription => {
    prescription.drug_interactions?.forEach((interaction: any) => {
      // By severity
      const severity = interaction.severity || 'Unknown';
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      
      // Common pairs - use drug1_name + drug2_name
      const pairKey = `${interaction.drug1_name || ''} + ${interaction.drug2_name || ''}`;
      
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
      const seconds = parseProcessingTimeToSeconds(prescription.processing_time);
      if (seconds !== null) {
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
    avgProcessingTime: formatProcessingTime(avgTime),
    quickestProcess: formatProcessingTime(quickest),
    slowestProcess: formatProcessingTime(slowest)
  };
}

function calculateGrievanceStats(grievances: any[]) {
  const total = grievances.length;
  const pending = grievances.filter(g => g.status === 'pending').length;
  const approved = grievances.filter(g => g.status === 'approved').length;
  const rejected = grievances.filter(g => g.status === 'rejected').length;
  
  return {
    total,
    pending,
    approved,
    rejected
  };
}