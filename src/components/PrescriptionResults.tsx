import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Shield, CreditCard } from "lucide-react";

interface PrescriptionResultsProps {
  results: {
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
          
          <Alert className="border-l-4 border-l-primary">
            <AlertDescription className="text-sm">
              {insuranceDecision.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

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
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onReset}
          variant="outline"
          size="lg"
          className="min-w-48"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Process Another Prescription
        </Button>
        <Button 
          size="lg"
          className="bg-gradient-primary shadow-medical min-w-48"
          onClick={() => {
            // Save the current result to history and navigate to history tab
            if (onSaveToHistory) {
              onSaveToHistory();
            }
          }}
        >
          Save to History
        </Button>
      </div>
    </div>
  );
};

export default PrescriptionResults;