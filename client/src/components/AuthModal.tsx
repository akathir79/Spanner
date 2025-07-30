import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, LogIn, Smartphone, Info, MapPin, Upload, User, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  userType: z.enum(["client", "worker", "admin", "super_admin"]),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const clientSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional(),
  districtId: z.string().min(1, "District is required"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  profilePicture: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

const workerSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional(),
  aadhaarNumber: z.string().length(12, "Aadhaar number must be 12 digits"),
  primaryService: z.string().min(1, "Primary service is required"),
  experienceYears: z.number().min(0).max(50),
  hourlyRate: z.number().min(0, "Hourly rate must be positive"),
  serviceDistricts: z.array(z.string()).min(1, "Select at least one district"),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  profilePicture: z.string().min(1, "Profile picture is required for workers"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [step, setStep] = useState(1);
  const [pendingLogin, setPendingLogin] = useState<{ mobile: string; userType: string } | null>(null);
  const [developmentOtp, setDevelopmentOtp] = useState<string>("");
  const [signupType, setSignupType] = useState<"client" | "worker">("client");
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [clientProfilePreview, setClientProfilePreview] = useState<string>("");
  const [workerProfilePreview, setWorkerProfilePreview] = useState<string>("");
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const { login, verifyOtp, signupClient, signupWorker, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch districts and services from database
  const { data: districts } = useQuery({
    queryKey: ["/api/districts"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: rawServices = [] } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Remove duplicate services by name
  const dynamicServices = rawServices ? 
    (rawServices as any[]).filter((service, index, arr) => 
      arr.findIndex(s => s.name === service.name) === index
    ) : [];

  // Mutation to create new service
  const createServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceName,
          tamilName: serviceName, // For now, use the same name for Tamil
          description: `${serviceName} services`,
          icon: "wrench",
          isActive: true
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create service");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "New service added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add new service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler for adding new service
  const handleAddNewService = async () => {
    if (!newServiceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a service name",
        variant: "destructive",
      });
      return;
    }

    // Check if service already exists
    const serviceExists = dynamicServices.some(
      service => service.name.toLowerCase() === newServiceName.trim().toLowerCase()
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
      // Set the newly created service as selected
      workerForm.setValue("primaryService", newServiceName.trim());
      // Reset the input and hide it
      setNewServiceName("");
      setShowNewServiceInput(false);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  // Handler for service selection
  const handleServiceSelect = (value: string) => {
    if (value === "ADD_NEW_SERVICE") {
      setShowNewServiceInput(true);
      return;
    }
    workerForm.setValue("primaryService", value);
    setShowNewServiceInput(false);
  };

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: "",
      userType: "client" as const,
    },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const clientForm = useForm({
    resolver: zodResolver(clientSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      districtId: "",
      address: "",
      pincode: "",
      profilePicture: "",
      termsAccepted: false,
    },
  });

  const workerForm = useForm({
    resolver: zodResolver(workerSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      aadhaarNumber: "",
      primaryService: "",
      experienceYears: 1,
      hourlyRate: 300,
      serviceDistricts: [] as string[],
      skills: [] as string[],
      address: "",
      pincode: "",
      profilePicture: "",
      termsAccepted: false,
    },
  });

  const handleProfilePictureUpload = (file: File | null, formType: "client" | "worker") => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      
      if (formType === "client") {
        setClientProfilePreview(base64String);
        clientForm.setValue("profilePicture", base64String);
      } else {
        setWorkerProfilePreview(base64String);
        workerForm.setValue("profilePicture", base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePicture = (formType: "client" | "worker") => {
    if (formType === "client") {
      setClientProfilePreview("");
      clientForm.setValue("profilePicture", "");
    } else {
      setWorkerProfilePreview("");
      workerForm.setValue("profilePicture", "");
    }
  };

  const handleLocationDetection = async (formType: "client" | "worker") => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);
    const currentForm = formType === "client" ? clientForm : workerForm;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) throw new Error('Failed to get location data');
          
          const data = await response.json();
          
          if (data && data.address) {
            const locationData = data.address;
            const detectedLocation = locationData.state_district || 
                                   locationData.county || 
                                   locationData.city || 
                                   locationData.town ||
                                   locationData.village;
            
            const detectedAddress = `${locationData.house_number || ''} ${locationData.road || ''} ${locationData.suburb || ''} ${locationData.city || ''}`.trim();
            const detectedPincode = locationData.postcode || '';
            
            // Find matching district
            const matchingDistrict = (districts as any)?.find((district: any) => {
              const districtName = district.name.toLowerCase();
              const detectedName = detectedLocation?.toLowerCase() || '';
              return districtName.includes(detectedName) || 
                     detectedName.includes(districtName) ||
                     district.tamilName.includes(detectedLocation);
            });
            
            // Update form with detected data
            if (detectedAddress) {
              if (formType === "client") {
                clientForm.setValue("address", detectedAddress);
              } else {
                workerForm.setValue("address", detectedAddress);
              }
            }
            if (detectedPincode) {
              if (formType === "client") {
                clientForm.setValue("pincode", detectedPincode);
              } else {
                workerForm.setValue("pincode", detectedPincode);
              }
            }
            if (matchingDistrict) {
              if (formType === "client") {
                clientForm.setValue("districtId", matchingDistrict.id);
              } else {
                // For worker form, add to service districts
                const currentDistricts: string[] = workerForm.getValues("serviceDistricts") || [];
                if (!currentDistricts.includes(matchingDistrict.id)) {
                  workerForm.setValue("serviceDistricts", [...currentDistricts, matchingDistrict.id]);
                }
              }
            }
            
            toast({
              title: "Location detected",
              description: `Address and district updated automatically`,
            });
          }
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: "Location detection failed",
            description: "Please enter address manually",
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

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    const result = await login(data.mobile, data.userType);
    if (result.success) {
      setPendingLogin({ mobile: data.mobile, userType: data.userType });
      setDevelopmentOtp(result.otp || "");
      setStep(2);
    }
  };

  const handleOtpVerify = async (data: z.infer<typeof otpSchema>) => {
    if (!pendingLogin) return;
    
    const result = await verifyOtp(pendingLogin.mobile, data.otp, "login");
    if (result) {
      onClose();
      setStep(1);
      setPendingLogin(null);
    }
  };

  const handleClientSignup = async (data: z.infer<typeof clientSignupSchema>) => {
    const { termsAccepted, ...signupData } = data;
    const result = await signupClient({
      ...signupData,
      role: "client",
    });
    if (result) {
      onClose();
    }
  };

  const handleWorkerSignup = async (data: z.infer<typeof workerSignupSchema>) => {
    const { termsAccepted, ...signupData } = data;
    const result = await signupWorker({
      ...signupData,
      role: "worker",
    });
    if (result) {
      onClose();
    }
  };

  const resetModal = () => {
    setStep(1);
    setPendingLogin(null);
    setDevelopmentOtp("");
    setClientProfilePreview("");
    setWorkerProfilePreview("");
    loginForm.reset();
    otpForm.reset();
    clientForm.reset();
    workerForm.reset();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === "login" ? (
              <>
                <LogIn className="h-5 w-5" />
                <span>Login to SPANNER</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Join SPANNER</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === "login" ? (
          <>
            {step === 1 && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number / Email</Label>
                  <Input
                    id="mobile"
                    placeholder="Enter mobile number or email"
                    {...loginForm.register("mobile")}
                  />
                  {loginForm.formState.errors.mobile && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="userType">User Type</Label>
                  <Select 
                    value={loginForm.watch("userType")} 
                    onValueChange={(value) => loginForm.setValue("userType", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select User Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {loginForm.formState.errors.userType && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.userType.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={otpForm.handleSubmit(handleOtpVerify)} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    {...otpForm.register("otp")}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-sm text-destructive mt-1">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                {developmentOtp && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Development OTP: <strong>{developmentOtp}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              </form>
            )}
          </>
        ) : (
          <Tabs value={signupType} onValueChange={(value) => setSignupType(value as "client" | "worker")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="worker">Worker</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <form onSubmit={clientForm.handleSubmit(handleClientSignup)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...clientForm.register("firstName")}
                    />
                    {clientForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {clientForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...clientForm.register("lastName")}
                    />
                    {clientForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {clientForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    placeholder="+91 XXXXX XXXXX"
                    {...clientForm.register("mobile")}
                  />
                  {clientForm.formState.errors.mobile && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    {...clientForm.register("email")}
                  />
                  {clientForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientProfilePicture">Profile Picture (Optional)</Label>
                  <div className="mt-2">
                    {clientProfilePreview ? (
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={clientProfilePreview}
                            alt="Profile preview"
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                            onClick={() => removeProfilePicture("client")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Profile picture uploaded successfully
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="relative"
                            asChild
                          >
                            <label htmlFor="clientProfilePictureInput" className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Photo
                            </label>
                          </Button>
                          <input
                            id="clientProfilePictureInput"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleProfilePictureUpload(e.target.files?.[0] || null, "client")}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {clientForm.formState.errors.profilePicture && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.profilePicture.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="district">District</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleLocationDetection("client")}
                      disabled={isLocationLoading}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {isLocationLoading ? "Finding..." : "Use Location"}
                    </Button>
                  </div>
                  <Select 
                    value={clientForm.watch("districtId")} 
                    onValueChange={(value) => clientForm.setValue("districtId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your district" />
                    </SelectTrigger>
                    <SelectContent>
                      {(districts as any)?.map((district: any) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name} ({district.tamilName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientForm.formState.errors.districtId && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.districtId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    placeholder="House/Building number, Street, Area"
                    {...clientForm.register("address")}
                  />
                  {clientForm.formState.errors.address && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    {...clientForm.register("pincode")}
                  />
                  {clientForm.formState.errors.pincode && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.pincode.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={clientForm.watch("termsAccepted")}
                    onCheckedChange={(checked) => clientForm.setValue("termsAccepted", !!checked)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
                {clientForm.formState.errors.termsAccepted && (
                  <p className="text-sm text-destructive">
                    {clientForm.formState.errors.termsAccepted.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="worker">
              <form onSubmit={workerForm.handleSubmit(handleWorkerSignup)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workerFirstName">First Name</Label>
                    <Input
                      id="workerFirstName"
                      {...workerForm.register("firstName")}
                    />
                    {workerForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workerLastName">Last Name</Label>
                    <Input
                      id="workerLastName"
                      {...workerForm.register("lastName")}
                    />
                    {workerForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workerMobile">Mobile Number</Label>
                    <Input
                      id="workerMobile"
                      placeholder="+91 XXXXX XXXXX"
                      {...workerForm.register("mobile")}
                    />
                    {workerForm.formState.errors.mobile && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workerEmail">Email Address (Optional)</Label>
                    <Input
                      id="workerEmail"
                      type="email"
                      {...workerForm.register("email")}
                    />
                    {workerForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                    {...workerForm.register("aadhaarNumber")}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Required for identity verification</p>
                  {workerForm.formState.errors.aadhaarNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.aadhaarNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workerProfilePicture">Profile Picture *</Label>
                  <div className="mt-2">
                    {workerProfilePreview ? (
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={workerProfilePreview}
                            alt="Profile preview"
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                            onClick={() => removeProfilePicture("worker")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Profile picture uploaded successfully
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="relative"
                            asChild
                          >
                            <label htmlFor="workerProfilePictureInput" className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Photo
                            </label>
                          </Button>
                          <input
                            id="workerProfilePictureInput"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleProfilePictureUpload(e.target.files?.[0] || null, "worker")}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG up to 5MB (Required for verification)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {workerForm.formState.errors.profilePicture && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.profilePicture.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryService">Primary Service</Label>
                    {!showNewServiceInput ? (
                      <Select 
                        value={workerForm.watch("primaryService")} 
                        onValueChange={handleServiceSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary service" />
                        </SelectTrigger>
                        <SelectContent>
                          {dynamicServices.map((service: any) => (
                            <SelectItem key={service.id} value={service.name}>
                              {service.name}
                            </SelectItem>
                          ))}
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
                        <div className="flex gap-2">
                          <Input
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                            placeholder="Enter new service name"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewService();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddNewService}
                            disabled={createServiceMutation.isPending || !newServiceName.trim()}
                          >
                            {createServiceMutation.isPending ? "Adding..." : "Add"}
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
                        <p className="text-xs text-muted-foreground">
                          Add a new service that doesn't exist in the current list
                        </p>
                      </div>
                    )}
                    {workerForm.formState.errors.primaryService && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.primaryService.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      max="50"
                      {...workerForm.register("experienceYears", { valueAsNumber: true })}
                    />
                    {workerForm.formState.errors.experienceYears && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.experienceYears.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    placeholder="300"
                    {...workerForm.register("hourlyRate", { valueAsNumber: true })}
                  />
                  {workerForm.formState.errors.hourlyRate && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.hourlyRate.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="workerAddress">Work Address/Location</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleLocationDetection("worker")}
                      disabled={isLocationLoading}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {isLocationLoading ? "Finding..." : "Use Location"}
                    </Button>
                  </div>
                  <Input
                    id="workerAddress"
                    placeholder="House/Building number, Street, Area"
                    {...workerForm.register("address")}
                  />
                  {workerForm.formState.errors.address && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workerPincode">Pincode</Label>
                  <Input
                    id="workerPincode"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    {...workerForm.register("pincode")}
                  />
                  {workerForm.formState.errors.pincode && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.pincode.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workerTerms"
                    checked={workerForm.watch("termsAccepted")}
                    onCheckedChange={(checked) => workerForm.setValue("termsAccepted", !!checked)}
                  />
                  <Label htmlFor="workerTerms" className="text-sm">
                    I agree to background verification and platform terms
                  </Label>
                </div>
                {workerForm.formState.errors.termsAccepted && (
                  <p className="text-sm text-destructive">
                    {workerForm.formState.errors.termsAccepted.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
