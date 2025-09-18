import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';
import { useGrievances, Grievance } from '@/hooks/useGrievances';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GrievanceStatusProps {
  prescriptionId: string;
}

export const GrievanceStatus = ({ prescriptionId }: GrievanceStatusProps) => {
  const { getGrievanceByPrescription } = useGrievances();
  const { toast } = useToast();
  const grievance = getGrievanceByPrescription(prescriptionId);

  if (!grievance) {
    return null;
  }

  const getStatusIcon = (status: Grievance['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: Grievance['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'approved':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
    }
  };

  const handleDownloadDocument = async () => {
    if (!grievance.document_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('grievance-documents')
        .download(grievance.document_url);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = grievance.document_url.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Appeal Status
              <Badge variant={getStatusVariant(grievance.status)} className="flex items-center gap-1">
                {getStatusIcon(grievance.status)}
                {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Submitted on {new Date(grievance.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Your Explanation:</h4>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
            {grievance.explanation}
          </p>
        </div>

        {grievance.document_url && (
          <div>
            <h4 className="font-medium mb-2">Supporting Document:</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDocument}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Document
            </Button>
          </div>
        )}

        {grievance.reviewed_at && grievance.reviewer_notes && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Review Response:
            </h4>
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-sm text-muted-foreground mb-2">
                {grievance.reviewer_notes}
              </p>
              <p className="text-xs text-muted-foreground">
                Reviewed on {new Date(grievance.reviewed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {grievance.status === 'pending' && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Under Review</span>
            </div>
            Your appeal is being reviewed by our team. We'll update you once a decision has been made.
          </div>
        )}
      </CardContent>
    </Card>
  );
};