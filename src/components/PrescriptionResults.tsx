import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Shield, CreditCard, FileText, Eye } from "lucide-react";
import { GrievanceForm } from "@/components/GrievanceForm";
import { GrievanceStatus } from "@/components/GrievanceStatus";

interface PrescriptionResultsProps {
  results: {
    prescriptionId?: string;
    insuranceDecision: {
      finalDecision: string;
      message: string;
    };
    drugInteractions: {
      interactions: Array<{
        drug_pair: string[];
        severity: string;
        interaction_type: string;
        description: string;
        recommendation: string;
      }>;
    };
  };
  onReset: () => void;
  onSaveToHistory?: () => void;
}

const PrescriptionResults = ({ results, onReset, onSaveToHistory }: PrescriptionResultsProps) => {
  const { insuranceDecision, drugInteractions } = results;
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Parse insurance message for better formatting
  const parseInsuranceMessage = (message: string) => {
    try {
      // Try to extract structured information from the message
      const lines = message.split(/\n|\./).filter(line => line.trim());
      const summary = lines[0]?.trim() || message;
      
      // Look for common patterns in insurance messages
      const coverage = lines.find(line => 
        line.toLowerCase().includes('coverage') || 
        line.toLowerCase().includes('copay') ||
        line.toLowerCase().includes('tier')
      );
      
      const reasoning = lines.find(line => 
        line.toLowerCase().includes('because') || 
        line.toLowerCase().includes('due to') ||
        line.toLowerCase().includes('reason')
      );
      
      const requirements = lines.find(line => 
        line.toLowerCase().includes('require') || 
        line.toLowerCase().includes('need') ||
        line.toLowerCase().includes('must')
      );

      return {
        summary,
        coverage,
        reasoning,
        requirements,
        fullMessage: message
      };
    } catch {
      return {
        summary: message,
        fullMessage: message
      };
    }
  };

  const parsedMessage = parseInsuranceMessage(insuranceDecision.message);

  const getInsuranceIcon = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "limited":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "denied":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getInsuranceVariant = (decision: string) => {
    switch (decision.toLowerCase()) {
      case "approved":
        return "approved";
      case "limited":
        return "limited";
      case "denied":
        return "denied";
      default:
        return "pending";
    }
  };

  return (
    <div className="space-y-6">
      {/* Insurance Decision */}
      <Card className="bg-gradient-card border-0 shadow-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Insurance Decision</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getInsuranceIcon(insuranceDecision.finalDecision)}
              <span className="font-medium capitalize">
                {insuranceDecision.finalDecision}
              </span>
            </div>
            <StatusBadge variant={getInsuranceVariant(insuranceDecision.finalDecision) as any}>
              {insuranceDecision.finalDecision.toUpperCase()}
            </StatusBadge>
          </div>
          
          <div className="space-y-3">
            {/* Main summary */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium">{parsedMessage.summary}</p>
            </div>
            
            {/* Additional parsed information */}
            {parsedMessage.coverage && (
              <div className="flex items-start space-x-2 text-sm">
                <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{parsedMessage.coverage}</span>
              </div>
            )}
            
            {parsedMessage.requirements && (
              <div className="flex items-start space-x-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{parsedMessage.requirements}</span>
              </div>
            )}

            {/* View Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span>Complete Insurance Analysis</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      {getInsuranceIcon(insuranceDecision.finalDecision)}
                      <span>Decision: {insuranceDecision.finalDecision.toUpperCase()}</span>
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong>Complete Message:</strong>
                        <p className="mt-1 text-muted-foreground whitespace-pre-line">
                          {parsedMessage.fullMessage}
                        </p>
                      </div>
                      
                      {parsedMessage.coverage && (
                        <div>
                          <strong>Coverage Details:</strong>
                          <p className="mt-1 text-muted-foreground">{parsedMessage.coverage}</p>
                        </div>
                      )}
                      
                      {parsedMessage.reasoning && (
                        <div>
                          <strong>Reasoning:</strong>
                          <p className="mt-1 text-muted-foreground">{parsedMessage.reasoning}</p>
                        </div>
                      )}
                      
                      {parsedMessage.requirements && (
                        <div>
                          <strong>Requirements:</strong>
                          <p className="mt-1 text-muted-foreground">{parsedMessage.requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Show grievance form for denied/limited prescriptions */}
          {(insuranceDecision.finalDecision.toLowerCase() === 'denied' || 
            insuranceDecision.finalDecision.toLowerCase() === 'limited') && 
           results.prescriptionId && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    {insuranceDecision.finalDecision.toLowerCase() === 'denied' 
                      ? 'Prescription Denied?' 
                      : 'Limited Coverage?'}
                  </p>
                  <p className="text-xs text-orange-600">
                    You can submit an appeal if you believe this decision needs review.
                  </p>
                </div>
                <GrievanceForm prescriptionId={results.prescriptionId} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Show grievance status if exists */}
      {results.prescriptionId && (
        <GrievanceStatus prescriptionId={results.prescriptionId} />
      )}

      {/* Drug Interactions */}
      <Card className="bg-gradient-card border-0 shadow-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Drug Interaction Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {drugInteractions.interactions.length === 0 ? (
            <div className="flex items-center space-x-3 p-4 bg-success/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-success-foreground">No significant drug interactions detected</span>
            </div>
          ) : (
            <div className="space-y-3">
              {drugInteractions.interactions.map((interaction, index) => {
                const severityVariant = interaction.severity.toLowerCase() === "yellow" ? "yellow" : "red";
                const severityIcon = interaction.severity.toLowerCase() === "yellow" 
                  ? <AlertTriangle className="h-4 w-4 text-warning" />
                  : <XCircle className="h-4 w-4 text-destructive" />;

                return (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {severityIcon}
                        <span className="font-medium">
                          {interaction.drug_pair.join(" + ")}
                        </span>
                      </div>
                      <StatusBadge variant={severityVariant as any}>
                        {interaction.severity} - {interaction.interaction_type}
                      </StatusBadge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <strong>Interaction:</strong> {interaction.description}
                      </p>
                      <p className="text-foreground">
                        <strong>Recommendation:</strong> {interaction.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
        <Button 
          onClick={onReset}
          variant="outline"
          size="lg"
          className="w-full sm:min-w-48 sm:w-auto order-2 sm:order-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          <span className="text-sm sm:text-base">Process Another Prescription</span>
        </Button>
        <Button 
          size="lg"
          className="bg-gradient-primary shadow-medical w-full sm:min-w-48 sm:w-auto order-1 sm:order-2"
          onClick={() => {
            // Save the current result to history and navigate to history tab
            if (onSaveToHistory) {
              onSaveToHistory();
            }
          }}
        >
          <span className="text-sm sm:text-base">Save to History</span>
        </Button>
      </div>
    </div>
  );
};

export default PrescriptionResults;