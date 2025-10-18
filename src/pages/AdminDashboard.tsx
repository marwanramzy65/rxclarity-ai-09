import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Shield,
    BarChart3,
    History,
    TrendingUp,
    Users,
    User,
    Building2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Pill,
    FileText,
    Eye,
    Edit
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminPrescriptions } from "@/hooks/useAdminPrescriptions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const AdminDashboard = () => {
    const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats();
    const [filterStatus, setFilterStatus] = useState<'all' | 'denied' | 'approved' | 'limited' | 'pending'>('all');
    const { prescriptions, loading: presLoading, error: presError, refreshPrescriptions } = useAdminPrescriptions(filterStatus);
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [statusChangeOpen, setStatusChangeOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const { toast } = useToast();

    const handleStatusChange = async (prescriptionId: string) => {
        if (!newStatus) {
            toast({
                title: "Error",
                description: "Please select a new status",
                variant: "destructive",
            });
            return;
        }

        setUpdatingStatus(true);
        try {
            const { error } = await supabase
                .from('prescriptions')
                .update({
                    insurance_decision: newStatus,
                    insurance_message: statusMessage || null,
                })
                .eq('id', prescriptionId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Prescription status updated successfully",
            });

            // Refresh data
            refreshPrescriptions();
            refetchStats();

            // Close dialog and reset
            setStatusChangeOpen(false);
            setNewStatus('');
            setStatusMessage('');
            setSelectedPrescription(null);
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update status",
                variant: "destructive",
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getInsuranceIcon = (decision: string | null) => {
        switch (decision?.toLowerCase()) {
            case "approved":
                return <CheckCircle className="h-5 w-5 text-success" />;
            case "limited":
                return <AlertTriangle className="h-5 w-5 text-warning" />;
            case "denied":
                return <XCircle className="h-5 w-5 text-destructive" />;
            default:
                return <Clock className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getDecisionVariant = (decision: string | null) => {
        switch (decision?.toLowerCase()) {
            case "approved":
                return "approved";
            case "limited":
                return "limited";
            case "denied":
                return "denied";
            default:
                return "pending";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card shadow-card-medical sticky top-0 z-50">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            <div>
                                <span className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                    Insurance Admin Portal
                                </span>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    Company-wide prescription monitoring and analytics
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* Welcome Section */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Insurance Company Dashboard</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Monitor all prescriptions, appeals, and insurance decisions across all pharmacies and patients
                    </p>
                </div>

                {/* Stats Cards */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="overview" className="flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Statistics</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center space-x-2">
                            <History className="h-4 w-4" />
                            <span>All Prescriptions</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Statistics Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Main Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Total Prescriptions</p>
                                            <p className="text-lg sm:text-2xl font-bold">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.totalPrescriptions}
                                            </p>
                                        </div>
                                        <div className="bg-primary/10 rounded-full p-2 sm:p-3">
                                            <Pill className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
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
                                                {statsLoading ? "..." : statsError ? "Error" : stats.approvedCount}
                                            </p>
                                        </div>
                                        <StatusBadge variant="approved" className="text-xs sm:text-sm">
                                            {statsLoading ? "..." : statsError ? "Error" : `${stats.approvedPercentage}%`}
                                        </StatusBadge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Limited</p>
                                            <p className="text-lg sm:text-2xl font-bold text-warning">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.limitedCount}
                                            </p>
                                        </div>
                                        <StatusBadge variant="limited" className="text-xs sm:text-sm">
                                            {statsLoading ? "..." : statsError ? "Error" : `${stats.limitedPercentage}%`}
                                        </StatusBadge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Denied</p>
                                            <p className="text-lg sm:text-2xl font-bold text-destructive">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.deniedCount}
                                            </p>
                                        </div>
                                        <StatusBadge variant="denied" className="text-xs sm:text-sm">
                                            {statsLoading ? "..." : statsError ? "Error" : `${stats.deniedPercentage}%`}
                                        </StatusBadge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                                            <p className="text-lg sm:text-2xl font-bold text-warning">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.pendingCount}
                                            </p>
                                        </div>
                                        <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-warning" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Secondary Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Total Patients</p>
                                            <p className="text-lg sm:text-2xl font-bold">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.totalPatients}
                                            </p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-full p-2 sm:p-3">
                                            <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Pharmacies</p>
                                            <p className="text-lg sm:text-2xl font-bold">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.totalPharmacies}
                                            </p>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-full p-2 sm:p-3">
                                            <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Total Appeals</p>
                                            <p className="text-lg sm:text-2xl font-bold">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.totalAppeals}
                                            </p>
                                        </div>
                                        <div className="bg-orange-500/10 rounded-full p-2 sm:p-3">
                                            <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-card border-0 shadow-card-medical">
                                <CardContent className="p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">Drug Interactions</p>
                                            <p className="text-lg sm:text-2xl font-bold text-warning">
                                                {statsLoading ? "..." : statsError ? "Error" : stats.interactionsFound}
                                            </p>
                                        </div>
                                        <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-warning" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Appeals Breakdown */}
                        <Card className="shadow-elevated border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Appeals & Grievances Breakdown
                                </CardTitle>
                                <CardDescription>Overview of all appeal statuses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-5 w-5 text-warning" />
                                            <h3 className="font-semibold">Pending Appeals</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-warning">
                                            {statsLoading ? "..." : stats.pendingAppeals}
                                        </p>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="h-5 w-5 text-success" />
                                            <h3 className="font-semibold">Approved Appeals</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-success">
                                            {statsLoading ? "..." : stats.approvedAppeals}
                                        </p>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <XCircle className="h-5 w-5 text-destructive" />
                                            <h3 className="font-semibold">Rejected Appeals</h3>
                                        </div>
                                        <p className="text-3xl font-bold text-destructive">
                                            {statsLoading ? "..." : stats.rejectedAppeals}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                        <Card className="shadow-elevated border-0">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-lg sm:text-xl">All Prescription History</CardTitle>
                                        <CardDescription className="text-sm">
                                            View all prescriptions across all pharmacies and patients, with appeals if available
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('all')}
                                        >
                                            All
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'approved' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('approved')}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approved
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'limited' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('limited')}
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                            Limited
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'denied' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('denied')}
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Denied
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'pending' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('pending')}
                                        >
                                            <Clock className="h-4 w-4 mr-1" />
                                            Pending
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                                {presLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-4 text-muted-foreground">Loading prescriptions...</p>
                                    </div>
                                ) : presError ? (
                                    <div className="text-center py-12">
                                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                                        <p className="text-destructive">Error loading prescriptions: {presError}</p>
                                    </div>
                                ) : prescriptions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No prescriptions found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {prescriptions.map((prescription) => (
                                            <Card key={prescription.id} className="border-l-4" style={{
                                                borderLeftColor:
                                                    prescription.insurance_decision === 'approved' ? '#10b981' :
                                                        prescription.insurance_decision === 'limited' ? '#f59e0b' :
                                                            prescription.insurance_decision === 'denied' ? '#ef4444' : '#94a3b8'
                                            }}>
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            {/* Patient and Date */}
                                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="font-semibold">{prescription.patient_name}</span>
                                                                </div>
                                                                <Badge variant="outline" className="text-xs">
                                                                    ID: {prescription.patient_id}
                                                                </Badge>
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span className="text-xs">
                                                                        {format(new Date(prescription.created_at), 'PPP')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Medications */}
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Medications:</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {prescription.prescription_drugs?.map((pd: any, idx: number) => (
                                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                                            {pd.drugs?.name} {pd.drugs?.strength} (Qty: {pd.quantity})
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Insurance Tier */}
                                                            <div className="flex items-center gap-2">
                                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">Insurance: {prescription.insurance_tier}</span>
                                                            </div>

                                                            {/* Appeals Section */}
                                                            {prescription.grievances && prescription.grievances.length > 0 && (
                                                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                                        <FileText className="h-4 w-4" />
                                                                        Appeals ({prescription.grievances.length})
                                                                    </h4>
                                                                    {prescription.grievances.map((grievance: any) => (
                                                                        <div key={grievance.id} className="mb-2 last:mb-0 p-2 bg-background rounded">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Badge variant={
                                                                                    grievance.status === 'approved' ? 'default' :
                                                                                        grievance.status === 'rejected' ? 'destructive' : 'secondary'
                                                                                } className="text-xs">
                                                                                    {grievance.status}
                                                                                </Badge>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {format(new Date(grievance.created_at), 'PPp')}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                {grievance.explanation}
                                                                            </p>
                                                                            {grievance.ai_decision && (
                                                                                <div className="mt-1 text-xs">
                                                                                    <span className="font-semibold">AI Decision:</span> {grievance.ai_decision}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right Side - Decision and Actions */}
                                                        <div className="flex flex-col items-end gap-2 sm:min-w-[180px]">
                                                            <StatusBadge variant={getDecisionVariant(prescription.insurance_decision) as any}>
                                                                {prescription.insurance_decision || 'Pending'}
                                                            </StatusBadge>

                                                            {prescription.drug_interactions && prescription.drug_interactions.length > 0 && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    {prescription.drug_interactions.length} Interaction(s)
                                                                </Badge>
                                                            )}

                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedPrescription(prescription);
                                                                    setNewStatus(prescription.insurance_decision || '');
                                                                    setStatusMessage(prescription.insurance_message || '');
                                                                    setStatusChangeOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" />
                                                                Change Status
                                                            </Button>

                                                            <Dialog open={detailsOpen && selectedPrescription?.id === prescription.id} onOpenChange={(open) => {
                                                                setDetailsOpen(open);
                                                                if (!open) setSelectedPrescription(null);
                                                            }}>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setSelectedPrescription(prescription)}
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        Details
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Prescription Details</DialogTitle>
                                                                    </DialogHeader>
                                                                    {selectedPrescription && (
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <h4 className="font-semibold mb-2">Patient Information</h4>
                                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                                    <div>
                                                                                        <span className="text-muted-foreground">Name:</span> {selectedPrescription.patient_name}
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-muted-foreground">ID:</span> {selectedPrescription.patient_id}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <h4 className="font-semibold mb-2">Insurance Decision</h4>
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    {getInsuranceIcon(selectedPrescription.insurance_decision)}
                                                                                    <span className="font-medium">
                                                                                        {selectedPrescription.insurance_decision || 'Pending'}
                                                                                    </span>
                                                                                </div>
                                                                                {selectedPrescription.insurance_message && (
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        {selectedPrescription.insurance_message}
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            {selectedPrescription.drug_interactions?.length > 0 && (
                                                                                <div>
                                                                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                                                        <AlertTriangle className="h-4 w-4 text-warning" />
                                                                                        Drug Interactions
                                                                                    </h4>
                                                                                    <div className="space-y-2">
                                                                                        {selectedPrescription.drug_interactions.map((interaction: any, idx: number) => (
                                                                                            <Card key={idx} className="p-3">
                                                                                                <div className="flex items-start gap-2">
                                                                                                    <Badge variant="destructive" className="text-xs">
                                                                                                        {interaction.severity}
                                                                                                    </Badge>
                                                                                                    <div className="flex-1 text-sm">
                                                                                                        <p className="font-medium mb-1">
                                                                                                            {interaction.drug_pair?.join(' + ')}
                                                                                                        </p>
                                                                                                        <p className="text-muted-foreground text-xs">
                                                                                                            {interaction.description}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Card>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Status Change Dialog */}
            <Dialog open={statusChangeOpen} onOpenChange={setStatusChangeOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Change Prescription Status</DialogTitle>
                        <DialogDescription>
                            Update the insurance decision for this prescription
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPrescription && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Patient:</span> {selectedPrescription.patient_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Current Status:</span>{' '}
                                    <span className={
                                        selectedPrescription.insurance_decision === 'approved' ? 'text-success' :
                                            selectedPrescription.insurance_decision === 'limited' ? 'text-warning' :
                                                selectedPrescription.insurance_decision === 'denied' ? 'text-destructive' :
                                                    'text-muted-foreground'
                                    }>
                                        {selectedPrescription.insurance_decision || 'Pending'}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-status">New Status</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger id="new-status">
                                        <SelectValue placeholder="Select new status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="approved">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-success" />
                                                <span>Approved</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="limited">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-warning" />
                                                <span>Limited</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="denied">
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-destructive" />
                                                <span>Denied</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>Pending</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status-message">Status Message (Optional)</Label>
                                <Textarea
                                    id="status-message"
                                    placeholder="Enter a message explaining the decision..."
                                    value={statusMessage}
                                    onChange={(e) => setStatusMessage(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStatusChangeOpen(false);
                                setNewStatus('');
                                setStatusMessage('');
                                setSelectedPrescription(null);
                            }}
                            disabled={updatingStatus}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedPrescription && handleStatusChange(selectedPrescription.id)}
                            disabled={updatingStatus || !newStatus}
                        >
                            {updatingStatus ? 'Updating...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDashboard;
