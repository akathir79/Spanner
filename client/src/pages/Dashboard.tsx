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
  MapPin as MapPinIcon,
  Users,
  DollarSign
} from "lucide-react";
import { useLocation } from "wouter";
import LocationViewer from "@/components/LocationViewer";
// Services and districts are now fetched dynamically from database

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
  const [serviceOpen, setServiceOpen] = useState(false);
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
      toast({
        title: "Success",
        description: "Job posted successfully! Workers can now bid on your job.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
      // Reset form
      setFormData({
        title: "",
        description: "",
        serviceCategory: "",
        districtId: "",
        budgetMin: "",
        budgetMax: "",
        deadline: "",
        requirements: [],
      });
      setNewRequirement("");
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

  const handleLocationFinder = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use real-time district detection
          const nearbyDistrict = await findNearestDistrict(latitude, longitude, districts as any);
          
          if (nearbyDistrict) {
            setFormData(prev => ({ ...prev, districtId: nearbyDistrict.id }));
            toast({
              title: "Location detected",
              description: `Set district to ${nearbyDistrict.name}`,
            });
          } else {
            toast({
              title: "Location outside Tamil Nadu",
              description: "Please select a district manually.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Location processing error:', error);
          toast({
            title: "Location processing failed",
            description: "Please select a district manually.",
            variant: "destructive",
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        let errorMessage = "Could not detect your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "Location access required",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  const findNearestDistrict = async (lat: number, lng: number, districts: any[]) => {
    // Use coordinate-based matching for immediate, reliable results
    return findDistrictByCoordinates(lat, lng, districts);
  };

  const findDistrictByCoordinates = (lat: number, lng: number, districts: any[]) => {
    // Tamil Nadu boundary check
    if (lat < 8.0 || lat > 13.5 || lng < 76.0 || lng > 80.5) {
      return null; // Outside Tamil Nadu
    }
    
    // Precise district coordinate boundaries for accurate detection
    const districtBounds: { [key: string]: { 
      latMin: number; latMax: number; lngMin: number; lngMax: number; center: { lat: number; lng: number } 
    } } = {
      'Chennai': { latMin: 12.74, latMax: 13.35, lngMin: 80.12, lngMax: 80.32, center: { lat: 13.0827, lng: 80.2707 } },
      'Coimbatore': { latMin: 10.75, latMax: 11.40, lngMin: 76.85, lngMax: 77.25, center: { lat: 11.0168, lng: 76.9558 } },
      'Madurai': { latMin: 9.70, latMax: 10.25, lngMin: 77.85, lngMax: 78.35, center: { lat: 9.9252, lng: 78.1198 } },
      'Tiruchirappalli': { latMin: 10.55, latMax: 11.05, lngMin: 78.45, lngMax: 78.95, center: { lat: 10.7905, lng: 78.7047 } },
      'Salem': { latMin: 11.45, latMax: 11.90, lngMin: 77.95, lngMax: 78.35, center: { lat: 11.6643, lng: 78.1460 } },
      'Tirunelveli': { latMin: 8.45, latMax: 8.95, lngMin: 77.45, lngMax: 77.95, center: { lat: 8.7139, lng: 77.7567 } },
      'Vellore': { latMin: 12.65, latMax: 13.15, lngMin: 78.95, lngMax: 79.35, center: { lat: 12.9165, lng: 79.1325 } },
      'Erode': { latMin: 11.15, latMax: 11.55, lngMin: 77.45, lngMax: 77.95, center: { lat: 11.3410, lng: 77.7172 } },
      'Dindigul': { latMin: 10.15, latMax: 10.65, lngMin: 77.75, lngMax: 78.25, center: { lat: 10.3673, lng: 77.9803 } },
      'Thanjavur': { latMin: 10.55, latMax: 11.05, lngMin: 79.05, lngMax: 79.45, center: { lat: 10.7870, lng: 79.1378 } },
      'Kanchipuram': { latMin: 12.55, latMax: 13.05, lngMin: 79.45, lngMax: 79.95, center: { lat: 12.8185, lng: 79.7053 } },
      'Cuddalore': { latMin: 11.45, latMax: 11.95, lngMin: 79.45, lngMax: 79.95, center: { lat: 11.7480, lng: 79.7714 } },
      'Tiruvannamalai': { latMin: 12.05, latMax: 12.45, lngMin: 78.85, lngMax: 79.35, center: { lat: 12.2253, lng: 79.0747 } },
      'Villupuram': { latMin: 11.70, latMax: 12.20, lngMin: 79.25, lngMax: 79.75, center: { lat: 11.9401, lng: 79.4861 } },
      'Karur': { latMin: 10.80, latMax: 11.20, lngMin: 77.85, lngMax: 78.25, center: { lat: 10.9571, lng: 78.0766 } },
      'Sivaganga': { latMin: 9.65, latMax: 10.05, lngMin: 78.25, lngMax: 78.75, center: { lat: 9.8433, lng: 78.4747 } },
      'Virudhunagar': { latMin: 9.35, latMax: 9.85, lngMin: 77.75, lngMax: 78.25, center: { lat: 9.5881, lng: 77.9624 } },
      'Thoothukkudi': { latMin: 8.45, latMax: 8.95, lngMin: 77.95, lngMax: 78.45, center: { lat: 8.7642, lng: 78.1348 } },
      'Nagapattinam': { latMin: 10.45, latMax: 10.95, lngMin: 79.65, lngMax: 80.15, center: { lat: 10.7660, lng: 79.8420 } },
      'Pudukkottai': { latMin: 10.15, latMax: 10.65, lngMin: 78.55, lngMax: 79.05, center: { lat: 10.3833, lng: 78.8200 } },
      'Ramanathapuram': { latMin: 9.15, latMax: 9.65, lngMin: 78.55, lngMax: 79.15, center: { lat: 9.3636, lng: 78.8370 } },
      'Dharmapuri': { latMin: 11.95, latMax: 12.35, lngMin: 77.95, lngMax: 78.35, center: { lat: 12.1357, lng: 78.1580 } },
      'Krishnagiri': { latMin: 12.25, latMax: 12.75, lngMin: 77.95, lngMax: 78.45, center: { lat: 12.5186, lng: 78.2137 } },
      'Ariyalur': { latMin: 10.95, latMax: 11.35, lngMin: 78.85, lngMax: 79.25, center: { lat: 11.1401, lng: 79.0784 } },
      'Namakkal': { latMin: 10.95, latMax: 11.45, lngMin: 77.95, lngMax: 78.35, center: { lat: 11.2189, lng: 78.1677 } },
      'Perambalur': { latMin: 11.05, latMax: 11.45, lngMin: 78.65, lngMax: 79.05, center: { lat: 11.2342, lng: 78.8809 } },
      'Nilgiris': { latMin: 11.15, latMax: 11.65, lngMin: 76.45, lngMax: 76.95, center: { lat: 11.4064, lng: 76.6932 } },
      'Kanyakumari': { latMin: 7.95, latMax: 8.35, lngMin: 77.25, lngMax: 77.75, center: { lat: 8.0883, lng: 77.5385 } },
      'Tiruvallur': { latMin: 12.95, latMax: 13.45, lngMin: 79.65, lngMax: 80.15, center: { lat: 13.1439, lng: 79.9094 } },
      'Tirupur': { latMin: 10.95, latMax: 11.35, lngMin: 77.15, lngMax: 77.55, center: { lat: 11.1085, lng: 77.3411 } },
      'Chengalpattu': { latMin: 12.45, latMax: 12.95, lngMin: 79.75, lngMax: 80.25, center: { lat: 12.6819, lng: 79.9865 } },
      'Tenkasi': { latMin: 8.75, latMax: 9.15, lngMin: 77.05, lngMax: 77.55, center: { lat: 8.9589, lng: 77.3152 } },
      'Tirupathur': { latMin: 12.25, latMax: 12.75, lngMin: 78.35, lngMax: 78.85, center: { lat: 12.4951, lng: 78.5675 } },
      'Ranipet': { latMin: 12.75, latMax: 13.15, lngMin: 79.15, lngMax: 79.55, center: { lat: 12.9249, lng: 79.3389 } },
      'Kallakurichi': { latMin: 11.55, latMax: 11.95, lngMin: 78.75, lngMax: 79.15, center: { lat: 11.7401, lng: 78.9597 } },
      'Mayiladuthurai': { latMin: 10.95, latMax: 11.35, lngMin: 79.45, lngMax: 79.85, center: { lat: 11.1021, lng: 79.6565 } }
    };
    
    // Check if coordinates fall within any district boundary
    for (const district of districts) {
      const bounds = districtBounds[district.name];
      if (bounds && 
          lat >= bounds.latMin && lat <= bounds.latMax && 
          lng >= bounds.lngMin && lng <= bounds.lngMax) {
        return district;
      }
    }
    
    // If no exact match, find nearest district center
    let closestDistrict = null;
    let minDistance = Infinity;
    
    for (const district of districts) {
      const bounds = districtBounds[district.name];
      if (bounds) {
        const distance = Math.sqrt(
          Math.pow(lat - bounds.center.lat, 2) + Math.pow(lng - bounds.center.lng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestDistrict = district;
        }
      }
    }
    
    return closestDistrict;
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
          <Label>Service Type *</Label>
          <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={serviceOpen}
                className="w-full justify-between"
              >
                {formData.serviceCategory
                  ? (services as any)?.find((service: any) => service.name === formData.serviceCategory)?.name
                  : "Select service"}
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
                          setFormData(prev => ({ ...prev, serviceCategory: service.name }));
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
          {formData.serviceCategory && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 px-2 text-xs"
              onClick={() => setFormData(prev => ({ ...prev, serviceCategory: "" }))}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>District *</Label>
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
                {formData.districtId
                  ? (() => {
                      const selectedDistrict = (districts as any)?.find((district: any) => district.id === formData.districtId);
                      return selectedDistrict ? `${selectedDistrict.name}${selectedDistrict.tamilName ? ` (${selectedDistrict.tamilName})` : ''}` : "Select district";
                    })()
                  : "Select district"}
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
                          setFormData(prev => ({ ...prev, districtId: district.id }));
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
          {formData.districtId && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 px-2 text-xs"
              onClick={() => setFormData(prev => ({ ...prev, districtId: "" }))}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
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
  const [selectedJobPosting, setSelectedJobPosting] = useState<any>(null);

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

  // Fetch user's job postings
  const { data: jobPostings = [], isLoading: jobPostingsLoading } = useQuery({
    queryKey: ["/api/job-postings/client", user.id],
    queryFn: () => fetch(`/api/job-postings/client/${user.id}`).then(res => res.json())
  });

  // Fetch bids for selected job posting
  const { data: jobBids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ["/api/bids/job", selectedJobPosting?.id],
    queryFn: () => fetch(`/api/bids/job/${selectedJobPosting.id}`).then(res => res.json()),
    enabled: !!selectedJobPosting?.id
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

  // Delete job posting mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest("DELETE", `/api/job-postings/${jobId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Deleted",
        description: "Your job posting has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user.id] });
      setSelectedJobPosting(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete job posting",
        variant: "destructive",
      });
    },
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const response = await apiRequest("PUT", `/api/bids/${bidId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Accepted",
        description: "The worker has been notified and can now start the job.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/job", selectedJobPosting?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Accept Failed",
        description: error.message || "Failed to accept bid",
        variant: "destructive",
      });
    },
  });

  // Reject bid mutation
  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const response = await apiRequest("PUT", `/api/bids/${bidId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Rejected",
        description: "The worker has been notified that their bid was not selected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/job", selectedJobPosting?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject bid",
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

        {/* Post a New Job Button */}
        <div className="mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Post a New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a New Job</DialogTitle>
                <p className="text-muted-foreground">
                  Get competitive bids from qualified workers across Tamil Nadu
                </p>
              </DialogHeader>
              <JobPostingForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="search">Find Workers</TabsTrigger>
            <TabsTrigger value="jobs">My Jobs/Bids</TabsTrigger>
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
                          
                          {/* Location Tracking for Active Bookings */}
                          {booking.status === "in_progress" && (
                            <div className="mt-4">
                              <LocationViewer
                                bookingId={booking.id}
                                workerName={`${booking.worker?.firstName || 'Worker'} ${booking.worker?.lastName || ''}`}
                                isActive={true}
                              />
                            </div>
                          )}
                          
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
                              ? (() => {
                                  const selectedDistrict = (districts as any)?.find((district: any) => district.id === searchFilters.district);
                                  return selectedDistrict ? `${selectedDistrict.name}${selectedDistrict.tamilName ? ` (${selectedDistrict.tamilName})` : ''}` : "Select District";
                                })()
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

          {/* My Jobs/Bids Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Side - My Job Postings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Job Postings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jobPostingsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-24 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : !jobPostings || jobPostings.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Use the "Post a New Job" button above to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {jobPostings.map((job: any) => (
                        <div 
                          key={job.id} 
                          className={`border rounded-lg p-4 space-y-3 cursor-pointer transition-all hover:shadow-md ${
                            selectedJobPosting?.id === job.id ? 'border-primary ring-2 ring-primary/20' : ''
                          }`}
                          onClick={() => setSelectedJobPosting(job)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{job.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {job.serviceCategory} • {job.district?.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={job.status === "open" ? "bg-green-100 text-green-800" : 
                                          job.status === "closed" ? "bg-gray-100 text-gray-800" : 
                                          job.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                          job.status === "completed" ? "bg-green-100 text-green-800" :
                                          "bg-gray-100 text-gray-800"}
                              >
                                {job.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteJobMutation.mutate(job.id);
                                }}
                                disabled={deleteJobMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Budget: ₹{job.budgetMin} - ₹{job.budgetMax}
                            </span>
                            <span>
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {job.requirements && job.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.requirements.slice(0, 2).map((req: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {req}
                                </Badge>
                              ))}
                              {job.requirements.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{job.requirements.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Side - Job Bids */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {selectedJobPosting ? `Bids for "${selectedJobPosting.title}"` : 'Select a Job to View Bids'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedJobPosting ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a Job Posting</h3>
                      <p className="text-muted-foreground">
                        Click on any job posting from the left to view worker bids.
                      </p>
                    </div>
                  ) : bidsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : !jobBids || jobBids.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                      <p className="text-muted-foreground">
                        Workers will submit bids for this job soon. Check back later!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {jobBids.map((bid: any) => (
                        <div key={bid.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {bid.worker?.firstName} {bid.worker?.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {bid.worker?.workerProfile?.primaryService}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₹{bid.proposedAmount}</p>
                              <p className="text-xs text-muted-foreground">
                                {bid.estimatedDuration}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {bid.proposal}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Submitted {new Date(bid.createdAt).toLocaleDateString()}
                            </span>
                            <Badge 
                              className={bid.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                        bid.status === "accepted" ? "bg-green-100 text-green-800" :
                                        "bg-gray-100 text-gray-800"}
                            >
                              {bid.status}
                            </Badge>
                          </div>
                          
                          {bid.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => acceptBidMutation.mutate(bid.id)}
                                disabled={acceptBidMutation.isPending}
                              >
                                {acceptBidMutation.isPending ? "Accepting..." : "Accept Bid"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex-1"
                                onClick={() => rejectBidMutation.mutate(bid.id)}
                                disabled={rejectBidMutation.isPending}
                              >
                                {rejectBidMutation.isPending ? "Rejecting..." : "Reject Bid"}
                              </Button>
                            </div>
                          )}
                          
                          {bid.status === "accepted" && (
                            <div className="mt-3">
                              <Button size="sm" variant="outline" className="w-full">
                                <Phone className="h-4 w-4 mr-2" />
                                Contact Worker: {bid.worker?.mobile}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
