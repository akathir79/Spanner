import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, MessageCircle, HeadphonesIcon } from "lucide-react";

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: ""
  });

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact SPANNER - Customer Support & Business Inquiries",
    "description": "Get in touch with SPANNER team for customer support, business inquiries, or any questions about our blue collar service marketplace platform.",
    "url": "https://spanner.replit.app/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "SPANNER",
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+91-9000000001",
          "contactType": "customer service",
          "availableLanguage": ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"],
          "hoursAvailable": {
            "@type": "OpeningHours",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "06:00",
            "closes": "22:00"
          }
        },
        {
          "@type": "ContactPoint",
          "email": "support@spanner.com",
          "contactType": "customer service"
        }
      ]
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent Successfully!",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Failed to Send Message",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <SEOHead
        title="Contact SPANNER - Customer Support & Business Inquiries | Get Help 24/7"
        description="Get in touch with SPANNER team for customer support, business inquiries, or any questions about our blue collar service marketplace platform. Available 24/7 in multiple languages."
        keywords="contact SPANNER, customer support, help desk, business inquiries, technical support, marketplace assistance, blue collar services support, contact customer care"
        canonical="https://spanner.replit.app/contact"
        ogTitle="Contact SPANNER - Get Support & Assistance"
        ogDescription="Need help with SPANNER? Contact our customer support team for assistance with bookings, payments, worker verification, or any questions about our platform."
        schemaData={contactPageSchema}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're here to help! Get in touch with our support team for any questions, 
            concerns, or feedback about SPANNER services.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Phone className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold">Phone Support</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">+91-9000000001</p>
                  <p className="text-sm text-muted-foreground">Available 24/7 for urgent support</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Mail className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-semibold">Email Support</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">support@spanner.com</p>
                  <p className="text-sm text-muted-foreground">Response within 2-4 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-6 w-6 text-red-600 mr-3" />
                    <h3 className="text-lg font-semibold">Service Areas</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">Pan-India Coverage</p>
                  <p className="text-sm text-muted-foreground">1000+ cities across all states</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-lg font-semibold">Support Hours</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">6:00 AM - 10:00 PM</p>
                  <p className="text-sm text-muted-foreground">7 days a week</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Category
                      </label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="worker">Worker Support</SelectItem>
                          <SelectItem value="client">Client Support</SelectItem>
                          <SelectItem value="business">Business Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Describe your inquiry in detail..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Help</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <HeadphonesIcon className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Account Issues</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Problems with login, registration, or profile updates.
                </p>
                <p className="text-xs text-blue-600">Call: +91-9000000001</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <MessageCircle className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">Booking Support</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Help with service bookings, scheduling, or modifications.
                </p>
                <p className="text-xs text-green-600">Email: bookings@spanner.com</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Mail className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-2">Payment Issues</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Questions about payments, refunds, or billing.
                </p>
                <p className="text-xs text-purple-600">Email: payments@spanner.com</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business Inquiries */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-4">Business Partnerships</h2>
          <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
            Interested in partnering with SPANNER? We're always looking for strategic partnerships 
            to expand our service offerings and reach.
          </p>
          <div className="text-center">
            <Button variant="outline" size="lg">
              <Mail className="h-5 w-5 mr-2" />
              business@spanner.com
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}