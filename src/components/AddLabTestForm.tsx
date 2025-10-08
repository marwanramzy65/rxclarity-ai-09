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

interface AddLabTestFormProps {
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

export const AddLabTestForm = ({ patientId, patientName, onSuccess }: AddLabTestFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    test_name: '',
    test_date: '',
    result: '',
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
          .from('lab-tests')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        fileUrl = fileName;
      }

      // Insert lab test
      const { error: insertError } = await supabase
        .from('lab_tests')
        .insert({
          user_id: user.id,
          patient_id: patientId,
          patient_name: patientName,
          test_name: formData.test_name,
          test_date: formData.test_date,
          result: formData.result,
          notes: formData.notes,
          file_url: fileUrl
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Lab test added successfully'
      });

      setFormData({ test_name: '', test_date: '', result: '', notes: '' });
      setFile(null);
      onSuccess();

    } catch (error) {
      console.error('Error adding lab test:', error);
      toast({
        title: 'Error',
        description: 'Failed to add lab test',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Lab Test</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="test_name">Test Name *</Label>
            <Input
              id="test_name"
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="test_date">Test Date *</Label>
            <Input
              id="test_date"
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="result">Result</Label>
            <Textarea
              id="result"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              placeholder="Enter test results..."
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
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
                Add Lab Test
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
