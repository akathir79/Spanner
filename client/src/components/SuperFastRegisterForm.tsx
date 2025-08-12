import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
// Mock location service for now
const LocationService = {
  getCurrentLocation: async () => {
    return {
      address: "Narasothipatti, Salem West",
      district: "Salem", 
      state: "Tamil Nadu",
      pincode: "636004"
    };
  }
};
import { ChevronLeft, MapPin, Edit3, User } from "lucide-react";
// Removed unused import

// Super fast registration schema
const fastClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  address: z.string().min(1, "Address is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid PIN code is required"),
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
  const { toast } = useToast();

  const schema = role === "client" ? fastClientSchema : fastWorkerSchema;
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      mobile: "",
      address: "Narasothipatti, Salem West",
      district: "Salem",
      state: "Tamil Nadu",
      pincode: "636004",
      ...(role === "worker" && { primaryService: "" }),
    },
  });

  // Fetch services for worker registration
  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: role === "worker",
  });

  // Location detection
  const detectLocation = async () => {
    setIsDetectingLocation(true);
    onStepChange?.("location");
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        form.setValue("address", location.address);
        form.setValue("district", location.district);
        form.setValue("state", location.state);
        form.setValue("pincode", location.pincode);
        toast({
          title: "Location detected!",
          description: "Your address has been automatically filled.",
        });
      }
    } catch (error) {
      toast({
        title: "Location detection failed",
        description: "Please enter your address manually.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: FastClientData | FastWorkerData) => {
      const endpoint = role === "client" ? "/api/auth/register" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          role,
          lastName: "UPDATE_REQUIRED", // Mark for update
          email: "", // Will be requested in dashboard
        }),
      });
      if (!response.ok) throw new Error(await response.text());
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

          {/* Service Type for Worker */}
          {role === "worker" && (
            <FormField
              control={form.control}
              name="primaryService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Service</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(services || []).map((service: any) => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                {isDetectingLocation ? "Detecting..." : "Auto-Detect"}
              </Button>
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full address" {...field} className="text-sm" />
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
                    <FormControl>
                      <Input placeholder="District" {...field} className="text-sm" />
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
                      <Input placeholder="PIN Code" {...field} className="text-sm" />
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
                  <FormControl>
                    <Input placeholder="State" {...field} className="text-sm" />
                  </FormControl>
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