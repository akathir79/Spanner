import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
// Removed useLanguage import as it's not being used
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  MapPin, 
  Star, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Users,
  Settings,
  Briefcase,
  CreditCard,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Eye,
  EyeOff,
  Plus,
  FileText,
  Filter,
  Ban
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LocationTracker from "@/components/LocationTracker";
import BankDetailsModal from "@/components/BankDetailsModal";
import { format } from "date-fns";

// Types
type WorkerBankDetails = {
  id: string;
  workerId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
};

// Bank Details Component - MOVED OUTSIDE MAIN COMPONENT
const BankDetailsCard = ({ user }: { user: any }) => {
  const { toast } = useToast();
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Fetch bank details
  const { data: bankDetails, isLoading: isBankDetailsLoading } = useQuery<WorkerBankDetails>({
    queryKey: ['/api/worker-bank-details', user?.id],
    enabled: !!user?.id,
  });

  if (isBankDetailsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Bank Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading bank details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Bank Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankDetails ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Bank details verified
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Bank Name</Label>
                    <p className="font-medium">{bankDetails.bankName}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Holder</Label>
                    <p className="font-medium">{bankDetails.accountHolderName}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Number</Label>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium font-mono">
                        {showAccountNumber 
                          ? bankDetails.accountNumber 
                          : `${bankDetails.accountNumber.slice(0, 4)}****${bankDetails.accountNumber.slice(-4)}`
                        }
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                      >
                        {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">IFSC Code</Label>
                    <p className="font-medium font-mono">{bankDetails.ifscCode}</p>
                  </div>
                  
                  {bankDetails.upiId && (
                    <div className="md:col-span-2">
                      <Label className="text-sm text-muted-foreground">UPI ID</Label>
                      <p className="font-medium">{bankDetails.upiId}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBankModal(true)}
                    className="w-full"
                  >
                    Update Bank Details
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bank Details Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your bank details to receive payments for completed jobs.
              </p>
              <Button
                onClick={() => setShowBankModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Bank Details</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details Modal */}
      <BankDetailsModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        workerId={user?.id || ""}
        existingDetails={bankDetails}
        onSuccess={() => {
          setShowBankModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/worker-bank-details', user?.id] });
        }}
      />
    </>
  );
};

// Worker Jobs Component - MOVED OUTSIDE MAIN COMPONENT 
const WorkerJobsTab = ({ user }: { user: any }) => {
  const { toast } = useToast();
  
  const [bidFormData, setBidFormData] = useState({
    proposedAmount: "",
    estimatedDuration: "",
    proposal: "",
  });
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  // Fetch available job postings
  const { data: jobPostings = [], isLoading } = useQuery({
    queryKey: ["/api/job-postings"],
    select: (data: any) => data.filter((job: any) => job.status === "open"),
  });

  // Fetch worker's bids
  const { data: myBids = [] } = useQuery<any[]>({
    queryKey: ["/api/bids/worker", user?.id],
    enabled: !!user?.id,
  });

  // Create bid mutation
  const createBidMutation = useMutation({
    mutationFn: (data: any) => 
      fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your bid has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/worker", user?.id] });
      setIsBidModalOpen(false);
      setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
      setSelectedJob(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !selectedJob || !bidFormData.proposedAmount || !bidFormData.proposal) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createBidMutation.mutate({
      jobPostingId: selectedJob.id,
      workerId: user.id,
      proposedAmount: parseFloat(bidFormData.proposedAmount),
      estimatedDuration: bidFormData.estimatedDuration,
      proposal: bidFormData.proposal,
    });
  };

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Available Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Available Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobPostings.length > 0 ? (
            <div className="space-y-4">
              {jobPostings.map((job: any) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>
                    <Badge>₹{job.budget}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedJob(job);
                      setIsBidModalOpen(true);
                    }}
                  >
                    Submit Bid
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No available jobs at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Bids */}
      <Card>
        <CardHeader>
          <CardTitle>My Bids</CardTitle>
        </CardHeader>
        <CardContent>
          {myBids.length > 0 ? (
            <div className="space-y-4">
              {myBids.map((bid: any) => (
                <div key={bid.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{bid.jobPosting?.title || "Job Title"}</h3>
                    <Badge
                      variant={
                        bid.status === "accepted" ? "default" :
                        bid.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {bid.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ₹{bid.proposedAmount}
                    </div>
                    {bid.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {bid.estimatedDuration}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm p-2 bg-muted/50 rounded">
                    {bid.proposal}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bids submitted yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function WorkerDashboard() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC OR RETURNS
  const { user, isLoading: authLoading } = useAuth();
  // Removed useLanguage as it's not needed for this component
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinReason, setRejoinReason] = useState("");

  // Fetch worker's bookings (always call hooks)
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings/user", user?.id, "worker"],
    queryFn: () => fetch(`/api/bookings/user/${user?.id}?role=worker`).then(res => res.json()),
    enabled: !!user?.id && user.role === "worker"
  });

  // Fetch worker profile (always call hooks)
  const { data: workerProfile = {}, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/worker/profile", user?.id],
    queryFn: () => fetch(`/api/worker/profile/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id && user.role === "worker"
  });

  // Update booking status mutation (MUST BE CALLED BEFORE ANY RETURNS)
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Rejoin request mutation
  const rejoinRequestMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiRequest("POST", `/api/worker/rejoin-request/${user?.id}`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Rejoin Request Submitted",
        description: "Your request to rejoin has been submitted to admin for review.",
      });
      setShowRejoinModal(false);
      setRejoinReason("");
      // Refresh user data to show updated status
      queryClient.invalidateQueries({ queryKey: ["/api/user/refresh"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit rejoin request",
        variant: "destructive",
      });
    },
  });

  // Authentication redirect logic in useEffect (MUST BE CALLED BEFORE ANY RETURNS)
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation("/");
      } else if (user.role !== "worker") {
        if (user.role === "client") {
          setLocation("/dashboard");
        } else if (user.role === "admin" || user.role === "super_admin") {
          setLocation("/admin-dashboard");
        }
      }
    }
  }, [user, authLoading, setLocation]);

  // Helper functions
  const handleRejoinRequest = () => {
    console.log("handleRejoinRequest called with reason:", rejoinReason);
    if (!rejoinReason.trim()) {
      console.log("No reason provided, showing error toast");
      toast({
        title: "Reason Required",
        description: "Please provide a reason for your rejoin request.",
        variant: "destructive",
      });
      return;
    }
    console.log("Submitting rejoin request with reason:", rejoinReason.trim());
    rejoinRequestMutation.mutate(rejoinReason.trim());
  };

  const handleStatusUpdate = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "accepted": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "in_progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Now that all hooks are called, we can do conditional checks
  const isWorkerApproved = user?.status === "approved";
  const isWorkerPending = user?.status === "pending";
  const isWorkerRejected = user?.status === "rejected";
  const isWorkerSuspended = user?.status === "suspended";

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if user is null or wrong role
  if (!user || user.role !== "worker") {
    return null;
  }

  // Show suspension notice for suspended workers
  if (isWorkerSuspended) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Your account has been suspended by admin
            </p>
          </div>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                <Ban className="h-5 w-5" />
                <span>Account Suspended</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-orange-700 dark:text-orange-300">
                  Your worker account has been temporarily suspended by an administrator. 
                  You have read-only access to view your profile and previous bookings, 
                  but cannot accept new jobs or update your availability.
                </p>
                <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>What you can do:</strong>
                  </p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                    <li>• View your profile information</li>
                    <li>• Check your booking history</li>
                    <li>• Contact support if you believe this is an error</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    For questions about your suspension, please contact our support team.
                  </p>
                  
                  {user?.hasRejoinRequest ? (
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        Rejoin Request Submitted
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your request to rejoin has been submitted and is under admin review.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        console.log("Rejoin button clicked, opening modal");
                        setShowRejoinModal(true);
                      }}
                      className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Request to Rejoin
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show approval pending state for unapproved workers
  if (isWorkerPending || isWorkerRejected) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Your worker profile is under review
            </p>
          </div>

          {/* Approval Status Card */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              {isWorkerPending && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Clock className="h-6 w-6 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200 text-lg">
                        Admin Will Approve
                      </span>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Your worker application is under review. Please wait for admin approval to access your full dashboard and start receiving service requests.
                    </p>
                  </div>
                </div>
              )}
              
              {isWorkerRejected && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200 text-lg">
                        Application Rejected
                      </span>
                    </div>
                    <p className="text-red-700 dark:text-red-300">
                      Your worker application has been rejected. Please contact admin for more details or to resubmit your application.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uneditable Profile Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Your Profile</span>
                <Badge variant="secondary" className="ml-2">Read Only</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Mobile</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.mobile}
                      </p>
                    </div>
                    {user.email && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-medium p-2 bg-muted rounded border">
                          {user.email}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">District</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.district || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">State</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.state || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Registration Date</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user?.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Worker Profile Information */}
                {workerProfile && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-4">Service Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Primary Service</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            {workerProfile.primaryService || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Experience Years</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            {workerProfile.experienceYears || "0"} years
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            ₹{workerProfile.hourlyRate || "0"}/hour
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Service Districts</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            {Array.isArray(workerProfile.serviceDistricts) 
                              ? workerProfile.serviceDistricts.join(", ") 
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalBookings: bookings?.length || 0,
    pendingBookings: bookings?.filter((b: any) => b.status === "pending").length || 0,
    completedBookings: bookings?.filter((b: any) => b.status === "completed").length || 0,
    totalEarnings: bookings?.filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0), 0) || 0,
    rating: workerProfile?.rating || 0,
    totalJobs: workerProfile?.totalJobs || 0,
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your services and track your earnings from your worker dashboard.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="jobs">Browse Jobs</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{booking.serviceName || "Service"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(booking.status)} mb-1`}>
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium">₹{booking.totalAmount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No bookings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{stats.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Jobs</span>
                      <span className="font-medium">{stats.totalJobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-medium">
                        {stats.totalBookings > 0 
                          ? `${Math.round((stats.completedBookings / stats.totalBookings) * 100)}%`
                          : "0%"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{booking.serviceName || "Service"}</h3>
                            <p className="text-sm text-muted-foreground">{booking.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{booking.status}</span>
                            </Badge>
                            <p className="text-lg font-bold mt-1">₹{booking.totalAmount}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {booking.address}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, "accepted")}
                              disabled={updateBookingMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                              disabled={updateBookingMutation.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        {booking.status === "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, "in_progress")}
                            disabled={updateBookingMutation.isPending}
                          >
                            Start Work
                          </Button>
                        )}
                        
                        {booking.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, "completed")}
                            disabled={updateBookingMutation.isPending}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <WorkerJobsTab user={user} />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Worker Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Image and Basic Info */}
                  <div className="lg:col-span-1">
                    <div className="text-center space-y-4">
                      <Avatar className="h-24 w-24 mx-auto">
                        <AvatarImage src={user.profilePicture} alt={user.firstName} />
                        <AvatarFallback className="text-lg">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{user.mobile}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          ID: {user?.id || "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="lg:col-span-2">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm text-muted-foreground">Verification Status</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {isWorkerApproved ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending Approval
                            </Badge>
                          )}
                          {workerProfile?.workerProfile?.isDocumentVerified ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Documents Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Documents Pending
                            </Badge>
                          )}
                          {workerProfile?.workerProfile?.isAadhaarVerified ? (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aadhaar Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Aadhaar Pending
                            </Badge>
                          )}
                          {workerProfile?.workerProfile?.isBackgroundVerified ? (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Background Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Background Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      {workerProfile?.workerProfile?.skills && workerProfile.workerProfile.skills.length > 0 && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Skills</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(workerProfile.workerProfile.skills || []).map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm text-muted-foreground">Service Areas</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {workerProfile?.workerProfile?.serviceAllAreas ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              All Areas
                            </Badge>
                          ) : (
                            workerProfile?.workerProfile?.serviceAreaNames && workerProfile.workerProfile.serviceAreaNames.length > 0 ? (
                              workerProfile.workerProfile.serviceAreaNames.map((areaName: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {areaName}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                No specific areas selected
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details Section */}
            <BankDetailsCard user={user} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Worker Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Availability Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle your availability to receive new bookings
                      </p>
                    </div>
                    <Switch
                      checked={workerProfile?.workerProfile?.isAvailable || false}
                      onCheckedChange={(checked) => {
                        // TODO: Implement availability toggle
                        toast({
                          title: "Feature Coming Soon",
                          description: "Availability toggle will be implemented soon.",
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base">Service Areas</Label>
                    <p className="text-sm text-muted-foreground">
                      Districts where you provide services
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {workerProfile?.serviceDistricts?.map((districtId: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          District {districtId}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No service areas configured</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base">Skills & Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {workerProfile?.skills?.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No skills added</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejoin Request Modal */}
      <Dialog open={showRejoinModal} onOpenChange={(open) => {
        console.log("Dialog open state changed:", open);
        setShowRejoinModal(open);
      }}>
        <DialogContent className="max-w-md" aria-describedby="rejoin-dialog-description">
          <DialogHeader>
            <DialogTitle>Request to Rejoin</DialogTitle>
            <DialogDescription id="rejoin-dialog-description">
              Please provide a reason for your rejoin request. This will be reviewed by our admin team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejoinReason" className="text-sm font-medium">
                Reason for rejoin request *
              </Label>
              <Textarea
                id="rejoinReason"
                value={rejoinReason}
                onChange={(e) => setRejoinReason(e.target.value)}
                placeholder="Please explain why you believe your account should be reactivated..."
                className="mt-2"
                rows={4}
                disabled={rejoinRequestMutation.isPending}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejoinModal(false);
                setRejoinReason("");
              }}
              disabled={rejoinRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejoinRequest}
              disabled={rejoinRequestMutation.isPending || !rejoinReason.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {rejoinRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}