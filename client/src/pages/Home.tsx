import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServiceCard } from "@/components/ServiceCard";
import { WorkerCard } from "@/components/WorkerCard";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Shield, Clock, Users, MapPin, Star, Handshake, Eye, EyeOff, Mail, Phone, Wrench, X } from "lucide-react";

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
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Login form states
  const [loginMode, setLoginMode] = useState<'otp' | 'password' | 'forgot' | 'recovery'>('otp');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'worker' | null>(null);

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

  // Authentication handlers
  const handleSendOTP = async () => {
    if (!mobile || mobile.length < 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91 ${mobile}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPLogin = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock successful login for development
      const mockUser = {
        id: `TN-CHENNAI-${Date.now()}-${selectedRole?.toUpperCase()}`,
        firstName: "Demo",
        lastName: "User",
        mobile: mobile,
        role: selectedRole || 'client',
        district: "Chennai",
        state: "Tamil Nadu"
      };
      
      login(mockUser);
      toast({
        title: "Login Successful",
        description: `Welcome to SPANNER as a ${selectedRole}!`,
      });
      setLocation('/dashboard');

    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!mobile || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both mobile number and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock successful login for development
      const mockUser = {
        id: `TN-CHENNAI-${Date.now()}-${selectedRole?.toUpperCase()}`,
        firstName: "Demo",
        lastName: "User",
        mobile: mobile,
        role: selectedRole || 'client',
        district: "Chennai",
        state: "Tamil Nadu"
      };
      
      login(mockUser);
      toast({
        title: "Login Successful",
        description: `Welcome back to SPANNER as a ${selectedRole}!`,
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!mobile) {
      toast({
        title: "Missing Information",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Reset Link Sent",
        description: `Password reset instructions sent to your registered mobile number`,
      });
      setLoginMode('recovery');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!otp || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter OTP and new password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully",
      });
      setLoginMode('otp');
      setOtp('');
      setPassword('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMobile('');
    setPassword('');
    setOtp('');
    setEmail('');
    setOtpSent(false);
    setShowPassword(false);
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                India's Most Trusted Urban Services Platform
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Discover seamless access to verified and skilled professionals across every state and district in India. Whether you need plumbing, electrical, carpentry, or appliance repair services, our platform connects you with certified experts tailored to your requirements. Enjoy transparent pricing, secure online booking, and reliable service delivery — all designed to make urban living simpler, safer, and more efficient.
              </p>
              <p className="text-lg mb-8 text-blue-200 font-medium">
                Trusted by thousands, we're redefining home and workplace maintenance with professionalism, accountability, and peace of mind.
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

            {/* Login Form */}
            {!user && (
              <div className="lg:flex justify-start lg:justify-center lg:ml-[-3rem]">
                <Card className={`w-full max-w-lg bg-white shadow-2xl border-0 transition-all duration-300 ${selectedRole ? 'min-h-[600px]' : 'min-h-[320px]'}`} style={{backgroundColor: '#ffffff'}}>
                  <CardHeader className="text-center pb-6 pt-8" style={{backgroundColor: '#ffffff'}}>
                    <CardTitle className="text-2xl font-bold text-primary">
                      {loginMode === 'forgot' ? 'Forgot Password' : 
                       loginMode === 'recovery' ? 'Reset Password' :
                       'Log in or Sign up'}
                    </CardTitle>
                    {loginMode === 'otp' && (
                      <p className="text-sm text-muted-foreground">
                        Sign up now and get <span className="font-semibold text-orange-600">500 🪙 SPANNER coins!</span>
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-6 px-8 pb-8" style={{backgroundColor: '#ffffff'}}>
                    {/* Role Selection - Always visible but collapses when role is selected */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">I am a</h3>
                      </div>
                      
                      {!selectedRole ? (
                        /* Expanded role selection */
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 bg-white"
                            style={{backgroundColor: '#ffffff'}}
                            onClick={() => setSelectedRole('client')}
                          >
                            <Users className="h-6 w-6 text-primary" />
                            <span className="font-medium">Client</span>
                          </Button>
                          <Button
                            variant="outline" 
                            className="h-20 flex flex-col items-center justify-center space-y-2 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 bg-white"
                            style={{backgroundColor: '#ffffff'}}
                            onClick={() => setSelectedRole('worker')}
                          >
                            <Wrench className="h-6 w-6 text-primary" />
                            <span className="font-medium">Worker</span>
                          </Button>
                        </div>
                      ) : (
                        /* Collapsed role indicator */
                        <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            {selectedRole === 'client' ? (
                              <Users className="h-5 w-5 text-primary" />
                            ) : (
                              <Wrench className="h-5 w-5 text-primary" />
                            )}
                            <span className="font-medium text-primary capitalize">{selectedRole}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              setSelectedRole(null);
                              resetForm();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Login Form - shown after role selection with smooth expansion */}
                    {selectedRole && (
                      <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        {/* Mobile Number Input */}
                    <div className="relative">
                      <div className="flex">
                        <div className="flex items-center px-4 py-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg">
                          <span className="text-sm font-medium text-gray-600">+91</span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="Mobile Number"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="rounded-l-none border-gray-300 py-3 px-4 text-base focus:border-primary focus:ring-primary"
                          disabled={loginMode === 'recovery'}
                        />
                      </div>
                    </div>

                    {/* Password Input for Password Login */}
                    {loginMode === 'password' && (
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="border-gray-300 py-3 px-4 text-base focus:border-primary focus:ring-primary pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-1 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}

                    {/* OTP Input */}
                    {(loginMode === 'otp' && otpSent) || loginMode === 'recovery' ? (
                      <div>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          className="border-gray-300 py-3 px-4 text-base focus:border-primary focus:ring-primary text-center tracking-widest font-mono"
                        />
                      </div>
                    ) : null}

                    {/* New Password for Recovery */}
                    {loginMode === 'recovery' && (
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="New Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="border-gray-300 py-3 px-4 text-base focus:border-primary focus:ring-primary pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-auto p-1 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}

                    {/* Toggle Buttons for OTP/Password */}
                    {loginMode === 'otp' && !otpSent && (
                      <div className="flex justify-between text-sm pt-2">
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                          onClick={() => {
                            setLoginMode('password');
                            resetForm();
                          }}
                        >
                          Use Password
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                          onClick={() => {
                            setLoginMode('forgot');
                            resetForm();
                          }}
                        >
                          Login with Email
                        </Button>
                      </div>
                    )}

                    {loginMode === 'password' && (
                      <div className="flex justify-between text-sm pt-2">
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                          onClick={() => {
                            setLoginMode('otp');
                            resetForm();
                          }}
                        >
                          Use OTP
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                          onClick={() => {
                            setLoginMode('forgot');
                            resetForm();
                          }}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                    )}

                    {/* Primary Action Button */}
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 py-3 text-base font-semibold rounded-lg mt-4"
                      onClick={() => {
                        if (loginMode === 'otp' && !otpSent) {
                          handleSendOTP();
                        } else if (loginMode === 'otp' && otpSent) {
                          handleOTPLogin();
                        } else if (loginMode === 'password') {
                          handlePasswordLogin();
                        } else if (loginMode === 'forgot') {
                          handleForgotPassword();
                        } else if (loginMode === 'recovery') {
                          handlePasswordRecovery();
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 
                       loginMode === 'otp' && !otpSent ? 'Send OTP' :
                       loginMode === 'otp' && otpSent ? 'Verify OTP' :
                       loginMode === 'password' ? 'Login' :
                       loginMode === 'forgot' ? 'Send Reset Link' :
                       loginMode === 'recovery' ? 'Reset Password' : 'Send OTP'}
                    </Button>

                    {/* Back Button for Forgot/Recovery */}
                    {(loginMode === 'forgot' || loginMode === 'recovery') && (
                      <Button
                        variant="outline"
                        className="w-full py-3 text-base font-medium rounded-lg border-gray-300 hover:bg-gray-50"
                        onClick={() => {
                          setLoginMode('otp');
                          resetForm();
                        }}
                      >
                        Back to Login
                      </Button>
                    )}

                    {/* Divider */}
                    {loginMode === 'otp' && !otpSent && (
                      <div className="space-y-6">
                        <div className="relative">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                            Or
                          </span>
                        </div>

                        {/* Google Login */}
                        <Button
                          variant="outline"
                          className="w-full py-3 text-base font-medium rounded-lg border-gray-300 hover:bg-gray-50"
                          onClick={() => {
                            toast({
                              title: "Coming Soon",
                              description: "Google login will be available soon",
                            });
                          }}
                        >
                          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#fbbc5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </Button>

                        {/* Help Link */}
                        <div className="text-center text-sm text-gray-600 mt-6">
                          Need help? <Button variant="link" className="p-0 h-auto text-sm text-primary font-medium">Connect with us 💬</Button>
                        </div>

                        {/* Terms */}
                        <div className="text-center text-sm text-gray-600 leading-relaxed px-4">
                          By logging or signing up, you agree to our{' '}
                          <Button variant="link" className="p-0 h-auto text-sm text-primary underline font-medium">
                            Terms
                          </Button>{' '}
                          &{' '}
                          <Button variant="link" className="p-0 h-auto text-sm text-primary underline font-medium">
                            Policy
                          </Button>
                        </div>
                      </div>
                    )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
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
                hourlyRate={worker.hourlyRate.toString()}
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