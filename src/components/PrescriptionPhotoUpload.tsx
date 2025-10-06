import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  similarMatches?: Array<{
    id: string;
    name: string;
    strength: string;
    generic_name: string;
    similarity: number;
  }>;
}

interface PrescriptionPhotoUploadProps {
  onMedicationsExtracted: (medications: ExtractedMedication[]) => void;
  onCancel: () => void;
}

const PrescriptionPhotoUpload = ({ onMedicationsExtracted, onCancel }: PrescriptionPhotoUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);

        try {
          // Call the extract-prescription edge function
          const { data, error } = await supabase.functions.invoke('extract-prescription', {
            body: { imageData }
          });

          if (error) {
            console.error('Error extracting prescription:', error);
            throw new Error(error.message || 'Failed to extract prescription data');
          }

          if (data.success && data.medications) {
            onMedicationsExtracted(data.medications);
            toast({
              title: "Prescription Extracted",
              description: `Found ${data.medications.length} medication(s) in the prescription.`,
            });
          } else {
            throw new Error('No medications found in the image');
          }
        } catch (error) {
          console.error('Error processing prescription:', error);
          toast({
            title: "Processing Error",
            description: error instanceof Error ? error.message : "Failed to process prescription image.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "File Error",
        description: "Failed to read the image file.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-gradient-card border-0 shadow-card-medical">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span>Upload Prescription Photo</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
        {!uploadedImage ? (
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-base font-medium text-foreground mb-2">
              Drop prescription image here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, and other image formats
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded prescription"
                className="w-full max-h-96 object-contain rounded-lg border"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={clearImage}
                className="absolute top-2 right-2"
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Extracting medications from prescription...</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Clear, well-lit photos work best</p>
          <p>• Make sure all text is readable</p>
          <p>• Avoid shadows and glare</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionPhotoUpload;