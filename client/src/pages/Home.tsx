import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { WorkerCard } from "@/components/WorkerCard";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
    id: "worker1",
    name: "Rajesh Kumar",
    service: "Plumbing",
    location: "Chennai, Tamil Nadu",
    rating: 4.9,
    reviews: 127,
    hourlyRate: 299,
    experience: "8+ years",
    isAvailable: true,
    avatar: rajeshAvatar
  },
  {
    id: "worker2", 
    name: "Arjun Singh",
    service: "Electrical",
    location: "Coimbatore, Tamil Nadu",
    rating: 4.8,
    reviews: 94,
    hourlyRate: 399,
    experience: "6+ years",
    isAvailable: true,
    avatar: arjunAvatar
  },
  {
    id: "worker3",
    name: "Suresh Patel", 
    service: "Painting",
    location: "Madurai, Tamil Nadu",
    rating: 4.7,
    reviews: 156,
    hourlyRate: 349,
    experience: "10+ years",
    isAvailable: false,
    avatar: sureshAvatar
  }
];

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleWorkerContact = (workerId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to contact workers",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Contact Request Sent",
      description: "The worker will contact you shortly",
    });
  };

  // Schema.org structured data for SEO
  const homePageSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SPANNER - India's Blue Collar Service Marketplace",
    "url": "https://spanner.replit.app",
    "description": "Find verified skilled workers across India on SPANNER. Connect with plumbers, electricians, painters, mechanics, carpenters, cleaning services, and more.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://spanner.replit.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "mainEntity": {
      "@type": "Organization",
      "name": "SPANNER",
      "url": "https://spanner.replit.app",
      "logo": "https://spanner.replit.app/logo.png",
      "description": "India's leading blue collar service marketplace connecting clients with verified skilled workers",
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "serviceType": ["Plumbing", "Electrical Work", "Painting", "Carpentry", "Cleaning Services", "Mechanical Repairs"]
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://spanner.replit.app"
        }
      ]
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="SPANNER - India's #1 Blue Collar Service Marketplace | Find Skilled Workers Near You"
        description="Find verified skilled workers across India on SPANNER. Connect with plumbers, electricians, painters, mechanics, carpenters, cleaning services, and more. Instant booking, secure payments, GPS tracking. Available in 1000+ cities nationwide."
        keywords="blue collar services India, skilled workers near me, plumber electrician carpenter, home services marketplace, worker booking app, service providers India, local handyman services, verified skilled workers, instant service booking, home maintenance India, SPANNER marketplace, blue collar jobs India"
        canonical="https://spanner.replit.app"
        ogTitle="SPANNER - India's #1 Blue Collar Service Marketplace"
        ogDescription="Find verified skilled workers across India. Connect with plumbers, electricians, painters, mechanics, carpenters, cleaning services, and more. Available in 1000+ cities nationwide."
        schemaData={homePageSchema}
      />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-blue-600 text-white py-20 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="max-w-4xl text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                India's Most Trusted Urban Services Platform
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Discover seamless access to verified and skilled professionals across every state and district in India. Whether you need plumbing, electrical, carpentry, or appliance repair services, our platform connects you with certified experts tailored to your requirements. Enjoy transparent pricing, secure online booking, and reliable service delivery — all designed to make urban living simpler, safer, and more efficient.
              </p>
              <p className="text-lg mb-8 text-blue-200 font-medium">
                Trusted by thousands, we're redefining home and workplace maintenance with professionalism, accountability, and peace of mind.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8">
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
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
              Why choose SPANNER for your service needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mockServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                name={service.name}
                description={service.description}
                icon={service.icon}
                price={service.price}
                rating={service.rating}
                reviews={service.reviews}
              />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="secondary">
              View All Services
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied customers who trust SPANNER for their service needs
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-primary border-primary hover:bg-gray-100"
                onClick={() => {
                  const event = new CustomEvent('openRegisterModal', { detail: { tab: 'client' } });
                  window.dispatchEvent(event);
                }}
              >
                Get Started as Client
              </Button>
              <Button
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={() => {
                  const event = new CustomEvent('openRegisterModal', { detail: { tab: 'worker' } });
                  window.dispatchEvent(event);
                }}
              >
                Join as Worker
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setLocation('/dashboard')}
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}