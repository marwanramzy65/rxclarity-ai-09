import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

interface Drug {
  id: string;
  name: string;
  brandNames: string[];
  drugClass: string;
  form: string;
  strengths: string[];
}

interface DrugSearchProps {
  onDrugSelect: (drug: { name: string; strength: string }) => void;
}

// Mock drug database - in real implementation, this would come from Supabase
const mockDrugs: Drug[] = [
  {
    id: "1",
    name: "Metformin",
    brandNames: ["Glucophage", "Fortamet"],
    drugClass: "Antidiabetic",
    form: "Tablet",
    strengths: ["500mg", "850mg", "1000mg"],
  },
  {
    id: "2", 
    name: "Lisinopril",
    brandNames: ["Prinivil", "Zestril"],
    drugClass: "ACE Inhibitor",
    form: "Tablet",
    strengths: ["2.5mg", "5mg", "10mg", "20mg"],
  },
  {
    id: "3",
    name: "Atorvastatin",
    brandNames: ["Lipitor"],
    drugClass: "Statin",
    form: "Tablet",
    strengths: ["10mg", "20mg", "40mg", "80mg"],
  },
  {
    id: "4",
    name: "Omeprazole",
    brandNames: ["Prilosec"],
    drugClass: "PPI",
    form: "Capsule",
    strengths: ["20mg", "40mg"],
  },
  {
    id: "5",
    name: "Semaglutide",
    brandNames: ["Ozempic", "Wegovy"],
    drugClass: "GLP-1 Agonist",
    form: "Injection",
    strengths: ["0.25mg", "0.5mg", "1mg", "2mg"],
  },
];

const DrugSearch = ({ onDrugSelect }: DrugSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDrugs, setFilteredDrugs] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length > 1) {
      const filtered = mockDrugs.filter(drug =>
        drug.name.toLowerCase().includes(value.toLowerCase()) ||
        drug.brandNames.some(brand => brand.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredDrugs(filtered);
    } else {
      setFilteredDrugs([]);
    }
    setSelectedDrug(null);
  };

  const handleDrugSelect = (drug: Drug) => {
    setSelectedDrug(drug);
    setSearchTerm(drug.name);
    setFilteredDrugs([]);
  };

  const handleAddDrug = (strength: string) => {
    if (selectedDrug) {
      onDrugSelect({
        name: selectedDrug.name,
        strength: strength,
      });
      setSearchTerm("");
      setSelectedDrug(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for medications..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 border-input focus:ring-primary"
        />
        
        {/* Search Results Dropdown */}
        {filteredDrugs.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-elevated max-h-60 overflow-y-auto">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                onClick={() => handleDrugSelect(drug)}
                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{drug.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{drug.drugClass}</Badge>
                      <Badge variant="outline" className="text-xs">{drug.form}</Badge>
                    </div>
                    {drug.brandNames.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Brands: {drug.brandNames.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Drug Strengths */}
      {selectedDrug && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Select strength for {selectedDrug.name}:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedDrug.strengths.map((strength) => (
                <Button
                  key={strength}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddDrug(strength)}
                  className="flex items-center space-x-1 hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="h-3 w-3" />
                  <span>{strength}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugSearch;