import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, CheckCircle, Shield, Clock, Users, MapPin, Star, Handshake, ChevronDown, X, MapPinIcon } from "lucide-react";

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
    avatar: "https://images.unsplash.com/photo-1582233479366-6d38bc390a08?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400"
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
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400"
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
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400"
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
    avatar: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400"
  },
  {
    id: 2,
    name: "Muthu Krishnan",
    location: "Coimbatore",
    rating: 5,
    text: "As a worker, SPANNER has helped me connect with more customers. The platform is easy to use and payments are always secure.",
    avatar: "https://images.unsplash.com/photo-1582233479366-6d38bc390a08?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400"
  },
  {
    id: 3,
    name: "Venkat Raman",
    location: "Madurai",
    rating: 5,
    text: "Excellent platform! Found a skilled electrician quickly. The Tamil language support made it very convenient for me to use.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=400"
  }
];

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchForm, setSearchForm] = useState({
    service: "",
    district: "",
    description: ""
  });
  const [serviceOpen, setServiceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const { data: districts } = useQuery({
    queryKey: ["/api/districts"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search:", searchForm);
  };

  const handleLocationFinder = () => {
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding to find the nearest district
          // For demo, we'll simulate finding Chennai based on coordinates
          const nearestDistrict = allTamilNaduDistricts.find(d => d.name === "Chennai");
          if (nearestDistrict) {
            setSearchForm(prev => ({ ...prev, district: nearestDistrict.id }));
          }
          setIsLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocationLoading(false);
          // Fallback: show all districts
        }
      );
    } else {
      setIsLocationLoading(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  const resetForm = () => {
    setSearchForm({
      service: "",
      district: "",
      description: ""
    });
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-blue-600 text-white py-20 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                {t("hero.title")}
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                {t("hero.subtitle")}
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
                      // This will trigger the register modal
                      const event = new CustomEvent('openRegisterModal');
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
                      // This will trigger the register modal
                      const event = new CustomEvent('openRegisterModal');
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
                  <h3 className="text-xl font-bold mb-4 text-foreground">
                    {t("hero.searchTitle")}
                  </h3>
                  
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
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
                                ? (services as any)?.find((service: any) => service.id === searchForm.service)?.name || 
                                  mockServices.find((service) => service.id === searchForm.service)?.name
                                : "Select Service"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search services..." />
                              <CommandList>
                                <CommandEmpty>No service found.</CommandEmpty>
                                <CommandGroup>
                                  {((services as any) || mockServices)?.map((service: any) => (
                                    <CommandItem
                                      key={service.id}
                                      value={service.name}
                                      onSelect={() => {
                                        setSearchForm(prev => ({ ...prev, service: service.id }));
                                        setServiceOpen(false);
                                      }}
                                    >
                                      {service.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {searchForm.service && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => setSearchForm(prev => ({ ...prev, service: "" }))}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-foreground">
                            District
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
                        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={districtOpen}
                              className="w-full justify-between"
                            >
                              {searchForm.district
                                ? allTamilNaduDistricts.find((district) => district.id === searchForm.district)?.name
                                : "Select District"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search districts..." />
                              <CommandList>
                                <CommandEmpty>No district found.</CommandEmpty>
                                <CommandGroup>
                                  {allTamilNaduDistricts.map((district) => (
                                    <CommandItem
                                      key={district.id}
                                      value={district.name}
                                      onSelect={() => {
                                        setSearchForm(prev => ({ ...prev, district: district.id }));
                                        setDistrictOpen(false);
                                      }}
                                    >
                                      {district.name} ({district.tamilName})
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {searchForm.district && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs"
                            onClick={() => setSearchForm(prev => ({ ...prev, district: "" }))}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-foreground">
                        Description
                      </label>
                      <Input
                        placeholder="Describe your service requirement..."
                        value={searchForm.description}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, description: e.target.value }))}
                      />
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

      {/* Tamil Nadu Districts Section */}
      <section className="py-16" id="districts">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("districts.title")}</h2>
            <p className="text-xl text-muted-foreground">
              We serve all 38 districts with verified professionals
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {allTamilNaduDistricts.slice(0, 12).map((district) => (
              <div key={district.id} className="text-center">
                <Button
                  variant="outline"
                  className="w-full mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none hover:from-yellow-600 hover:to-orange-600"
                  onClick={() => handleDistrictClick(district.name)}
                >
                  {district.name}
                </Button>
                <small className="text-muted-foreground">
                  {district.tamilName}
                </small>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              View All 38 Districts
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
            <Button size="lg" variant="secondary">
              <Users className="h-5 w-5 mr-2" />
              Sign Up as Client
            </Button>
            <Button size="lg" variant="outline" className="bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600">
              <Users className="h-5 w-5 mr-2" />
              Join as Worker
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
