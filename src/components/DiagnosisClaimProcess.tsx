import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Check, Clock, FileText, Activity, Stethoscope, ClipboardCheck } from "lucide-react";
import { useDiagnosisClaims, DiagnosisClaim } from "@/hooks/useDiagnosisClaims";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const STAGES = [
  {
    id: 1,
    title: "Physician Requests",
    description: "Upload initial physician request and medical history",
    icon: Stethoscope
  },
  {
    id: 2,
    title: "Lab Test(s) and X-rays",
    description: "Upload laboratory results and diagnostic imaging",
    icon: Activity
  },
  {
    id: 3,
    title: "Physician Revision",
    description: "Upload physician's review and recommendations",
    icon: FileText
  },
  {
    id: 4,
    title: "Final Claim Decision",
    description: "Final diagnosis and treatment plan",
    icon: ClipboardCheck
  }
];

export default function DiagnosisClaimProcess() {
  const { claims, loading, createClaim, updateStage } = useDiagnosisClaims();
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientId, setNewPatientId] = useState("");
  const [uploadingStage, setUploadingStage] = useState<{claimId: string, stage: number} | null>(null);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientId.trim()) {
      toast.error("Please fill in all patient information");
      return;
    }

      try {
        await createClaim(newPatientName.trim(), newPatientId.trim());
        setNewPatientName("");
        setNewPatientId("");
        toast.success("New diagnosis claim created successfully");
      } catch (error) {
        console.error("Error creating claim:", error);
        toast.error("Failed to create claim");
      }
  };

  const handleFileUpload = async (claimId: string, stage: number, file: File) => {
    try {
      setUploadingStage({ claimId, stage });
      
      console.log('Starting file upload:', { claimId, stage, fileName: file.name, fileSize: file.size });
      
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `claims/${claimId}_stage_${stage}_${Date.now()}.${fileExt}`;
      
      console.log('Uploading to storage with filename:', fileName);
      
      const { data, error: uploadError } = await supabase.storage
        .from('grievance-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('grievance-documents')
        .getPublicUrl(fileName);

      console.log('Got public URL:', publicUrl);

      // Update claim stage
      await updateStage(claimId, stage, publicUrl);
      
      toast.success(`Stage ${stage} completed successfully`);
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploadingStage(null);
    }
  };

  const getStageStatus = (claim: DiagnosisClaim, stageId: number) => {
    const completed = claim[`stage_${stageId}_completed` as keyof DiagnosisClaim] as boolean;
    const isCurrent = claim.current_stage === stageId;
    
    if (completed) return 'completed';
    if (isCurrent) return 'current';
    return 'pending';
  };

  const getProgressPercentage = (claim: DiagnosisClaim) => {
    const completedStages = [
      claim.stage_1_completed,
      claim.stage_2_completed,
      claim.stage_3_completed,
      claim.stage_4_completed
    ].filter(Boolean).length;
    
    return (completedStages / 4) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading kidney claims...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Claim Form */}
      <Card className="shadow-elevated border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>New Medical Diagnosis Claim</span>
          </CardTitle>
          <CardDescription>
            Start a new medical diagnosis claim processing workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClaim} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  placeholder="Enter patient ID"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Create New Claim
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Claims */}
      {claims.map((claim) => (
        <Card key={claim.id} className="shadow-elevated border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {claim.patient_name} (ID: {claim.patient_id})
                </CardTitle>
                <CardDescription>
                  Status: {claim.status === 'completed' ? 'Completed' : 'In Progress'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Overall Progress</div>
                <Progress value={getProgressPercentage(claim)} className="w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stage Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {STAGES.map((stage) => {
                const status = getStageStatus(claim, stage.id);
                const Icon = stage.icon;
                const isUploading = uploadingStage?.claimId === claim.id && uploadingStage?.stage === stage.id;
                
                return (
                  <div key={stage.id} className="relative">
                    <div className={`
                      rounded-lg border p-4 text-center transition-all
                      ${status === 'completed' ? 'bg-success/10 border-success/20' : 
                        status === 'current' ? 'bg-primary/10 border-primary/20' : 
                        'bg-muted/50 border-muted'}
                    `}>
                      <div className="flex items-center justify-center mb-2">
                        <div className={`
                          rounded-full p-2
                          ${status === 'completed' ? 'bg-success text-success-foreground' : 
                            status === 'current' ? 'bg-primary text-primary-foreground' : 
                            'bg-muted text-muted-foreground'}
                        `}>
                          {status === 'completed' ? (
                            <Check className="h-4 w-4" />
                          ) : status === 'current' ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{stage.title}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{stage.description}</p>
                      
                      {status === 'current' && !isUploading && (
                        <div>
                          <input
                            type="file"
                            id={`file-${claim.id}-${stage.id}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(claim.id, stage.id, file);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`file-${claim.id}-${stage.id}`)?.click()}
                            className="w-full"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                        </div>
                      )}
                      
                      {isUploading && (
                        <Button variant="outline" size="sm" disabled className="w-full">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                          Uploading...
                        </Button>
                      )}
                      
                      {status === 'completed' && (
                        <div className="text-xs text-success">
                          Completed ✓
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Final Diagnosis */}
            {claim.final_diagnosis && (
              <Card className="bg-gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <span>Final Diagnosis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{claim.final_diagnosis}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ))}
      
      {claims.length === 0 && (
        <Card className="shadow-elevated border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Diagnosis Claims Yet</h3>
            <p className="text-muted-foreground text-center">
              Create your first medical diagnosis claim to start the processing workflow.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}