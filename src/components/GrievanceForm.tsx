import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, Upload, FileText } from 'lucide-react';
import { useGrievances } from '@/hooks/useGrievances';
import { useToast } from '@/hooks/use-toast';

interface GrievanceFormProps {
  prescriptionId: string;
  disabled?: boolean;
}

export const GrievanceForm = ({ prescriptionId, disabled }: GrievanceFormProps) => {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { submitGrievance } = useGrievances();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      toast({
        title: "Error",
        description: "Please provide an explanation for your appeal.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    const result = await submitGrievance(prescriptionId, explanation, file || undefined);
    
    if (result.success) {
      toast({
        title: "Appeal Submitted",
        description: "Your grievance has been submitted successfully. We'll review it and get back to you.",
      });
      setOpen(false);
      setExplanation('');
      setFile(null);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to submit appeal. Please try again.",
        variant: "destructive",
      });
    }
    
    setSubmitting(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Submit Appeal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Insurance Appeal</DialogTitle>
          <DialogDescription>
            If you believe your prescription was incorrectly denied, you can submit an appeal with additional information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="explanation">Explanation *</Label>
            <Textarea
              id="explanation"
              placeholder="Please explain why you believe this prescription should be approved. Include any relevant medical information or circumstances."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[100px] mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="document">Supporting Document (Optional)</Label>
            <div className="mt-2">
              <Input
                id="document"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                className="hidden"
              />
              <Label 
                htmlFor="document" 
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-md cursor-pointer hover:border-muted-foreground/50 transition-colors"
              >
                <div className="text-center">
                  {file ? (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">
                        Click to upload a document<br />
                        <span className="text-xs">(PDF, DOC, Image - Max 10MB)</span>
                      </div>
                    </>
                  )}
                </div>
              </Label>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !explanation.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Appeal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};