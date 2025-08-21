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
import { ChevronLeft, Plus, ChevronDown, MapPin } from "lucide-react";
// Removed AddressForm import - using manual fields to prevent infinite loops
import { detectStateFromLocation, INDIAN_STATES_AND_UTS } from "@shared/constants";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import statesDistrictsData from "@shared/states-districts.json";

// Quick Join schema - complete address like normal registration
const fastClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^\d+$/, "Mobile number must contain only digits"),
  houseNumber: z.string().min(1, "House number is required"),
  streetName: z.string().min(1, "Street name is required"),
  areaName: z.string().min(1, "Area name is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
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
  const [mobileAvailability, setMobileAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [apiDistricts, setApiDistricts] = useState<Array<{id: string, name: string, tamilName?: string}>>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [districtPopoverOpen, setDistrictPopoverOpen] = useState(false);
  const [districtSearchInput, setDistrictSearchInput] = useState("");
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [stateSearchInput, setStateSearchInput] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [hasAutoDetectedLocation, setHasAutoDetectedLocation] = useState(false);
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
  
  // Load districts based on selected state
  const selectedState = form.watch("state");
  
  const { data: districts, isLoading: isLoadingDistrictsQuery } = useQuery({
    queryKey: ['/api/districts', selectedState],
    queryFn: async () => {
      if (selectedState === "Tamil Nadu") {
        const response = await fetch(`/api/districts/Tamil%20Nadu`);
        if (!response.ok) {
          throw new Error('Failed to fetch districts');
        }
        return response.json();
      }
      return [];
    },
    enabled: !!selectedState && selectedState === "Tamil Nadu",
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });

  // Update apiDistricts when state changes or districts load
  useEffect(() => {
    if (selectedState) {
      if (selectedState === "Tamil Nadu") {
        // Use API districts for Tamil Nadu
        if (districts && Array.isArray(districts)) {
          setApiDistricts(districts);
        }
      } else {
        // Use states-districts.json for other states
        const stateData = statesDistrictsData.states[selectedState as keyof typeof statesDistrictsData.states];
        if (stateData) {
          const stateDistricts = stateData.districts.map((district: string) => ({
            id: district.toLowerCase().replace(/\s+/g, '-'),
            name: district
          }));
          setApiDistricts(stateDistricts);
        } else {
          setApiDistricts([]);
        }
      }
    } else {
      setApiDistricts([]);
    }
  }, [selectedState, districts]);

  // Auto-detect location when form opens (like normal registration) - temporarily disabled for debugging
  // useEffect(() => {
  //   if (!hasAutoDetectedLocation) {
  //     const timer = setTimeout(() => {
  //       console.log("Auto-detecting location for Quick Join form...");
  //       handleLocationDetection(true); // Pass true for automatic detection
  //       setHasAutoDetectedLocation(true);
  //     }, 1000);
      
  //     return () => clearTimeout(timer);
  //   }
  // }, [hasAutoDetectedLocation]);

  // Location detection function (same as AuthModal)
  const handleLocationDetection = async (isAutomatic = false) => {
    if (!navigator.geolocation) {
      if (!isAutomatic) {
        toast({
          title: "Location not supported",
          description: "Your browser doesn't support location detection.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error('Location detection failed');
          }
          
          const data = await response.json();
          console.log("Location detection results:", {
            detectedLocation: data.address?.state_district || data.address?.county,
            detectedCounty: data.address?.county,
            detectedStateDistrict: data.address?.state_district,
            detectedPincode: data.address?.postcode,
            allLocationData: data.address
          });

          if (data.address) {
            const address = data.address;
            
            // Auto-fill location fields
            if (address.house_number) {
              form.setValue("houseNumber", address.house_number);
            }
            if (address.road) {
              form.setValue("streetName", address.road);
            }
            if (address.quarter || address.suburb || address.neighbourhood) {
              form.setValue("areaName", address.quarter || address.suburb || address.neighbourhood || "");
            }
            if (address.postcode && address.postcode.length === 6) {
              form.setValue("pincode", address.postcode);
            }
            if (address.state === "Tamil Nadu") {
              form.setValue("state", "Tamil Nadu");
              
              // Match district using the same logic as AuthModal
              const detectedStateDistrict = address.state_district?.toLowerCase();
              const detectedCounty = address.county?.toLowerCase();
              
              console.log("Checking district matching...", { detectedStateDistrict, detectedCounty, availableDistricts: apiDistricts.length });
              
              if (apiDistricts.length > 0) {
                let matchedDistrict = null;
                
                // Try to match with state_district first, then county
                for (const district of apiDistricts) {
                  const districtName = district.name.toLowerCase();
                  
                  if (detectedStateDistrict && 
                      (districtName === detectedStateDistrict || 
                       districtName.includes(detectedStateDistrict) || 
                       detectedStateDistrict.includes(districtName))) {
                    matchedDistrict = district;
                    break;
                  }
                  
                  if (detectedCounty && 
                      (districtName === detectedCounty || 
                       districtName.includes(detectedCounty) || 
                       detectedCounty.includes(districtName))) {
                    matchedDistrict = district;
                    break;
                  }
                }
                
                if (matchedDistrict) {
                  console.log("District set:", matchedDistrict.name, "with ID:", matchedDistrict.id);
                  form.setValue("district", matchedDistrict.id);
                }
              }
            }
            
            if (!isAutomatic) {
              toast({
                title: "Location detected",
                description: "Address fields have been filled automatically.",
              });
            }
          }
        } catch (error) {
          console.error("Location detection error:", error);
          if (!isAutomatic) {
            toast({
              title: "Location detection failed",
              description: "Please fill address manually.",
              variant: "destructive",
            });
          }
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsDetectingLocation(false);
        if (!isAutomatic) {
          toast({
            title: "Location access denied",
            description: "Please allow location access or fill address manually.",
            variant: "destructive",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

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

  // No location detection or district loading for simplified Quick Join

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

  // Removed all location detection to simplify Quick Join form



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
          // Use complete address data from form
          district: apiDistricts.find(d => d.id === data.district)?.name || data.district,
          fullAddress: `${data.houseNumber}, ${data.streetName}, ${data.areaName}, ${apiDistricts.find(d => d.id === data.district)?.name || data.district}, ${data.state} - ${data.pincode}`,
          email: "", // Will be requested in dashboard

          // Worker-specific required fields with defaults for quick registration
          ...(role === "worker" && {
            aadhaarNumber: "000000000000", // Placeholder - to be updated in dashboard
            experienceYears: 1, // Default - to be updated in dashboard  
            hourlyRate: 100, // Default rate - to be updated in dashboard
            serviceDistricts: [data.district], // Use selected district
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

          {/* Address Section with Auto-Detect */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <FormLabel className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Your Address
              </FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200"
                onClick={() => handleLocationDetection(false)}
                disabled={isDetectingLocation}
              >
                <div className="flex items-center gap-1">
                  {isDetectingLocation ? (
                    <>
                      <div className="relative">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin animation-delay-75" />
                      </div>
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="8" strokeWidth="1.5" opacity="0.5"/>
                        <circle cx="12" cy="12" r="11" strokeWidth="1" opacity="0.3"/>
                      </svg>
                      <span>{form.watch("houseNumber") || form.watch("streetName") || form.watch("areaName") ? "Re-Detect" : "Auto-Detect"}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>

            {/* House Number */}
            <FormField
              control={form.control}
              name="houseNumber"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="text-xs">House Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="House/Flat/Building No."
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Street Name */}
            <FormField
              control={form.control}
              name="streetName"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="text-xs">Street Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Street/Road Name"
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Area Name */}
            <FormField
              control={form.control}
              name="areaName"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <FormLabel className="text-xs">Area Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Area/Locality Name"
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* District and PIN Code in grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* District Selection */}
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <FormControl>
                  <Popover open={districtPopoverOpen} onOpenChange={setDistrictPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={districtPopoverOpen}
                        className="w-full justify-between"
                        disabled={isLoadingDistrictsQuery}
                      >
                        {field.value 
                          ? apiDistricts.find(district => district.id === field.value)?.name || "Select district"
                          : isLoadingDistrictsQuery
                          ? "Loading districts..."
                          : "Select district"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 animate-dropdown-open">
                      <Command>
                        <CommandInput 
                          placeholder="Search districts..." 
                          value={districtSearchInput}
                          onValueChange={setDistrictSearchInput}
                          className="transition-all duration-200"
                        />
                        <CommandEmpty>No district found.</CommandEmpty>
                        <CommandList className="max-h-40 overflow-y-auto dropdown-scrollbar">
                          <CommandGroup>
                            {apiDistricts
                              .filter(district => 
                                district.name.toLowerCase().includes(districtSearchInput.toLowerCase())
                              )
                              .map((district, index) => (
                                <CommandItem
                                  key={district.id}
                                  className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                  style={{ animationDelay: `${index * 20}ms` }}
                                  onSelect={() => {
                                    const item = document.querySelector(`[data-value="${district.name}"]`);
                                    if (item) {
                                      item.classList.add('animate-selection-highlight');
                                    }
                                    setTimeout(() => {
                                      field.onChange(district.id);
                                      setDistrictPopoverOpen(false);
                                      setDistrictSearchInput("");
                                    }, 80);
                                  }}
                                >
                                  <span className="transition-all duration-150">
                                    {district.name}
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PIN Code */}
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">PIN Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="6-digit PIN"
                    {...field}
                    className="text-sm"
                    maxLength={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* State Selection - Searchable dropdown like AuthModal */}
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={statePopoverOpen}
                      className="w-full justify-between"
                    >
                      {field.value 
                        ? INDIAN_STATES_AND_UTS.find(state => state.name === field.value)?.name
                        : "Select your state"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 animate-dropdown-open">
                  <Command>
                    <CommandInput 
                      placeholder="Search states..." 
                      value={stateSearchInput}
                      onValueChange={setStateSearchInput}
                      className="transition-all duration-200"
                    />
                    <CommandEmpty>No state found.</CommandEmpty>
                    <CommandList className="max-h-40 overflow-y-auto dropdown-scrollbar">
                      <CommandGroup heading="States">
                        {INDIAN_STATES_AND_UTS
                          .filter(state => state.type === "state")
                          .filter(state => 
                            state.name.toLowerCase().includes(stateSearchInput.toLowerCase())
                          )
                          .map((state, index) => (
                            <CommandItem
                              key={state.id}
                              className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                              style={{ animationDelay: `${index * 15}ms` }}
                              onSelect={() => {
                                field.onChange(state.name);
                                // Clear district when state changes
                                form.setValue("district", "");
                                setStatePopoverOpen(false);
                                setStateSearchInput("");
                              }}
                            >
                              {state.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                      <CommandGroup heading="Union Territories">
                        {INDIAN_STATES_AND_UTS
                          .filter(state => state.type === "ut")
                          .filter(state => 
                            state.name.toLowerCase().includes(stateSearchInput.toLowerCase())
                          )
                          .map((state, index) => (
                            <CommandItem
                              key={state.id}
                              className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                              style={{ animationDelay: `${index * 15}ms` }}
                              onSelect={() => {
                                field.onChange(state.name);
                                // Clear district when state changes
                                form.setValue("district", "");
                                setStatePopoverOpen(false);
                                setStateSearchInput("");
                              }}
                            >
                              {state.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

          {/* Service Type for Worker - Restored with proper string rendering */}
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
                        {Array.isArray(services) && services.length > 0 ? (
                          services.map((service: any) => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                            <SelectItem value="Painting">Painting</SelectItem>
                            <SelectItem value="Cleaning">Cleaning</SelectItem>
                            <SelectItem value="Carpentry">Carpentry</SelectItem>
                            <SelectItem value="AC Repair">AC Repair</SelectItem>
                          </>
                        )}
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
                        placeholder="Enter new service name"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (newServiceName.trim()) {
                              form.setValue("primaryService", newServiceName.trim());
                              setShowNewServiceInput(false);
                              setNewServiceName("");
                            }
                          }}
                        >
                          Add Service
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewServiceInput(false);
                            setNewServiceName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}



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