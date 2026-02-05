import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Calendar, User, Pill, AlertTriangle, CheckCircle, Clock, CreditCard, Shield, FileText, XCircle, History } from "lucide-react";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { GrievanceForm } from "@/components/GrievanceForm";
import { GrievanceStatus } from "@/components/GrievanceStatus";
import { useNavigate } from "react-router-dom";

const PrescriptionHistory = () => {
  const { prescriptions, loading, error } = usePrescriptions();
  const navigate = useNavigate();
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getInsuranceIcon = (decision: string | null) => {
    switch (decision?.toLowerCase()) {
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

  const parseInsuranceMessage = (message: string | null) => {
    if (!message) return { summary: "No message available", fullMessage: "" };
    
    try {
      const lines = message.split(/\n|\./).filter(line => line.trim());
      const summary = lines[0]?.trim() || message;
      
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/patient/${prescription.patient_id}`)}
                        className="ml-2"
                      >
                        <History className="h-4 w-4 mr-1" />
                        View History
                      </Button>
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
                    <Dialog 
                      open={detailsOpen && selectedPrescription?.id === prescription.id} 
                      onOpenChange={(open) => {
                        setDetailsOpen(open);
                        if (!open) setSelectedPrescription(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPrescription(prescription)}
                          className="bg-white/50 hover:bg-white/80"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span>Prescription Details - {prescription.patient_name}</span>
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 mt-6">
                          {/* Patient Information */}
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-3 flex items-center space-x-2">
                              <User className="h-5 w-5 text-primary" />
                              <span>Patient Information</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Name:</strong> {prescription.patient_name}
                              </div>
                              <div>
                                <strong>Patient ID:</strong> {prescription.patient_id}
                              </div>
                              <div>
                                <strong>Insurance Tier:</strong> {prescription.insurance_tier}
                              </div>
                              <div>
                                <strong>Date:</strong> {new Date(prescription.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Medications */}
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-3 flex items-center space-x-2">
                              <Pill className="h-5 w-5 text-primary" />
                              <span>Prescribed Medications</span>
                            </h4>
                            <div className="space-y-2">
                              {prescription.prescription_drugs.map((pd: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                                  <div>
                                    <span className="font-medium">{pd.drugs.name}</span>
                                    <Badge variant="secondary" className="ml-2">{pd.drugs.strength}</Badge>
                                    {pd.drugs.generic_name && pd.drugs.generic_name !== pd.drugs.name && (
                                      <span className="text-sm text-muted-foreground ml-2">({pd.drugs.generic_name})</span>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground">Quantity: {pd.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Insurance Decision */}
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-3 flex items-center space-x-2">
                              <CreditCard className="h-5 w-5 text-primary" />
                              <span>Insurance Decision</span>
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                {getInsuranceIcon(prescription.insurance_decision)}
                                <span className="font-medium capitalize">
                                  {prescription.insurance_decision || 'No decision recorded'}
                                </span>
                                <StatusBadge variant={getDecisionVariant(prescription.insurance_decision) as any}>
                                  {(prescription.insurance_decision || 'Pending').toUpperCase()}
                                </StatusBadge>
                              </div>
                              
                              {prescription.insurance_message && (
                                <>
                                  {(() => {
                                    const parsed = parseInsuranceMessage(prescription.insurance_message);
                                    return (
                                      <div className="space-y-2">
                                        <div className="p-3 bg-background rounded">
                                          <p className="text-sm font-medium">{parsed.summary}</p>
                                        </div>
                                        
                                        {parsed.coverage && (
                                          <div className="flex items-start space-x-2 text-sm">
                                            <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{parsed.coverage}</span>
                                          </div>
                                        )}
                                        
                                        {parsed.requirements && (
                                          <div className="flex items-start space-x-2 text-sm">
                                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{parsed.requirements}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                              
                              {/* Show grievance form for denied/limited prescriptions */}
                              {(prescription.insurance_decision?.toLowerCase() === 'denied' || 
                                prescription.insurance_decision?.toLowerCase() === 'limited') && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-orange-800 mb-1">
                                        {prescription.insurance_decision?.toLowerCase() === 'denied' 
                                          ? 'Prescription Denied?' 
                                          : 'Limited Coverage?'}
                                      </p>
                                      <p className="text-xs text-orange-600">
                                        Submit an appeal if you believe this decision needs review.
                                      </p>
                                    </div>
                                    <GrievanceForm prescriptionId={prescription.id} />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Show grievance status if exists */}
                            <GrievanceStatus prescriptionId={prescription.id} />
                          </div>

                          {/* Drug Interactions */}
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-3 flex items-center space-x-2">
                              <Shield className="h-5 w-5 text-primary" />
                              <span>Drug Interaction Analysis</span>
                            </h4>
                            {prescription.drug_interactions.length === 0 ? (
                              <div className="flex items-center space-x-3 p-4 bg-success/10 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-success" />
                                <span className="text-success-foreground">No significant drug interactions detected</span>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {prescription.drug_interactions.map((interaction: any, index: number) => {
                                  const severityVariant = interaction.severity?.toLowerCase() === "yellow" ? "yellow" : "red";
                                  const severityIcon = interaction.severity?.toLowerCase() === "yellow" 
                                    ? <AlertTriangle className="h-4 w-4 text-warning" />
                                    : <XCircle className="h-4 w-4 text-destructive" />;
                                  
                                  // Build drug pair string from drug1_name and drug2_name or drug_pair array
                                  const drugPairStr = interaction.drug_pair && Array.isArray(interaction.drug_pair) && interaction.drug_pair.length > 0
                                    ? interaction.drug_pair.join(' + ')
                                    : `${interaction.drug1_name || ''} + ${interaction.drug2_name || ''}`;

                                  return (
                                    <div key={index} className="p-4 bg-background border rounded-lg space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          {severityIcon}
                                          <span className="font-medium">
                                            {drugPairStr}
                                          </span>
                                        </div>
                                        <StatusBadge variant={severityVariant as any}>
                                          {interaction.severity} - {interaction.interaction_type || 'Interaction'}
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
                          </div>

                          {/* Processing Information */}
                          {prescription.processing_time && (
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <h4 className="font-semibold mb-3 flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <span>Processing Information</span>
                              </h4>
                              <div className="text-sm">
                                <strong>Processing Time:</strong> {prescription.processing_time}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
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