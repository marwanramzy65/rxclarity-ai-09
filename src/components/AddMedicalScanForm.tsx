import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

interface AddMedicalScanFormProps {
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

export const AddMedicalScanForm = ({ patientId, patientName, onSuccess }: AddMedicalScanFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    scan_type: '',
    scan_date: '',
    findings: '',
    notes: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let fileUrl = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('medical-scans')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        fileUrl = fileName;
      }

      // Insert medical scan
      const { error: insertError } = await supabase
        .from('medical_scans')
        .insert({
          user_id: user.id,
          patient_id: patientId,
          patient_name: patientName,
          scan_type: formData.scan_type,
          scan_date: formData.scan_date,
          findings: formData.findings,
          notes: formData.notes,
          file_url: fileUrl
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Medical scan added successfully'
      });

      setFormData({ scan_type: '', scan_date: '', findings: '', notes: '' });
      setFile(null);
      onSuccess();

    } catch (error) {
      console.error('Error adding medical scan:', error);
      toast({
        title: 'Error',
        description: 'Failed to add medical scan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Medical Scan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scan_type">Scan Type *</Label>
            <Input
              id="scan_type"
              value={formData.scan_type}
              onChange={(e) => setFormData({ ...formData, scan_type: e.target.value })}
              placeholder="e.g., X-Ray, CT Scan, MRI"
              required
            />
          </div>

          <div>
            <Label htmlFor="scan_date">Scan Date *</Label>
            <Input
              id="scan_date"
              type="date"
              value={formData.scan_date}
              onChange={(e) => setFormData({ ...formData, scan_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="findings">Findings</Label>
            <Textarea
              id="findings"
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              placeholder="Enter scan findings..."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <Label htmlFor="file">Upload File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.dcm"
            />
            {file && <p className="text-sm text-muted-foreground mt-1">{file.name}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Add Medical Scan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
