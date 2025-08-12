import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ChevronLeft, MapPin, User, Edit3, Loader2 } from "lucide-react";
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
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const { toast } = useToast();

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
        if (district) form.setValue("district", district);
        if (state) form.setValue("state", state);
        if (pincode) form.setValue("pincode", pincode);
        
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
      const endpoint = role === "client" ? "/api/auth/register" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          role,
          lastName: "UPDATE_REQUIRED", // Mark for update
          email: "", // Will be requested in dashboard
          fullAddress: `${data.houseNumber}, ${data.streetName}, ${data.areaName}`, // Combine for full address
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
                      {Array.isArray(services) ? services.map((service: any) => (
                        <SelectItem key={service.id} value={service.name}>
                          {service.name}
                        </SelectItem>
                      )) : []}
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
                onClick={() => detectLocation(false)}
                disabled={isDetectingLocation}
                className={`flex items-center gap-1 transition-all duration-500 ${
                  isDetectingLocation 
                    ? "location-detecting bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-400 text-blue-700 shadow-xl scale-105 animate-pulse" 
                    : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-md hover:scale-102"
                }`}
              >
                {isDetectingLocation ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                ) : (
                  <Edit3 className="w-3 h-3 transition-transform duration-300 hover:scale-110" />
                )}
                <span className={`font-medium transition-all duration-300 ${
                  isDetectingLocation ? "text-blue-700" : ""
                }`}>
                  {isDetectingLocation ? "🌍 Detecting..." : hasAutoDetected ? "🔄 Re-Detect" : "📍 Auto-Detect"}
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