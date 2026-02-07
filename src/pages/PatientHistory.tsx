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
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 animate-fade-in">
          <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Patient Profile Card */}
        <Card className="mb-6 border-0 shadow-card-medical animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2.5">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span>Patient Profile</span>
                <p className="text-sm font-normal text-muted-foreground">{patientData.patient_name}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold text-sm">{patientData.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Patient ID</p>
                <p className="font-semibold text-sm">{patientData.patient_id}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-0 shadow-card-medical hover-lift animate-fade-in-up">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/10 rounded-lg p-1.5">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Prescriptions</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{patientData.prescriptions.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card-medical hover-lift animate-fade-in-up animation-delay-100">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-success/10 rounded-lg p-1.5">
                  <FileText className="h-4 w-4 text-success" />
                </div>
                <h3 className="font-semibold text-sm">Lab Tests</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{patientData.labTests.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card-medical hover-lift animate-fade-in-up animation-delay-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-warning/10 rounded-lg p-1.5">
                  <Scan className="h-4 w-4 text-warning" />
                </div>
                <h3 className="font-semibold text-sm">Scans</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{patientData.scans.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card-medical hover-lift animate-fade-in-up animation-delay-300">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-destructive/10 rounded-lg p-1.5">
                  <Activity className="h-4 w-4 text-destructive" />
                </div>
                <h3 className="font-semibold text-sm">Claims</h3>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{patientData.kidneyDiagnosis.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="prescriptions" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 h-11">
              <TabsTrigger value="prescriptions" className="text-xs sm:text-sm whitespace-nowrap">Prescriptions</TabsTrigger>
              <TabsTrigger value="lab-tests" className="text-xs sm:text-sm whitespace-nowrap">Lab Tests</TabsTrigger>
              <TabsTrigger value="scans" className="text-xs sm:text-sm whitespace-nowrap">Scans</TabsTrigger>
              <TabsTrigger value="kidney" className="text-xs sm:text-sm whitespace-nowrap">Claims</TabsTrigger>
              <TabsTrigger value="add" className="text-xs sm:text-sm whitespace-nowrap">Add Records</TabsTrigger>
            </TabsList>
          </div>

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
