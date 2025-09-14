import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Search, User, CreditCard, Pill, Loader2 } from "lucide-react";
import DrugSearch from "@/components/DrugSearch";
import PrescriptionResults from "@/components/PrescriptionResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SelectedDrug {
  id: string;
  name: string;
  strength: string;
  quantity: number;
}

const PrescriptionForm = () => {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [insuranceTier, setInsuranceTier] = useState("Standard");
  const [selectedDrugs, setSelectedDrugs] = useState<SelectedDrug[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const addDrug = (drug: { name: string; strength: string }) => {
    const newDrug: SelectedDrug = {
      id: Math.random().toString(36).substr(2, 9),
      name: drug.name,
      strength: drug.strength,
      quantity: 30,
    };
    setSelectedDrugs([...selectedDrugs, newDrug]);
  };

  const removeDrug = (id: string) => {
    setSelectedDrugs(selectedDrugs.filter(drug => drug.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setSelectedDrugs(selectedDrugs.map(drug => 
      drug.id === id ? { ...drug, quantity } : drug
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientName || !patientId || selectedDrugs.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one medication.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call the process-prescription edge function
      const { data, error } = await supabase.functions.invoke('process-prescription', {
        body: {
          patientName,
          patientId,
          insuranceTier,
          selectedDrugs,
        }
      });

      if (error) {
        console.error('Error processing prescription:', error);
        throw new Error(error.message || 'Failed to process prescription');
      }

      // Format the results for the UI
      const results = {
        insuranceDecision: data.insuranceDecision,
        drugInteractions: data.drugInteractions,
        prescriptionId: data.prescriptionId,
        processingTime: data.processingTime
      };
      
      setResults(results);
      
      toast({
        title: "Prescription Processed",
        description: `Insurance and interaction check completed in ${data.processingTime}.`,
      });
    } catch (error) {
      console.error('Error processing prescription:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPatientName("");
    setPatientId("");
    setSelectedDrugs([]);
    setResults(null);
  };

  if (results) {
    return (
      <PrescriptionResults 
        results={results} 
        onReset={resetForm} 
        onSaveToHistory={() => {
          // The prescription is automatically saved in the database
          // Just reset the form and show confirmation
          setResults(null);
          toast({
            title: "Prescription Saved",
            description: "Prescription has been saved to your history.",
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Information */}
        <Card className="bg-gradient-card border-0 shadow-card-medical">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <span>Patient Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient full name"
                  className="border-input focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientId">Government ID (14 digits) *</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                  placeholder="12345678901234"
                  className="border-input focus:ring-primary"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card className="bg-gradient-card border-0 shadow-card-medical">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Insurance Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="insuranceTier">Insurance Tier</Label>
              <select
                id="insuranceTier"
                value={insuranceTier}
                onChange={(e) => setInsuranceTier(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Medications */}
        <Card className="bg-gradient-card border-0 shadow-card-medical">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Pill className="h-5 w-5 text-primary" />
              <span>Prescription Medications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DrugSearch onDrugSelect={addDrug} />
            
            {selectedDrugs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Selected Medications:</h4>
                  {selectedDrugs.map((drug) => (
                    <div key={drug.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{drug.name}</span>
                          <Badge variant="secondary">{drug.strength}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`quantity-${drug.id}`} className="text-xs text-muted-foreground">
                          Qty:
                        </Label>
                        <Input
                          id={`quantity-${drug.id}`}
                          type="number"
                          min="1"
                          max="90"
                          value={drug.quantity}
                          onChange={(e) => updateQuantity(drug.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDrug(drug.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg" 
            className="bg-gradient-primary shadow-medical min-w-48"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Prescription"
            )}
          </Button>
        </div>
      </form>

    </div>
  );
};

export default PrescriptionForm;