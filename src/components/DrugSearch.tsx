import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Drug {
  id: string;
  name: string;
  strength: string;
  generic_name?: string;
}

interface DrugSearchProps {
  onDrugSelect: (drug: { name: string; strength: string }) => void;
}

const DrugSearch = ({ onDrugSelect }: DrugSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [filteredDrugs, setFilteredDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching drugs:', error);
        return;
      }
      
      setDrugs(data || []);
      setFilteredDrugs([]);
    } catch (error) {
      console.error('Error fetching drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setFilteredDrugs([]);
    } else {
      const filtered = drugs.filter(drug =>
        drug.name.toLowerCase().includes(value.toLowerCase()) ||
        drug.generic_name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDrugs(filtered);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Loading medications..."
            disabled
            className="pl-10 border-input"
          />
        </div>
      </div>
    );
  }

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
        
        {/* Search Results */}
        {searchTerm.trim() !== "" && filteredDrugs.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-elevated max-h-60 overflow-y-auto">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                className="p-3 hover:bg-muted border-b last:border-b-0 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{drug.name}</span>
                  <Badge variant="secondary">{drug.strength}</Badge>
                  {drug.generic_name && drug.generic_name !== drug.name && (
                    <span className="text-sm text-muted-foreground">({drug.generic_name})</span>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onDrugSelect({ name: drug.name, strength: drug.strength });
                    setSearchTerm("");
                    setFilteredDrugs([]);
                  }}
                  className="h-8 bg-gradient-primary shadow-medical"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugSearch;