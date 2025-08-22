import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { WorkerCard } from "@/components/WorkerCard";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthenticationModal from "@/components/AuthenticationModal";
import { CheckCircle, Shield, Clock, Users, MapPin, Star, Handshake } from "lucide-react";

import { SEOHead } from "@/components/SEOHead";
import rajeshAvatar from "@assets/Babu_1753861985304.png";
import arjunAvatar from "@assets/krishnan_1753861985304.png";
import sureshAvatar from "@assets/veni_1753861985304.png";

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
  }
];

const mockWorkers = [
  {
    id: "worker-1",
    name: "Rajesh Kumar",
    service: "Plumber",
    location: "Chennai, Tamil Nadu",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 350,
    experience: "5+ years",
    isAvailable: true,
    avatar: rajeshAvatar
  },
  {
    id: "worker-2",
    name: "Arjun Singh",
    service: "Electrician",
    location: "Coimbatore, Tamil Nadu",
    rating: 4.8,
    reviews: 89,
    hourlyRate: 400,
    experience: "7+ years",
    isAvailable: false,
    avatar: arjunAvatar
  },
  {
    id: "worker-3",
    name: "Suresh Babu",
    service: "Painter",
    location: "Madurai, Tamil Nadu",
    rating: 4.9,
    reviews: 156,
    hourlyRate: 320,
    experience: "6+ years",
    isAvailable: true,
    avatar: sureshAvatar
  }
];

// Translation function (basic implementation)
const t = (key: string) => {
  const translations: Record<string, string> = {
    "hero.title": "Find Trusted Blue-Collar Services",
    "hero.subtitle": "Connect with verified professionals across Tamil Nadu",
    "services.title": "Popular Services",
    "workers.title": "Featured Workers",
    "features.title": "Why Choose SPANNER",
    "cta.getStarted": "Get Started Today",
    "cta.description": "Join thousands of satisfied customers",
  };
  return translations[key] || key;
};

export default function Home() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const handleWorkerContact = (workerId: string) => {
    if (!user) {
      setAuthModalMode("login");
      setAuthModalOpen(true);
      return;
    }
    
    toast({
      title: "Contact Worker",
      description: "Worker contact feature will be available soon!",
    });
  };

  const openLoginModal = () => {
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthModalMode("signup");
    setAuthModalOpen(true);
  };

  if (user) {
    setLocation('/dashboard');
    return null;
  }

  return (
    <>
      <SEOHead 
        title="SPANNER - Tamil Nadu Blue-Collar Service Marketplace | Find Trusted Workers"
        description="Connect with verified blue-collar professionals across Tamil Nadu. Find plumbers, electricians, painters, and more. Trusted by thousands of customers."
        keywords="blue collar services Tamil Nadu, plumbers Chennai, electricians Coimbatore, home services India, professional workers"
      />
      
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Find Trusted 
                  <span className="text-primary block">Blue-Collar Services</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                  Connect with verified professionals across Tamil Nadu. 
                  From plumbing to electrical work, find skilled workers near you.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-lg"
                  onClick={openSignupModal}
                  data-testid="button-get-started"
                >
                  Get Started Today
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 text-lg font-semibold rounded-lg"
                  onClick={openLoginModal}
                  data-testid="button-login"
                >
                  Login
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified Workers</h3>
                    <p className="text-sm text-gray-600">Background checked professionals</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Quick Service</h3>
                    <p className="text-sm text-gray-600">Same-day service available</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Top Rated</h3>
                    <p className="text-sm text-gray-600">4.8+ average rating</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Handshake className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Fair Pricing</h3>
                    <p className="text-sm text-gray-600">Transparent, honest rates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Visual placeholder */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="w-full max-w-md h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">30,000+ Happy Customers</h3>
                  <p className="text-gray-600">Join our community of satisfied users across Tamil Nadu</p>
                </div>
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
                name={worker.name}
                service={worker.service}
                location={worker.location}
                rating={worker.rating}
                reviews={worker.reviews}
                hourlyRate={worker.hourlyRate.toString()}
                experience={worker.experience}
                isAvailable={worker.isAvailable}
                avatar={worker.avatar}
                onContact={handleWorkerContact}
              />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={openLoginModal}
              data-testid="button-view-all-workers"
            >
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
              Why choose SPANNER for your service needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mockServices.map((service) => (
              <ServiceCard
                key={service.id}
                name={service.name}
                description={service.description}
                icon={service.icon}
                price={service.price}
                rating={service.rating}
                reviews={service.reviews}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold mb-6">
              Ready to find your perfect service provider?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of satisfied customers who trust SPANNER for their home service needs
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                onClick={openSignupModal}
                data-testid="button-join-now"
              >
                Join Now - It's Free
                <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold"
                onClick={openLoginModal}
                data-testid="button-login-cta"
              >
                Already a member? Login
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">30,000+</div>
                <div className="opacity-80">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold">5,000+</div>
                <div className="opacity-80">Verified Workers</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50,000+</div>
                <div className="opacity-80">Jobs Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication Modal */}
      <AuthenticationModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}