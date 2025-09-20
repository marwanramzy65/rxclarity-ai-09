import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, User, LogOut, Plus, History, AlertTriangle, BarChart3, Activity } from "lucide-react";
import PrescriptionForm from "@/components/PrescriptionForm";
import PrescriptionHistory from "@/components/PrescriptionHistory";
import DiagnosisClaimProcess from "@/components/DiagnosisClaimProcess";
import DetailedStatsModal from "@/components/DetailedStatsModal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("new-prescription");
  const [detailedStatsOpen, setDetailedStatsOpen] = useState(false);
  const { stats, loading, error } = useDashboardStats();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card-medical sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Pill className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PharmaVerse
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="truncate max-w-32 lg:max-w-none">{user?.email || 'Pharmacist'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Process prescriptions and review insurance claims efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Today's Claims</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {loading ? "..." : error ? "Error" : stats.todaysClaims}
                  </p>
                </div>
                <div className="bg-primary/10 rounded-full p-2 sm:p-3">
                  <Plus className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                  <p className="text-lg sm:text-2xl font-bold text-success">
                    {loading ? "..." : error ? "Error" : stats.approvedCount}
                  </p>
                </div>
                <StatusBadge variant="approved" className="text-xs sm:text-sm">
                  {loading ? "..." : error ? "Error" : `${stats.approvedPercentage}%`}
                </StatusBadge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Interactions Found</p>
                  <p className="text-lg sm:text-2xl font-bold text-warning">
                    {loading ? "..." : error ? "Error" : stats.interactionsFound}
                  </p>
                </div>
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card-medical">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Avg. Processing Time</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    {loading ? "..." : error ? "Error" : stats.avgProcessingTime}
                  </p>
                </div>
                <div className="bg-success/10 rounded-full p-2 sm:p-3">
                  <History className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View More Analytics Button */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Button 
            variant="outline" 
            onClick={() => setDetailedStatsOpen(true)}
            className="bg-gradient-card border-primary/20 hover:bg-primary/5"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View More Analytics
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="new-prescription" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm">
              <Plus className="h-4 w-4" />
              <span className="">New Prescription</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="diagnosis-claims" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm">
              <Activity className="h-4 w-4" />
              <span>Diagnosis Claims</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-prescription">
            <Card className="shadow-elevated border-0">
              <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-lg sm:text-xl">Submit New Prescription</CardTitle>
                <CardDescription className="text-sm">
                  Enter patient and prescription details for automated insurance processing and drug interaction checks
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <PrescriptionForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="shadow-elevated border-0">
              <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-lg sm:text-xl">Prescription History</CardTitle>
                <CardDescription className="text-sm">
                  View previous prescriptions and their processing results
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <PrescriptionHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnosis-claims">
            <Card className="shadow-elevated border-0">
              <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-lg sm:text-xl">Medical Diagnosis Claims</CardTitle>
                <CardDescription className="text-sm">
                  Manage medical diagnosis claims through the 4-stage workflow process
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                <DiagnosisClaimProcess />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Detailed Stats Modal */}
      <DetailedStatsModal 
        open={detailedStatsOpen} 
        onOpenChange={setDetailedStatsOpen} 
      />
    </div>
  );
};

export default Dashboard;