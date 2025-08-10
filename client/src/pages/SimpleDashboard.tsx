import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Star,
  Building,
  Phone,
  Mail
} from "lucide-react";

// Job posting form component
const JobPostingForm = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    serviceCategory: "",
    serviceAddress: "",
    state: "",
    districtId: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    requirements: [] as string[],
  });
  const [newRequirement, setNewRequirement] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Fetch services and districts
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => 
      fetch("/api/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: "Success", description: "Job posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
      onClose?.();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post job. Please try again.", variant: "destructive" });
    }
  });

  // Auto-detect location
  const handleLocationDetect = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get location details
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&countrycode=IN`
          );
          
          if (!response.ok) {
            throw new Error("Failed to get location details");
          }
          
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const components = result.components;
            
            // Extract state and district
            const state = components.state || components.state_district || "";
            const district = components.state_district || components.county || "";
            const address = result.formatted || "";
            
            setFormData(prev => ({
              ...prev,
              serviceAddress: address,
              state: state,
              districtId: district
            }));
            
            toast({
              title: "Location Detected",
              description: `Location set to ${district}, ${state}`,
            });
          }
        } catch (error) {
          console.error("Location detection error:", error);
          toast({
            title: "Location Error",
            description: "Failed to detect location. Please enter manually.",
            variant: "destructive"
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocationLoading(false);
        toast({
          title: "Location Error",
          description: "Failed to access location. Please enter manually.",
          variant: "destructive"
        });
      }
    );
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.serviceCategory) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const jobData = {
      ...formData,
      clientId: user?.id,
      status: "open",
      budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
      budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
    };

    createJobMutation.mutate(jobData);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Plumbing repair needed urgently"
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your service requirements in detail..."
            rows={4}
          />
        </div>

        <div>
          <Label>Service Category *</Label>
          <Select value={formData.serviceCategory} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceCategory: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select service category" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service: any) => (
                <SelectItem key={service.id} value={service.name}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="address">Service Address</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleLocationDetect}
              disabled={isLocationLoading}
            >
              <MapPin className="h-4 w-4 mr-1" />
              {isLocationLoading ? "Detecting..." : "Detect Location"}
            </Button>
          </div>
          <Input
            id="address"
            value={formData.serviceAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, serviceAddress: e.target.value }))}
            placeholder="Enter your complete address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Min Budget (₹)</Label>
            <Input
              type="number"
              value={formData.budgetMin}
              onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
              placeholder="1000"
            />
          </div>
          <div>
            <Label>Max Budget (₹)</Label>
            <Input
              type="number"
              value={formData.budgetMax}
              onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
              placeholder="5000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
          />
        </div>

        <div>
          <Label>Requirements</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Add a requirement"
              onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            />
            <Button type="button" onClick={addRequirement}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.requirements.map((req, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeRequirement(index)}>
                {req} ×
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={createJobMutation.isPending}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
        </Button>
      </div>
    </div>
  );
};

// Main Dashboard Component
const SimpleDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // Fetch user data
  const { data: jobPostings = [] } = useQuery({
    queryKey: ["/api/job-postings", "client", user?.id],
    enabled: !!user?.id,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/bookings", "user", user?.id],
    enabled: !!user?.id,
  });

  const activeJobs = jobPostings.filter((job: any) => job.status === "open");
  const completedJobs = jobPostings.filter((job: any) => job.status === "completed");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.fullName || user?.username}</h1>
          <p className="text-muted-foreground">Manage your service requests and bookings</p>
        </div>
        <Button 
          onClick={() => setIsJobModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {jobPostings.length > 0 ? (
                <div className="space-y-4">
                  {jobPostings.slice(0, 5).map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">{job.serviceCategory}</p>
                      </div>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity</p>
                  <Button 
                    onClick={() => setIsJobModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Job Postings</CardTitle>
            </CardHeader>
            <CardContent>
              {jobPostings.length > 0 ? (
                <div className="space-y-4">
                  {jobPostings.map((job: any) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {job.serviceCategory}
                            </span>
                            {job.budgetMin && job.budgetMax && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ₹{job.budgetMin} - ₹{job.budgetMax}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.serviceAddress}
                            </span>
                          </div>
                        </div>
                        <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No jobs posted yet</p>
                  <Button 
                    onClick={() => setIsJobModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking: any) => (
                    <div key={booking.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{booking.serviceType}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{booking.serviceAddress}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {booking.scheduledDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₹{booking.amount}
                            </span>
                          </div>
                        </div>
                        <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No bookings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Posting Modal */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
          </DialogHeader>
          <JobPostingForm onClose={() => setIsJobModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleDashboard;