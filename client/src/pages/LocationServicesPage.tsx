import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Users, Phone, Clock, Shield } from "lucide-react";

interface LocationServicesPageProps {
  city?: string;
  state?: string;
}

export default function LocationServicesPage({ city = "Chennai", state = "Tamil Nadu" }: LocationServicesPageProps) {
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `SPANNER Services in ${city}`,
    "description": `Find skilled blue collar workers in ${city}, ${state}. Professional plumbers, electricians, painters, mechanics, and more verified service providers.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": state,
      "addressCountry": "India"
    },
    "serviceArea": {
      "@type": "City",
      "name": city
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "5000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "priceRange": "₹₹",
    "telephone": "+91-9000000001",
    "url": `https://spanner.replit.app/locations/${state.toLowerCase().replace(/\s+/g, '-')}/${city.toLowerCase().replace(/\s+/g, '-')}`
  };

  const localServices = [
    {
      name: "Plumbers",
      count: "500+",
      avgRating: 4.8,
      startingPrice: "₹299",
      description: `Professional plumbers in ${city} for all your plumbing needs`,
      specialties: ["Pipe Repair", "Bathroom Fitting", "Drain Cleaning", "Water Heater"]
    },
    {
      name: "Electricians", 
      count: "400+",
      avgRating: 4.7,
      startingPrice: "₹399",
      description: `Licensed electricians in ${city} for safe electrical work`,
      specialties: ["Wiring", "Switch Repair", "Fan Installation", "Appliance Setup"]
    },
    {
      name: "Painters",
      count: "350+",
      avgRating: 4.9,
      startingPrice: "₹349",
      description: `Expert painters in ${city} for interior and exterior painting`,
      specialties: ["Wall Painting", "Texture Work", "Waterproofing", "Wood Polish"]
    },
    {
      name: "Home Cleaners",
      count: "600+",
      avgRating: 4.8,
      startingPrice: "₹199",
      description: `Professional cleaning services in ${city} for homes and offices`,
      specialties: ["Deep Cleaning", "Regular Cleaning", "Sofa Cleaning", "Kitchen Cleaning"]
    },
    {
      name: "AC Technicians",
      count: "300+",
      avgRating: 4.6,
      startingPrice: "₹299",
      description: `AC repair and service experts in ${city} for all brands`,
      specialties: ["AC Repair", "Installation", "Gas Filling", "Maintenance"]
    },
    {
      name: "Carpenters",
      count: "250+",
      avgRating: 4.7,
      startingPrice: "₹449",
      description: `Skilled carpenters in ${city} for furniture and woodwork`,
      specialties: ["Furniture Repair", "Custom Work", "Installation", "Wood Cutting"]
    }
  ];

  const popularAreas = [
    "T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Mylapore", "Nungambakkam",
    "Guindy", "Porur", "Tambaram", "Chromepet", "Perungudi", "Sholinganallur"
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEOHead
        title={`Skilled Workers in ${city} | Home Services ${state} | SPANNER`}
        description={`Find and hire verified skilled workers in ${city}, ${state}. Professional plumbers, electricians, painters, mechanics, cleaners, and more. Instant booking, secure payments, quality guaranteed. 2000+ verified professionals in ${city}.`}
        keywords={`skilled workers ${city}, home services ${city}, plumber ${city}, electrician ${city}, painter ${city}, mechanic ${city}, cleaner ${city}, services in ${city} ${state}, local workers ${city}, verified professionals ${city}`}
        canonical={`https://spanner.replit.app/locations/${state.toLowerCase().replace(/\s+/g, '-')}/${city.toLowerCase().replace(/\s+/g, '-')}`}
        ogTitle={`Professional Home Services in ${city}, ${state} - SPANNER`}
        ogDescription={`Find verified skilled workers in ${city}. 2000+ professionals available for instant booking. Quality guaranteed services in ${city}, ${state}.`}
        schemaData={locationSchema}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Skilled Workers in {city}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find and hire verified professionals in {city}, {state}. Over 2000+ skilled workers 
            ready to serve you with quality guaranteed services.
          </p>
          <div className="flex justify-center items-center space-x-6 mt-6">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">{city}, {state}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">2000+ Workers</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium">4.8 Average Rating</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Available Services in {city}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{service.name} in {city}</h3>
                    <Badge className="bg-green-100 text-green-800">{service.count}</Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-medium">{service.avgRating}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Starting from <span className="font-bold text-green-600">{service.startingPrice}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Specialties:</h4>
                    <div className="flex flex-wrap gap-1">
                      {service.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full">
                    Book {service.name} Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Areas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">We Serve All Areas in {city}</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularAreas.map((area, index) => (
                <div key={index} className="text-center hover:text-blue-600 cursor-pointer transition-colors">
                  <MapPin className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-sm font-medium">{area}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Badge variant="outline" className="px-4 py-2">
                + All {city} Areas Covered
              </Badge>
            </div>
          </div>
        </div>

        {/* Why Choose Local Workers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SPANNER in {city}?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-3">Local & Verified</h3>
                <p className="text-muted-foreground">
                  All workers in {city} are locally verified with background checks and skill validation.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-3">Quick Response</h3>
                <p className="text-muted-foreground">
                  Fast response time in {city} with same-day service available for urgent requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Phone className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-semibold mb-3">Local Support</h3>
                <p className="text-muted-foreground">
                  Dedicated customer support team in {state} speaking local languages for better assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Local Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What {city} Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">5.0</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Excellent plumber service in {city}. Quick response and professional work. 
                  SPANNER made it so easy to find reliable workers."
                </p>
                <div className="font-semibold">Ramesh Kumar</div>
                <div className="text-sm text-muted-foreground">T. Nagar, {city}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">5.0</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Found a great electrician through SPANNER. Fair pricing and quality work. 
                  Highly recommend for anyone in {city}."
                </p>
                <div className="font-semibold">Lakshmi Devi</div>
                <div className="text-sm text-muted-foreground">Anna Nagar, {city}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">5.0</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Amazing cleaning service in {city}. The team was punctual and thorough. 
                  Will definitely use SPANNER again."
                </p>
                <div className="font-semibredold">Suresh Babu</div>
                <div className="text-sm text-muted-foreground">Velachery, {city}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Need Service in {city} Today?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Don't wait! Book verified professionals in {city}, {state} right now. 
            Quick response, quality guaranteed, and transparent pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Book Service in {city}
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