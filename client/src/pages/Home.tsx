import { useState, useEffect } from "react";

// Add TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ServiceCard } from "@/components/ServiceCard";
import { WorkerCard } from "@/components/WorkerCard";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, Shield, Clock, Users, MapPin, Star, Handshake, ChevronDown, X, MapPinIcon } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import rajeshAvatar from "@assets/Babu_1753861985304.png";
import arjunAvatar from "@assets/krishnan_1753861985304.png";
import sureshAvatar from "@assets/veni_1753861985304.png";
import { INDIAN_STATES_AND_UTS } from "@shared/constants";

// Mock data for demonstration
const mockServices = [
  {
    id: "plumber",
    name: "Plumbing Services",
    description: "Expert plumbers for repairs, installations, and maintenance across Tamil Nadu districts.",
    icon: "fas fa-wrench",
    price: "₹299/hour",
    rating: 4.8,
    reviews: 2340
  },
  {
    id: "electrician",
    name: "Electrical Services",
    description: "Licensed electricians for wiring, repairs, and electrical installations.",
    icon: "fas fa-bolt",
    price: "₹399/hour",
    rating: 4.7,
    reviews: 1890
  },
  {
    id: "painter",
    name: "Painting Services",
    description: "Professional painters for interior and exterior painting projects.",
    icon: "fas fa-paint-roller",
    price: "₹349/hour",
    rating: 4.9,
    reviews: 3210
  },
  {
    id: "mechanic",
    name: "Mechanic Services",
    description: "Skilled mechanics for vehicle repairs and maintenance services.",
    icon: "fas fa-tools",
    price: "₹449/hour", 
    rating: 4.6,
    reviews: 1560
  },
  {
    id: "septic_cleaner",
    name: "Septic Cleaning",
    description: "Professional septic tank cleaning and maintenance services.",
    icon: "fas fa-recycle",
    price: "₹199/hour",
    rating: 4.5,
    reviews: 890
  },
  {
    id: "general_repairs",
    name: "General Repairs",
    description: "Multi-skilled workers for various home and office repair needs.",
    icon: "fas fa-hammer",
    price: "₹249/hour",
    rating: 4.7,
    reviews: 2100
  }
];

const mockWorkers = [
  {
    id: "worker1",
    name: "Rajesh Kumar",
    service: "Expert Plumber",
    location: "Chennai, Tamil Nadu",
    rating: 5.0,
    reviews: 156,
    hourlyRate: "₹299/hour",
    experience: "5+ years exp",
    isAvailable: true,
    avatar: rajeshAvatar
  },
  {
    id: "worker2",
    name: "Arjun Patel",
    service: "Licensed Electrician",
    location: "Coimbatore, Tamil Nadu",
    rating: 4.9,
    reviews: 203,
    hourlyRate: "₹399/hour",
    experience: "7+ years exp",
    isAvailable: true,
    avatar: arjunAvatar
  },
  {
    id: "worker3",
    name: "Suresh Murugan",
    service: "Professional Painter",
    location: "Madurai, Tamil Nadu",
    rating: 4.8,
    reviews: 89,
    hourlyRate: "₹349/hour",
    experience: "4+ years exp",
    isAvailable: true,
    avatar: sureshAvatar
  }
];

// All 38 Tamil Nadu Districts
const allTamilNaduDistricts = [
  { id: "ariyalur", name: "Ariyalur", tamilName: "அரியலூர்" },
  { id: "chengalpattu", name: "Chengalpattu", tamilName: "செங்கல்பட்டு" },
  { id: "chennai", name: "Chennai", tamilName: "சென்னை" },
  { id: "coimbatore", name: "Coimbatore", tamilName: "கோயம்புத்தூர்" },
  { id: "cuddalore", name: "Cuddalore", tamilName: "கடலூர்" },
  { id: "dharmapuri", name: "Dharmapuri", tamilName: "தர்மபுரி" },
  { id: "dindigul", name: "Dindigul", tamilName: "திண்டுக்கல்" },
  { id: "erode", name: "Erode", tamilName: "ஈரோடு" },
  { id: "kallakurichi", name: "Kallakurichi", tamilName: "கள்ளக்குறிச்சி" },
  { id: "kanchipuram", name: "Kanchipuram", tamilName: "காஞ்சிபுரம்" },
  { id: "kanyakumari", name: "Kanyakumari", tamilName: "கன்யாகுமரி" },
  { id: "karur", name: "Karur", tamilName: "கரூர்" },
  { id: "krishnagiri", name: "Krishnagiri", tamilName: "கிருஷ்ணகிரி" },
  { id: "madurai", name: "Madurai", tamilName: "மதுரை" },
  { id: "mayiladuthurai", name: "Mayiladuthurai", tamilName: "மயிலாடுதுறை" },
  { id: "nagapattinam", name: "Nagapattinam", tamilName: "நாகப்பட்டினம்" },
  { id: "namakkal", name: "Namakkal", tamilName: "நாமக்கல்" },
  { id: "nilgiris", name: "Nilgiris", tamilName: "நீலகிரி" },
  { id: "perambalur", name: "Perambalur", tamilName: "பெரம்பலூர்" },
  { id: "pudukkottai", name: "Pudukkottai", tamilName: "புதுக்கோட்டை" },
  { id: "ramanathapuram", name: "Ramanathapuram", tamilName: "இராமநாதபுரம்" },
  { id: "ranipet", name: "Ranipet", tamilName: "ராணிப்பேட்டை" },
  { id: "salem", name: "Salem", tamilName: "சேலம்" },
  { id: "sivaganga", name: "Sivaganga", tamilName: "சிவகங்கை" },
  { id: "tenkasi", name: "Tenkasi", tamilName: "தென்காசி" },
  { id: "thanjavur", name: "Thanjavur", tamilName: "தஞ்சாவூர்" },
  { id: "theni", name: "Theni", tamilName: "தேனி" },
  { id: "thoothukudi", name: "Thoothukudi", tamilName: "தூத்துக்குடி" },
  { id: "tiruchirappalli", name: "Tiruchirappalli", tamilName: "திருச்சிராப்பள்ளி" },
  { id: "tirunelveli", name: "Tirunelveli", tamilName: "திருநெல்வேலி" },
  { id: "tirupattur", name: "Tirupattur", tamilName: "திருப்பத்தூர்" },
  { id: "tiruppur", name: "Tiruppur", tamilName: "திருப்பூர்" },
  { id: "tiruvallur", name: "Tiruvallur", tamilName: "திருவள்ளூர்" },
  { id: "tiruvannamalai", name: "Tiruvannamalai", tamilName: "திருவண்ணாமலை" },
  { id: "tiruvarur", name: "Tiruvarur", tamilName: "திருவாரூர்" },
  { id: "vellore", name: "Vellore", tamilName: "வேலூர்" },
  { id: "viluppuram", name: "Viluppuram", tamilName: "விழுப்புரம்" },
  { id: "virudhunagar", name: "Virudhunagar", tamilName: "விருதுநகர்" }
];

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Chennai",
    rating: 5,
    text: "Found an excellent plumber through SPANNER. The booking process was simple, and the worker arrived on time. Very professional service!",
    avatar: sureshAvatar
  },
  {
    id: 2,
    name: "Muthu Krishnan",
    location: "Coimbatore",
    rating: 5,
    text: "As a worker, SPANNER has helped me connect with more customers. The platform is easy to use and payments are always secure.",
    avatar: arjunAvatar
  },
  {
    id: 3,
    name: "Venkat Raman",
    location: "Madurai",
    rating: 5,
    text: "Excellent platform! Found a skilled electrician quickly. The Tamil language support made it very convenient for me to use.",
    avatar: rajeshAvatar
  }
];

export default function Home() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchForm, setSearchForm] = useState({
    service: "",
    state: "",
    district: "",
    description: ""
  });
  const [serviceOpen, setServiceOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);


  // No longer fetching districts from database - using API approach for all states

  // State for dynamic districts from API
  const [apiDistricts, setApiDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const { data: rawServices } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Remove duplicate services by name
  const services = rawServices ? 
    (rawServices as any[]).filter((service, index, arr) => 
      arr.findIndex(s => s.name === service.name) === index
    ) : null;

  // Get districts based on selected state - use API data for all states
  const getAvailableDistricts = () => {
    if (searchForm.state && apiDistricts.length > 0) {
      // Use API districts for all states (including Tamil Nadu)
      return apiDistricts.map(district => ({
        id: district.name, // Use name as id for API districts
        name: district.name,
        tamilName: null // No Tamil names for API data
      }));
    }
    return [];
  };

  // Fetch districts from API when state changes (for all states)
  useEffect(() => {
    if (searchForm.state) {
      fetchDistrictsFromAPI(searchForm.state);
    } else {
      setApiDistricts([]);
    }
  }, [searchForm.state]);

  const fetchDistrictsFromAPI = async (stateName: string) => {
    setIsLoadingDistricts(true);
    try {
      // Use our backend API endpoint which connects to REST India API
      const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
      
      if (response.ok) {
        const districtsData = await response.json();
        if (Array.isArray(districtsData) && districtsData.length > 0) {
          setApiDistricts(districtsData);
          console.log(`Loaded ${districtsData.length} districts from API for ${stateName}`);
          return;
        }
      }
      
      // Fallback to static data if API fails or returns no data
      const districts = await getFallbackDistricts(stateName);
      setApiDistricts(districts);
      console.log(`Loaded ${districts.length} districts from fallback data for ${stateName}`);
      
    } catch (error) {
      console.error("Error loading districts from API, using fallback:", error);
      // Use fallback data if API fails
      try {
        const districts = await getFallbackDistricts(stateName);
        setApiDistricts(districts);
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
        setApiDistricts([]);
      }
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const getFallbackDistricts = async (stateName: string): Promise<Array<{id: string, name: string}>> => {
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
      "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Mon", "Wokha", "Zunheboto", "Phek"],
      "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Saiha", "Mamit"],
      "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Ziro", "Tezu", "Khonsa"],
      "Sikkim": ["East Sikkim", "West Sikkim", "North Sikkim", "South Sikkim"]
    };

    const districts = majorDistricts[stateName] || [];
    return districts.map((district, index) => ({
      id: `${district}-${index}`,
      name: district
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search:", searchForm);
  };

  const handleLocationFinder = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use a free reverse geocoding service (nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location data');
          }
          
          const data = await response.json();
          
          if (data && data.address) {
            const locationData = data.address;
            console.log("Location detection results:", {
              detectedLocation: locationData.state_district || locationData.county || locationData.city || locationData.town || locationData.village,
              detectedCounty: locationData.county,
              detectedStateDistrict: locationData.state_district,
              detectedPincode: locationData.postcode,
              matchingDistrict: null,
              allLocationData: locationData
            });
            
            // Extract state from location data
            const detectedState = locationData.state;
            
            // Try to extract district/state information
            const detectedLocation = locationData.state_district || 
                                   locationData.county || 
                                   locationData.city || 
                                   locationData.town ||
                                   locationData.village;
            
            // Set the state field if detected
            let finalDetectedState = detectedState;
            if (detectedState) {
              // Find matching state in INDIAN_STATES_AND_UTS
              const matchingState = INDIAN_STATES_AND_UTS.find(state => 
                state.name.toLowerCase() === detectedState.toLowerCase() ||
                detectedState.toLowerCase().includes(state.name.toLowerCase())
              );
              
              if (matchingState) {
                finalDetectedState = matchingState.name;
                setSearchForm(prev => ({ ...prev, state: matchingState.name }));
                
                // Load districts and then find matching district with proper timing
                const loadDistrictsAndMatch = async () => {
                  try {
                    setIsLoadingDistricts(true);
                    // Load districts for the detected state
                    const response = await fetch(`/api/districts/${encodeURIComponent(matchingState.name)}`);
                    if (response.ok) {
                      const districtsData = await response.json();
                      if (Array.isArray(districtsData) && districtsData.length > 0) {
                        setApiDistricts(districtsData);
                        
                        // Small delay to ensure state is updated
                        setTimeout(() => {
                          // Now find matching district with improved matching logic
                          const matchingDistrict = districtsData.find((district: any) => {
                            const districtName = district.name.toLowerCase();
                            const detectedStateDistrict = locationData.state_district?.toLowerCase() || '';
                            const detectedCounty = locationData.county?.toLowerCase() || '';
                            
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
                            setSearchForm(prev => ({ ...prev, district: matchingDistrict.name }));
                            setDistrictOpen(false);
                            toast({
                              title: "Location detected",
                              description: `Your location has been set to ${matchingDistrict.name}, ${finalDetectedState}`,
                            });
                          } else {
                            toast({
                              title: "Location detected",
                              description: `Please select your district from ${finalDetectedState}`,
                            });
                          }
                          setIsLoadingDistricts(false);
                        }, 300);
                        return;
                      }
                    }
                    
                    // If no district match found, show state was detected
                    setIsLoadingDistricts(false);
                    toast({
                      title: "Location detected",
                      description: `Please select your district from ${finalDetectedState}`,
                    });
                    
                  } catch (error) {
                    console.error("Error loading districts for location matching:", error);
                    setIsLoadingDistricts(false);
                    toast({
                      title: "Location detected",
                      description: `Please select your district from ${finalDetectedState}`,
                    });
                  }
                };
                
                await loadDistrictsAndMatch();
                return; // Skip the original district matching logic
              }
            }
            
            // Find matching district using current API data (fallback)
            let matchingDistrict = null;
            const availableDistricts = getAvailableDistricts();
            matchingDistrict = availableDistricts.find((district: any) => {
              const districtName = district.name.toLowerCase();
              const detectedName = detectedLocation?.toLowerCase() || '';
              return districtName.includes(detectedName) || 
                     detectedName.includes(districtName);
            });
            
            console.log("Location detection results:", {
              detectedLocation,
              detectedCounty: locationData.county,
              detectedStateDistrict: locationData.state_district,
              detectedPincode: locationData.postcode,
              matchingDistrict: matchingDistrict?.name,
              allLocationData: locationData
            });
            
            if (matchingDistrict) {
              setSearchForm(prev => ({ ...prev, district: matchingDistrict.id }));
              toast({
                title: "Location detected",
                description: `Your location has been set to ${matchingDistrict.name}${finalDetectedState ? `, ${finalDetectedState}` : ''}`,
              });
            } else {
              // If no district match found, show state was detected
              if (finalDetectedState) {
                toast({
                  title: "Location detected",
                  description: `Please select your district from ${finalDetectedState}`,
                });
              } else {
                toast({
                  title: "District not found",
                  description: "Please select your location manually",
                  variant: "destructive",
                });
              }
            }
          }
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: "Location detection failed",
            description: "Please select your district manually",
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
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const resetForm = () => {
    setSearchForm({
      service: "",
      state: "",
      district: "",
      description: ""
    });
  };

  // Voice input handler
  const handleVoiceTranscript = (transcript: string) => {
    setSearchForm(prev => ({ ...prev, description: transcript }));
  };

  const handleServiceClick = (serviceId: string) => {
    console.log("Service clicked:", serviceId);
    // Navigate to service page or show service details
  };

  const handleWorkerContact = (workerId: string) => {
    console.log("Contact worker:", workerId);
    // Implement contact functionality
  };

  const handleDistrictClick = (districtName: string) => {
    console.log("District clicked:", districtName);
    // Filter workers by district
  };

  // Authentication checks - MUST be after all hooks
  if (user && window.location.pathname === '/') {
    const userRole = user.role;
    if (userRole === "admin" || userRole === "super_admin") {
      setLocation("/admin-dashboard");
      return null;
    } else if (userRole === "worker") {
      setLocation("/worker-dashboard");
      return null;
    } else if (userRole === "client") {
      setLocation("/dashboard");
      return null;
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-blue-600 text-white py-20 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                India's Most Trusted Urban Services Platform
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Connect with verified skilled workers across all states and districts of India. From plumbing to electrical work, find the right professional for your needs with transparent pricing and secure booking.
              </p>
              
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Verified Workers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>24/7 Support</span>
                </div>
              </div>
              
              {!user && (
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary border-primary hover:bg-primary hover:text-white"
                    onClick={() => {
                      // This will trigger the register modal with client tab
                      const event = new CustomEvent('openRegisterModal', { detail: { tab: 'client' } });
                      window.dispatchEvent(event);
                    }}
                  >
                    <span className="mr-2">👤</span>
                    Sign Up as Client
                  </Button>
                  <Button
                    size="lg"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                    onClick={() => {
                      // This will trigger the register modal with worker tab
                      const event = new CustomEvent('openRegisterModal', { detail: { tab: 'worker' } });
                      window.dispatchEvent(event);
                    }}
                  >
                    <span className="mr-2">🔧</span>
                    Join as Worker
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <Card className="bg-white/95 backdrop-blur text-foreground shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground flex-1">
                      Find Services Near You
                    </h3>
                    <VoiceAssistant
                      onServiceSelect={(serviceId) => setSearchForm(prev => ({ ...prev, service: serviceId }))}
                      onStateSelect={(stateName) => setSearchForm(prev => ({ ...prev, state: stateName }))}
                      onDistrictSelect={(districtName) => setSearchForm(prev => ({ ...prev, district: districtName }))}
                      onDescriptionUpdate={(description) => setSearchForm(prev => ({ ...prev, description }))}
                      services={services || []}
                      className="h-10 w-10 p-2 rounded-full"
                    />
                  </div>
                  
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                          Service Type
                        </label>
                        <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={serviceOpen}
                              className="w-full justify-between"
                            >
                              {searchForm.service
                                ? services?.find((service: any) => service.id === searchForm.service)?.name
                                : "Select Service"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 animate-dropdown-open">
                            <Command>
                              <CommandInput 
                                placeholder="Search services..." 
                                className="transition-all duration-200"
                              />
                              <CommandList className="dropdown-scrollbar">
                                <CommandEmpty>No service found.</CommandEmpty>
                                <CommandGroup>
                                  {services?.map((service: any, index) => (
                                    <CommandItem
                                      key={service.id}
                                      value={service.name}
                                      className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                      style={{ animationDelay: `${index * 30}ms` }}
                                      onSelect={() => {
                                        const item = document.querySelector(`[data-value="${service.name}"]`);
                                        if (item) {
                                          item.classList.add('animate-selection-highlight');
                                        }
                                        setTimeout(() => {
                                          setSearchForm(prev => ({ ...prev, service: service.id }));
                                          setServiceOpen(false);
                                        }, 100);
                                      }}
                                    >
                                      <span className="transition-all duration-150">{service.name}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-foreground">
                            State
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={handleLocationFinder}
                            disabled={isLocationLoading}
                          >
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {isLocationLoading ? "Finding..." : "Use Location"}
                          </Button>
                        </div>
                        <Popover open={stateOpen} onOpenChange={setStateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={stateOpen}
                              className="w-full justify-between"
                            >
                              {searchForm.state
                                ? INDIAN_STATES_AND_UTS.find(state => state.name === searchForm.state)?.name
                                : "Select your state"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 animate-dropdown-open">
                            <Command>
                              <CommandInput 
                                placeholder="Search states..." 
                                className="transition-all duration-200"
                              />
                              <CommandList className="dropdown-scrollbar">
                                <CommandEmpty>No state found.</CommandEmpty>
                                <CommandGroup heading="States">
                                  {INDIAN_STATES_AND_UTS.filter(item => item.type === 'state').map((state, index) => (
                                    <CommandItem
                                      key={state.name}
                                      value={state.name}
                                      className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                      style={{ animationDelay: `${index * 20}ms` }}
                                      onSelect={() => {
                                        const item = document.querySelector(`[data-value="${state.name}"]`);
                                        if (item) {
                                          item.classList.add('animate-selection-highlight');
                                        }
                                        setTimeout(() => {
                                          setSearchForm(prev => ({ ...prev, state: state.name }));
                                          setStateOpen(false);
                                        }, 100);
                                      }}
                                    >
                                      <span className="transition-all duration-150">{state.name}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                <CommandGroup heading="Union Territories">
                                  {INDIAN_STATES_AND_UTS.filter(item => item.type === 'ut').map((ut, index) => (
                                    <CommandItem
                                      key={ut.name}
                                      value={ut.name}
                                      className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                      style={{ animationDelay: `${(INDIAN_STATES_AND_UTS.filter(item => item.type === 'state').length + index) * 20}ms` }}
                                      onSelect={() => {
                                        const item = document.querySelector(`[data-value="${ut.name}"]`);
                                        if (item) {
                                          item.classList.add('animate-selection-highlight');
                                        }
                                        setTimeout(() => {
                                          setSearchForm(prev => ({ ...prev, state: ut.name }));
                                          setStateOpen(false);
                                        }, 100);
                                      }}
                                    >
                                      <span className="transition-all duration-150">{ut.name}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                          District
                        </label>
                        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={districtOpen}
                              className="w-full justify-between"
                            >
                              {searchForm.district
                                ? (() => {
                                    const selectedDistrict = getAvailableDistricts().find((district: any) => district.id === searchForm.district);
                                    return selectedDistrict ? selectedDistrict.name : "Select District";
                                  })()
                                : isLoadingDistricts ? "Loading districts..." : "Select District"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 animate-dropdown-open">
                            <Command>
                              <CommandInput 
                                placeholder="Search districts..." 
                                className="transition-all duration-200"
                              />
                              <CommandList className="dropdown-scrollbar">
                                <CommandEmpty>No district found.</CommandEmpty>
                                <CommandGroup>
                                  {getAvailableDistricts().map((district: any, index) => (
                                    <CommandItem
                                      key={district.id}
                                      value={district.name}
                                      className="transition-all duration-150 hover:bg-accent/80 data-[selected=true]:bg-accent animate-district-load"
                                      style={{ animationDelay: `${index * 25}ms` }}
                                      onSelect={() => {
                                        const item = document.querySelector(`[data-value="${district.name}"]`);
                                        if (item) {
                                          item.classList.add('animate-selection-highlight');
                                        }
                                        setTimeout(() => {
                                          setSearchForm(prev => ({ ...prev, district: district.id }));
                                          setDistrictOpen(false);
                                        }, 100);
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
                      </div>
                      

                    
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">
                          Description
                        </label>
                        <div className="relative">
                          <Input
                            placeholder="Describe your service requirement..."
                            value={searchForm.description}
                            onChange={(e) => setSearchForm(prev => ({ ...prev, description: e.target.value }))}
                            className="pr-14"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                            <VoiceInput 
                              onTranscript={handleVoiceTranscript}
                              language="en-US"
                              size="sm"
                              className="h-9 w-9 p-1.5 rounded-lg font-medium"
                              showStatus={false}
                              supportedLanguages={["en-US", "ta-IN", "hi-IN", "en-IN"]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Search className="h-4 w-4 mr-2" />
                        Search Workers
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetForm}
                        className="px-4"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-primary mb-2">25,000+</h3>
                <p className="text-muted-foreground">Verified Workers</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border">
                <MapPin className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-600 mb-2">38</h3>
                <p className="text-muted-foreground">Districts Covered</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border">
                <Handshake className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-yellow-600 mb-2">1,50,000+</h3>
                <p className="text-muted-foreground">Jobs Completed</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border">
                <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-yellow-600 mb-2">4.8/5</h3>
                <p className="text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Featured Workers Section */}
      <section className="py-16 bg-muted/30" id="workers">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("workers.title")}</h2>
            <p className="text-xl text-muted-foreground">
              Meet our verified professionals with excellent track records
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                id={worker.id}
                name={worker.name}
                service={worker.service}
                location={worker.location}
                rating={worker.rating}
                reviews={worker.reviews}
                hourlyRate={worker.hourlyRate}
                experience={worker.experience}
                isAvailable={worker.isAvailable}
                avatar={worker.avatar}
                onContact={handleWorkerContact}
              />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="secondary">
              <Users className="h-5 w-5 mr-2" />
              View All Workers
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("features.title")}</h2>
            <p className="text-xl text-muted-foreground">
              Connecting Tamil Nadu with trusted blue-collar professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Workers",
                description: "All workers undergo background verification including Aadhaar validation and skill assessment."
              },
              {
                icon: CheckCircle,
                title: "Secure Payments",
                description: "Multiple payment options including UPI, cards, and digital wallets with secure processing."
              },
              {
                icon: Clock,
                title: "24/7 Support",
                description: "Round-the-clock customer support in both English and Tamil languages."
              },
              {
                icon: Star,
                title: "Quality Assurance",
                description: "Rating and review system ensures high-quality service delivery across all categories."
              },
              {
                icon: Users,
                title: "Large Network",
                description: "Connect with thousands of skilled professionals across all 38 Tamil Nadu districts."
              },
              {
                icon: MapPin,
                title: "Local Focus",
                description: "District-wise service matching ensures you find workers in your immediate area."
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h5 className="font-semibold text-lg mb-3">{feature.title}</h5>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("testimonials.title")}</h2>
            <p className="text-xl text-muted-foreground">
              Real feedback from satisfied customers across Tamil Nadu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < testimonial.rating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">"{testimonial.text}"</p>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h6 className="font-semibold">{testimonial.name}</h6>
                      <small className="text-muted-foreground">{testimonial.location}</small>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("cta.title")}</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied customers and skilled workers on Tamil Nadu's leading service marketplace
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => {
                // This will trigger the register modal with client tab
                const event = new CustomEvent('openRegisterModal', { detail: { tab: 'client' } });
                window.dispatchEvent(event);
              }}
            >
              <Users className="h-5 w-5 mr-2" />
              Sign Up as Client
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
              onClick={() => {
                // This will trigger the register modal with worker tab
                const event = new CustomEvent('openRegisterModal', { detail: { tab: 'worker' } });
                window.dispatchEvent(event);
              }}
            >
              <Users className="h-5 w-5 mr-2" />
              Join as Worker
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
