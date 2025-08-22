import { useState, useEffect } from "react";
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
import { UserPlus, LogIn, Smartphone, Info, MapPin, Upload, User, X, Plus, CheckCircle, AlertTriangle, Clock, ChevronDown, CreditCard, Users, Wrench } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import BankDetailsModal from "@/components/BankDetailsModal";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { INDIAN_STATES_AND_UTS, detectStateFromLocation } from "@shared/constants";

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
  houseNumber: z.string().optional(),
  streetName: z.string().optional(),
  areaName: z.string().optional(),
  districtId: z.string().min(1, "District is required"),
  address: z.string().min(5, "Address is required"),
  state: z.string().min(1, "State is required"),
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
  houseNumber: z.string().optional(),
  streetName: z.string().optional(),
  areaName: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),  
  districtId: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  bio: z.string().optional(),
  profilePicture: z.string().min(1, "Profile picture is required for workers"),
  bioDataDocument: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
  initialTab?: "client" | "worker";
  onSwitchToSignup?: () => void;
}

export function AuthModal({ isOpen, onClose, mode, initialTab, onSwitchToSignup }: AuthModalProps) {
  const [step, setStep] = useState(1);
  const [pendingLogin, setPendingLogin] = useState<{ mobile: string; role: string } | null>(null);
  const [developmentOtp, setDevelopmentOtp] = useState<string>("");
  const [signupType, setSignupType] = useState<"client" | "worker">(initialTab || "client");
  const [loginRole, setLoginRole] = useState<"client" | "worker">("client");
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [clientProfilePreview, setClientProfilePreview] = useState<string>("");
  const [workerProfilePreview, setWorkerProfilePreview] = useState<string>("");
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newAreaInput, setNewAreaInput] = useState("");
  const [districtSearchInput, setDistrictSearchInput] = useState("");
  const [districtPopoverOpen, setDistrictPopoverOpen] = useState(false);
  const [clientDistrictPopoverOpen, setClientDistrictPopoverOpen] = useState(false);
  const [clientDistrictSearchInput, setClientDistrictSearchInput] = useState("");
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [workerStatePopoverOpen, setWorkerStatePopoverOpen] = useState(false);
  const [stateSearchInput, setStateSearchInput] = useState("");
  const [workerStateSearchInput, setWorkerStateSearchInput] = useState("");
  const [workerDistrictSearchInput, setWorkerDistrictSearchInput] = useState("");
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
  const [loginError, setLoginError] = useState<string>("");
  
  // Availability checking states
  const [clientMobileAvailability, setClientMobileAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [clientEmailAvailability, setClientEmailAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [workerMobileAvailability, setWorkerMobileAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [workerEmailAvailability, setWorkerEmailAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [workerAadhaarAvailability, setWorkerAadhaarAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [hasAutoDetectedClient, setHasAutoDetectedClient] = useState(false);
  const [hasAutoDetectedWorker, setHasAutoDetectedWorker] = useState(false);
  
  const { loginWithOtp, verifyOtp, signupClient, signupWorker, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      houseNumber: "",
      streetName: "",
      areaName: "",
      districtId: "",
      address: "",
      state: "",
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
      houseNumber: "",
      streetName: "",
      areaName: "",
      address: "",
      pincode: "",
      districtId: "",
      state: "",
      bio: "",
      profilePicture: "",
      termsAccepted: false,
    },
  });

  // Simple state management like home page
  const [clientDistrictOpen, setClientDistrictOpen] = useState(false);
  const [workerDistrictOpen, setWorkerDistrictOpen] = useState(false);
  const [clientApiDistricts, setClientApiDistricts] = useState<Array<{id: string, name: string, tamilName?: string}>>([]);
  const [workerApiDistricts, setWorkerApiDistricts] = useState<Array<{id: string, name: string, tamilName?: string}>>([]);
  const [isClientLoadingDistricts, setIsClientLoadingDistricts] = useState(false);
  const [isWorkerLoadingDistricts, setIsWorkerLoadingDistricts] = useState(false);

  // Watch for state changes in forms
  const selectedClientState = clientForm.watch("state");
  const selectedWorkerState = workerForm.watch("state");

  // Simple useEffect patterns like home page
  useEffect(() => {
    if (selectedClientState) {
      fetchClientDistrictsFromAPI(selectedClientState);
    } else {
      setClientApiDistricts([]);
    }
  }, [selectedClientState]);

  useEffect(() => {
    if (selectedWorkerState) {
      fetchWorkerDistrictsFromAPI(selectedWorkerState);
    } else {
      setWorkerApiDistricts([]);
    }
  }, [selectedWorkerState]);

  // Simple API fetching functions like home page
  const fetchClientDistrictsFromAPI = async (stateName: string) => {
    setIsClientLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
      if (response.ok) {
        const districtsData = await response.json();
        if (Array.isArray(districtsData) && districtsData.length > 0) {
          setClientApiDistricts(districtsData);
          console.log(`AuthModal: Loaded ${districtsData.length} districts from API for ${stateName}`, districtsData);
          return;
        }
      }
      const districts = await getFallbackDistricts(stateName);
      setClientApiDistricts(districts);
      console.log(`Loaded ${districts.length} districts from fallback data for ${stateName}`);
    } catch (error) {
      console.error("Error loading districts from API, using fallback:", error);
      try {
        const districts = await getFallbackDistricts(stateName);
        setClientApiDistricts(districts);
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
        setClientApiDistricts([]);
      }
    } finally {
      setIsClientLoadingDistricts(false);
    }
  };

  const fetchWorkerDistrictsFromAPI = async (stateName: string) => {
    setIsWorkerLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
      if (response.ok) {
        const districtsData = await response.json();
        if (Array.isArray(districtsData) && districtsData.length > 0) {
          setWorkerApiDistricts(districtsData);
          console.log(`AuthModal: Loaded ${districtsData.length} districts from API for ${stateName}`, districtsData);
          return;
        }
      }
      const districts = await getFallbackDistricts(stateName);
      setWorkerApiDistricts(districts);
      console.log(`Loaded ${districts.length} districts from fallback data for ${stateName}`);
    } catch (error) {
      console.error("Error loading districts from API, using fallback:", error);
      try {
        const districts = await getFallbackDistricts(stateName);
        setWorkerApiDistricts(districts);
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
        setWorkerApiDistricts([]);
      }
    } finally {
      setIsWorkerLoadingDistricts(false);
    }
  };

  // Fallback districts function (same as Home page)
  const getFallbackDistricts = async (stateName: string): Promise<Array<{id: string, name: string, tamilName?: string}>> => {
    // Fallback static data for major states
    const majorDistricts: Record<string, string[]> = {
      "Tamil Nadu": ["Chennai", "Coimbatore", "Salem", "Madurai", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Kanchipuram", "Tiruppur", "Cuddalore", "Karur", "Dharmapuri", "Nagapattinam", "Krishnagiri", "Sivaganga", "Namakkal", "Virudhunagar", "Villupuram", "Ramanathapuram", "Theni", "Pudukkottai", "Tiruvannamalai", "Kanyakumari", "Nilgiris", "Perambalur", "Ariyalur", "Kallakurichi", "Chengalpattu", "Tenkasi", "Tirupathur", "Ranipet", "Mayiladuthurai", "Tiruvallur"],
      "Karnataka": ["Bangalore Urban", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Shimoga", "Tumkur"],
      "Maharashtra": ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad", "Solapur", "Kolhapur", "Satara"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Ghaziabad"],
      "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda"],
      "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand"],
      "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bharatpur", "Alwar"],
      "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Ratlam", "Satna"],
      "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kottayam", "Palakkad", "Kannur"],
      "Andhra Pradesh": ["Hyderabad", "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati"],
      "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
      "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada"],
      "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Hoshiarpur"],
      "Haryana": ["Gurgaon", "Faridabad", "Hisar", "Panipat", "Karnal", "Ambala", "Yamunanagar", "Rohtak"],
      "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah"],
      "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih"],
      "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon"],
      "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Nahan", "Kullu", "Hamirpur"],
      "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rudrapur", "Kashipur", "Rishikesh", "Pithoragarh"],
      "Goa": ["North Goa", "South Goa"],
      "Manipur": ["Imphal East", "Imphal West", "Thoubal", "Bishnupur", "Churachandpur", "Senapati", "Ukhrul", "Chandel"],
      "Tripura": ["West Tripura", "South Tripura", "North Tripura", "Dhalai"],
      "Meghalaya": ["East Khasi Hills", "West Khasi Hills", "East Garo Hills", "West Garo Hills", "South Garo Hills"],
      "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Mon", "Wokha", "Zunheboto", "Phek"]
    };

    const districtNames = majorDistricts[stateName] || [];
    return districtNames.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, ''),
      name: name,
      tamilName: stateName === "Tamil Nadu" ? name : undefined
    }));
  };

  // Update signupType when initialTab changes and modal is opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setSignupType(initialTab);
    }
  }, [isOpen, initialTab]);



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



  const handleLocationDetection = async (formType: "client" | "worker", isAutomatic: boolean = false) => {
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

    setIsLocationLoading(true);
    const currentForm = formType === "client" ? clientForm : workerForm;
    
    // Clear current state to ensure fresh data loading
    if (formType === "client") {
      clientForm.setValue("districtId", "");
    } else {
      workerForm.setValue("districtId", "");
    }

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
            
            // Extract address components
            const houseNumber = locationData.house_number || '';
            const streetName = locationData.road || '';
            const areaName = locationData.village || locationData.suburb || locationData.neighbourhood || '';
            
            // Build a more accurate address with better locality detection
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
            // Use appropriate districts based on form type
            const currentDistricts = formType === "client" ? clientApiDistricts : workerApiDistricts;
            if (currentDistricts && currentDistricts.length > 0) {
              matchingDistrict = currentDistricts.find((district: any) => {
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
            
            // If no district match found, try to find by pincode from areas
            if (!matchingDistrict && detectedPincode && allAreas) {
              const matchingArea = (allAreas as any)?.find((area: any) => 
                area.pincode === detectedPincode
              );
              if (matchingArea) {
                matchingDistrict = currentDistricts?.find((district: any) => 
                  district.id === matchingArea.districtId
                );
              }
            }
            
            // Update form with detected data
            if (formType === "client") {
              if (houseNumber) clientForm.setValue("houseNumber", houseNumber);
              if (streetName) clientForm.setValue("streetName", streetName);
              if (areaName) clientForm.setValue("areaName", areaName);
              if (detectedAddress) clientForm.setValue("address", detectedAddress);
              if (detectedPincode) clientForm.setValue("pincode", detectedPincode);
            } else {
              if (houseNumber) workerForm.setValue("houseNumber", houseNumber);
              if (streetName) workerForm.setValue("streetName", streetName);
              if (areaName) workerForm.setValue("areaName", areaName);
              if (detectedAddress) workerForm.setValue("address", detectedAddress);
              if (detectedPincode) workerForm.setValue("pincode", detectedPincode);
            }
            // Detect state from location data
            const detectedState = detectStateFromLocation(locationData);
            
            // Set state first to trigger district loading
            if (formType === "client") {
              clientForm.setValue("state", detectedState);
            } else {
              workerForm.setValue("state", detectedState);
            }
            
            // Load districts and match - using the exact same logic as Home page
            if (detectedState) {
              try {
                // Load districts for the detected state
                const response = await fetch(`/api/districts/${encodeURIComponent(detectedState)}`);
                if (response.ok) {
                  const districtsData = await response.json();
                  if (Array.isArray(districtsData) && districtsData.length > 0) {
                    // Update the district arrays
                    if (formType === "client") {
                      setClientApiDistricts(districtsData);
                    } else {
                      setWorkerApiDistricts(districtsData);
                    }
                    
                    console.log('AuthModal: Districts loaded, now matching...', districtsData.length);
                    
                    // Small delay to ensure state is updated - SAME AS HOME PAGE
                    setTimeout(() => {
                      // Find matching district with improved matching logic - EXACT SAME AS HOME PAGE
                      const matchingDistrict = districtsData.find((district: any) => {
                        const districtName = district.name.toLowerCase();
                        const detectedStateDistrict = locationData.state_district?.toLowerCase() || '';
                        const detectedCounty = locationData.county?.toLowerCase() || '';
                        
                        // Debug logging
                        if (districtName === 'salem') {
                          console.log('Checking Salem district:', {
                            districtName,
                            detectedStateDistrict,
                            detectedCounty,
                            directMatch1: districtName === detectedStateDistrict,
                            directMatch2: districtName === detectedCounty,
                            includes1: detectedStateDistrict.includes(districtName),
                            includes2: detectedCounty.includes(districtName),
                            includes3: districtName.includes(detectedStateDistrict),
                            includes4: districtName.includes(detectedCounty)
                          });
                        }
                        
                        // Direct matches
                        if (districtName === detectedStateDistrict || districtName === detectedCounty) {
                          return true;
                        }
                        
                        // Check if detected location contains district name
                        if (detectedStateDistrict.includes(districtName) || detectedCounty.includes(districtName)) {
                          return true;
                        }
                        
                        // Check if district name contains detected location (handles "Salem West" -> "Salem")
                        if (districtName.includes(detectedStateDistrict) || districtName.includes(detectedCounty)) {
                          return true;
                        }
                        
                        // Remove common suffixes for better matching
                        const cleanDistrict = districtName.replace(/\s+(district|west|east|north|south)$/i, '');
                        const cleanDetectedState = detectedStateDistrict.replace(/\s+(district|west|east|north|south)$/i, '');
                        const cleanDetectedCounty = detectedCounty.replace(/\s+(district|west|east|north|south)$/i, '');
                        
                        return cleanDistrict === cleanDetectedState || cleanDistrict === cleanDetectedCounty;
                      });
                      
                      if (matchingDistrict) {
                        // Set district using the matching district data
                        if (formType === "client") {
                          clientForm.setValue("districtId", matchingDistrict.id, { shouldDirty: true, shouldTouch: true });
                          setClientDistrictPopoverOpen(false);
                          setClientDistrictSearchInput("");
                          console.log('District set for client:', matchingDistrict.name, 'with ID:', matchingDistrict.id);
                        } else {
                          workerForm.setValue("districtId", matchingDistrict.id, { shouldDirty: true, shouldTouch: true });
                          const currentDistricts: string[] = workerForm.getValues("serviceDistricts") || [];
                          if (!currentDistricts.includes(matchingDistrict.id)) {
                            workerForm.setValue("serviceDistricts", [...currentDistricts, matchingDistrict.id], { shouldDirty: true, shouldTouch: true });
                          }
                          setDistrictPopoverOpen(false);
                          console.log('District set for worker:', matchingDistrict.name, 'with ID:', matchingDistrict.id);
                        }
                        
                        // Trigger form validation
                        if (formType === "client") {
                          clientForm.trigger(["state", "districtId"]);
                        } else {
                          workerForm.trigger(["state", "districtId", "serviceDistricts"]);
                        }
                      } else {
                        console.log('No matching district found for:', locationData.state_district, 'or', locationData.county);
                      }
                    }, 300); // Same 300ms delay as Home page
                  }
                }
              } catch (error) {
                console.error('Error loading districts:', error);
              }
            }
            
            if (!isAutomatic) {
              toast({
                title: "Location detected",
                description: "Address, state, and pincode detected. District will be set automatically.",
              });
            }
            
            console.log('Location detection results:', {
              detectedLocation,
              detectedCounty: locationData.county,
              detectedStateDistrict: locationData.state_district,
              detectedPincode,
              allLocationData: locationData,
              availableDistricts: currentDistricts?.slice(0, 5) // Show first 5 for debugging
            });
          }
        } catch (error) {
          console.error('Error getting location:', error);
          if (!isAutomatic) {
            toast({
              title: "Location detection failed",
              description: "Please enter address manually",
              variant: "destructive",
            });
          }
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
        
        if (!isAutomatic) {
          toast({
            title: "Location access required",
            description: errorMessage,
            variant: "destructive",
          });
        }
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
    setLoginError(""); // Clear any previous errors
    const result = await loginWithOtp(data.mobile, loginRole);
    if (result.success) {
      setPendingLogin({ mobile: data.mobile, role: loginRole });
      setDevelopmentOtp(result.otp || "");
      setStep(2);
    } else {
      // Display the error message from the server
      setLoginError(result.error || "Login failed. Please try again.");
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
    // Check mobile availability before proceeding
    if (clientMobileAvailability === "not-available") {
      toast({
        title: "Mobile Number Not Available",
        description: "This mobile number is already registered. Please use a different number.",
        variant: "destructive",
      });
      return;
    }

    // Check email availability before proceeding (if email is provided)
    if (data.email && clientEmailAvailability === "not-available") {
      toast({
        title: "Email Not Available",
        description: "This email address is already registered. Please use a different email.",
        variant: "destructive",
      });
      return;
    }

    const { termsAccepted, districtId, ...signupData } = data;
    
    // Convert districtId to district name
    const selectedDistrict = clientApiDistricts?.find(d => d.id === districtId);
    const districtName = selectedDistrict?.name || districtId;
    
    const result = await signupClient({
      ...signupData,
      district: districtName,
      role: "client",
    });
    if (result?.success) {
      onClose();
    } else {
      // Show error message to user
      toast({
        title: "Registration Failed",
        description: result?.error || "Unable to create account. Please try again.",
        variant: "destructive",
      });
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

    // Check mobile availability before proceeding
    if (workerMobileAvailability === "not-available") {
      toast({
        title: "Mobile Number Not Available",
        description: "This mobile number is already registered. Please use a different number.",
        variant: "destructive",
      });
      return;
    }

    // Check email availability before proceeding (if email is provided)
    if (data.email && workerEmailAvailability === "not-available") {
      toast({
        title: "Email Not Available",
        description: "This email address is already registered. Please use a different email.",
        variant: "destructive",
      });
      return;
    }

    // Check Aadhaar availability before proceeding
    if (workerAadhaarAvailability === "not-available") {
      toast({
        title: "Aadhaar Number Not Available",
        description: "This Aadhaar number is already registered. Please verify your Aadhaar number is correct.",
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

    // Check if Aadhaar is already registered
    if (workerAadhaarAvailability === "not-available") {
      toast({
        title: "Aadhaar Already Registered",
        description: "This Aadhaar number is already registered with another account. Please use a different Aadhaar number.",
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
    setLoginError(""); // Clear login error
    setClientProfilePreview("");
    setWorkerProfilePreview("");
    setShowNewServiceInput(false);
    setNewServiceName("");
    setNewSkillInput("");
    setDistrictSearchInput("");
    setDistrictPopoverOpen(false);
    setClientDistrictPopoverOpen(false);
    setClientDistrictSearchInput("");
    setStatePopoverOpen(false);
    setWorkerStatePopoverOpen(false);
    setStateSearchInput("");
    setWorkerStateSearchInput("");
    setSelectedDistrictForAreas("");
    setAreasPopoverOpen(false);
    setHomeDistrictPopoverOpen(false);
    setServiceAllAreas(false);
    setAadhaarVerificationStep("input");
    setAadhaarOtp("");
    setGeneratedAadhaarOtp("");
    setBioDataPreview("");
    setRegistrationCompleted(false);
    setRegisteredWorkerId("");
    setWorkerRegistrationStep("details");
    setClientDistrictOpen(false);
    setWorkerDistrictOpen(false);
    setClientApiDistricts([]);
    setWorkerApiDistricts([]);
    // Reset availability checking states
    setClientMobileAvailability("");
    setClientEmailAvailability("");
    setWorkerMobileAvailability("");
    setWorkerEmailAvailability("");
    setWorkerAadhaarAvailability("");
    loginForm.reset();
    otpForm.reset();
    clientForm.reset();
    workerForm.reset();
  };

  // Reset forms whenever modal opens to ensure fresh fields
  useEffect(() => {
    if (isOpen) {
      resetModal();
      setHasAutoDetectedClient(false);
      setHasAutoDetectedWorker(false);
    }
  }, [isOpen]);

  // Auto-detect location when client form opens (exactly like Quick Join form)
  useEffect(() => {
    if (isOpen && mode === "signup" && signupType === "client" && !hasAutoDetectedClient) {
      // Start auto-detection after a short delay to allow form to render
      const timer = setTimeout(() => {
        console.log("Auto-detecting location for client form...");
        handleLocationDetection("client", true); // Pass true for automatic detection
        setHasAutoDetectedClient(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode, signupType, hasAutoDetectedClient]);

  // Auto-detect location when worker form opens (exactly like Quick Join form)
  useEffect(() => {
    if (isOpen && mode === "signup" && signupType === "worker" && !hasAutoDetectedWorker) {
      // Start auto-detection after a short delay to allow form to render
      const timer = setTimeout(() => {
        console.log("Auto-detecting location for worker form...");
        handleLocationDetection("worker", true); // Pass true for automatic detection
        setHasAutoDetectedWorker(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode, signupType, hasAutoDetectedWorker]);

  // Availability checking function
  const checkAvailability = async (mobile: string, email: string, aadhaarNumber: string, role: string, formType: "client" | "worker") => {
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, email, aadhaarNumber, role }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (formType === "client") {
          if (mobile) {
            setClientMobileAvailability(result.mobile ? "available" : "not-available");
          }
          if (email) {
            setClientEmailAvailability(result.email ? "available" : "not-available");
          }
        } else {
          if (mobile) {
            setWorkerMobileAvailability(result.mobile ? "available" : "not-available");
          }
          if (email) {
            setWorkerEmailAvailability(result.email ? "available" : "not-available");
          }
          if (aadhaarNumber) {
            setWorkerAadhaarAvailability(result.aadhaar ? "available" : "not-available");
          }
        }
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  // Watch for mobile/email/aadhaar changes in forms
  const clientMobile = clientForm.watch("mobile");
  const clientEmail = clientForm.watch("email");
  const workerMobile = workerForm.watch("mobile");
  const workerEmail = workerForm.watch("email");
  const workerAadhaar = workerForm.watch("aadhaarNumber");

  // Debounced availability checking for client form
  useEffect(() => {
    if (clientMobile && clientMobile.length >= 10) {
      setClientMobileAvailability("checking");
      const timer = setTimeout(() => {
        checkAvailability(clientMobile, "", "", "client", "client");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setClientMobileAvailability("");
    }
  }, [clientMobile]);

  useEffect(() => {
    if (clientEmail && clientEmail.includes("@")) {
      setClientEmailAvailability("checking");
      const timer = setTimeout(() => {
        checkAvailability("", clientEmail, "", "client", "client");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setClientEmailAvailability("");
    }
  }, [clientEmail]);

  // Debounced availability checking for worker form
  useEffect(() => {
    if (workerMobile && workerMobile.length >= 10) {
      setWorkerMobileAvailability("checking");
      const timer = setTimeout(() => {
        checkAvailability(workerMobile, "", "", "worker", "worker");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setWorkerMobileAvailability("");
    }
  }, [workerMobile]);

  useEffect(() => {
    if (workerEmail && workerEmail.includes("@")) {
      setWorkerEmailAvailability("checking");
      const timer = setTimeout(() => {
        checkAvailability("", workerEmail, "", "worker", "worker");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setWorkerEmailAvailability("");
    }
  }, [workerEmail]);

  // Debounced availability checking for worker Aadhaar
  useEffect(() => {
    if (workerAadhaar && workerAadhaar.length === 12) {
      setWorkerAadhaarAvailability("checking");
      const timer = setTimeout(() => {
        checkAvailability("", "", workerAadhaar, "worker", "worker");
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setWorkerAadhaarAvailability("");
    }
  }, [workerAadhaar]);

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white" style={{backgroundColor: '#ffffff'}}>
        <DialogHeader className="text-center pb-6 pt-4" style={{backgroundColor: '#ffffff'}}>
          <DialogTitle className="text-2xl font-bold text-primary">
            {mode === "login" ? "Log in or Sign up" : "Join SPANNER"}
          </DialogTitle>
          {mode === "login" && (
            <p className="text-sm text-muted-foreground mt-2">
              Sign up now and get <span className="font-semibold text-orange-600">500 🪙 SPANNER coins!</span>
            </p>
          )}
        </DialogHeader>

        {mode === "login" ? (
          <>
            {step === 1 && (
              <div className="space-y-6 px-2 pb-4" style={{backgroundColor: '#ffffff'}}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  {/* Role Selection - Collapsible like Home page */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">I am a</h3>
                    </div>
                    
                    {!loginRole ? (
                      /* Expanded role selection */
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 bg-white"
                          style={{backgroundColor: '#ffffff'}}
                          onClick={() => {
                            setLoginRole('client');
                            setLoginError("");
                          }}
                        >
                          <Users className="h-6 w-6 text-primary" />
                          <span className="font-medium">Client</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 bg-white"
                          style={{backgroundColor: '#ffffff'}}
                          onClick={() => {
                            setLoginRole('worker');
                            setLoginError("");
                          }}
                        >
                          <Wrench className="h-6 w-6 text-primary" />
                          <span className="font-medium">Worker</span>
                        </Button>
                      </div>
                    ) : (
                      /* Collapsed role indicator */
                      <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          {loginRole === 'client' ? (
                            <Users className="h-5 w-5 text-primary" />
                          ) : (
                            <Wrench className="h-5 w-5 text-primary" />
                          )}
                          <span className="font-medium text-primary capitalize">{loginRole}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setLoginRole(null as any);
                            setLoginError("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Login Form - shown after role selection */}
                  {loginRole && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                      {/* Mobile Number Input */}
                      <div className="relative">
                        <div className="flex">
                          <div className="flex items-center px-4 py-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg">
                            <span className="text-sm font-medium text-gray-600">+91</span>
                          </div>
                          <Input
                            type="tel"
                            placeholder="Mobile Number"
                            className="rounded-l-none border-gray-300 py-3 px-4 text-base focus:border-primary focus:ring-primary"
                            {...loginForm.register("mobile")}
                          />
                        </div>
                        {loginForm.formState.errors.mobile && (
                          <p className="text-sm text-destructive mt-1">
                            {loginForm.formState.errors.mobile.message}
                          </p>
                        )}
                      </div>

                      {loginError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {loginError}
                            {loginError.includes("not found") && (
                              <span className="block mt-2">
                                Don't have an account? <strong>Sign up</strong> first.
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-3 text-base font-semibold rounded-lg" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Send OTP"}
                      </Button>

                      {/* Toggle Links */}
                      <div className="flex justify-between text-sm pt-2">
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Password login will be available soon",
                            });
                          }}
                        >
                          Use Password
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                          onClick={() => {
                            toast({
                              title: "Contact Support",
                              description: "For account recovery, please contact our support team.",
                            });
                          }}
                        >
                          Login with Email
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="space-y-6">
                        <div className="relative">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                            Or
                          </span>
                        </div>

                        {/* Google Login */}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full py-3 text-base font-medium rounded-lg border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Google login will be available soon",
                            });
                          }}
                        >
                          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#fbbc5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </Button>

                        {/* Help and Terms */}
                        <div className="text-center text-sm text-gray-600 mt-6">
                          Need help? <Button variant="link" className="p-0 h-auto text-sm text-primary font-medium">Connect with us 💬</Button>
                        </div>

                        <div className="text-center text-sm text-gray-600 leading-relaxed px-4">
                          By logging or signing up, you agree to our{' '}
                          <Button variant="link" className="p-0 h-auto text-sm text-primary underline font-medium">
                            Terms
                          </Button>{' '}
                          &{' '}
                          <Button variant="link" className="p-0 h-auto text-sm text-primary underline font-medium">
                            Policy
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm p-0 h-auto text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      if (onSwitchToSignup) {
                        onSwitchToSignup();
                      } else {
                        handleClose();
                      }
                    }}
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
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 h-10 rounded-md">
              <TabsTrigger 
                value="client" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-sm transition-all"
              >
                Client
              </TabsTrigger>
              <TabsTrigger 
                value="worker" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-sm transition-all"
              >
                Worker
              </TabsTrigger>
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
                  <div className="relative">
                    <Input
                      id="mobile"
                      placeholder="+91 XXXXX XXXXX"
                      {...clientForm.register("mobile")}
                    />
                    {clientMobileAvailability && (
                      <div className="absolute right-2 top-2.5 flex items-center">
                        {clientMobileAvailability === "checking" && (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        )}
                        {clientMobileAvailability === "available" && (
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Available</span>
                          </div>
                        )}
                        {clientMobileAvailability === "not-available" && (
                          <div className="flex items-center text-red-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Not Available</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {clientForm.formState.errors.mobile && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      {...clientForm.register("email")}
                    />
                    {clientEmailAvailability && (
                      <div className="absolute right-2 top-2.5 flex items-center">
                        {clientEmailAvailability === "checking" && (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        )}
                        {clientEmailAvailability === "available" && (
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Available</span>
                          </div>
                        )}
                        {clientEmailAvailability === "not-available" && (
                          <div className="flex items-center text-red-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Not Available</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Your Location
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200"
                      onClick={() => handleLocationDetection("client")}
                      disabled={isLocationLoading}
                    >
                      <div className="flex items-center gap-1">
                        {isLocationLoading ? (
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
                            <span>{clientForm.watch("houseNumber") || clientForm.watch("streetName") || clientForm.watch("areaName") ? "Re-Detect" : "Auto-Detect"}</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </div>

                  {/* House Number */}
                  <div className="mb-3">
                    <Label htmlFor="houseNumber" className="text-xs">House Number</Label>
                    <Input
                      id="houseNumber"
                      placeholder="House/Flat/Building No."
                      {...clientForm.register("houseNumber")}
                      className="text-sm"
                    />
                  </div>

                  {/* Street Name */}
                  <div className="mb-3">
                    <Label htmlFor="streetName" className="text-xs">Street Name</Label>
                    <Input
                      id="streetName"
                      placeholder="Street/Road Name"
                      {...clientForm.register("streetName")}
                      className="text-sm"
                    />
                  </div>

                  {/* Area Name */}
                  <div className="mb-3">
                    <Label htmlFor="areaName" className="text-xs">Area Name</Label>
                    <Input
                      id="areaName"
                      placeholder="Area/Locality Name"
                      {...clientForm.register("areaName")}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* District and PIN Code in grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* District */}
                  <div>
                    <Label htmlFor="clientDistrict" className="text-xs">District</Label>
                  <Popover open={clientDistrictPopoverOpen} onOpenChange={setClientDistrictPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientDistrictPopoverOpen}
                        className="w-full justify-between"
                        disabled={!clientForm.watch("state") || isClientLoadingDistricts}
                      >
                        {clientForm.watch("districtId") 
                          ? clientApiDistricts.find(district => district.id === clientForm.watch("districtId"))?.name || "Select district"
                          : isClientLoadingDistricts
                          ? "Loading districts..."
                          : !clientForm.watch("state")
                          ? "Select state first"
                          : "Select district"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 animate-dropdown-open">
                      <Command>
                        <CommandInput 
                          placeholder="Search districts..." 
                          value={clientDistrictSearchInput}
                          onValueChange={setClientDistrictSearchInput}
                          className="transition-all duration-200"
                        />
                        <CommandEmpty>No district found.</CommandEmpty>
                        <CommandList className="max-h-40 overflow-y-auto dropdown-scrollbar">
                          <CommandGroup>
                            {clientApiDistricts
                              .filter(district => 
                                district.name.toLowerCase().includes(clientDistrictSearchInput.toLowerCase())
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
                                      clientForm.setValue("districtId", district.id);
                                      setClientDistrictPopoverOpen(false);
                                      setClientDistrictSearchInput("");
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
                  {clientForm.formState.errors.districtId && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.districtId.message}
                    </p>
                  )}
                  </div>

                  {/* PIN Code */}
                  <div>
                    <Label htmlFor="pincode" className="text-xs">PIN Code</Label>
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
                </div>

                {/* State field */}
                <div>
                  <Label htmlFor="state">State</Label>
                  <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statePopoverOpen}
                        className="w-full justify-between"
                      >
                        {clientForm.watch("state") 
                          ? INDIAN_STATES_AND_UTS.find(state => state.name === clientForm.watch("state"))?.name
                          : "Select your state"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
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
                                    const item = document.querySelector(`[data-value="${state.name}"]`);
                                    if (item) {
                                      item.classList.add('animate-selection-highlight');
                                    }
                                    setTimeout(() => {
                                      clientForm.setValue("state", state.name);
                                      // Clear district, pincode and area name when state changes
                                      clientForm.setValue("districtId", "");
                                      clientForm.setValue("pincode", "");
                                      clientForm.setValue("areaName", "");
                                      setStatePopoverOpen(false);
                                      setStateSearchInput("");
                                    }, 80);
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
                                    const item = document.querySelector(`[data-value="${state.name}"]`);
                                    if (item) {
                                      item.classList.add('animate-selection-highlight');
                                    }
                                    setTimeout(() => {
                                      clientForm.setValue("state", state.name);
                                      // Clear district, pincode and area name when state changes
                                      clientForm.setValue("districtId", "");
                                      clientForm.setValue("pincode", "");
                                      clientForm.setValue("areaName", "");
                                      setStatePopoverOpen(false);
                                      setStateSearchInput("");
                                    }, 80);
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
                  {clientForm.formState.errors.state && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.state.message}
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
                    <div className="relative">
                      <Input
                        id="workerMobile"
                        placeholder="+91 XXXXX XXXXX"
                        {...workerForm.register("mobile")}
                      />
                      {workerMobileAvailability && (
                        <div className="absolute right-2 top-2.5 flex items-center">
                          {workerMobileAvailability === "checking" && (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          )}
                          {workerMobileAvailability === "available" && (
                            <div className="flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Available</span>
                            </div>
                          )}
                          {workerMobileAvailability === "not-available" && (
                            <div className="flex items-center text-red-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Not Available</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {workerForm.formState.errors.mobile && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workerEmail">Email Address (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="workerEmail"
                        type="email"
                        {...workerForm.register("email")}
                      />
                      {workerEmailAvailability && (
                        <div className="absolute right-2 top-2.5 flex items-center">
                          {workerEmailAvailability === "checking" && (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          )}
                          {workerEmailAvailability === "available" && (
                            <div className="flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Available</span>
                            </div>
                          )}
                          {workerEmailAvailability === "not-available" && (
                            <div className="flex items-center text-red-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Not Available</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                          disabled={
                            !workerForm.watch("aadhaarNumber") || 
                            workerForm.watch("aadhaarNumber").length !== 12 ||
                            workerAadhaarAvailability === "not-available" ||
                            workerAadhaarAvailability === "checking"
                          }
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

                    {/* Aadhaar Availability Indicator */}
                    {workerAadhaarAvailability && (
                      <div className="flex justify-end mt-1">
                        {workerAadhaarAvailability === "checking" && (
                          <div className="flex items-center text-blue-600">
                            <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs">Checking...</span>
                          </div>
                        )}
                        {workerAadhaarAvailability === "available" && (
                          <div className="flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Available</span>
                          </div>
                        )}
                        {workerAadhaarAvailability === "not-available" && (
                          <div className="flex items-center text-red-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs">Already registered</span>
                          </div>
                        )}
                      </div>
                    )}
                    
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
                              setNewAreaInput("");
                            }
                          }}
                        />
                        <Label htmlFor="serviceAllAreas" className="text-sm font-normal cursor-pointer">
                          All Areas
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type area name (e.g., Koramangala, Jayanagar, Anna Nagar)"
                          value={newAreaInput}
                          onChange={(e) => setNewAreaInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newAreaInput.trim() && !serviceAllAreas) {
                                const currentAreas = workerForm.getValues("serviceAreas") || [];
                                if (!currentAreas.includes(newAreaInput.trim())) {
                                  workerForm.setValue("serviceAreas", [...currentAreas, newAreaInput.trim()]);
                                  setNewAreaInput("");
                                  // Clear "All Areas" checkbox when specific area is added
                                  setServiceAllAreas(false);
                                  workerForm.setValue("serviceAllAreas", false);
                                }
                              }
                            }
                          }}
                          disabled={serviceAllAreas}
                          className={serviceAllAreas ? "bg-muted cursor-not-allowed" : ""}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newAreaInput.trim() && !serviceAllAreas) {
                              const currentAreas = workerForm.getValues("serviceAreas") || [];
                              if (!currentAreas.includes(newAreaInput.trim())) {
                                workerForm.setValue("serviceAreas", [...currentAreas, newAreaInput.trim()]);
                                setNewAreaInput("");
                                // Clear "All Areas" checkbox when specific area is added
                                setServiceAllAreas(false);
                                workerForm.setValue("serviceAllAreas", false);
                              }
                            }
                          }}
                          disabled={!newAreaInput.trim() || serviceAllAreas}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {serviceAllAreas 
                          ? "You will serve all areas within your selected districts."
                          : "Type specific areas within your service districts, or check 'All Areas' to serve everywhere in your districts."
                        }
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {workerForm.watch("serviceAreas")?.map((areaName: string, index: number) => (
                        <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                          <span>{areaName}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => {
                              const currentAreas = workerForm.getValues("serviceAreas") || [];
                              workerForm.setValue("serviceAreas", currentAreas.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
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
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Your Location
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-200"
                      onClick={() => handleLocationDetection("worker")}
                      disabled={isLocationLoading}
                    >
                      <div className="flex items-center gap-1">
                        {isLocationLoading ? (
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
                            <span>{workerForm.watch("houseNumber") || workerForm.watch("streetName") || workerForm.watch("areaName") ? "Re-Detect" : "Auto-Detect"}</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </div>

                  {/* House Number */}
                  <div className="mb-3">
                    <Label htmlFor="workerHouseNumber" className="text-xs">House Number</Label>
                    <Input
                      id="workerHouseNumber"
                      placeholder="House/Flat/Building No."
                      {...workerForm.register("houseNumber")}
                      className="text-sm"
                    />
                  </div>

                  {/* Street Name */}
                  <div className="mb-3">
                    <Label htmlFor="workerStreetName" className="text-xs">Street Name</Label>
                    <Input
                      id="workerStreetName"
                      placeholder="Street/Road Name"
                      {...workerForm.register("streetName")}
                      className="text-sm"
                    />
                  </div>

                  {/* Area Name */}
                  <div className="mb-3">
                    <Label htmlFor="workerAreaName" className="text-xs">Area Name</Label>
                    <Input
                      id="workerAreaName"
                      placeholder="Area/Locality Name"
                      {...workerForm.register("areaName")}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* District and PIN Code in grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* District */}
                  <div>
                    <Label htmlFor="workerDistrict" className="text-xs">District</Label>
                    <Popover open={homeDistrictPopoverOpen} onOpenChange={setHomeDistrictPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={homeDistrictPopoverOpen}
                          className="w-full justify-between"
                          disabled={!workerForm.watch("state") || isWorkerLoadingDistricts}
                        >
                          {workerForm.watch("districtId") 
                            ? workerApiDistricts?.find((d: any) => d.id === workerForm.watch("districtId"))?.name || "Select district"
                            : isWorkerLoadingDistricts
                            ? "Loading districts..."
                            : !workerForm.watch("state")
                            ? "Select state first"
                            : "Select district"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 animate-dropdown-open">
                        <Command>
                          <CommandInput 
                            placeholder="Search districts..." 
                            value={workerDistrictSearchInput}
                            onValueChange={setWorkerDistrictSearchInput}
                            className="transition-all duration-200"
                          />
                          <CommandEmpty>No district found.</CommandEmpty>
                          <CommandList className="max-h-40 overflow-y-auto dropdown-scrollbar">
                            <CommandGroup>
                              {workerApiDistricts
                                .filter(district => 
                                  district.name.toLowerCase().includes(workerDistrictSearchInput.toLowerCase())
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
                                        workerForm.setValue("districtId", district.id);
                                        setHomeDistrictPopoverOpen(false);
                                        setWorkerDistrictSearchInput("");
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
                    {workerForm.formState.errors.districtId && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.districtId.message}
                      </p>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div>
                    <Label htmlFor="workerPincode" className="text-xs">PIN Code</Label>
                    <Input
                      id="workerPincode"
                      placeholder="6-digit pincode"
                      maxLength={6}
                      {...workerForm.register("pincode")}
                      className="text-sm"
                    />
                    {workerForm.formState.errors.pincode && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.pincode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* State field */}
                <div>
                  <Label htmlFor="workerState">State</Label>
                  <Popover open={workerStatePopoverOpen} onOpenChange={setWorkerStatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={workerStatePopoverOpen}
                        className="w-full justify-between"
                      >
                        {workerForm.watch("state") 
                          ? INDIAN_STATES_AND_UTS.find(state => state.name === workerForm.watch("state"))?.name
                          : "Select your state"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 animate-dropdown-open">
                      <Command>
                        <CommandInput 
                          placeholder="Search states..." 
                          value={workerStateSearchInput}
                          onValueChange={setWorkerStateSearchInput}
                          className="transition-all duration-200"
                        />
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandList className="max-h-40 overflow-y-auto dropdown-scrollbar">
                          <CommandGroup heading="States">
                            {INDIAN_STATES_AND_UTS
                              .filter(state => state.type === "state")
                              .filter(state => 
                                state.name.toLowerCase().includes(workerStateSearchInput.toLowerCase())
                              )
                              .map((state, index) => (
                                <CommandItem
                                  key={state.id}
                                  className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                  style={{ animationDelay: `${index * 15}ms` }}
                                  onSelect={() => {
                                    const item = document.querySelector(`[data-value="${state.name}"]`);
                                    if (item) {
                                      item.classList.add('animate-selection-highlight');
                                    }
                                    setTimeout(() => {
                                      workerForm.setValue("state", state.name);
                                      // Clear district, pincode and area name when state changes
                                      workerForm.setValue("districtId", "");
                                      workerForm.setValue("pincode", "");
                                      workerForm.setValue("areaName", "");
                                      setWorkerStatePopoverOpen(false);
                                      setWorkerStateSearchInput("");
                                    }, 80);
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
                                state.name.toLowerCase().includes(workerStateSearchInput.toLowerCase())
                              )
                              .map((state, index) => (
                                <CommandItem
                                  key={state.id}
                                  className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                  style={{ animationDelay: `${(INDIAN_STATES_AND_UTS.filter(item => item.type === 'state').length + index) * 15}ms` }}
                                  onSelect={() => {
                                    const item = document.querySelector(`[data-value="${state.name}"]`);
                                    if (item) {
                                      item.classList.add('animate-selection-highlight');
                                    }
                                    setTimeout(() => {
                                      workerForm.setValue("state", state.name);
                                      // Clear district, pincode and area name when state changes
                                      workerForm.setValue("districtId", "");
                                      workerForm.setValue("pincode", "");
                                      workerForm.setValue("areaName", "");
                                      setWorkerStatePopoverOpen(false);
                                      setWorkerStateSearchInput("");
                                    }, 80);
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
                  {workerForm.formState.errors.state && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.state.message}
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
                      <PopoverContent className="w-full p-0 animate-dropdown-open" style={{ overflow: 'visible' }}>
                        <div className="flex flex-col">
                          <div className="px-3 py-2 border-b">
                            <input
                              type="text"
                              placeholder="Search districts..."
                              className="w-full px-0 py-1 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground"
                              onChange={(e) => {
                                // Simple search filter implementation
                                const searchTerm = e.target.value.toLowerCase();
                                const items = document.querySelectorAll('[data-district-item]');
                                items.forEach(item => {
                                  const text = item.textContent?.toLowerCase() || '';
                                  if (text.includes(searchTerm)) {
                                    (item as HTMLElement).style.display = 'block';
                                  } else {
                                    (item as HTMLElement).style.display = 'none';
                                  }
                                });
                              }}
                            />
                          </div>
                          <div className="max-h-40 overflow-y-scroll dropdown-scrollbar" style={{ overflowY: 'scroll' }}>
                            {isWorkerLoadingDistricts ? (
                              <div className="px-3 py-2 text-sm animate-pulse">Loading districts...</div>
                            ) : workerApiDistricts.length > 0 ? (
                              workerApiDistricts.map((district: any, index) => (
                                <div
                                  key={district.id}
                                  data-district-item
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/80 transition-all duration-150 animate-district-load"
                                  style={{ animationDelay: `${index * 20}ms` }}
                                  onClick={() => {
                                    const currentDistricts = workerForm.getValues("serviceDistricts") || [];
                                    if (!currentDistricts.includes(district.id)) {
                                      workerForm.setValue("serviceDistricts", [...currentDistricts, district.id]);
                                    }
                                    setDistrictPopoverOpen(false);
                                  }}
                                >
                                  {district.name}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No districts found</div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Select districts from dropdown or type to search (e.g., Chennai, Coimbatore, Salem)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workerForm.watch("serviceDistricts")?.map((districtId: string, index) => {
                      const district = workerApiDistricts.find((d: any) => d.id === districtId) || null;
                      return district ? (
                        <div 
                          key={districtId} 
                          className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs animate-tag-appear transition-all duration-150 hover:bg-secondary/80"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <span className="transition-all duration-150">{district.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 transition-all duration-150 hover:bg-destructive/20"
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              const tagElement = target.closest('.animate-tag-appear') as HTMLElement;
                              if (tagElement) {
                                tagElement.classList.add('animate-tag-remove');
                              }
                              setTimeout(() => {
                                const currentDistricts = workerForm.getValues("serviceDistricts") || [];
                                workerForm.setValue("serviceDistricts", currentDistricts.filter(id => id !== districtId));
                              }, 150);
                            }}
                          >
                            <X className="h-3 w-3 transition-all duration-150" />
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
