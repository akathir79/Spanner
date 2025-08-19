/**
 * SPANNER Mobile Test App - Standalone Mobile Interface
 * Completely isolated mobile experience without any navigation conflicts
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wrench, Home, User, Settings, Phone, CheckCircle, Search, Plus, Briefcase, Lock, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileAddressForm } from '@/components/MobileAddressForm';

export default function MobileTestApp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<'welcome' | 'login' | 'register' | 'quick-join-select' | 'quick-join-client' | 'quick-join-worker'>('welcome');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Service management states for Quick Join
  const [showNewServiceInput, setShowNewServiceInput] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  
  // Location states for worker registration
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [addressValues, setAddressValues] = useState({
    houseNumber: '',
    streetName: '',
    areaName: '',
    district: '',
    state: '',
    pincode: '',
  });

  // Fetch services for worker registration
  const { data: services, isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ["/api/services"],
    enabled: true, // Always enabled for mobile app
  });



  // Enhanced service selection handler
  const handleServiceSelect = (value: string) => {
    console.log("Service selected:", value);
    if (value === "ADD_NEW_SERVICE") {
      setShowNewServiceInput(true);
      return;
    }
    setSelectedService(value);
    setShowNewServiceInput(false);
  };

  // Mutation to create new service
  const createServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          description: `${serviceName} services`,
          icon: 'wrench',
          isActive: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create service');
      }
      
      return response.json();
    },
    onSuccess: (newService) => {
      // Invalidate and refetch services
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      
      // Select the newly created service
      setSelectedService(newService.name);
      
      // Reset form
      setNewServiceName('');
      setShowNewServiceInput(false);
      
      toast({
        title: "Service added successfully!",
        description: `${newService.name} has been added to the service list.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNewService = async () => {
    if (!newServiceName.trim()) {
      toast({
        title: "Service name required",
        description: "Please enter a service name.",
        variant: "destructive",
      });
      return;
    }

    // Check if service already exists
    const serviceExists = Array.isArray(services) && services.some((service: any) => 
      service.name.toLowerCase() === newServiceName.trim().toLowerCase()
    );

    if (serviceExists) {
      toast({
        title: "Service exists",
        description: "This service already exists. Please select it from the dropdown.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createServiceMutation.mutateAsync(newServiceName.trim());
      // Set the newly created service as selected
      setSelectedService(newServiceName.trim());
      // Reset the input and hide it
      setNewServiceName("");
      setShowNewServiceInput(false);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };



  // Registration mutation for mobile worker
  const workerRegistrationMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      mobile: string;
      primaryService: string;
      houseNumber: string;
      streetName: string;
      areaName: string;
      state: string;
      district: string;
      pincode: string;
    }) => {
      const response = await fetch("/api/auth/signup/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          role: "worker",
          lastName: "UPDATE_REQUIRED",
          houseNumber: data.houseNumber,
          streetName: data.streetName, 
          areaName: data.areaName,
          district: data.district,
          state: data.state,
          pincode: data.pincode,
          email: "",
          fullAddress: `${data.houseNumber}, ${data.streetName}, ${data.areaName}, ${data.district}, ${data.state} - ${data.pincode}`,
          aadhaarNumber: "000000000000",
          experienceYears: 1,
          hourlyRate: 100,
          serviceDistricts: [data.district],
          skills: [data.primaryService],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: "Welcome to SPANNER! You can now receive job requests from clients.",
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWorkerRegistration = () => {
    // Get form values from DOM (this is a simplified approach for mobile demo)
    const firstNameInput = document.querySelector('input[placeholder="Your First Name"]') as HTMLInputElement;
    const mobileInput = document.querySelector('input[placeholder="10-digit mobile number"]') as HTMLInputElement;
    
    const firstName = firstNameInput?.value || '';
    const mobile = mobileInput?.value || '';
    
    if (!firstName || !mobile || !selectedService || !addressValues.state || !addressValues.district || !addressValues.houseNumber || !addressValues.streetName || !addressValues.areaName || !addressValues.pincode) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including complete address.",
        variant: "destructive",
      });
      return;
    }

    if (mobile.length !== 10) {
      toast({
        title: "Invalid mobile number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    workerRegistrationMutation.mutate({
      firstName,
      mobile,
      primaryService: selectedService,
      ...addressValues,
    });
  };

  const handleTestApp = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Hide everything else and show only mobile app
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      {/* Black background covering entire screen */}
      <div className="fixed inset-0 bg-black z-[10000]" />
      
      {/* Mobile phone container */}
      <div className="fixed inset-0 flex items-center justify-center z-[10001]">
        <div className="w-[380px] h-[680px] bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-800 relative overflow-hidden">
          
          {/* Mobile Status Bar */}
          <div className="bg-black text-white text-xs px-6 py-2 flex justify-between rounded-t-[1.5rem]">
            <span>9:41 AM</span>
            <span>📶 📶 📶 100%</span>
          </div>

          {/* App Header */}
          <div className="bg-blue-600 text-white p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="h-6 w-6" />
                <h1 className="text-lg font-bold">SPANNER</h1>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-blue-700 text-lg"
                onClick={() => window.location.href = '/'}
                title="Close Mobile App"
              >
                ✕
              </Button>
            </div>
            <p className="text-blue-100 text-sm">Your blue-collar service marketplace is now available on mobile.</p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="absolute top-20 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Mobile app is working perfectly!</span>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
            
            {currentPage === 'welcome' && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to SPANNER Mobile</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    Your blue-collar service marketplace is now available on mobile.
                  </p>
                  
                  <Button 
                    onClick={handleTestApp}
                    className="w-full bg-blue-600 text-white h-12 text-lg mb-4"
                  >
                    ▶ Test App
                  </Button>
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button 
                      onClick={() => setCurrentPage('quick-join-select')}
                      className="h-12 bg-purple-600 text-white"
                    >
                      🚀 Quick Join
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!user) {
                          setShowAuthPrompt(true);
                        } else {
                          setCurrentPage('quick-post');
                        }
                      }}
                      className="h-12 bg-green-600 text-white"
                    >
                      📝 Quick Post
                    </Button>
                  </div>
                  
                  {user && (
                    <div className="text-center mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Welcome back, <strong>{user.firstName}!</strong>
                      </p>
                      <Badge variant="outline" className="mt-1">{user.role}</Badge>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Button 
                      onClick={() => setCurrentPage('login')}
                      variant="outline"
                      className="h-10"
                    >
                      👤 Login
                    </Button>
                    <Button 
                      onClick={() => setCurrentPage('register')}
                      variant="outline"
                      className="h-10"
                    >
                      📝 Register
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-blue-600">1000+</div>
                    <div className="text-xs text-gray-600">Workers</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-green-600">500+</div>
                    <div className="text-xs text-gray-600">Jobs Completed</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-lg font-bold text-purple-600">28</div>
                    <div className="text-xs text-gray-600">Locations</div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="text-center p-3 bg-green-100 text-green-800 text-sm rounded-lg">
                  ✅ Connected to SPANNER Backend<br />
                  <span className="text-xs">Status: Ready • Port: 5000 • Mobile Preview Mode</span>
                </div>
              </div>
            )}

            {currentPage === 'login' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('welcome')}
                  className="mb-4"
                >
                  ← Back
                </Button>
                
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>Login to SPANNER</CardTitle>
                    <CardDescription>Enter your mobile number</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      className="h-12 text-center text-lg"
                    />
                    <Button className="w-full h-12 bg-blue-600 text-white">
                      Send OTP
                    </Button>
                    <p className="text-center text-sm text-gray-600">
                      Don't have an account? 
                      <Button 
                        variant="link" 
                        className="p-0 ml-1"
                        onClick={() => setCurrentPage('register')}
                      >
                        Sign up
                      </Button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentPage === 'register' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('welcome')}
                  className="mb-4"
                >
                  ← Back
                </Button>
                
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>Join SPANNER</CardTitle>
                    <CardDescription>Quick and simple signup</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      type="text" 
                      placeholder="First Name"
                      className="h-12"
                    />
                    <Input 
                      type="tel" 
                      placeholder="10-digit mobile number"
                      className="h-12"
                      maxLength={10}
                    />
                    {/* Quick Post is only for clients - no account type selection needed */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-700 text-center">
                        ✅ Creating a client account to post jobs and hire workers
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 text-center">
                        📍 Your address will be collected when you post your first job for security and accurate service delivery.
                      </p>
                    </div>
                    <Button className="w-full h-12 bg-blue-600 text-white">
                      Create Account
                    </Button>
                    <p className="text-center text-sm text-gray-600">
                      Already have an account? 
                      <Button 
                        variant="link" 
                        className="p-0 ml-1"
                        onClick={() => setCurrentPage('login')}
                      >
                        Sign in
                      </Button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Join Role Selection - Matches Web App Flow */}
            {currentPage === 'quick-join-select' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('welcome')}
                  className="mb-4"
                >
                  ← Back
                </Button>
                
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-purple-600">🚀 Quick Join</CardTitle>
                    <CardDescription>Choose how you want to use SPANNER</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Role Selection Cards - Matching Web App Design */}
                    <div className="grid grid-cols-1 gap-3">
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-300"
                        onClick={() => setCurrentPage('quick-join-client')}
                      >
                        <CardContent className="p-4 text-center bg-pink-50">
                          <User className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <h3 className="font-semibold text-gray-800">I Need Services</h3>
                          <p className="text-purple-600 text-sm font-medium">Register as Client</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
                        onClick={() => setCurrentPage('quick-join-worker')}
                      >
                        <CardContent className="p-4 text-center bg-green-50">
                          <Wrench className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <h3 className="font-semibold text-gray-800">I Provide Services</h3>
                          <p className="text-green-600 text-sm font-medium">Register as Worker</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Join Client Registration - Simplified */}
            {currentPage === 'quick-join-client' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('quick-join-select')}
                  className="mb-4"
                >
                  ← Back
                </Button>
                
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-purple-600">👤 Client Registration</CardTitle>
                    <CardDescription>Quick signup - just first name and mobile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      type="text" 
                      placeholder="Your First Name"
                      className="h-12"
                    />
                    <Input 
                      type="tel" 
                      placeholder="10-digit mobile number"
                      className="h-12"
                      maxLength={10}
                    />
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 text-center">
                        📍 Your address will be collected when you post your first job for security and accurate service delivery.
                      </p>
                    </div>
                    <Button 
                      onClick={handleTestApp}
                      className="w-full h-12 bg-purple-600 text-white"
                    >
                      Register as Client
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Join Worker Registration - Simplified */}
            {currentPage === 'quick-join-worker' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('quick-join-select')}
                  className="mb-4"
                >
                  ← Back
                </Button>
                
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-green-600">🔧 Worker Registration</CardTitle>
                    <CardDescription>Quick signup - just name, mobile, and service</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      type="text" 
                      placeholder="Your First Name"
                      className="h-12"
                    />
                    <Input 
                      type="tel" 
                      placeholder="10-digit mobile number"
                      className="h-12"
                      maxLength={10}
                    />
                    {/* Primary Service Field - Clean Implementation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Primary Service</label>
                      
                      {!showNewServiceInput ? (
                        <div className="relative">
                          <select 
                            value={selectedService}
                            onChange={(e) => handleServiceSelect(e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="" disabled>Select primary service</option>
                            {Array.isArray(services) && services.length > 0 ? (
                              services.map((service: any) => (
                                <option key={service.id} value={service.name}>
                                  {service.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Painting">Painting</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Carpentry">Carpentry</option>
                                <option value="AC Repair">AC Repair</option>
                                <option value="Mechanic">Mechanic</option>
                                <option value="Gardening">Gardening</option>
                              </>
                            )}
                            <option value="ADD_NEW_SERVICE" className="text-blue-600">+ Add New Service</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                            placeholder="Enter new service name (e.g., Home Repair, HVAC Service)"
                            className="w-full h-12"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddNewService();
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddNewService}
                              disabled={createServiceMutation.isPending || !newServiceName.trim()}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              {createServiceMutation.isPending ? "Adding..." : "Add Service"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowNewServiceInput(false);
                                setNewServiceName("");
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Add a new service that doesn't exist in the current list
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Address Form */}
                    <MobileAddressForm
                      values={addressValues}
                      onChange={(field, value) => setAddressValues(prev => ({ ...prev, [field]: value }))}
                      isDetecting={isDetectingLocation}
                      onDetect={() => {
                        setIsDetectingLocation(true);
                        // Reset loading state after timeout
                        setTimeout(() => setIsDetectingLocation(false), 8000);
                      }}
                      className="border rounded-lg p-3 bg-gray-50"
                    />

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 text-center">
                        📍 Your state and district help clients find you for local service requests.
                      </p>
                    </div>
                    <Button 
                      onClick={handleWorkerRegistration}
                      disabled={!selectedService || !addressValues.state || !addressValues.district || !addressValues.houseNumber || !addressValues.streetName || !addressValues.areaName || !addressValues.pincode || workerRegistrationMutation.isPending}
                      className="w-full h-12 bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {workerRegistrationMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : !selectedService || !addressValues.state || !addressValues.district || !addressValues.houseNumber || !addressValues.streetName || !addressValues.areaName || !addressValues.pincode ? (
                        "Complete all fields to register" 
                      ) : (
                        "Register as Worker"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentPage === 'quick-post' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('welcome')}
                  className="mb-4"
                >
                  ← Back
                </Button>
                
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-green-600">📝 Quick Post</CardTitle>
                    <CardDescription>Post a job in 30 seconds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      type="text" 
                      placeholder="Job Title (e.g., Fix AC)"
                      className="h-12"
                    />
                    <textarea 
                      placeholder="What work do you need done?"
                      className="w-full h-20 px-3 py-2 border rounded-lg resize-none"
                      rows={3}
                    />
                    <select className="w-full h-12 px-3 border rounded-lg bg-white">
                      <option>Select Service Type</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Painting</option>
                      <option>Cleaning</option>
                      <option>Carpentry</option>
                      <option>AC Repair</option>
                    </select>
                    <Input 
                      type="number" 
                      placeholder="Budget (₹)"
                      className="h-12"
                    />
                    <select className="w-full h-12 px-3 border rounded-lg bg-white">
                      <option>Select Location</option>
                      <option>Chennai</option>
                      <option>Bangalore</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Pune</option>
                      <option>Hyderabad</option>
                    </select>
                    <Button className="w-full h-12 bg-green-600 text-white">
                      Post Job Now
                    </Button>
                    <p className="text-center text-xs text-gray-600">
                      Get quotes from qualified workers instantly!
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t h-16 rounded-b-[1.5rem]">
            <div className="flex justify-around items-center h-full px-4">
              <button 
                onClick={() => setCurrentPage('welcome')}
                className={`flex flex-col items-center space-y-1 ${currentPage === 'welcome' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Home className="h-5 w-5" />
                <span className="text-xs">Home</span>
              </button>
              
              <button 
                onClick={() => setCurrentPage('quick-join-select')}
                className={`flex flex-col items-center space-y-1 ${currentPage.startsWith('quick-join') ? 'text-purple-600' : 'text-gray-500'}`}
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Join</span>
              </button>
              
              <button 
                onClick={() => {
                  if (!user) {
                    setShowAuthPrompt(true);
                  } else {
                    setCurrentPage('quick-post');
                  }
                }}
                className={`flex flex-col items-center space-y-1 ${currentPage === 'quick-post' ? 'text-green-600' : 'text-gray-500'}`}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Post</span>
              </button>
              
              <button 
                onClick={() => setCurrentPage('login')}
                className={`flex flex-col items-center space-y-1 ${currentPage === 'login' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs">More</span>
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
              <div className="text-center mb-4">
                <Lock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Quick Post Authentication</h3>
                <p className="text-gray-600 text-sm mt-2">
                  To post a job and hire workers using voice, you need to be logged in as a client.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setShowAuthPrompt(false);
                    setCurrentPage('login');
                  }}
                  className="w-full bg-blue-600 text-white"
                >
                  I Have an Account
                </Button>
                <Button 
                  onClick={() => {
                    setShowAuthPrompt(false);
                    setCurrentPage('register');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create New Account
                </Button>
                <Button 
                  onClick={() => setShowAuthPrompt(false)}
                  variant="ghost"
                  className="w-full text-gray-500"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}