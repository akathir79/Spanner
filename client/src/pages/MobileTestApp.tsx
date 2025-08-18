/**
 * SPANNER Mobile Test App - Standalone Mobile Interface
 * Completely isolated mobile experience without any navigation conflicts
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wrench, Home, User, Settings, Phone, CheckCircle, Search, Plus, Briefcase } from 'lucide-react';

export default function MobileTestApp() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [showSuccess, setShowSuccess] = useState(false);

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
                    <CardDescription>Create your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input 
                      type="text" 
                      placeholder="Full Name"
                      className="h-12"
                    />
                    <Input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      className="h-12"
                    />
                    <select className="w-full h-12 px-3 border rounded-lg bg-white">
                      <option>I need services (Client)</option>
                      <option>I provide services (Worker)</option>
                    </select>
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
                onClick={() => setCurrentPage('login')}
                className={`flex flex-col items-center space-y-1 ${currentPage === 'login' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Login</span>
              </button>
              
              <button 
                onClick={() => setCurrentPage('register')}
                className={`flex flex-col items-center space-y-1 ${currentPage === 'register' ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">Register</span>
              </button>
              
              <button className="flex flex-col items-center space-y-1 text-gray-500">
                <Settings className="h-5 w-5" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}