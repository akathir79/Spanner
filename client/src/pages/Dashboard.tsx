import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  X,
  MapPin as MapPinIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { TAMIL_NADU_DISTRICTS, SERVICE_CATEGORIES } from "@/lib/constants";

// Job posting form component
const JobPostingForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    serviceCategory: "",
    districtId: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    requirements: [] as string[],
  });
  const [newRequirement, setNewRequirement] = useState("");

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
      toast({
        title: "Success",
        description: "Job posted successfully! Workers can now bid on your job.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !formData.title || !formData.description || !formData.serviceCategory || !formData.districtId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const jobData = {
      clientId: user.id,
      title: formData.title,
      description: formData.description,
      serviceCategory: formData.serviceCategory,
      districtId: formData.districtId,
      budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
      budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
      deadline: formData.deadline ? new Date(formData.deadline) : null,
      requirements: formData.requirements,
    };

    createJobMutation.mutate(jobData);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Fix kitchen plumbing leak"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="serviceCategory">Service Type *</Label>
          <Select
            value={formData.serviceCategory}
            onValueChange={(value) => setFormData({ ...formData, serviceCategory: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {(services as any).map((service: any) => (
                <SelectItem key={service.id} value={service.name}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District *</Label>
          <Select
            value={formData.districtId}
            onValueChange={(value) => setFormData({ ...formData, districtId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {(districts as any).map((district: any) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the work needed..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetMin">Min Budget (₹)</Label>
          <Input
            id="budgetMin"
            type="number"
            value={formData.budgetMin}
            onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
            placeholder="500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetMax">Max Budget (₹)</Label>
          <Input
            id="budgetMax"
            type="number"
            value={formData.budgetMax}
            onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
            placeholder="2000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline (Optional)</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Requirements (Optional)</Label>
        <div className="flex gap-2">
          <Input
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            placeholder="Add a requirement..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
          />
          <Button type="button" onClick={addRequirement} size="sm">
            Add
          </Button>
        </div>
        {formData.requirements.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.requirements.map((req, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => removeRequirement(index)}
              >
                {req} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={createJobMutation.isPending}>
        {createJobMutation.isPending ? "Posting..." : "Post Job"}
      </Button>
    </form>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [searchFilters, setSearchFilters] = useState({
    service: "",
    district: "",
    search: "",
    description: ""
  });
  const [serviceOpen, setServiceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Redirect if not authenticated or wrong role
  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "client") {
    if (user.role === "worker") {
      setLocation("/worker-dashboard");
    } else if (user.role === "admin" || user.role === "super_admin") {
      setLocation("/admin-dashboard");
    }
    return null;
  }

  // Fetch user's bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings/user", user.id, "client"],
    queryFn: () => fetch(`/api/bookings/user/${user.id}?role=client`).then(res => res.json())
  });

  // Fetch districts and services
  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
    queryFn: () => fetch("/api/districts").then(res => res.json())
  });

  const { data: rawServices = [] } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => fetch("/api/services").then(res => res.json())
  });

  // Remove duplicate services by name
  const services = rawServices ? 
    (rawServices as any[]).filter((service, index, arr) => 
      arr.findIndex(s => s.name === service.name) === index
    ) : [];

  // Search workers
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ["/api/workers/search", searchFilters.service, searchFilters.district],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchFilters.service) params.append("service", searchFilters.service);
      if (searchFilters.district) params.append("district", searchFilters.district);
      return fetch(`/api/workers/search?${params}`).then(res => res.json());
    },
    enabled: !!(searchFilters.service || searchFilters.district)
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your service request has been sent to the worker.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      setIsBookingModalOpen(false);
      setSelectedWorker(null);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Location detection function
  const handleLocationFinder = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location data');
          }
          
          const data = await response.json();
          
          if (data && data.address) {
            const locationData = data.address;
            const detectedLocation = locationData.state_district || 
                                   locationData.county || 
                                   locationData.city || 
                                   locationData.town ||
                                   locationData.village;
            
            const matchingDistrict = (districts as any)?.find((district: any) => {
              const districtName = district.name.toLowerCase();
              const detectedName = detectedLocation?.toLowerCase() || '';
              return districtName.includes(detectedName) || 
                     detectedName.includes(districtName) ||
                     district.tamilName.includes(detectedLocation);
            });
            
            if (matchingDistrict) {
              setSearchFilters(prev => ({ ...prev, district: matchingDistrict.id }));
              toast({
                title: "Location detected",
                description: `Your district has been set to ${matchingDistrict.name}`,
              });
            } else {
              const chennaiDistrict = (districts as any)?.find((district: any) => 
                district.name.toLowerCase() === "chennai"
              );
              if (chennaiDistrict) {
                setSearchFilters(prev => ({ ...prev, district: chennaiDistrict.id }));
                toast({
                  title: "Location detected",
                  description: "Set to Chennai (nearest major district)",
                });
              } else {
                toast({
                  title: "District not found",
                  description: "Please select your district manually",
                  variant: "destructive",
                });
              }
            }
          }
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: "Location detection failed",
            description: "Please select your district manually",
            variant: "destructive",
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Please enable location access and try again";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const resetSearchForm = () => {
    setSearchFilters({
      service: "",
      district: "",
      search: "",
      description: ""
    });
  };

  const handleCreateBooking = (data: any) => {
    if (!selectedWorker) return;

    createBookingMutation.mutate({
      clientId: user.id,
      workerId: selectedWorker.id,
      serviceCategory: selectedWorker.workerProfile.primaryService,
      description: data.description,
      districtId: user.districtId || selectedWorker.districtId,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
    });
  };

  const handleContactWorker = (worker: any) => {
    setSelectedWorker(worker);
    setIsBookingModalOpen(true);
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

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your bookings and find trusted workers for your service needs.
          </p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="search">Find Workers</TabsTrigger>
            <TabsTrigger value="jobs">Post Job</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>My Service Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by searching for workers and booking your first service.
                    </p>
                    <Button onClick={() => {
                      const searchTab = document.querySelector('[data-state="inactive"][value="search"]') as HTMLElement;
                      if (searchTab) searchTab.click();
                    }}>
                      <Search className="h-4 w-4 mr-2" />
                      Find Workers
                    </Button>
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                          </div>
                          
                          <p className="text-sm mt-3 p-3 bg-muted/50 rounded-md">
                            {booking.description}
                          </p>
                          
                          {booking.totalAmount && (
                            <div className="mt-3 flex justify-between items-center">
                              <span className="font-semibold text-green-600">
                                ₹{booking.totalAmount}
                              </span>
                              <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                                Payment: {booking.paymentStatus}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Find Workers Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Find Workers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Service Type
                      </label>
                      <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={serviceOpen}
                            className="w-full justify-between"
                          >
                            {searchFilters.service
                              ? (services as any)?.find((service: any) => service.id === searchFilters.service)?.name
                              : "Select Service"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search services..." />
                            <CommandList>
                              <CommandEmpty>No service found.</CommandEmpty>
                              <CommandGroup>
                                {(services as any)?.map((service: any) => (
                                  <CommandItem
                                    key={service.id}
                                    value={service.name}
                                    onSelect={() => {
                                      setSearchFilters(prev => ({ ...prev, service: service.id }));
                                      setServiceOpen(false);
                                    }}
                                  >
                                    {service.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {searchFilters.service && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => setSearchFilters(prev => ({ ...prev, service: "" }))}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">
                          District
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleLocationFinder}
                          disabled={isLocationLoading}
                        >
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {isLocationLoading ? "Finding..." : "Use Location"}
                        </Button>
                      </div>
                      <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={districtOpen}
                            className="w-full justify-between"
                          >
                            {searchFilters.district
                              ? (districts as any)?.find((district: any) => district.id === searchFilters.district)?.name
                              : "Select District"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search districts..." />
                            <CommandList>
                              <CommandEmpty>No district found.</CommandEmpty>
                              <CommandGroup>
                                {(districts as any)?.map((district: any) => (
                                  <CommandItem
                                    key={district.id}
                                    value={district.name}
                                    onSelect={() => {
                                      setSearchFilters(prev => ({ ...prev, district: district.id }));
                                      setDistrictOpen(false);
                                    }}
                                  >
                                    {district.name} ({district.tamilName})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {searchFilters.district && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => setSearchFilters(prev => ({ ...prev, district: "" }))}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Input
                      placeholder="Describe your service requirement..."
                      value={searchFilters.description}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Search Workers
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetSearchForm}
                      className="px-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>

                {workersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-64 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !workers || workers.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No workers found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search filters to find workers in your area.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker: any) => (
                      <Card key={worker.id} className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {worker.firstName} {worker.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {worker.workerProfile.primaryService.replace('_', ' ')}
                              </p>
                            </div>
                            {worker.workerProfile.isAvailable && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Available
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{worker.district?.name || 'Multiple districts'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>
                                {worker.workerProfile.rating || '0.0'} ({worker.workerProfile.totalJobs || 0} jobs)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{worker.workerProfile.experienceYears} years experience</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-600">
                              ₹{worker.workerProfile.hourlyRate}/hour
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleContactWorker(worker)}
                              disabled={!worker.workerProfile.isAvailable}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Book Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
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
                      <Label>Mobile Number</Label>
                      <p className="text-lg font-medium flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{user.mobile}</span>
                      </p>
                    </div>
                    {user.email && (
                      <div>
                        <Label>Email Address</Label>
                        <p className="text-lg font-medium flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </p>
                      </div>
                    )}
                    <div>
                      <Label>Account Type</Label>
                      <Badge variant="secondary" className="mt-1">
                        Client Account
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Account Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {user.isVerified ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
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
                      <Label>Member Since</Label>
                      <p className="text-lg font-medium">
                        {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post Job Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Job Posting Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Post a New Job
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Get Competitive Bids</h3>
                    <p className="text-muted-foreground mb-4">
                      Post your job requirements and receive bids from qualified workers across Tamil Nadu.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Job Posting
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Post a New Job</DialogTitle>
                        </DialogHeader>
                        <JobPostingForm />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* My Job Postings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    My Job Postings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
                    <p className="text-muted-foreground">
                      Your posted jobs and received bids will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
          </DialogHeader>
          
          {selectedWorker && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateBooking({
                description: formData.get('description'),
                scheduledDate: formData.get('scheduledDate'),
              });
            }} className="space-y-4">
              <div>
                <Label>Worker</Label>
                <p className="font-medium">
                  {selectedWorker.firstName} {selectedWorker.lastName}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedWorker.workerProfile.primaryService.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <Label htmlFor="scheduledDate">Preferred Date & Time</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Service Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what you need help with..."
                  required
                  rows={3}
                />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <span>Estimated Rate:</span>
                <span className="font-semibold text-green-600">
                  ₹{selectedWorker.workerProfile.hourlyRate}/hour
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    setSelectedWorker(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? "Booking..." : "Book Service"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
