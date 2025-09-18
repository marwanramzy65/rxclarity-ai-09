import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, AlertCircle, Pill, ArrowLeft } from "lucide-react";

interface ExtractedMedication {
  name: string;
  strength: string;
  directions: string;
  found: boolean;
  dbMatch?: {
    id: string;
    name: string;
    strength: string;
    generic_name: string;
  };
}

interface ReviewedMedication extends ExtractedMedication {
  id: string;
  confirmed: boolean;
  quantity: number;
  editedName?: string;
  editedStrength?: string;
  editedDirections?: string;
}

interface MedicationReviewProps {
  medications: ExtractedMedication[];
  onConfirm: (confirmedMedications: ReviewedMedication[]) => void;
  onBack: () => void;
}

const MedicationReview = ({ medications, onConfirm, onBack }: MedicationReviewProps) => {
  const [reviewedMeds, setReviewedMeds] = useState<ReviewedMedication[]>(
    medications.map((med, index) => ({
      ...med,
      id: `reviewed_${index}_${Date.now()}`,
      confirmed: med.found, // Auto-confirm found medications
      quantity: 30,
    }))
  );

  const updateMedication = (id: string, updates: Partial<ReviewedMedication>) => {
    setReviewedMeds(prev => 
      prev.map(med => 
        med.id === id ? { ...med, ...updates } : med
      )
    );
  };

  const toggleConfirmation = (id: string) => {
    setReviewedMeds(prev => 
      prev.map(med => 
        med.id === id ? { ...med, confirmed: !med.confirmed } : med
      )
    );
  };

  const removeMedication = (id: string) => {
    setReviewedMeds(prev => prev.filter(med => med.id !== id));
  };

  const handleConfirm = () => {
    // Only pass confirmed medications for processing
    const confirmedMeds = reviewedMeds.filter(med => med.confirmed);
    onConfirm(confirmedMeds);
  };

  const getStatusBadge = (med: ReviewedMedication) => {
    if (med.confirmed && med.found) {
      return <Badge variant="default" className="bg-success text-success-foreground">Found & Confirmed</Badge>;
    } else if (med.confirmed && !med.found) {
      return <Badge variant="secondary">Confirmed (Not in DB)</Badge>;
    } else if (med.found) {
      return <Badge variant="outline">Found - Needs Review</Badge>;
    } else {
      return <Badge variant="outline" className="border-warning text-warning">Not Found</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-gradient-card border-0 shadow-card-medical">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <div className="flex items-center space-x-2">
              <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>Review Extracted Medications</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-sm text-muted-foreground mb-4">
            Review and confirm the medications extracted from your prescription. 
            Only confirmed items will be processed for drug interactions and insurance checks.
          </div>
          
          <div className="space-y-4">
            {reviewedMeds.map((med, index) => (
              <div key={med.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Medication {index + 1}</span>
                    {getStatusBadge(med)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={med.confirmed ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleConfirmation(med.id)}
                      className={med.confirmed ? "bg-success hover:bg-success/90" : ""}
                    >
                      {med.confirmed ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Confirmed
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(med.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${med.id}`} className="text-sm">Medication Name</Label>
                    <Input
                      id={`name-${med.id}`}
                      value={med.editedName || med.name}
                      onChange={(e) => updateMedication(med.id, { editedName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`strength-${med.id}`} className="text-sm">Strength</Label>
                    <Input
                      id={`strength-${med.id}`}
                      value={med.editedStrength || med.strength}
                      onChange={(e) => updateMedication(med.id, { editedStrength: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${med.id}`} className="text-sm">Quantity</Label>
                    <Input
                      id={`quantity-${med.id}`}
                      type="number"
                      min="1"
                      max="90"
                      value={med.quantity}
                      onChange={(e) => updateMedication(med.id, { quantity: parseInt(e.target.value) || 1 })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`directions-${med.id}`} className="text-sm">Directions</Label>
                  <Textarea
                    id={`directions-${med.id}`}
                    value={med.editedDirections || med.directions}
                    onChange={(e) => updateMedication(med.id, { editedDirections: e.target.value })}
                    className="text-sm resize-none"
                    rows={2}
                  />
                </div>

                {!med.found && (
                  <div className="flex items-start space-x-2 p-3 bg-warning/10 rounded-md">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Not found in database</p>
                      <p className="text-muted-foreground">
                        This medication will be listed in the final report as-is without drug interaction or insurance checks.
                      </p>
                    </div>
                  </div>
                )}

                {med.found && med.dbMatch && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Database match:</span> {med.dbMatch.name} ({med.dbMatch.strength})
                    {med.dbMatch.generic_name && med.dbMatch.generic_name !== med.dbMatch.name && (
                      <span className="ml-2">• Generic: {med.dbMatch.generic_name}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-muted-foreground">
              {reviewedMeds.filter(m => m.confirmed).length} of {reviewedMeds.length} medications confirmed
            </div>
            <Button
              onClick={handleConfirm}
              disabled={reviewedMeds.filter(m => m.confirmed).length === 0}
              className="bg-gradient-primary shadow-medical w-full sm:w-auto"
            >
              Process Confirmed Medications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicationReview;