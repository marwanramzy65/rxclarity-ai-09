import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, User, Eye, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Patients = () => {
  const navigate = useNavigate();
  const { patients, loading, upsertPatient, refetch } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    age: '',
    address: '',
    phone: '',
    email: ''
  });

  const filteredPatients = patients.filter(patient =>
    patient.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPatient(true);

    const { error } = await upsertPatient({
      patient_id: formData.patient_id,
      patient_name: formData.patient_name,
      age: formData.age ? parseInt(formData.age) : undefined,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined
    });

    setIsAddingPatient(false);

    if (error) {
      toast.error('Failed to save patient');
    } else {
      toast.success('Patient saved successfully');
      setFormData({
        patient_id: '',
        patient_name: '',
        age: '',
        address: '',
        phone: '',
        email: ''
      });
      setSelectedPatient(null);
    }
  };

  const openEditDialog = (patient: any) => {
    setSelectedPatient(patient);
    setFormData({
      patient_id: patient.patient_id,
      patient_name: patient.patient_name,
      age: patient.age?.toString() || '',
      address: patient.address || '',
      phone: patient.phone || '',
      email: patient.email || ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Patients</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedPatient(null);
                setFormData({
                  patient_id: '',
                  patient_name: '',
                  age: '',
                  address: '',
                  phone: '',
                  email: ''
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patient_id">Patient ID *</Label>
                    <Input
                      id="patient_id"
                      value={formData.patient_id}
                      onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                      required
                      disabled={!!selectedPatient}
                    />
                  </div>
                  <div>
                    <Label htmlFor="patient_name">Patient Name *</Label>
                    <Input
                      id="patient_name"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isAddingPatient}>
                  {isAddingPatient ? 'Saving...' : 'Save Patient'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <span>{patient.patient_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(patient)}>
                            Edit Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Patient</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="patient_id_edit">Patient ID *</Label>
                                <Input
                                  id="patient_id_edit"
                                  value={formData.patient_id}
                                  disabled
                                />
                              </div>
                              <div>
                                <Label htmlFor="patient_name_edit">Patient Name *</Label>
                                <Input
                                  id="patient_name_edit"
                                  value={formData.patient_name}
                                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="age_edit">Age</Label>
                                <Input
                                  id="age_edit"
                                  type="number"
                                  value={formData.age}
                                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="phone_edit">Phone</Label>
                                <Input
                                  id="phone_edit"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="email_edit">Email</Label>
                                <Input
                                  id="email_edit"
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="address_edit">Address</Label>
                                <Input
                                  id="address_edit"
                                  value={formData.address}
                                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                              </div>
                            </div>
                            <Button type="submit" disabled={isAddingPatient}>
                              {isAddingPatient ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/patient/${patient.patient_id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View History
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Patient ID</p>
                      <p className="font-medium">{patient.patient_id}</p>
                    </div>
                    {patient.age && (
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">{patient.age}</p>
                      </div>
                    )}
                    {patient.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                    )}
                    {patient.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    )}
                    {patient.address && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{patient.address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;
