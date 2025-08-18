import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, MessageCircle, CheckCircle, Star, Shield, Clock, Users } from "lucide-react";

export default function HowItWorksPage() {
  const howItWorksSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Use SPANNER - Blue Collar Service Marketplace",
    "description": "Step-by-step guide on how to find and hire skilled blue collar workers on SPANNER marketplace",
    "totalTime": "PT15M",
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Mobile phone or computer with internet"
      },
      {
        "@type": "HowToSupply", 
        "name": "Service requirement details"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Sign Up & Post Your Requirement",
        "text": "Create your account and post your service requirement with location and budget details",
        "image": "https://spanner.replit.app/step1.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Browse & Select Workers",
        "text": "Browse verified workers, check ratings and reviews, and select the best match for your needs",
        "image": "https://spanner.replit.app/step2.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Connect & Schedule",
        "text": "Connect with your chosen worker, discuss details, and schedule the service at your convenience",
        "image": "https://spanner.replit.app/step3.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Service Completion & Payment",
        "text": "Get your service completed, verify the work, and make secure payment through the platform",
        "image": "https://spanner.replit.app/step4.jpg"
      }
    ]
  };

  const clientSteps = [
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: "Sign Up & Post Your Requirement",
      description: "Create your account in minutes and post your service requirement with location, budget, and specific details.",
      details: [
        "Quick registration with mobile verification",
        "Describe your service needs clearly",
        "Set your budget and preferred timing",
        "Choose your location and service area"
      ]
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Browse & Select Workers", 
      description: "Browse verified workers in your area, check their ratings, reviews, and select the best match for your needs.",
      details: [
        "View verified worker profiles",
        "Check ratings and customer reviews",
        "Compare skills and experience",
        "Review portfolio and past work"
      ]
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Connect & Schedule",
      description: "Connect with your chosen worker, discuss project details, and schedule the service at your convenience.",
      details: [
        "Direct chat with workers",
        "Discuss project requirements",
        "Negotiate terms and pricing",
        "Schedule at your convenience"
      ]
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Service Completion & Payment",
      description: "Get your service completed professionally, verify the work quality, and make secure payment through the platform.",
      details: [
        "Track service progress in real-time",
        "Verify completion with OTP system",
        "Rate and review the worker",
        "Secure payment protection"
      ]
    }
  ];

  const workerSteps = [
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: "Complete Profile & Verification",
      description: "Create your professional profile, upload documents, and complete our verification process to build trust.",
      details: [
        "Upload ID and skill certificates",
        "Add portfolio of your work",
        "Bank account verification",
        "Background check completion"
      ]
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Browse Available Jobs",
      description: "Browse service requests in your area, filter by skills and preferences, and find suitable opportunities.",
      details: [
        "Filter jobs by location and skills",
        "View job details and requirements",
        "Check client reviews and ratings",
        "Set your availability status"
      ]
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Bid & Connect with Clients",
      description: "Submit competitive bids, communicate with clients, and showcase your expertise to win projects.",
      details: [
        "Submit detailed proposals",
        "Chat directly with clients",
        "Share your expertise and experience",
        "Negotiate fair pricing"
      ]
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: "Complete Work & Get Paid",
      description: "Deliver quality service, get client approval, and receive secure payments directly to your account.",
      details: [
        "Complete jobs professionally",
        "Use OTP system for completion",
        "Build positive ratings",
        "Get paid securely and on time"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEOHead
        title="How SPANNER Works - Step by Step Guide | Blue Collar Service Marketplace"
        description="Learn how to use SPANNER to find skilled workers or get hired for blue collar jobs. Step-by-step guide for clients and workers. Simple registration, secure payments, verified professionals."
        keywords="how SPANNER works, hire skilled workers, blue collar jobs process, service marketplace guide, worker registration, client guide, secure payments, verified workers, job bidding process"
        canonical="https://spanner.replit.app/how-it-works"
        ogTitle="How SPANNER Works - Complete Guide for Clients & Workers"
        ogDescription="Step-by-step guide on using SPANNER to find skilled workers or get hired for blue collar jobs. Simple, secure, and trusted platform."
        schemaData={howItWorksSchema}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            How SPANNER Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Getting started with SPANNER is simple. Whether you're looking to hire skilled workers 
            or offering your services, our platform makes it easy, secure, and efficient.
          </p>
        </div>

        {/* For Clients Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">For Clients - Find Skilled Workers</h2>
            <p className="text-lg text-muted-foreground">
              Get quality services from verified professionals in just a few clicks
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {clientSteps.map((step, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex-shrink-0">
                      <div className="text-blue-600 dark:text-blue-400">
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge className="bg-blue-600 text-white mr-3">
                          Step {index + 1}
                        </Badge>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* For Workers Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">For Workers - Grow Your Business</h2>
            <p className="text-lg text-muted-foreground">
              Connect with clients, showcase your skills, and build a sustainable income
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {workerSteps.map((step, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg flex-shrink-0">
                      <div className="text-purple-600 dark:text-purple-400">
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge className="bg-purple-600 text-white mr-3">
                          Step {index + 1}
                        </Badge>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SPANNER?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold mb-3">Verified & Trusted</h3>
                <p className="text-muted-foreground">
                  All workers are thoroughly verified with background checks, skill assessments, 
                  and document validation for your peace of mind.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-3">Quick & Efficient</h3>
                <p className="text-muted-foreground">
                  Find and book services in minutes, with real-time tracking and instant 
                  communication between clients and workers.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <Users className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
                <p className="text-muted-foreground">
                  Built by the community, for the community. Ratings, reviews, and feedback 
                  ensure quality and trust in every transaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How do I ensure the worker is qualified?</h3>
                <p className="text-muted-foreground text-sm">
                  All workers undergo thorough verification including ID checks, skill assessments, 
                  and background verification. You can also check their ratings and reviews from previous clients.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Is my payment secure?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, all payments are processed through secure payment gateways. Payments are released 
                  to workers only after you confirm job completion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What if I'm not satisfied with the service?</h3>
                <p className="text-muted-foreground text-sm">
                  We have a comprehensive dispute resolution system. You can report issues, and our 
                  support team will help resolve them fairly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How do workers get paid?</h3>
                <p className="text-muted-foreground text-sm">
                  Workers receive payments directly to their verified bank accounts after successful 
                  job completion and client confirmation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers and skilled workers who trust SPANNER 
            for their service needs across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Find Services Now
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