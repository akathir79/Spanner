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

// Simplified Quick Join schema - only first name, mobile number, and service for workers
const fastClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  mobile: z.string().length(10, "Mobile number must be exactly 10 digits").regex(/^\d+$/, "Mobile number must contain only digits"),
});

const fastWorkerSchema = fastClientSchema.extend({
  primaryService: z.string().min(1, "Primary service is required"),
  houseNumber: z.string().min(1, "House number is required"),
  streetName: z.string().min(1, "Street name is required"),
  areaName: z.string().min(1, "Area name is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  pincode: z.string().length(6, "PIN code must be exactly 6 digits").regex(/^\d+$/, "PIN code must contain only digits"),
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const schema = role === "client" ? fastClientSchema : fastWorkerSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      mobile: "",
      ...(role === "worker" && { 
        primaryService: "",
        houseNumber: "",
        streetName: "",
        areaName: "",
        state: "",
        district: "",
        pincode: "",
      }),
    },
  });

  // Fetch services for worker registration
  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: role === "worker",
  });



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

  // Custom location detection handler for AddressForm
  const handleLocationDetection = () => {
    setIsDetectingLocation(true);
    // AddressForm handles the actual geolocation logic
    // We manage the loading state here
    setTimeout(() => setIsDetectingLocation(false), 8000); // Reset after geolocation timeout
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
    onStepChange?.("contact-info");
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
                  <Input placeholder="Enter 10-digit mobile number" {...field} />
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

          {/* Address Form for Worker */}
          {role === "worker" && (
            <AddressForm
              form={form}
              isDetecting={isDetectingLocation}
              onDetect={handleLocationDetection}
              autoDetectOnMount={true}
              className="border rounded-lg p-4 bg-gray-50"
            />
          )}

          {/* Registration note */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              📍 {role === "worker" 
                ? "Your state and district help clients find you for local service requests."
                : "Your address will be collected when you post your first job for security and accurate service delivery."
              }
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating Account..." : `Join as ${role === "client" ? "Client" : "Worker"}`}
          </Button>
        </form>
      </Form>
    </div>
  );
}