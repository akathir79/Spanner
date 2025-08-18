import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Shield, Clock, Users, CheckCircle, Filter } from "lucide-react";
import { useState } from "react";

export default function FindWorkersPage() {
  const [searchFilters, setSearchFilters] = useState({
    service: "",
    location: "",
    budget: "",
    experience: "",
    rating: ""
  });

  const findWorkersSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": "Find Skilled Workers Near You - SPANNER Marketplace",
    "description": "Search and hire verified skilled workers in your area. Find plumbers, electricians, painters, mechanics, and more professionals near you.",
    "url": "https://spanner.replit.app/find-workers",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Skilled Workers Directory",
      "description": "Comprehensive directory of verified blue collar workers across India",
      "numberOfItems": "50000+"
    }
  };

  const popularServices = [
    { name: "Plumber", searches: "15,000+ monthly", icon: "🔧" },
    { name: "Electrician", searches: "12,000+ monthly", icon: "⚡" },
    { name: "Painter", searches: "8,000+ monthly", icon: "🎨" },
    { name: "Mechanic", searches: "10,000+ monthly", icon: "🔩" },
    { name: "Cleaner", searches: "6,000+ monthly", icon: "🧽" },
    { name: "Carpenter", searches: "7,000+ monthly", icon: "🪚" },
    { name: "AC Repair", searches: "9,000+ monthly", icon: "❄️" },
    { name: "Pest Control", searches: "4,000+ monthly", icon: "🐛" }
  ];

  const topCities = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", 
    "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
    "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri", "Patna"
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEOHead
        title="Find Skilled Workers Near You | Hire Verified Professionals | SPANNER"
        description="Search and hire verified skilled workers in your area on SPANNER. Find plumbers, electricians, painters, mechanics, carpenters, cleaners, and more professionals. Instant booking, secure payments, 50,000+ verified workers across 1000+ Indian cities."
        keywords="find workers near me, hire skilled workers, local plumber, electrician near me, painter hire, mechanic services, home services, skilled professionals, blue collar workers, verified workers India, instant worker booking"
        canonical="https://spanner.replit.app/find-workers"
        ogTitle="Find & Hire Skilled Workers Near You - SPANNER"
        ogDescription="Search 50,000+ verified skilled workers across India. Instant booking, secure payments, GPS tracking. Find plumbers, electricians, painters & more."
        schemaData={findWorkersSchema}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Find Skilled Workers Near You
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Search from 50,000+ verified skilled workers across 1000+ Indian cities. 
            Get instant quotes, secure bookings, and quality guaranteed services.
          </p>

          {/* Search Form */}
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Select value={searchFilters.service} onValueChange={(value) => setSearchFilters({...searchFilters, service: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="painter">Painter</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="cleaner">Home Cleaner</SelectItem>
                    <SelectItem value="carpenter">Carpenter</SelectItem>
                  </SelectContent>
                </Select>

                <Input 
                  placeholder="Enter your location"
                  value={searchFilters.location}
                  onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                />

                <Select value={searchFilters.budget} onValueChange={(value) => setSearchFilters({...searchFilters, budget: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Budget Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-500">Under ₹500</SelectItem>
                    <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                    <SelectItem value="1000-2000">₹1,000 - ₹2,000</SelectItem>
                    <SelectItem value="above-2000">Above ₹2,000</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="w-full">
                  <Search className="h-5 w-5 mr-2" />
                  Search Workers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Most Searched Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <h3 className="font-semibold mb-1">{service.name}</h3>
                  <p className="text-xs text-muted-foreground">{service.searches}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Our Workers */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Hire Through SPANNER?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-3">100% Verified Workers</h3>
                <p className="text-muted-foreground">
                  All workers undergo thorough background checks, skill verification, 
                  and document validation for your complete safety and peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-xl font-semibold mb-3">Top Rated Professionals</h3>
                <p className="text-muted-foreground">
                  Choose from highly rated workers with verified customer reviews 
                  and ratings. Quality guaranteed with every service booking.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-3">Instant Booking</h3>
                <p className="text-muted-foreground">
                  Book services instantly with real-time availability, 
                  GPS tracking, and direct communication with workers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service Areas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Available in 1000+ Cities</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              {topCities.map((city, index) => (
                <div key={index} className="hover:text-blue-600 cursor-pointer transition-colors">
                  <MapPin className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-sm font-medium">{city}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Badge variant="outline" className="px-4 py-2">
                + 982 More Cities
              </Badge>
            </div>
          </div>
        </div>

        {/* Customer Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Clients Say</h2>
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
                  "Found an excellent plumber through SPANNER. Quick response, 
                  fair pricing, and quality work. Highly recommended!"
                </p>
                <div className="font-semibold">Rajesh Kumar</div>
                <div className="text-sm text-muted-foreground">Mumbai</div>
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
                  "The electrician was professional and completed the work efficiently. 
                  SPANNER makes finding reliable workers so easy."
                </p>
                <div className="font-semibold">Priya Sharma</div>
                <div className="text-sm text-muted-foreground">Delhi</div>
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
                  "Best platform for finding skilled workers. Transparent pricing, 
                  verified professionals, and excellent customer support."
                </p>
                <div className="font-semibold">Amit Patel</div>
                <div className="text-sm text-muted-foreground">Bangalore</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Hire a Worker?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join over 100,000+ satisfied customers who trust SPANNER for their service needs. 
            Get instant quotes from verified professionals in your area.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
            <Search className="h-5 w-5 mr-2" />
            Find Workers Now
          </Button>
        </div>
      </div>
    </div>
  );
}