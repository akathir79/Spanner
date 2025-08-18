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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { INDIAN_STATES_AND_UTS } from "@shared/constants";

import { ChevronLeft, MapPin, User, Satellite, Radio, ChevronDown, Plus } from "lucide-react";
// Removed unused import

// Super fast registration schema
const fastClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^\d+$/, "Mobile number must contain only digits"),
  houseNumber: z.string().min(1, "House number is required"),
  streetName: z.string().min(1, "Street name is required"),
  areaName: z.string().min(1, "Area name is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string()
    .min(6, "PIN code must be 6 digits")
    .max(6, "PIN code must be 6 digits")
    .regex(/^\d{6}$/, "PIN code must contain exactly 6 digits"),
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
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [stateSearchInput, setStateSearchInput] = useState("");
  const [districtPopoverOpen, setDistrictPopoverOpen] = useState(false);
  const [districtSearchInput, setDistrictSearchInput] = useState("");
  const [apiDistricts, setApiDistricts] = useState<Array<{id: string, name: string, tamilName?: string}>>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
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
      district: "",
      state: "",
      pincode: "",
      ...(role === "worker" && { primaryService: "" }),
    },
  });

  // Fetch services for worker registration
  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: role === "worker",
  });

  // Mutation to create new service
  const createServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          description: `${serviceName} services`,
          icon: 'wrench',
          isActive: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create service');
      }
      
      return response.json();
    },
    onSuccess: (newService) => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      
      // Set the newly created service as selected
      form.setValue("primaryService", newService.name);
      
      // Reset form
      setNewServiceName('');
      setShowNewServiceInput(false);
      
      toast({
        title: "Service added successfully!",
        description: `${newService.name} has been added to the service list.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNewService = async () => {
    if (!newServiceName.trim()) {
      toast({
        title: "Service name required",
        description: "Please enter a service name.",
        variant: "destructive",
      });
      return;
    }

    // Check if service already exists
    const serviceExists = Array.isArray(services) && services.some((service: any) => 
      service.name.toLowerCase() === newServiceName.trim().toLowerCase()
    );

    if (serviceExists) {
      toast({
        title: "Service exists",
        description: "This service already exists. Please select it from the dropdown.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createServiceMutation.mutateAsync(newServiceName.trim());
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  // Handler for service selection (like AuthModal)
  const handleServiceSelect = (value: string) => {
    if (value === "ADD_NEW_SERVICE") {
      setShowNewServiceInput(true);
      return;
    }
    form.setValue("primaryService", value);
    setShowNewServiceInput(false);
  };

  // Watch for state changes
  const selectedState = form.watch("state");

  // Load districts when state changes
  useEffect(() => {
    if (selectedState) {
      fetchDistrictsFromAPI(selectedState);
    } else {
      setApiDistricts([]);
      form.setValue("district", "");
    }
  }, [selectedState]);

  // Fetch districts from API
  const fetchDistrictsFromAPI = async (stateName: string) => {
    setIsLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
      if (response.ok) {
        const districtsData = await response.json();
        if (Array.isArray(districtsData) && districtsData.length > 0) {
          setApiDistricts(districtsData);
          console.log(`SuperFastRegisterForm: Loaded ${districtsData.length} districts from API for ${stateName}`);
          return;
        }
      }
      // Fallback to static data if API fails
      const districts = getFallbackDistricts(stateName);
      setApiDistricts(districts);
    } catch (error) {
      console.error("Error loading districts:", error);
      const districts = getFallbackDistricts(stateName);
      setApiDistricts(districts);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // Fallback districts function
  const getFallbackDistricts = (stateName: string): Array<{id: string, name: string, tamilName?: string}> => {
    const majorDistricts: Record<string, string[]> = {
      "Tamil Nadu": ["Chennai", "Coimbatore", "Salem", "Madurai", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore"],
      "Karnataka": ["Bangalore Urban", "Mysore", "Hubli", "Mangalore", "Belgaum"],
      "Maharashtra": ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad"],
      // Add more states as needed
    };
    
    const districtNames = majorDistricts[stateName] || [];
    return districtNames.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, ''),
      name: name,
      tamilName: stateName === "Tamil Nadu" ? name : undefined
    }));
  };

  // Real-time GPS location detection
  const detectLocation = async (isAutomatic = false) => {
    setIsDetectingLocation(true);
    if (!isAutomatic) {
      onStepChange?.("location");
    }
    
    try {
      // Get GPS coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by this browser"));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use Nominatim (OpenStreetMap) for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error("Failed to get location details");
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Extract address components from Nominatim response
        const houseNumber = address.house_number || "";
        const street = address.road || address.street || "";
        const area = address.suburb || address.neighbourhood || address.village || address.town || "";
        const district = address.state_district || address.county || "";
        const state = address.state || "";
        const pincode = address.postcode || "";
        
        // Fill the form with detected location
        if (houseNumber) form.setValue("houseNumber", houseNumber);
        if (street) form.setValue("streetName", street);
        if (area) form.setValue("areaName", area);
        if (pincode) form.setValue("pincode", pincode);
        
        // Set state first to trigger district loading
        if (state) {
          form.setValue("state", state);
          
          // Wait a bit for districts to load, then set district
          setTimeout(async () => {
            // Districts should be loaded by now through the useEffect
            if (district) {
              // Try to find matching district from the loaded districts
              const normalizedDistrict = district.replace(/\s+district$/i, "").trim();
              form.setValue("district", normalizedDistrict);
            }
          }, 500);
        }
        
        if (!isAutomatic) {
          toast({
            title: "Location detected!",
            description: "Your address has been automatically filled using GPS.",
          });
        }
        setHasAutoDetected(true);
      } else {
        throw new Error("No address found for your location");
      }
    } catch (error) {
      console.error("Location detection error:", error);
      if (!isAutomatic) {
        toast({
          title: "Location detection failed",
          description: "Please enter your address manually. Make sure location access is enabled.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Auto-detect location when form loads
  useEffect(() => {
    if (!hasAutoDetected) {
      // Start auto-detection after a short delay to allow form to render
      const timer = setTimeout(() => {
        detectLocation(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasAutoDetected]);


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
          email: "", // Will be requested in dashboard
          fullAddress: `${data.houseNumber}, ${data.streetName}, ${data.areaName}`, // Combine for full address
          // Worker-specific required fields with defaults for quick registration
          ...(role === "worker" && {
            aadhaarNumber: "000000000000", // Placeholder - to be updated in dashboard
            experienceYears: 1, // Default - to be updated in dashboard  
            hourlyRate: 100, // Default rate - to be updated in dashboard
            serviceDistricts: [data.district || "Salem"], // Use selected district
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
        description: `Welcome to SPANNER! Please complete your profile in the dashboard.`,
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
    onStepChange?.("contact-info");
    registerMutation.mutate(data);
  };

  return (
    <div className="space-y-3 -mt-6">
      {/* Single header line: Back button (left) | Title (center) | Close button (right) */}
      <div className="flex items-center justify-between pb-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-gray-100 flex-shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center flex-1">
          <h3 className="font-semibold text-gray-800">
            {role === "client" ? "Client" : "Worker"} Registration
          </h3>
          <p className="text-xs text-gray-500">Complete your profile details below</p>
        </div>
        <div className="w-8 flex-shrink-0"></div> {/* Spacer for balance */}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5">
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
                  <Input placeholder="Enter your mobile number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service Type for Worker - Enhanced with Add New Service */}
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

          {/* Location Section */}
          <div className="space-y-1.5 p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Your Location</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => detectLocation(false)}
                disabled={isDetectingLocation}
                className={`flex items-center gap-1.5 transition-all duration-300 ${
                  isDetectingLocation 
                    ? "location-detecting" 
                    : "hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {isDetectingLocation ? (
                  <Radio className="w-4 h-4 location-radar" />
                ) : (
                  <Satellite className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {isDetectingLocation ? "Detecting" : hasAutoDetected ? "Re-Detect" : "Auto-Detect"}
                </span>
              </Button>
            </div>

            {/* House Number */}
            <FormField
              control={form.control}
              name="houseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">House Number</FormLabel>
                  <FormControl>
                    <Input placeholder="House/Flat/Building No." {...field} className="text-sm" />
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
                <FormItem>
                  <FormLabel className="text-xs">Street Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Street/Road Name" {...field} className="text-sm" />
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
                <FormItem>
                  <FormLabel className="text-xs">Area Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Area/Locality Name" {...field} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              {/* District */}
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">District</FormLabel>
                    <Popover open={districtPopoverOpen} onOpenChange={setDistrictPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={districtPopoverOpen}
                            className="w-full justify-between text-sm font-normal"
                            disabled={!selectedState || isLoadingDistricts}
                          >
                            {!selectedState ? (
                              <span className="text-muted-foreground">Select state first</span>
                            ) : isLoadingDistricts ? (
                              <span className="text-muted-foreground">Loading districts...</span>
                            ) : field.value ? (
                              apiDistricts.find(d => d.name === field.value)?.name || field.value
                            ) : (
                              <span className="text-muted-foreground">Select district</span>
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
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
                                    style={{ animationDelay: `${index * 15}ms` }}
                                    onSelect={() => {
                                      field.onChange(district.name);
                                      setDistrictPopoverOpen(false);
                                      setDistrictSearchInput("");
                                      // Clear PIN code when manually selecting district after auto-detection
                                      if (hasAutoDetected && !isDetectingLocation) {
                                        form.setValue("pincode", "");
                                      }
                                    }}
                                  >
                                    <span className="transition-all duration-150">
                                      {district.name}
                                      {district.tamilName && district.tamilName !== district.name && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({district.tamilName})
                                        </span>
                                      )}
                                    </span>
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
                        onChange={(e) => {
                          // Only allow digits
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* State */}
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">State</FormLabel>
                  <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={statePopoverOpen}
                          className="w-full justify-between text-sm font-normal"
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
                                    setStatePopoverOpen(false);
                                    setStateSearchInput("");
                                    // Clear PIN code, district and area name when manually selecting state after auto-detection
                                    if (hasAutoDetected && !isDetectingLocation) {
                                      form.setValue("pincode", "");
                                      form.setValue("district", "");
                                      form.setValue("areaName", "");
                                    }
                                  }}
                                >
                                  <span className="transition-all duration-150">{state.name}</span>
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
                                  style={{ animationDelay: `${(INDIAN_STATES_AND_UTS.filter(item => item.type === 'state').length + index) * 15}ms` }}
                                  onSelect={() => {
                                    field.onChange(state.name);
                                    setStatePopoverOpen(false);
                                    setStateSearchInput("");
                                    // Clear PIN code, district and area name when manually selecting state after auto-detection
                                    if (hasAutoDetected && !isDetectingLocation) {
                                      form.setValue("pincode", "");
                                      form.setValue("district", "");
                                      form.setValue("areaName", "");
                                    }
                                  }}
                                >
                                  <span className="transition-all duration-150">{state.name}</span>
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
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              "Creating Account..."
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center">
            Complete your full profile after registration to access all features.
          </p>
        </form>
      </Form>
    </div>
  );
}