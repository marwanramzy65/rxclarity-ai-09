import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, User, Pill, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";

const PrescriptionHistory = () => {
  const { prescriptions, loading, error } = usePrescriptions();

  const handleViewDetails = (prescription: any) => {
    const medications = prescription.prescription_drugs
      .map((pd: any) => `${pd.drugs.name} ${pd.drugs.strength} (Qty: ${pd.quantity})`)
      .join(', ');
    
    const interactions = prescription.drug_interactions.length > 0
      ? prescription.drug_interactions
          .map((interaction: any) => `${interaction.drug_pair.join(' + ')}: ${interaction.severity} - ${interaction.description}`)
          .join('\n')
      : 'No interactions detected';

    alert(`Prescription Details:

Patient: ${prescription.patient_name}
ID: ${prescription.patient_id}
Insurance Tier: ${prescription.insurance_tier}
Medications: ${medications}
Insurance Decision: ${prescription.insurance_decision}
Decision Message: ${prescription.insurance_message || 'N/A'}
Drug Interactions:
${interactions}
Processing Time: ${prescription.processing_time || 'N/A'}
Date: ${new Date(prescription.created_at).toLocaleString()}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading prescription history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive">Error loading prescription history: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Prescription History</h2>
        <p className="text-muted-foreground">
          Review past prescription processing results and decisions
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No History Available</h3>
          <p className="text-muted-foreground">
            Process your first prescription to see results here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => {
            const getDecisionVariant = (decision: string | null) => {
              switch (decision?.toLowerCase()) {
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

            const medications = prescription.prescription_drugs.map(
              (pd) => `${pd.drugs.name} ${pd.drugs.strength}`
            );

            const interactionsSummary = prescription.drug_interactions.length > 0
              ? `${prescription.drug_interactions.length} interaction(s) detected`
              : "No interactions";

            return (
              <Card key={prescription.id} className="bg-gradient-card border-0 shadow-card-medical">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{prescription.patient_name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {prescription.patient_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{prescription.insurance_tier}</Badge>
                      <StatusBadge variant={getDecisionVariant(prescription.insurance_decision) as any}>
                        {prescription.insurance_decision || 'Processing'}
                      </StatusBadge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Medications:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {medications.map((med, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {med}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Interactions:</span>
                        <span className="flex items-center space-x-1">
                          {prescription.drug_interactions.length > 0 ? (
                            <AlertTriangle className="h-3 w-3 text-warning" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-success" />
                          )}
                          <span>{interactionsSummary}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Processing Time:</span>
                        <span>{prescription.processing_time || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(prescription.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(prescription)}
                      className="bg-white/50 hover:bg-white/80"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrescriptionHistory;