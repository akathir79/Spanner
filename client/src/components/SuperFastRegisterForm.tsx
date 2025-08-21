import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { detectStateFromLocation } from "@shared/constants";

// Enhanced Quick Join schema - both client and worker now include address fields for location card functionality
const fastClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^\d+$/, "Mobile number must contain only digits"),
  houseNumber: z.string().min(1, "House number is required"),
  streetName: z.string().min(1, "Street name is required"),
  areaName: z.string().min(1, "Area name is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  pincode: z.string().length(6, "PIN code must be exactly 6 digits").regex(/^\d+$/, "PIN code must contain only digits"),
});

const fastWorkerSchema = fastClientSchema.extend({
  primaryService: z.string().min(1, "Primary service is required"),
});

type FastClientData = z.infer<typeof fastClientSchema>;
type FastWorkerData = z.infer<typeof fastWorkerSchema>;

interface SuperFastRegisterFormProps {
  role: "client" | "worker";
  onComplete: () => void;
  onBack: () => void;
  onStepChange?: (step: "role-selection" | "personal-info" | "contact-info" | "location" | "completion") => void;
  onError?: () => void;
}

export function SuperFastRegisterForm({ role, onComplete, onBack, onStepChange, onError }: SuperFastRegisterFormProps) {
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [mobileAvailability, setMobileAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [hasAutoDetectedLocation, setHasAutoDetectedLocation] = useState(false);
  const [apiDistricts, setApiDistricts] = useState<Array<{id: string, name: string, tamilName?: string}>>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const schema = role === "client" ? fastClientSchema : fastWorkerSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      mobile: "",
      houseNumber: "",
      streetName: "",
      areaName: "",
      state: "",
      district: "",
      pincode: "",
      ...(role === "worker" && { 
        primaryService: "",
      }),
    },
  });

  // Fetch services for worker registration
  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: role === "worker",
  });

  // Mobile availability checking function
  const checkMobileAvailability = async (mobile: string) => {
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, email: "", aadhaarNumber: "", role }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setMobileAvailability(result.mobile ? "available" : "not-available");
      }
    } catch (error) {
      console.error("Error checking mobile availability:", error);
      setMobileAvailability("");
    }
  };

  // Watch for mobile number changes and check availability
  const mobileValue = form.watch("mobile");
  useEffect(() => {
    if (mobileValue && mobileValue.length === 10) {
      setMobileAvailability("checking");
      const timer = setTimeout(() => {
        checkMobileAvailability(mobileValue);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setMobileAvailability("");
    }
  }, [mobileValue, role]);

  // Watch for state changes to load districts (only when manually changed)
  const selectedState = form.watch("state");
  
  useEffect(() => {
    if (selectedState && selectedState !== "Tamil Nadu") { // Avoid auto-fetch for default state
      fetchDistrictsFromAPI(selectedState);
    } else if (selectedState === "Tamil Nadu" && apiDistricts.length === 0) {
      fetchDistrictsFromAPI(selectedState); // Load TN districts only if not already loaded
    }
  }, [selectedState]);

  // API fetching function
  const fetchDistrictsFromAPI = async (stateName: string) => {
    if (isLoadingDistricts) return; // Prevent concurrent calls
    
    setIsLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`SuperFast: Loaded ${data.length} districts for ${stateName}`);
        setApiDistricts(data);
      }
    } catch (error) {
      console.error("SuperFast: Error loading districts:", error);
      setApiDistricts([]);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // Auto-detect location when component mounts - exactly like AuthModal
  useEffect(() => {
    if (!hasAutoDetectedLocation) {
      // Start auto-detection after a short delay to allow form to render
      const timer = setTimeout(() => {
        console.log("SuperFast: Auto-detecting location for", role, "form...");
        handleLocationDetection(true); // Pass true for automatic detection
        setHasAutoDetectedLocation(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasAutoDetectedLocation, role]);

  // Service selection handler
  const handleServiceSelect = (value: string) => {
    if (value === "ADD_NEW_SERVICE") {
      setShowNewServiceInput(true);
      return;
    }
    form.setValue("primaryService", value);
    setShowNewServiceInput(false);
  };

  // Create new service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          description: `${serviceName} services`,
        }),
      });
      if (!response.ok) throw new Error('Failed to create service');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      form.setValue("primaryService", data.name);
      setShowNewServiceInput(false);
      setNewServiceName("");
      toast({
        title: "Service added!",
        description: `${data.name} has been added to the service list.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to add service",
        description: "Please try again or select an existing service.",
        variant: "destructive",
      });
    },
  });

  const handleAddNewService = () => {
    if (!newServiceName.trim()) return;
    createServiceMutation.mutate(newServiceName.trim());
  };

  // Location detection handler - EXACT copy from AuthModal with adaptations for SuperFast form
  const handleLocationDetection = async (isAutomatic: boolean = false) => {
    if (!navigator.geolocation) {
      if (!isAutomatic) {
        toast({
          title: "Location not supported",
          description: "Your browser doesn't support location detection",
          variant: "destructive",
        });
      }
      return;
    }

    setIsDetectingLocation(true);
    
    // Clear current state to ensure fresh data loading - EXACT like AuthModal
    form.setValue("district", "");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log("SuperFast GPS coordinates:", { latitude, longitude });
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) throw new Error('Failed to get location data');
          
          const data = await response.json();
          console.log("SuperFast Nominatim data:", data);
          
          if (data && data.address) {
            const locationData = data.address;
            const detectedLocation = locationData.state_district || 
                                   locationData.county || 
                                   locationData.city || 
                                   locationData.town ||
                                   locationData.village;
            
            // Extract address components - EXACT like AuthModal
            const houseNumber = locationData.house_number || '';
            const streetName = locationData.road || '';
            const areaName = locationData.village || locationData.suburb || locationData.neighbourhood || '';
            
            // Build a more accurate address with better locality detection - EXACT like AuthModal
            const addressParts = [
              houseNumber,
              streetName,
              areaName,
              locationData.city || locationData.town,
              locationData.county
            ].filter(part => part && part.trim() !== '');
            
            const detectedAddress = addressParts.join(', ');
            const detectedPincode = locationData.postcode || '';
            
            // Find matching district with improved logic - including all location components
            let matchingDistrict = null;
            
            // First try to find district from currently loaded districts (if state is already set)
            if (apiDistricts && apiDistricts.length > 0) {
              matchingDistrict = apiDistricts.find((district: any) => {
                const districtName = district.name.toLowerCase();
                const detectedStateDistrict = locationData.state_district?.toLowerCase() || '';
                const detectedCounty = locationData.county?.toLowerCase() || '';
                const detectedCity = locationData.city?.toLowerCase() || '';
                
                // Priority 1: Exact match with state_district (most reliable for Indian addresses)
                if (districtName === detectedStateDistrict) {
                  return true;
                }
                
                // Priority 2: Exact match with county
                if (districtName === detectedCounty) {
                  return true;
                }
                
                // Priority 3: Check if state_district contains district name
                if (detectedStateDistrict && detectedStateDistrict.includes(districtName)) {
                  return true;
                }
                
                // Priority 4: Check if county contains district name  
                if (detectedCounty && detectedCounty.includes(districtName)) {
                  return true;
                }
                
                // Priority 5: Check city match
                if (districtName === detectedCity) {
                  return true;
                }
                
                // Priority 6: Check Tamil name matches
                if (district.tamilName?.toLowerCase() === detectedStateDistrict ||
                    district.tamilName?.toLowerCase() === detectedCounty) {
                  return true;
                }
                
                return false;
              });
            } else {
              // If no districts loaded yet, create a temporary district object using most reliable data
              const tempDistrictName = locationData.state_district || locationData.county || locationData.city || 'Unknown';
              matchingDistrict = {
                id: tempDistrictName.toLowerCase().replace(/\s+/g, '') || 'temp',
                name: tempDistrictName,
                isTemporary: true
              };
            }
            
            // Update form with detected data - EXACT like AuthModal
            if (houseNumber) form.setValue("houseNumber", houseNumber);
            if (streetName) form.setValue("streetName", streetName);
            if (areaName) form.setValue("areaName", areaName);
            if (detectedPincode) form.setValue("pincode", detectedPincode);
            
            // Detect state from location data - EXACT like AuthModal
            const detectedState = detectStateFromLocation(locationData);
            
            // Set state first to trigger district loading
            form.setValue("state", detectedState);
            console.log("SuperFast: State set to:", detectedState);
            
            // Load districts and match - ONE-TIME fetch only
            if (detectedState) {
              try {
                console.log('SuperFast: Loading districts for state:', detectedState);
                const response = await fetch(`/api/districts/${encodeURIComponent(detectedState)}`);
                if (response.ok) {
                  const districtsData = await response.json();
                  if (Array.isArray(districtsData) && districtsData.length > 0) {
                    console.log('SuperFast: Districts loaded successfully:', districtsData.length);
                    
                    // Find matching district with the fresh data (no state update to prevent loops)
                    const finalMatchingDistrict = districtsData.find((district: any) => {
                      const districtName = district.name.toLowerCase();
                      const detectedStateDistrict = locationData.state_district?.toLowerCase() || '';
                      const detectedCounty = locationData.county?.toLowerCase() || '';
                      const detectedCity = locationData.city?.toLowerCase() || '';
                      
                      // Priority 1: Exact match with state_district (most reliable for Indian addresses)
                      if (districtName === detectedStateDistrict) {
                        return true;
                      }
                      
                      // Priority 2: Exact match with county
                      if (districtName === detectedCounty) {
                        return true;
                      }
                      
                      // Priority 3: Check if state_district contains district name
                      if (detectedStateDistrict && detectedStateDistrict.includes(districtName)) {
                        return true;
                      }
                      
                      // Priority 4: Check if county contains district name  
                      if (detectedCounty && detectedCounty.includes(districtName)) {
                        return true;
                      }
                      
                      // Priority 5: Check city match
                      if (districtName === detectedCity) {
                        return true;
                      }
                      
                      // Priority 6: Check Tamil name matches
                      if (district.tamilName?.toLowerCase() === detectedStateDistrict ||
                          district.tamilName?.toLowerCase() === detectedCounty) {
                        return true;
                      }
                      
                      return false;
                    });
                    
                    if (finalMatchingDistrict) {
                      form.setValue("district", finalMatchingDistrict.name);
                      console.log("SuperFast: Final district set to:", finalMatchingDistrict.name);
                      
                      if (!isAutomatic) {
                        toast({
                          title: "Location detected successfully!",
                          description: `Set to ${detectedState}, ${finalMatchingDistrict.name}`,
                        });
                      }
                    } else {
                      console.log("SuperFast: No matching district found for location:", detectedLocation);
                      if (!isAutomatic) {
                        toast({
                          title: "Location partially detected",
                          description: "Please verify and select your district manually.",
                        });
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("SuperFast: Error loading districts for state:", detectedState, error);
                if (!isAutomatic) {
                  toast({
                    title: "Location partially detected",
                    description: "Please select your district manually.",
                    variant: "destructive",
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error("SuperFast: Location detection error:", error);
          if (!isAutomatic) {
            toast({
              title: "Location detection failed",
              description: "Please enter your address manually.",
              variant: "destructive",
            });
          }
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("SuperFast: Geolocation error:", error);
        if (!isAutomatic) {
          toast({
            title: "Location access denied",
            description: "Please enter your address manually.",
            variant: "destructive",
          });
        }
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };



  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: FastClientData | FastWorkerData) => {
      const endpoint = role === "client" ? "/api/auth/signup/client" : "/api/auth/signup/worker";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          role,
          lastName: "UPDATE_REQUIRED", // Mark for update
          // Address will be collected during job posting for clients, from form for workers
          houseNumber: role === "worker" ? (data as FastWorkerData).houseNumber : "COLLECT_DURING_POSTING",
          streetName: role === "worker" ? (data as FastWorkerData).streetName : "COLLECT_DURING_POSTING", 
          areaName: role === "worker" ? (data as FastWorkerData).areaName : "COLLECT_DURING_POSTING",
          district: role === "worker" ? (data as FastWorkerData).district : "COLLECT_DURING_POSTING",
          state: role === "worker" ? (data as FastWorkerData).state : "COLLECT_DURING_POSTING",
          pincode: role === "worker" ? (data as FastWorkerData).pincode : "COLLECT_DURING_POSTING",
          fullAddress: role === "worker" ? `${(data as FastWorkerData).houseNumber}, ${(data as FastWorkerData).streetName}, ${(data as FastWorkerData).areaName}, ${(data as FastWorkerData).district}, ${(data as FastWorkerData).state} - ${(data as FastWorkerData).pincode}` : "COLLECT_DURING_POSTING",
          email: "", // Will be requested in dashboard

          // Worker-specific required fields with defaults for quick registration
          ...(role === "worker" && {
            aadhaarNumber: "000000000000", // Placeholder - to be updated in dashboard
            experienceYears: 1, // Default - to be updated in dashboard  
            hourlyRate: 100, // Default rate - to be updated in dashboard
            serviceDistricts: [(data as FastWorkerData).district], // Use selected district
            skills: [(data as FastWorkerData).primaryService || "General"], // Use primary service as default skill
          })
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Registration failed";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: `Welcome to SPANNER! Your address will be collected when you post your first job.`,
      });
      onComplete();
    },
    onError: (error: any) => {
      onError?.();
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FastClientData | FastWorkerData) => {
    // Additional validation for mobile availability
    if (mobileAvailability === "not-available") {
      toast({
        title: "Mobile number not available",
        description: "This mobile number is already registered. Please use a different number.",
        variant: "destructive",
      });
      return;
    }
    
    if (mobileAvailability === "checking") {
      toast({
        title: "Please wait",
        description: "Still checking mobile number availability...",
        variant: "destructive",
      });
      return;
    }

    if (onStepChange) {
      onStepChange("completion");
    }
    registerMutation.mutate(data);
  };

  return (
    <div className="space-y-3 -mt-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between pb-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-gray-100 flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center flex-1">
          <h3 className="font-semibold text-gray-800">
            {role === "client" ? "Client" : "Worker"} Registration
          </h3>
          <p className="text-xs text-gray-500">Quick and simple signup</p>
        </div>
        <div className="w-8 flex-shrink-0"></div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mobile */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Enter 10-digit mobile number" 
                      {...field}
                      className={mobileAvailability === "not-available" ? "border-red-500" : ""}
                      maxLength={10}
                    />
                    {mobileAvailability === "checking" && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {mobileAvailability === "available" && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                        ✓
                      </div>
                    )}
                    {mobileAvailability === "not-available" && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                        ✗
                      </div>
                    )}
                  </div>
                </FormControl>
                {mobileAvailability === "not-available" && (
                  <p className="text-xs text-red-600 mt-1">Mobile number not available</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service Type for Worker */}
          {role === "worker" && (
            <FormField
              control={form.control}
              name="primaryService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Service</FormLabel>
                  {!showNewServiceInput ? (
                    <Select 
                      value={field.value} 
                      onValueChange={handleServiceSelect}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(services) ? services.map((service: any) => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name}
                          </SelectItem>
                        )) : [
                          <SelectItem key="plumbing" value="Plumbing">Plumbing</SelectItem>,
                          <SelectItem key="electrical" value="Electrical">Electrical</SelectItem>,
                          <SelectItem key="painting" value="Painting">Painting</SelectItem>,
                          <SelectItem key="cleaning" value="Cleaning">Cleaning</SelectItem>,
                          <SelectItem key="carpentry" value="Carpentry">Carpentry</SelectItem>,
                          <SelectItem key="ac-repair" value="AC Repair">AC Repair</SelectItem>
                        ]}
                        <SelectItem value="ADD_NEW_SERVICE" className="text-blue-600 font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Service
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Enter new service name (e.g., Home Repair, HVAC Service)"
                        className="w-full"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewService();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewService}
                          disabled={createServiceMutation.isPending || !newServiceName.trim()}
                          className="flex-1"
                        >
                          {createServiceMutation.isPending ? "Adding..." : "Add Service"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewServiceInput(false);
                            setNewServiceName("");
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add a new service that doesn't exist in the current list
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Address Form for Both Client and Worker */}
          <AddressForm
            form={form}
            isDetecting={isDetectingLocation}
            onDetect={handleLocationDetection}
            autoDetectOnMount={true}
            className="border rounded-lg p-4 bg-gray-50"
          />

          {/* Registration note */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              📍 {role === "worker" 
                ? "Your address helps clients find you for local service requests. Location detected automatically!"
                : "Your address is collected for security and accurate service delivery. Location detected automatically!"
              }
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              registerMutation.isPending || 
              mobileAvailability === "not-available" || 
              mobileAvailability === "checking" ||
              !mobileValue ||
              mobileValue.length !== 10
            }
          >
            {registerMutation.isPending 
              ? "Creating Account..." 
              : mobileAvailability === "checking"
              ? "Checking availability..."
              : `Join as ${role === "client" ? "Client" : "Worker"}`
            }
          </Button>
        </form>
      </Form>
    </div>
  );
}