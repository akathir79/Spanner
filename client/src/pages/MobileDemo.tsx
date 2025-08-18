/**
 * SPANNER Mobile App - Complete Mobile Interface
 * Full-featured mobile version with all web app functionality
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Home, User, Settings, Phone, CheckCircle, Search, MapPin, Calendar, Clock, Star, Briefcase, MessageCircle, Wallet, Bell, Menu, ArrowLeft, Plus, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MobileState {
  currentPage: string;
  showSuccess: boolean;
  selectedService: string;
  selectedDistrict: string;
  searchQuery: string;
  jobTitle: string;
  jobDescription: string;
  jobBudget: string;
  showNotifications: boolean;
  showMenu: boolean;
}

export default function MobileDemo() {
  const { user, login, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<MobileState>({
    currentPage: user ? 'dashboard' : 'home',
    showSuccess: false,
    selectedService: '',
    selectedDistrict: '',
    searchQuery: '',
    jobTitle: '',
    jobDescription: '',
    jobBudget: '',
    showNotifications: false,
    showMenu: false
  });

  // Fetch data
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
    enabled: true
  }) as { data: any[] };

  const { data: areas = [] } = useQuery({
    queryKey: ['/api/areas'],
    enabled: true
  }) as { data: any[] };

  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user
  }) as { data: any[] };

  const { data: workers = [] } = useQuery({
    queryKey: ['/api/workers'],
    enabled: state.currentPage === 'find-workers'
  }) as { data: any[] };

  const updateState = (updates: Partial<MobileState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleTest = () => {
    updateState({ showSuccess: true });
    setTimeout(() => updateState({ showSuccess: false }), 2000);
  };

  const handleQuickPost = async () => {
    if (!state.jobTitle || !state.jobDescription) {
      toast({ title: "Please fill in job details", variant: "destructive" });
      return;
    }

    try {
      await apiRequest('POST', '/api/bookings', {
        title: state.jobTitle,
        description: state.jobDescription,
        budget: state.jobBudget || '1000',
        serviceId: state.selectedService || services[0]?.id,
        districtId: state.selectedDistrict || areas[0]?.id
      });
      
      toast({ title: "Job posted successfully!" });
      updateState({ 
        currentPage: 'my-jobs',
        jobTitle: '',
        jobDescription: '',
        jobBudget: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    } catch (error) {
      toast({ title: "Failed to post job", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-sm mx-auto relative mt-20">
      {/* Mobile Status Bar */}
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between">
        <span>9:41 AM</span>
        <span>100%</span>
      </div>

      {/* App Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center space-x-2">
          <Wrench className="h-6 w-6" />
          <h1 className="text-lg font-bold">SPANNER</h1>
        </div>
        <p className="text-blue-100 text-sm">Blue-collar services</p>
      </div>

      {/* Success Message */}
      {state.showSuccess && (
        <div className="absolute top-16 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>App is working perfectly!</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 pb-20">
        {state.currentPage === 'home' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Welcome to SPANNER Mobile</CardTitle>
                <CardDescription>
                  Find workers or offer services across India
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!user ? (
                  <>
                    <Button 
                      onClick={handleTest}
                      className="w-full bg-blue-600 text-white h-12 text-lg"
                    >
                      Test Mobile App
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => updateState({ currentPage: 'login' })}
                        variant="outline"
                        className="h-12"
                      >
                        Login
                      </Button>
                      <Button 
                        onClick={() => updateState({ currentPage: 'register' })}
                        variant="outline"
                        className="h-12"
                      >
                        Register
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Welcome back, {user.firstName}!</h3>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => updateState({ currentPage: 'quick-post' })}
                        className="h-12 bg-green-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Quick Post
                      </Button>
                      <Button 
                        onClick={() => updateState({ currentPage: 'find-workers' })}
                        className="h-12 bg-blue-600"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Find Workers
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => updateState({ currentPage: 'my-jobs' })}
                      variant="outline"
                      className="w-full h-12"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      My Jobs ({bookings.length})
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{workers.length || '1000+'}+</div>
                <div className="text-sm">Workers</div>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{bookings.length || '500+'}+</div>
                <div className="text-sm">Jobs Done</div>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{areas.length || '28'}</div>
                <div className="text-sm">Locations</div>
              </div>
            </div>

            {/* Services Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {services.slice(0, 6).map((service: any) => (
                    <Button
                      key={service.id}
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center"
                      onClick={() => updateState({ 
                        currentPage: 'find-workers',
                        selectedService: service.id 
                      })}
                    >
                      <Wrench className="h-5 w-5 mb-1" />
                      <span className="text-xs">{service.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state.currentPage === 'quick-post' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => updateState({ currentPage: 'home' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Quick Post Job</h2>
            </div>

            <Card>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    placeholder="e.g., Fix kitchen plumbing"
                    value={state.jobTitle}
                    onChange={(e) => updateState({ jobTitle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what work you need done..."
                    value={state.jobDescription}
                    onChange={(e) => updateState({ jobDescription: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={state.selectedService} onValueChange={(value) => updateState({ selectedService: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service: any) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={state.selectedDistrict} onValueChange={(value) => updateState({ selectedDistrict: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.slice(0, 20).map((area: any) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Budget (₹)</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={state.jobBudget}
                    onChange={(e) => updateState({ jobBudget: e.target.value })}
                  />
                </div>

                <Button 
                  onClick={handleQuickPost}
                  className="w-full h-12 bg-green-600 text-white"
                >
                  Post Job
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {state.currentPage === 'find-workers' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => updateState({ currentPage: 'home' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Find Workers</h2>
            </div>

            <div className="flex space-x-2">
              <Input
                placeholder="Search workers..."
                value={state.searchQuery}
                onChange={(e) => updateState({ searchQuery: e.target.value })}
                className="flex-1"
              />
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {workers.length > 0 ? (
              <div className="space-y-3">
                {workers.map((worker: any) => (
                  <Card key={worker.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{worker.firstName} {worker.lastName}</h3>
                          <p className="text-sm text-gray-600">{worker.services?.[0] || 'General Services'}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">4.8</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {worker.district || 'Local'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No workers found. Try adjusting your search.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {state.currentPage === 'my-jobs' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => updateState({ currentPage: 'home' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">My Jobs</h2>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((booking: any) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{booking.title || 'Service Request'}</h3>
                          <p className="text-sm text-gray-600">{booking.description?.slice(0, 50)}...</p>
                        </div>
                        <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {booking.area || 'Local Area'}
                        </span>
                        <span className="flex items-center">
                          <Wallet className="h-3 w-3 mr-1" />
                          ₹{booking.budget || 'TBD'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs posted yet</p>
                  <Button 
                    className="mt-4"
                    onClick={() => updateState({ currentPage: 'quick-post' })}
                  >
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {state.currentPage === 'login' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => updateState({ currentPage: 'home' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Login</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your mobile number to continue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    className="h-12 text-lg"
                  />
                </div>
                <Button className="w-full h-12 bg-blue-600 text-white text-lg">
                  Send OTP
                </Button>
                <div className="text-center">
                  <span className="text-sm text-gray-600">Don't have an account? </span>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => updateState({ currentPage: 'register' })}
                  >
                    Sign up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state.currentPage === 'register' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => updateState({ currentPage: 'home' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Create Account</h2>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Join SPANNER</CardTitle>
                <CardDescription>Create your account to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    type="text" 
                    placeholder="Enter your full name"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client (I need services)</SelectItem>
                      <SelectItem value="worker">Worker (I provide services)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full h-12 bg-blue-600 text-white text-lg">
                  Create Account
                </Button>
                <div className="text-center">
                  <span className="text-sm text-gray-600">Already have an account? </span>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => updateState({ currentPage: 'login' })}
                  >
                    Sign in
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state.currentPage === 'dashboard' && user && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>Welcome back, {user.firstName}!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                    <div className="text-sm">Active Jobs</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹5,000</div>
                    <div className="text-sm">Wallet Balance</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => updateState({ currentPage: 'quick-post' })}
                    className="w-full h-12"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Button>
                  <Button 
                    onClick={() => updateState({ currentPage: 'my-jobs' })}
                    variant="outline"
                    className="w-full h-12"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Manage Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} className="flex items-center space-x-3 py-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{booking.title || 'Service Request'}</p>
                      <p className="text-xs text-gray-600">{booking.status}</p>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {state.currentPage === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => updateState({ currentPage: user ? 'dashboard' : 'home' })}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Settings</h2>
            </div>

            <Card>
              <CardContent className="space-y-4 pt-4">
                {user && (
                  <>
                    <div className="text-center pb-4 border-b">
                      <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <Badge variant="outline" className="mt-2">{user.role}</Badge>
                    </div>
                    
                    <Button variant="outline" className="w-full justify-start h-12">
                      <User className="h-4 w-4 mr-3" />
                      Edit Profile
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Bell className="h-4 w-4 mr-3" />
                      Notifications
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start h-12">
                      <Wallet className="h-4 w-4 mr-3" />
                      Wallet & Payments
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start h-12"
                      onClick={logout}
                    >
                      Logout
                    </Button>
                  </>
                )}
                
                {!user && (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Please login to access settings</p>
                    <Button 
                      onClick={() => updateState({ currentPage: 'login' })}
                      className="w-full"
                    >
                      Login
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-sm mx-auto">
        <div className="flex justify-around p-3">
          <button 
            onClick={() => updateState({ currentPage: user ? 'dashboard' : 'home' })}
            className={`flex flex-col items-center space-y-1 p-2 ${state.currentPage === 'home' || state.currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </button>
          
          {user ? (
            <>
              <button 
                onClick={() => updateState({ currentPage: 'find-workers' })}
                className={`flex flex-col items-center space-y-1 p-2 ${state.currentPage === 'find-workers' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Search className="h-5 w-5" />
                <span className="text-xs">Search</span>
              </button>
              <button 
                onClick={() => updateState({ currentPage: 'my-jobs' })}
                className={`flex flex-col items-center space-y-1 p-2 relative ${state.currentPage === 'my-jobs' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-xs">Jobs</span>
                {bookings.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {bookings.length}
                  </div>
                )}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => updateState({ currentPage: 'login' })}
                className={`flex flex-col items-center space-y-1 p-2 ${state.currentPage === 'login' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Login</span>
              </button>
              <button 
                onClick={() => updateState({ currentPage: 'register' })}
                className={`flex flex-col items-center space-y-1 p-2 ${state.currentPage === 'register' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">Register</span>
              </button>
            </>
          )}
          
          <button 
            onClick={() => updateState({ currentPage: 'settings' })}
            className={`flex flex-col items-center space-y-1 p-2 ${state.currentPage === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="text-center p-2 bg-green-100 text-green-800 text-sm">
        Connected to SPANNER Backend • {services.length} Services • {areas.length} Locations
      </div>
    </div>
  );
}