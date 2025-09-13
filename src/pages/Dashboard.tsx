import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, User, LogOut, Plus, History, AlertTriangle } from "lucide-react";
import PrescriptionForm from "@/components/PrescriptionForm";
import PrescriptionHistory from "@/components/PrescriptionHistory";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("new-prescription");

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card-medical sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pill className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PharmaVerse
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.email || 'Pharmacist'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Process prescriptions and review insurance claims efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Claims</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="bg-primary/10 rounded-full p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">18</p>
                </div>
                <StatusBadge variant="approved">75%</StatusBadge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interactions Found</p>
                  <p className="text-2xl font-bold text-warning">3</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Processing Time</p>
                  <p className="text-2xl font-bold">2.4s</p>
                </div>
                <div className="bg-success/10 rounded-full p-3">
                  <History className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-prescription" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Prescription</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-prescription">
            <Card className="shadow-elevated border-0">
              <CardHeader>
                <CardTitle>Submit New Prescription</CardTitle>
                <CardDescription>
                  Enter patient and prescription details for automated insurance processing and drug interaction checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrescriptionForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="shadow-elevated border-0">
              <CardHeader>
                <CardTitle>Prescription History</CardTitle>
                <CardDescription>
                  View previous prescriptions and their processing results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrescriptionHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;