import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, LogIn, Smartphone, Info, MapPin, Upload, User, X, Plus, CheckCircle, AlertTriangle, Clock, ChevronDown, CreditCard } from "lucide-react";
import BankDetailsModal from "@/components/BankDetailsModal";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const loginSchema = z.object({
  mobile: z.string().min(1, "Mobile number or email is required"),
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
  aadhaarVerified: z.boolean().optional(),
  primaryService: z.string().min(1, "Primary service is required"),
  experienceYears: z.number().min(0).max(50),
  hourlyRate: z.number().min(0, "Hourly rate must be positive"),
  serviceDistricts: z.array(z.string()).min(1, "Select at least one district"),
  serviceAreas: z.array(z.string()).optional(),
  serviceAllAreas: z.boolean().default(false),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  districtId: z.string().min(1, "District is required"),
  bio: z.string().optional(),
  profilePicture: z.string().min(1, "Profile picture is required for workers"),
  bioDataDocument: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [step, setStep] = useState(1);
  const [pendingLogin, setPendingLogin] = useState<{ mobile: string; role: string } | null>(null);
  const [developmentOtp, setDevelopmentOtp] = useState<string>("");
  const [signupType, setSignupType] = useState<"client" | "worker">("client");
  const [loginRole, setLoginRole] = useState<"client" | "worker">("client");
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [clientProfilePreview, setClientProfilePreview] = useState<string>("");
  const [workerProfilePreview, setWorkerProfilePreview] = useState<string>("");
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [districtSearchInput, setDistrictSearchInput] = useState("");
  const [districtPopoverOpen, setDistrictPopoverOpen] = useState(false);
  const [selectedDistrictForAreas, setSelectedDistrictForAreas] = useState<string>("");
  const [areasPopoverOpen, setAreasPopoverOpen] = useState(false);
  const [homeDistrictPopoverOpen, setHomeDistrictPopoverOpen] = useState(false);
  const [serviceAllAreas, setServiceAllAreas] = useState(false);
  const [aadhaarVerificationStep, setAadhaarVerificationStep] = useState<"input" | "verify" | "verified">("input");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [generatedAadhaarOtp, setGeneratedAadhaarOtp] = useState("");
  const [bioDataPreview, setBioDataPreview] = useState<string>("");
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [registeredWorkerId, setRegisteredWorkerId] = useState<string>("");
  const [workerRegistrationStep, setWorkerRegistrationStep] = useState<"details" | "bank" | "complete">("details");
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
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

  // Fetch areas for selected districts
  const { data: allAreas = [] } = useQuery({
    queryKey: ["/api/areas"],
    staleTime: 1000 * 60 * 30, // 30 minutes
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

  // Get available areas for selected districts
  const getAvailableAreas = () => {
    const selectedDistricts = workerForm.watch("serviceDistricts");
    if (!selectedDistricts || selectedDistricts.length === 0 || !allAreas) {
      return [];
    }
    return (allAreas as any[]).filter((area: any) => 
      selectedDistricts.includes(area.districtId)
    );
  };

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
      aadhaarVerified: false,
      primaryService: "",
      experienceYears: 1,
      hourlyRate: 300,
      serviceDistricts: [] as string[],
      serviceAreas: [] as string[],
      serviceAllAreas: false,
      skills: [] as string[],
      address: "",
      pincode: "",
      districtId: "",
      bio: "",
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
            
            // Find matching district with improved logic - including pincode area lookup
            let matchingDistrict = (districts as any)?.find((district: any) => {
              const districtName = district.name.toLowerCase();
              const detectedName = detectedLocation?.toLowerCase() || '';
              const detectedCity = locationData.city?.toLowerCase() || '';
              const detectedCounty = locationData.county?.toLowerCase() || '';
              const detectedStateDistrict = locationData.state_district?.toLowerCase() || '';
              
              // Check for exact matches first (most reliable)
              if (districtName === detectedStateDistrict || 
                  districtName === detectedCounty ||
                  districtName === detectedCity ||
                  districtName === detectedName) {
                return true;
              }
              
              // Check if detected location contains the district name
              if (detectedStateDistrict.includes(districtName) ||
                  detectedCounty.includes(districtName) ||
                  detectedCity.includes(districtName) ||
                  detectedName.includes(districtName)) {
                return true;
              }
              
              // Check Tamil name matches
              if (district.tamilName?.toLowerCase().includes(detectedName) ||
                  district.tamilName?.toLowerCase().includes(detectedStateDistrict) ||
                  district.tamilName?.toLowerCase().includes(detectedCounty)) {
                return true;
              }
              
              return false;
            });
            
            // If no district match found, try to find by pincode from areas
            if (!matchingDistrict && detectedPincode && allAreas) {
              const matchingArea = (allAreas as any)?.find((area: any) => 
                area.pincode === detectedPincode
              );
              if (matchingArea) {
                matchingDistrict = (districts as any)?.find((district: any) => 
                  district.id === matchingArea.districtId
                );
              }
            }
            
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
                // For worker form, set both home district and add to service districts
                workerForm.setValue("districtId", matchingDistrict.id);
                setHomeDistrictPopoverOpen(false); // Close the popover
                const currentDistricts: string[] = workerForm.getValues("serviceDistricts") || [];
                if (!currentDistricts.includes(matchingDistrict.id)) {
                  workerForm.setValue("serviceDistricts", [...currentDistricts, matchingDistrict.id]);
                }
              }
            }
            
            toast({
              title: "Location detected",
              description: matchingDistrict 
                ? `Address, pincode, and district (${matchingDistrict.name}) updated automatically`
                : `Address and pincode updated. Please select district manually.`,
            });
            
            console.log('Location detection results:', {
              detectedLocation,
              detectedCity: locationData.city,
              detectedCounty: locationData.county,
              detectedStateDistrict: locationData.state_district,
              detectedPincode,
              matchingDistrict: matchingDistrict?.name,
              allLocationData: locationData
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
    const result = await login(data.mobile, loginRole);
    if (result.success) {
      setPendingLogin({ mobile: data.mobile, role: loginRole });
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
      
      // Force page refresh to trigger proper redirection
      window.location.reload();
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

  const handleBankDetailsComplete = () => {
    setShowBankDetailsModal(false);
    setRegistrationCompleted(true);
    setWorkerRegistrationStep("details");
    toast({
      title: "Registration Complete!",
      description: "Your worker profile has been created successfully. Please wait for admin approval.",
    });
    
    // Close modal and redirect to worker dashboard
    setTimeout(() => {
      onClose();
      window.location.reload(); // Force page refresh to trigger proper redirection
    }, 2000);
  };

  const handleWorkerSignup = async (data: z.infer<typeof workerSignupSchema>) => {
    // Check if Aadhaar is verified before proceeding
    if (aadhaarVerificationStep !== "verified") {
      toast({
        title: "Aadhaar Verification Required",
        description: "Please verify your Aadhaar number before submitting the application.",
        variant: "destructive",
      });
      return;
    }

    const { termsAccepted, ...signupData } = data;
    const result = await signupWorker({
      ...signupData,
      role: "worker",
      aadhaarVerified: true, // Mark as verified since they completed the process
      bioDataDocument: bioDataPreview, // Add the bio data document from state
    });
    if (result) {
      if (typeof result === 'object' && result !== null && 'user' in result) {
        const userResult = result as any;
        if (userResult.user && userResult.user.id) {
          setRegisteredWorkerId(userResult.user.id);
        }
      }
      // Move to completion step instead of forcing bank details
      setWorkerRegistrationStep("complete");
      toast({
        title: "Registration Successful!",
        description: "Your worker application has been submitted successfully.",
      });
    }
  };



  const handleAadhaarVerificationRequest = () => {
    const aadhaarNumber = workerForm.getValues("aadhaarNumber");
    
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toast({
        title: "Invalid Aadhaar Number",
        description: "Please enter a valid 12-digit Aadhaar number.",
        variant: "destructive",
      });
      return;
    }

    // Generate mock OTP for Aadhaar verification
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedAadhaarOtp(mockOtp);
    setAadhaarVerificationStep("verify");
    
    toast({
      title: "Aadhaar OTP Sent",
      description: "Please check your registered mobile number for the OTP.",
    });
  };

  const handleAadhaarOtpVerification = () => {
    if (aadhaarOtp === generatedAadhaarOtp) {
      setAadhaarVerificationStep("verified");
      toast({
        title: "Aadhaar Verified",
        description: "Your Aadhaar number has been successfully verified.",
      });
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter the correct OTP sent to your registered mobile number.",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setStep(1);
    setPendingLogin(null);
    setDevelopmentOtp("");
    setClientProfilePreview("");
    setWorkerProfilePreview("");
    setShowNewServiceInput(false);
    setNewServiceName("");
    setNewSkillInput("");
    setDistrictSearchInput("");
    setDistrictPopoverOpen(false);
    setAadhaarVerificationStep("input");
    setAadhaarOtp("");
    setGeneratedAadhaarOtp("");
    setBioDataPreview("");
    setRegistrationCompleted(false);
    setRegisteredWorkerId("");
    setWorkerRegistrationStep("details");
    loginForm.reset();
    otpForm.reset();
    clientForm.reset();
    workerForm.reset();
  };

  const handleBioDataUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Bio data document must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBioDataPreview(result);
        toast({
          title: "Bio data uploaded",
          description: "Document attached successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div>
                    <Label>Login As</Label>
                    <RadioGroup value={loginRole} onValueChange={(value: "client" | "worker") => setLoginRole(value)} className="flex gap-6 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="login-client" />
                        <Label htmlFor="login-client" className="cursor-pointer">Client (Need Services)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worker" id="login-worker" />
                        <Label htmlFor="login-worker" className="cursor-pointer">Worker (Provide Services)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Smartphone className="h-4 w-4 mr-2" />
                    {isLoading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm p-0 h-auto text-muted-foreground hover:text-foreground"
                    onClick={handleClose}
                  >
                    Sign Up
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm p-0 h-auto text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      toast({
                        title: "Contact Support",
                        description: "For account recovery, please contact our support team.",
                      });
                    }}
                  >
                    Forgot ID/Password
                  </Button>
                </div>
              </div>
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
                      <div className="flex items-center justify-between">
                        <span>Development OTP: <strong>{developmentOtp}</strong></span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => otpForm.setValue("otp", developmentOtp)}
                          className="ml-2"
                        >
                          Paste OTP
                        </Button>
                      </div>
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
              {workerRegistrationStep === "details" ? (
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="aadhaar"
                        placeholder="XXXX XXXX XXXX"
                        maxLength={12}
                        {...workerForm.register("aadhaarNumber")}
                        disabled={aadhaarVerificationStep === "verified"}
                        className={aadhaarVerificationStep === "verified" ? "bg-green-50 border-green-200" : ""}
                      />
                      {aadhaarVerificationStep === "input" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAadhaarVerificationRequest}
                          disabled={!workerForm.watch("aadhaarNumber") || workerForm.watch("aadhaarNumber").length !== 12}
                        >
                          Verify
                        </Button>
                      )}
                      {aadhaarVerificationStep === "verified" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-green-100 text-green-700 border-green-200"
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verified
                        </Button>
                      )}
                    </div>
                    
                    {aadhaarVerificationStep === "verify" && (
                      <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Aadhaar OTP Verification</span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            value={aadhaarOtp}
                            onChange={(e) => setAadhaarOtp(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAadhaarOtpVerification}
                            disabled={aadhaarOtp.length !== 6}
                          >
                            Verify OTP
                          </Button>
                        </div>
                        {generatedAadhaarOtp && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex items-center justify-between">
                                <span>Development OTP: <strong>{generatedAadhaarOtp}</strong></span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAadhaarOtp(generatedAadhaarOtp)}
                                  className="ml-2"
                                >
                                  Paste OTP
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-blue-600"
                          onClick={handleAadhaarVerificationRequest}
                        >
                          Resend OTP
                        </Button>
                      </div>
                    )}
                    
                    {aadhaarVerificationStep === "verified" && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Aadhaar number verified successfully</span>
                      </div>
                    )}
                  </div>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
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
                    {workerForm.formState.errors.primaryService && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.primaryService.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1">
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
                  <Label htmlFor="serviceDistricts">Service Districts *</Label>
                  <div className="space-y-2">
                    <Popover open={districtPopoverOpen} onOpenChange={setDistrictPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={districtPopoverOpen}
                          className="w-full justify-between"
                        >
                          Select from dropdown
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search districts..." />
                          <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                              {districts && Array.isArray(districts) ? districts.map((district: any) => (
                                <CommandItem
                                  key={district.id}
                                  value={district.name}
                                  onSelect={() => {
                                    const currentDistricts = workerForm.getValues("serviceDistricts") || [];
                                    if (!currentDistricts.includes(district.id)) {
                                      workerForm.setValue("serviceDistricts", [...currentDistricts, district.id]);
                                    }
                                    setDistrictPopoverOpen(false);
                                  }}
                                >
                                  {district.name} ({district.tamilName})
                                </CommandItem>
                              )) : null}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Select districts from dropdown or type to search (e.g., Chennai, Coimbatore, Salem)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workerForm.watch("serviceDistricts")?.map((districtId: string) => {
                      const district = districts && Array.isArray(districts) ? districts.find((d: any) => d.id === districtId) : null;
                      return district ? (
                        <div key={districtId} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                          <span>{district.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => {
                              const currentDistricts = workerForm.getValues("serviceDistricts") || [];
                              workerForm.setValue("serviceDistricts", currentDistricts.filter(id => id !== districtId));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  {workerForm.formState.errors.serviceDistricts && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.serviceDistricts.message}
                    </p>
                  )}
                </div>

                {/* Service Areas - only show if districts are selected */}
                {workerForm.watch("serviceDistricts")?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="serviceAreas">Service Areas (Optional)</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="serviceAllAreas"
                          checked={serviceAllAreas}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true;
                            setServiceAllAreas(isChecked);
                            workerForm.setValue("serviceAllAreas", isChecked);
                            if (isChecked) {
                              // Clear specific areas when "All Areas" is selected
                              workerForm.setValue("serviceAreas", []);
                            }
                          }}
                        />
                        <Label htmlFor="serviceAllAreas" className="text-sm font-normal cursor-pointer">
                          All Areas
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Popover open={areasPopoverOpen} onOpenChange={setAreasPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={areasPopoverOpen}
                            className="w-full justify-between"
                            disabled={serviceAllAreas}
                          >
                            {serviceAllAreas ? "All areas selected" : "Select specific areas"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search areas..." />
                            <CommandList>
                              <CommandEmpty>No area found.</CommandEmpty>
                              <CommandGroup>
                                {getAvailableAreas().map((area: any) => (
                                  <CommandItem
                                    key={area.id}
                                    value={area.name}
                                    onSelect={() => {
                                      const currentAreas = workerForm.getValues("serviceAreas") || [];
                                      if (!currentAreas.includes(area.id)) {
                                        workerForm.setValue("serviceAreas", [...currentAreas, area.id]);
                                        // Clear "All Areas" checkbox when specific area is selected
                                        setServiceAllAreas(false);
                                        workerForm.setValue("serviceAllAreas", false);
                                      }
                                      setAreasPopoverOpen(false);
                                    }}
                                  >
                                    {area.name} {area.tamilName && `(${area.tamilName})`}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        {serviceAllAreas 
                          ? "You will serve all areas within your selected districts."
                          : "Select specific areas within your service districts, or check 'All Areas' to serve everywhere in your districts."
                        }
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {workerForm.watch("serviceAreas")?.map((areaId: string) => {
                        const area = (allAreas as any[]).find((a: any) => a.id === areaId);
                        return area ? (
                          <div key={areaId} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                            <span>{area.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => {
                                const currentAreas = workerForm.getValues("serviceAreas") || [];
                                workerForm.setValue("serviceAreas", currentAreas.filter(id => id !== areaId));
                                // Check if we need to show "All Areas" again after removing specific area
                                const remainingAreas = currentAreas.filter(id => id !== areaId);
                                if (remainingAreas.length === 0 && !serviceAllAreas) {
                                  // Could auto-check "All Areas" if no specific areas are selected
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="skills">Skills & Expertise *</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill (e.g., Pipe Repair, Wiring, Painting)"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSkillInput.trim()) {
                              const currentSkills = workerForm.getValues("skills") || [];
                              if (!currentSkills.includes(newSkillInput.trim())) {
                                workerForm.setValue("skills", [...currentSkills, newSkillInput.trim()]);
                                setNewSkillInput("");
                              }
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (newSkillInput.trim()) {
                            const currentSkills = workerForm.getValues("skills") || [];
                            if (!currentSkills.includes(newSkillInput.trim())) {
                              workerForm.setValue("skills", [...currentSkills, newSkillInput.trim()]);
                              setNewSkillInput("");
                            }
                          }
                        }}
                        disabled={!newSkillInput.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {workerForm.watch("skills")?.map((skill: string, index: number) => (
                        <div key={index} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs">
                          <span>{skill}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-primary-foreground hover:text-primary-foreground"
                            onClick={() => {
                              const currentSkills = workerForm.getValues("skills") || [];
                              workerForm.setValue("skills", currentSkills.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {workerForm.formState.errors.skills && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.skills.message}
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="workerDistrict">District</Label>
                    <Popover open={homeDistrictPopoverOpen} onOpenChange={setHomeDistrictPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={homeDistrictPopoverOpen}
                          className="w-full justify-between"
                        >
                          {workerForm.watch("districtId") 
                            ? (districts as any[])?.find((d: any) => d.id === workerForm.watch("districtId"))?.name || "Select District"
                            : "Select District"
                          }
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search districts..." />
                          <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                              {districts && Array.isArray(districts) ? districts.map((district: any) => (
                                <CommandItem
                                  key={district.id}
                                  value={district.name}
                                  onSelect={() => {
                                    workerForm.setValue("districtId", district.id);
                                    setHomeDistrictPopoverOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{district.name}</span>
                                    <span className="text-sm text-muted-foreground">({district.tamilName})</span>
                                  </div>
                                </CommandItem>
                              )) : null}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your home district. Use "Use Location" button above to auto-detect.
                    </p>
                    {workerForm.formState.errors.districtId && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.districtId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio/Description (Optional)</Label>
                  <textarea
                    id="bio"
                    placeholder="Tell clients about your experience, specialties, and why they should choose you..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...workerForm.register("bio")}
                  />
                  {workerForm.formState.errors.bio && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bioData">Bio Data Document (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="bioData"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleBioDataUpload}
                        className="cursor-pointer"
                      />
                      {bioDataPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-green-100 text-green-700 border-green-200"
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Attached
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload your resume, certificates, or ID documents (PDF, PNG, JPG up to 5MB)
                    </p>
                  </div>
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
              ) : workerRegistrationStep === "complete" ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Registration Successful!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your worker application has been submitted successfully.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can add your bank details now for payment processing, or add them later from your dashboard.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      onClick={() => setShowBankDetailsModal(true)}
                      className="flex-1"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Bank Details Now
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Registration Complete",
                          description: "You can add bank details later from your dashboard.",
                        });
                        onClose();
                        // Force page refresh to trigger proper redirection to worker dashboard
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }}
                      className="flex-1"
                    >
                      Add Later
                    </Button>
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        )}

        {/* Worker Registration Completion with Bank Details */}
        {registrationCompleted && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Registration Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your worker application has been submitted successfully. You can now add your bank details for payment processing.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-center">Add Bank Details (Optional)</h4>
              <p className="text-sm text-muted-foreground text-center">
                Add your bank details now or later from your dashboard to receive payments from completed jobs.
              </p>
              

            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRegistrationCompleted(false);
                  setRegisteredWorkerId("");
                  onClose();
                }}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                onClick={() => {
                  setRegistrationCompleted(false);
                  setRegisteredWorkerId("");
                  onClose();
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Bank Details Modal */}
        <BankDetailsModal
          isOpen={showBankDetailsModal}
          onClose={() => setShowBankDetailsModal(false)}
          workerId={registeredWorkerId}
          onSuccess={handleBankDetailsComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
