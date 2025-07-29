import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  TrendingUp,
  Wallet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Award,
  Users,
  Briefcase,
  DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// Worker Jobs Component
const WorkerJobsTab = () => {
  const { user } = useAuth();
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

    const bidData = {
      jobPostingId: selectedJob.id,
      workerId: user.id,
      proposedAmount: parseFloat(bidFormData.proposedAmount),
      estimatedDuration: bidFormData.estimatedDuration,
      proposal: bidFormData.proposal,
    };

    createBidMutation.mutate(bidData);
  };

  const hasAlreadyBid = (jobId: string) => {
    return myBids.some((bid: any) => bid.jobPostingId === jobId);
  };

  const getBudgetRange = (job: any) => {
    if (job.budgetMin && job.budgetMax) {
      return `₹${job.budgetMin} - ₹${job.budgetMax}`;
    } else if (job.budgetMin) {
      return `₹${job.budgetMin}+`;
    } else if (job.budgetMax) {
      return `Up to ₹${job.budgetMax}`;
    }
    return "Budget TBD";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Available Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Available Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : jobPostings.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs available</h3>
              <p className="text-muted-foreground">
                Check back later for new opportunities!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {jobPostings.map((job: any) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.serviceCategory}
                      </p>
                    </div>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                  
                  <p className="text-sm line-clamp-2">
                    {job.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.district?.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {getBudgetRange(job)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {job.client?.firstName} {job.client?.lastName}
                    </div>
                    
                    {hasAlreadyBid(job.id) ? (
                      <Badge variant="secondary">Bid Submitted</Badge>
                    ) : (
                      <Dialog 
                        open={isBidModalOpen && selectedJob?.id === job.id} 
                        onOpenChange={(open) => {
                          setIsBidModalOpen(open);
                          if (!open) {
                            setSelectedJob(null);
                            setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedJob(job)}
                          >
                            Place Bid
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Submit Your Bid</DialogTitle>
                            <DialogDescription>
                              {job.title}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSubmitBid} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="proposedAmount">Your Bid Amount (₹) *</Label>
                              <Input
                                id="proposedAmount"
                                type="number"
                                value={bidFormData.proposedAmount}
                                onChange={(e) => setBidFormData({ ...bidFormData, proposedAmount: e.target.value })}
                                placeholder="Enter your bid amount"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                              <Input
                                id="estimatedDuration"
                                value={bidFormData.estimatedDuration}
                                onChange={(e) => setBidFormData({ ...bidFormData, estimatedDuration: e.target.value })}
                                placeholder="e.g., 2-3 days, 1 week"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="proposal">Your Proposal *</Label>
                              <Textarea
                                id="proposal"
                                value={bidFormData.proposal}
                                onChange={(e) => setBidFormData({ ...bidFormData, proposal: e.target.value })}
                                placeholder="Explain your approach and experience..."
                                rows={4}
                                required
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setIsBidModalOpen(false);
                                  setSelectedJob(null);
                                  setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                className="flex-1"
                                disabled={createBidMutation.isPending}
                              >
                                {createBidMutation.isPending ? "Submitting..." : "Submit Bid"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Bids */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myBids.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
              <p className="text-muted-foreground">
                Start bidding on jobs to see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {myBids.map((bid: any) => (
                <div key={bid.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{bid.jobPosting?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Client: {bid.jobPosting?.client?.firstName} {bid.jobPosting?.client?.lastName}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        bid.status === "pending" ? "default" :
                        bid.status === "accepted" ? "secondary" :
                        "destructive"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { useLocation } from "wouter";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or wrong role
  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "worker") {
    if (user.role === "client") {
      setLocation("/dashboard");
    } else if (user.role === "admin" || user.role === "super_admin") {
      setLocation("/admin-dashboard");
    }
    return null;
  }

  // Fetch worker's bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings/user", user.id, "worker"],
    queryFn: () => fetch(`/api/bookings/user/${user.id}?role=worker`).then(res => res.json())
  });

  // Fetch worker profile
  const { data: workerProfile = {}, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/worker/profile", user.id],
    queryFn: () => fetch(`/api/worker/profile/${user.id}`).then(res => res.json())
  });

  // Update booking status mutation
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
            Manage your services, bookings, and track your earnings.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedBookings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">₹{stats.totalEarnings.toLocaleString()}</p>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
            <TabsTrigger value="jobs">Browse Jobs</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Active Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Active Service Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground">
                      Your bookings will appear here when clients book your services.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold capitalize">
                                {booking.serviceCategory.replace('_', ' ')} Service
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Booking ID: {booking.id.substring(0, 8)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(booking.status)}
                                <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(booking.scheduledDate).toLocaleDateString()} at{' '}
                                {new Date(booking.scheduledDate).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.district?.name || 'Location TBD'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Client: {booking.client?.firstName} {booking.client?.lastName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.client?.mobile}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm p-3 bg-muted/50 rounded-md mb-4">
                            {booking.description}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                              {booking.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusUpdate(booking.id, "accepted")}
                                    disabled={updateBookingMutation.isPending}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                    disabled={updateBookingMutation.isPending}
                                  >
                                    Decline
                                  </Button>
                                </>
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
                            
                            {booking.totalAmount && (
                              <span className="font-semibold text-green-600">
                                ₹{booking.totalAmount}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <WorkerJobsTab />
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold text-green-600">₹{(stats.totalEarnings * 0.7).toFixed(0)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg per Job</p>
                      <p className="text-2xl font-bold">
                        ₹{stats.completedBookings > 0 ? (stats.totalEarnings / stats.completedBookings).toFixed(0) : 0}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion Rate</span>
                      <span>{stats.totalBookings > 0 ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <Progress 
                      value={stats.totalBookings > 0 ? (stats.completedBookings / stats.totalBookings) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Payment Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Gross Earnings:</span>
                          <span>₹{stats.totalEarnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee (15%):</span>
                          <span>-₹{(stats.totalEarnings * 0.15).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Net Earnings:</span>
                          <span className="text-green-600">₹{(stats.totalEarnings * 0.85).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Performance Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Jobs:</span>
                          <span>{stats.totalJobs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Rating:</span>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            {stats.rating}/5.0
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Response Rate:</span>
                          <span>95%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Worker Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-lg font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div>
                      <Label>Primary Service</Label>
                      <p className="text-lg font-medium capitalize">
                        {workerProfile?.primaryService?.replace('_', ' ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label>Experience</Label>
                      <p className="text-lg font-medium">
                        {workerProfile?.experienceYears || 0} years
                      </p>
                    </div>
                    <div>
                      <Label>Hourly Rate</Label>
                      <p className="text-lg font-medium text-green-600">
                        ₹{workerProfile?.hourlyRate || 0}/hour
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Contact Information</Label>
                      <div className="space-y-2 mt-2">
                        <p className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{user.mobile}</span>
                        </p>
                        {user.email && (
                          <p className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Verification Status</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        {workerProfile?.isBackgroundVerified ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Background Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Performance</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{stats.rating}/5.0 rating</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-blue-600" />
                          <span>{stats.totalJobs} jobs completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      checked={workerProfile?.isAvailable || false}
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
    </div>
  );
}
