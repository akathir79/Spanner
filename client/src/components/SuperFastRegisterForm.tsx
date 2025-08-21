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
import { ChevronLeft, Plus, ChevronDown } from "lucide-react";
// Removed AddressForm import - using manual fields to prevent infinite loops
import { detectStateFromLocation } from "@shared/constants";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Quick Join schema - simplified to essentials with district selection
const fastClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^\d+$/, "Mobile number must contain only digits"),
  districtId: z.string().min(1, "District is required"),
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const schema = role === "client" ? fastClientSchema : fastWorkerSchema;
  
  // Load Tamil Nadu districts for combobox
  const { data: districts, isLoading: isLoadingDistrictsQuery } = useQuery({
    queryKey: ['/api/districts', 'Tamil Nadu'],
    queryFn: async () => {
      const response = await fetch(`/api/districts/Tamil%20Nadu`);
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });

  // Update apiDistricts when districts load
  useEffect(() => {
    if (districts && Array.isArray(districts)) {
      setApiDistricts(districts);
    }
  }, [districts]);
  
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
          // Address will be collected during job posting for both clients and workers
          houseNumber: "COLLECT_DURING_POSTING",
          streetName: "COLLECT_DURING_POSTING", 
          areaName: "COLLECT_DURING_POSTING",
          district: apiDistricts.find(d => d.id === data.districtId)?.name || "COLLECT_DURING_POSTING",
          state: "Tamil Nadu", // Default state
          pincode: "COLLECT_DURING_POSTING",
          fullAddress: "COLLECT_DURING_POSTING",
          email: "", // Will be requested in dashboard

          // Worker-specific required fields with defaults for quick registration
          ...(role === "worker" && {
            aadhaarNumber: "000000000000", // Placeholder - to be updated in dashboard
            experienceYears: 1, // Default - to be updated in dashboard  
            hourlyRate: 100, // Default rate - to be updated in dashboard
            serviceDistricts: [data.districtId], // Use selected district
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

          {/* District Selection */}
          <FormField
            control={form.control}
            name="districtId"
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