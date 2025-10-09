import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { AddLabTestForm } from '@/components/AddLabTestForm';
import { AddMedicalScanForm } from '@/components/AddMedicalScanForm';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Pill, FileText, Scan, Activity, ExternalLink, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientHistory() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patientData, loading, error, refetch } = usePatientHistory(patientId || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patient history...</p>
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'Patient not found'}</p>
            <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>

        {/* Patient Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Patient Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{patientData.patient_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="font-semibold">{patientData.patient_id}</p>
              </div>
              {patientData.age && (
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-semibold">{patientData.age} years</p>
                </div>
              )}
              {patientData.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{patientData.phone}</p>
                </div>
              )}
              {patientData.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{patientData.email}</p>
                </div>
              )}
              {patientData.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold">{patientData.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Prescriptions</h3>
              </div>
              <p className="text-3xl font-bold">{patientData.prescriptions.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Lab Tests</h3>
              </div>
              <p className="text-3xl font-bold">{patientData.labTests.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Scan className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Medical Scans</h3>
              </div>
              <p className="text-3xl font-bold">{patientData.scans.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Diagnosis Claims</h3>
              </div>
              <p className="text-3xl font-bold">{patientData.kidneyDiagnosis.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="prescriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="lab-tests">Lab Tests</TabsTrigger>
            <TabsTrigger value="scans">Medical Scans</TabsTrigger>
            <TabsTrigger value="kidney">Diagnosis Claims</TabsTrigger>
            <TabsTrigger value="add">Add Records</TabsTrigger>
          </TabsList>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-4">
            {patientData.prescriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No prescriptions found
                </CardContent>
              </Card>
            ) : (
              patientData.prescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {format(new Date(prescription.created_at), 'PPP')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Insurance: {prescription.insurance_tier}
                        </p>
                      </div>
                      <Badge variant={
                        prescription.insurance_decision === 'approved' ? 'default' :
                        prescription.insurance_decision === 'denied' ? 'destructive' : 'secondary'
                      }>
                        {prescription.insurance_decision === 'approved' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : prescription.insurance_decision === 'denied' ? (
                          <XCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {prescription.insurance_decision || 'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">Medications:</h4>
                    <ul className="space-y-1">
                      {prescription.prescription_drugs?.map((pd: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          • {pd.drugs?.name} {pd.drugs?.strength} - Qty: {pd.quantity}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Lab Tests Tab */}
          <TabsContent value="lab-tests" className="space-y-4">
            {patientData.labTests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No lab tests found
                </CardContent>
              </Card>
            ) : (
              patientData.labTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{test.test_name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(test.test_date), 'PPP')}
                        </p>
                      </div>
                      {test.file_url && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from('lab-tests')
                              .createSignedUrl(test.file_url, 3600);
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View File
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {test.result && (
                      <div>
                        <h4 className="font-semibold text-sm">Result:</h4>
                        <p className="text-sm">{test.result}</p>
                      </div>
                    )}
                    {test.notes && (
                      <div>
                        <h4 className="font-semibold text-sm">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{test.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Medical Scans Tab */}
          <TabsContent value="scans" className="space-y-4">
            {patientData.scans.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No medical scans found
                </CardContent>
              </Card>
            ) : (
              patientData.scans.map((scan) => (
                <Card key={scan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{scan.scan_type}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(scan.scan_date), 'PPP')}
                        </p>
                      </div>
                      {scan.file_url && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from('medical-scans')
                              .createSignedUrl(scan.file_url, 3600);
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View File
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {scan.findings && (
                      <div>
                        <h4 className="font-semibold text-sm">Findings:</h4>
                        <p className="text-sm">{scan.findings}</p>
                      </div>
                    )}
                    {scan.notes && (
                      <div>
                        <h4 className="font-semibold text-sm">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{scan.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Diagnosis Claims Tab */}
          <TabsContent value="kidney" className="space-y-4">
            {patientData.kidneyDiagnosis.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No diagnosis claims found
                </CardContent>
              </Card>
            ) : (
              patientData.kidneyDiagnosis.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Diagnosis Claim</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Created: {format(new Date(claim.created_at), 'PPP')}
                        </p>
                      </div>
                      <Badge variant={
                        claim.status === 'completed' ? 'default' :
                        claim.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {claim.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold">Current Stage: {claim.current_stage}/4</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          {claim.stage_1_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">Stage 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {claim.stage_2_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">Stage 2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {claim.stage_3_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">Stage 3</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {claim.stage_4_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">Stage 4</span>
                        </div>
                      </div>

                      {claim.final_diagnosis && (
                        <div className="pt-2 border-t">
                          <h4 className="font-semibold text-sm mb-1">Final Diagnosis:</h4>
                          <p className="text-sm">{claim.final_diagnosis}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Add Records Tab */}
          <TabsContent value="add" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AddLabTestForm 
                patientId={patientData.patient_id}
                patientName={patientData.patient_name}
                onSuccess={refetch}
              />
              <AddMedicalScanForm 
                patientId={patientData.patient_id}
                patientName={patientData.patient_name}
                onSuccess={refetch}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
