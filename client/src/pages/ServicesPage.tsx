import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, Shield, MapPin, ArrowRight } from "lucide-react";

export default function ServicesPage() {
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Blue Collar Services Marketplace - SPANNER",
    "description": "Comprehensive blue collar services including plumbing, electrical, painting, carpentry, cleaning, and more across India",
    "provider": {
      "@type": "Organization",
      "name": "SPANNER"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Home Services Catalog",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Plumbing Services",
            "description": "Professional plumbing services including repairs, installations, and maintenance"
          }
        },
        {
          "@type": "Offer", 
          "itemOffered": {
            "@type": "Service",
            "name": "Electrical Services",
            "description": "Licensed electrical work including wiring, repairs, and installations"
          }
        }
      ]
    }
  };

  const services = [
    {
      name: "Plumbing Services",
      description: "Expert plumbers for pipe repairs, installations, drain cleaning, and bathroom fixtures",
      price: "Starting from ₹299",
      rating: 4.8,
      bookings: "25,000+",
      workers: "5,000+",
      icon: "🔧",
      features: ["24/7 Emergency Service", "Licensed Professionals", "Warranty Included", "Same Day Service"],
      locations: ["Mumbai", "Delhi", "Bangalore", "Chennai", "+996 more"]
    },
    {
      name: "Electrical Services", 
      description: "Licensed electricians for wiring, switch repairs, appliance installation, and safety checks",
      price: "Starting from ₹399",
      rating: 4.7,
      bookings: "20,000+",
      workers: "4,200+",
      icon: "⚡",
      features: ["Safety Certified", "Modern Equipment", "Emergency Repairs", "Installation Services"],
      locations: ["Mumbai", "Delhi", "Hyderabad", "Pune", "+996 more"]
    },
    {
      name: "Painting Services",
      description: "Professional painters for interior, exterior, and specialty painting projects",
      price: "Starting from ₹349",
      rating: 4.9,
      bookings: "18,000+", 
      workers: "3,800+",
      icon: "🎨",
      features: ["Quality Paints", "Color Consultation", "Surface Preparation", "Clean Finish"],
      locations: ["Bangalore", "Chennai", "Kolkata", "Ahmedabad", "+996 more"]
    },
    {
      name: "Carpentry Services",
      description: "Skilled carpenters for furniture repair, custom woodwork, and installation services",
      price: "Starting from ₹449",
      rating: 4.6,
      bookings: "15,000+",
      workers: "3,200+", 
      icon: "🪚",
      features: ["Custom Designs", "Quality Wood", "Repair Services", "Installation"],
      locations: ["Delhi", "Mumbai", "Jaipur", "Lucknow", "+996 more"]
    },
    {
      name: "Home Cleaning",
      description: "Professional cleaning services for homes, offices, and deep cleaning requirements",
      price: "Starting from ₹199",
      rating: 4.8,
      bookings: "30,000+",
      workers: "6,500+",
      icon: "🧽",
      features: ["Eco-Friendly Products", "Trained Staff", "Regular Service", "Deep Cleaning"],
      locations: ["Mumbai", "Bangalore", "Hyderabad", "Pune", "+996 more"]
    },
    {
      name: "AC Repair & Service",
      description: "Expert AC technicians for repair, maintenance, installation, and gas filling services",
      price: "Starting from ₹299",
      rating: 4.7,
      bookings: "22,000+",
      workers: "4,000+",
      icon: "❄️",
      features: ["All Brands Supported", "Genuine Parts", "Annual Maintenance", "Emergency Service"],
      locations: ["Delhi", "Mumbai", "Chennai", "Ahmedabad", "+996 more"]
    },
    {
      name: "Appliance Repair",
      description: "Skilled technicians for washing machine, refrigerator, microwave, and other appliance repairs",
      price: "Starting from ₹249",
      rating: 4.6,
      bookings: "16,000+",
      workers: "3,500+",
      icon: "🔌",
      features: ["Multi-Brand Service", "Genuine Parts", "Doorstep Service", "Warranty"],
      locations: ["Bangalore", "Hyderabad", "Kolkata", "Indore", "+996 more"]
    },
    {
      name: "Pest Control",
      description: "Professional pest control services for termites, cockroaches, bed bugs, and rodents",
      price: "Starting from ₹599",
      rating: 4.5,
      bookings: "12,000+",
      workers: "2,800+",
      icon: "🐛",
      features: ["Safe Chemicals", "Licensed Service", "Follow-up Visit", "Long-lasting Results"],
      locations: ["Mumbai", "Delhi", "Chennai", "Pune", "+996 more"]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEOHead
        title="Home Services Near You | Plumbing, Electrical, Cleaning & More | SPANNER"
        description="Get professional home services from verified experts. Plumbing, electrical, painting, carpentry, cleaning, AC repair, and more. 50,000+ skilled workers, instant booking, secure payments across 1000+ Indian cities."
        keywords="home services near me, plumbing services, electrical services, painting services, carpentry services, home cleaning, AC repair, appliance repair, pest control, skilled workers India, professional services"
        canonical="https://spanner.replit.app/services"
        ogTitle="Professional Home Services - SPANNER Marketplace"
        ogDescription="Book professional home services from verified experts. Plumbing, electrical, cleaning, painting & more. 50,000+ workers across India."
        schemaData={servicesSchema}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Professional Home Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Book trusted professionals for all your home service needs. From plumbing to painting, 
            we connect you with verified skilled workers across 1000+ Indian cities.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{service.icon}</div>
                    <div>
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-medium">{service.rating}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {service.workers} workers
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{service.price}</div>
                    <div className="text-xs text-muted-foreground">{service.bookings} bookings</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <Shield className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Available in:</h4>
                  <div className="flex flex-wrap gap-1">
                    {service.locations.map((location, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full">
                  Book {service.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Why Choose Our Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SPANNER Services?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold mb-2">Verified Professionals</h3>
                <p className="text-sm text-muted-foreground">
                  All service providers are background verified and skill tested
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold mb-2">Quick Response</h3>
                <p className="text-sm text-muted-foreground">
                  Same day service available for urgent requirements
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-sm text-muted-foreground">
                  100% satisfaction guarantee with quality assurance
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold mb-2">Pan India Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Available in 1000+ cities across all Indian states
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service Process */}
        <div className="mb-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold mb-2">Choose Service</h3>
              <p className="text-sm text-muted-foreground">Select the service you need from our comprehensive list</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold mb-2">Select Provider</h3>
              <p className="text-sm text-muted-foreground">Browse and choose from verified professionals in your area</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold mb-2">Book & Pay</h3>
              <p className="text-sm text-muted-foreground">Schedule your service and make secure payment</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold mb-2">Get Service</h3>
              <p className="text-sm text-muted-foreground">Enjoy professional service with quality guarantee</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Need a Service Today?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Don't wait! Book professional services from verified experts in your area. 
            Quick response, quality guaranteed, and transparent pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Book Service Now
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Call +91-9000000001
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}