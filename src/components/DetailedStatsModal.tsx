import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDetailedStats } from "@/hooks/useDetailedStats";
import { 
  TrendingUp, 
  Pill, 
  Shield, 
  Clock, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react";

interface DetailedStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailedStatsModal = ({ open, onOpenChange }: DetailedStatsModalProps) => {
  const { stats, loading, error } = useDetailedStats();

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Detailed Analytics</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading detailed statistics...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !stats) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Detailed Analytics</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <p className="text-muted-foreground">{error || 'Failed to load statistics'}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Detailed Analytics</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Weekly Trends */}
          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Weekly Trends (Last 4 Weeks)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.weeklyTrends.map((week, index) => (
                  <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Week of {week.week}</p>
                    <p className="text-xl font-bold">{week.prescriptions}</p>
                    <p className="text-sm text-success">{week.approvalRate}% approved</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Medications */}
            <Card className="bg-gradient-card border-0 shadow-card-medical">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <span>Top Prescribed Medications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.topMedications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <Badge variant="secondary" className="text-xs">{med.strength}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{med.count}</p>
                      <p className="text-xs text-muted-foreground">total qty</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insurance Tier Distribution */}
            <Card className="bg-gradient-card border-0 shadow-card-medical">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Insurance Tier Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.insuranceTierDistribution.map((tier, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{tier.tier}</p>
                      <p className="text-sm text-muted-foreground">{tier.count} prescriptions</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={tier.approvalRate >= 90 ? "default" : tier.approvalRate >= 70 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {tier.approvalRate}%
                      </Badge>
                      {tier.approvalRate >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : tier.approvalRate >= 70 ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Processing Insights */}
          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Processing Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Average Processing Time by Tier</h4>
                  <div className="space-y-2">
                    {stats.processingInsights.averageByTier.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                        <span className="text-sm">{item.tier}</span>
                        <Badge variant="secondary">{item.avgTime}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Peak Processing Hours</h4>
                  <div className="space-y-2">
                    {stats.processingInsights.peakHours.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                        <span className="text-sm">{item.hour}:00 - {item.hour + 1}:00</span>
                        <Badge variant="secondary">{item.count} prescriptions</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interaction Analysis */}
          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span>Drug Interaction Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Interactions by Severity</h4>
                  <div className="space-y-2">
                    {stats.interactionAnalysis.bySeverity.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                        <span className="text-sm capitalize">{item.severity}</span>
                        <Badge 
                          variant={item.severity.toLowerCase() === 'red' ? 'destructive' : 
                                  item.severity.toLowerCase() === 'yellow' ? 'secondary' : 'secondary'}
                        >
                          {item.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Most Common Drug Pairs</h4>
                  <div className="space-y-2">
                    {stats.interactionAnalysis.commonPairs.map((item, index) => (
                      <div key={index} className="p-2 bg-muted/20 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.drugPair}
                          </span>
                          <Badge 
                            variant={item.severity.toLowerCase() === 'red' ? 'destructive' : 
                                    item.severity.toLowerCase() === 'yellow' ? 'secondary' : 'secondary'}
                            className="text-xs"
                          >
                            {item.count}x
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Performance Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{stats.performanceMetrics.totalProcessed}</p>
                  <p className="text-sm text-muted-foreground">Total Processed</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-success">{stats.performanceMetrics.avgProcessingTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Processing</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-success">{stats.performanceMetrics.quickestProcess}</p>
                  <p className="text-sm text-muted-foreground">Fastest Process</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-warning">{stats.performanceMetrics.slowestProcess}</p>
                  <p className="text-sm text-muted-foreground">Slowest Process</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStatsModal;