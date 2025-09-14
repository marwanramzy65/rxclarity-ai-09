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
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        <Input
          placeholder="Search for medications..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 border-input focus:ring-primary h-10 sm:h-auto"
        />
        
        {/* Search Results */}
        {searchTerm.trim() !== "" && filteredDrugs.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[60vh] sm:max-h-60 overflow-y-auto">
            <div className="py-1">
              {filteredDrugs.map((drug) => (
                <div
                  key={drug.id}
                  className="px-3 py-3 sm:py-2 hover:bg-accent/50 border-b border-border/50 last:border-b-0"
                >
                  {/* Mobile-first layout: stack elements vertically */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3">
                    {/* Drug info section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                        <span className="font-medium text-sm sm:text-base text-foreground truncate">{drug.name}</span>
                        {drug.generic_name && drug.generic_name !== drug.name && (
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">({drug.generic_name})</span>
                        )}
                      </div>
                      
                      {/* Strengths as badges with horizontal scroll */}
                      <div className="flex gap-1 mt-1 sm:mt-0 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="flex gap-1 min-w-max">
                          {drug.strength.split(',').map((strength, index) => (
                            <Badge key={index} variant="secondary" className="text-xs whitespace-nowrap flex-shrink-0">
                              {strength.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons section */}
                    <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent sm:overflow-visible">
                      <div className="flex gap-1 min-w-max sm:min-w-0">
                        {drug.strength.split(',').map((strength, index) => (
                          <Button
                            key={index}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onDrugSelect({ name: drug.name, strength: strength.trim() });
                              setSearchTerm("");
                              setFilteredDrugs([]);
                            }}
                            className="h-8 px-2 sm:px-3 text-xs whitespace-nowrap flex-shrink-0 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {strength.trim()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* No results message */}
        {searchTerm.trim() !== "" && filteredDrugs.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No medications found for "{searchTerm}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugSearch;