import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, User, Pill } from "lucide-react";

// Mock data - in real implementation, this would come from Supabase
const mockHistory = [
  {
    id: "1",
    patientName: "John Doe",
    patientId: "12345678901234",
    submittedAt: "2024-01-15 14:30",
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    insuranceDecision: "approved",
    interactions: 1,
    processingTime: "2.1s",
  },
  {
    id: "2", 
    patientName: "Jane Smith",
    patientId: "23456789012345",
    submittedAt: "2024-01-15 13:15",
    medications: ["Atorvastatin 40mg"],
    insuranceDecision: "limited",
    interactions: 0,
    processingTime: "1.8s",
  },
  {
    id: "3",
    patientName: "Robert Johnson",
    patientId: "34567890123456",
    submittedAt: "2024-01-15 11:45",
    medications: ["Omeprazole 20mg", "Clopidogrel 75mg", "Ibuprofen 400mg"],
    insuranceDecision: "approved",
    interactions: 2,
    processingTime: "3.2s",
  },
];

const PrescriptionHistory = () => {
  const handleViewDetails = (prescriptionId: string) => {
    // TODO: Implement view details functionality
    console.log("Viewing details for:", prescriptionId);
  };

  return (
    <div className="space-y-4">
      {mockHistory.length === 0 ? (
        <Card className="bg-gradient-card border-0 shadow-card-medical">
          <CardContent className="p-8 text-center">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No prescriptions processed yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Submit your first prescription to see it appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockHistory.map((prescription) => (
            <Card key={prescription.id} className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{prescription.patientName}</p>
                      <p className="text-sm text-muted-foreground">ID: {prescription.patientId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{prescription.submittedAt}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Medications:</p>
                    <div className="flex flex-wrap gap-1">
                      {prescription.medications.map((medication, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {medication}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Results:</p>
                    <div className="flex items-center space-x-2">
                      <StatusBadge 
                        variant={prescription.insuranceDecision as any}
                        className="text-xs"
                      >
                        Insurance: {prescription.insuranceDecision.toUpperCase()}
                      </StatusBadge>
                      
                      {prescription.interactions > 0 && (
                        <StatusBadge variant="yellow" className="text-xs">
                          {prescription.interactions} Interaction{prescription.interactions > 1 ? 's' : ''}
                        </StatusBadge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Processing time: <span className="font-medium">{prescription.processingTime}</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(prescription.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Backend Integration Notice */}
      <Card className="border-warning/50 bg-warning/5 mt-6">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Note:</strong> This is demo data. Connect Supabase to store and retrieve 
            real prescription history from your database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionHistory;