import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Shield, Clock, Target, Globe, Award, Heart } from "lucide-react";

export default function AboutPage() {
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About SPANNER - India's Leading Blue Collar Service Marketplace",
    "description": "Learn about SPANNER's mission to connect skilled blue collar workers with clients across India. Discover our story, values, and commitment to empowering the workforce.",
    "url": "https://spanner.replit.app/about",
    "mainEntity": {
      "@type": "Organization",
      "name": "SPANNER",
      "description": "India's premier blue collar service marketplace connecting skilled workers with clients nationwide",
      "foundingDate": "2024",
      "founder": {
        "@type": "Person",
        "name": "SPANNER Team"
      },
      "mission": "To empower India's blue collar workforce by providing a trusted platform for connecting skilled workers with clients nationwide",
      "areaServed": {
        "@type": "Country",
        "name": "India"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEOHead
        title="About SPANNER - India's Leading Blue Collar Service Marketplace | Our Story & Mission"
        description="Learn about SPANNER's mission to connect skilled blue collar workers with clients across India. Discover our story, values, and commitment to empowering the workforce. Founded to bridge the gap between skilled workers and quality service seekers."
        keywords="about SPANNER, blue collar marketplace India, skilled workers platform, service marketplace mission, worker empowerment India, home services company, trusted service provider, SPANNER story, blue collar jobs platform"
        canonical="https://spanner.replit.app/about"
        ogTitle="About SPANNER - Empowering India's Blue Collar Workforce"
        ogDescription="Learn about SPANNER's mission to connect skilled blue collar workers with clients across India. Discover our story, values, and commitment to empowering the workforce."
        schemaData={aboutPageSchema}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About SPANNER
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're on a mission to transform India's blue collar workforce by creating a trusted platform 
            that connects skilled workers with clients nationwide, ensuring quality services and fair opportunities for all.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-blue-500 mr-3" />
                <h2 className="text-2xl font-bold">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To empower India's blue collar workforce by providing a trusted, technology-driven platform 
                that connects skilled workers with clients nationwide, ensuring fair wages, quality services, 
                and economic growth for communities across the country.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <Globe className="h-8 w-8 text-purple-500 mr-3" />
                <h2 className="text-2xl font-bold">Our Vision</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted marketplace for blue collar services, where every skilled 
                worker has access to dignified employment opportunities and every client can find reliable, 
                quality services with complete transparency and security.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Trust & Safety</h3>
                <p className="text-sm text-muted-foreground">
                  Verified workers, secure payments, and comprehensive safety measures for all users.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Heart className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">Empowerment</h3>
                <p className="text-sm text-muted-foreground">
                  Creating opportunities for workers to build sustainable livelihoods and grow their skills.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Award className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  Committed to delivering exceptional service quality and customer satisfaction.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Users className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="text-lg font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Building strong connections between workers and clients across Indian communities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Makes SPANNER Different</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <CheckCircle className="h-10 w-10 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Comprehensive Verification</h3>
                <p className="text-muted-foreground">
                  Every worker undergoes thorough background checks, skill verification, and document validation 
                  to ensure you get trusted, qualified professionals.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Clock className="h-10 w-10 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Real-Time Tracking</h3>
                <p className="text-muted-foreground">
                  Track your service provider's location, get real-time updates, and stay informed 
                  throughout the service delivery process.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Globe className="h-10 w-10 text-purple-500 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Pan-India Coverage</h3>
                <p className="text-muted-foreground">
                  Available across 1000+ cities in India, connecting workers and clients 
                  in both metro cities and smaller towns nationwide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">SPANNER by Numbers</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50,000+</div>
              <div className="text-muted-foreground">Verified Workers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">1,000+</div>
              <div className="text-muted-foreground">Cities Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">2M+</div>
              <div className="text-muted-foreground">Services Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">4.8/5</div>
              <div className="text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Our Services */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Services We Connect</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Plumbing", "Electrical Work", "Painting", "Carpentry", "Home Cleaning",
              "Appliance Repair", "Pest Control", "Garden Maintenance", "AC Repair",
              "Vehicle Repair", "Interior Design", "Security Services", "Catering",
              "Event Planning", "Courier Services", "Moving & Packing"
            ].map((service, index) => (
              <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                {service}
              </Badge>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Join the SPANNER Community Today</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Whether you're a skilled worker looking for opportunities or a client seeking reliable services, 
            SPANNER is here to connect you with the right people.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Find Workers
            </button>
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors">
              Join as Worker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}