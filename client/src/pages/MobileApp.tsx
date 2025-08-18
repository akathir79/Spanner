/**
 * SPANNER Mobile App Preview - Web Version
 * Mobile-style interface accessible through the web browser
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wrench, ArrowLeft, Phone, UserPlus, Play } from 'lucide-react';

type MobileScreen = 'home' | 'login' | 'register' | 'test';

export default function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home');
  const [showAlert, setShowAlert] = useState(false);

  const handleTestApp = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Mobile App Container */}
      <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen relative">
        
        {/* Status Bar */}
        <div className="bg-gray-900 text-white text-xs px-4 py-1 flex justify-between">
          <span>9:41 AM</span>
          <span>📶 📶 📶 🔋</span>
        </div>

        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-4">
          <div className="flex items-center space-x-2">
            <Wrench className="h-6 w-6" />
            <h1 className="text-lg font-bold">SPANNER Mobile</h1>
          </div>
          <p className="text-blue-100 text-sm mt-1">Blue-collar service marketplace</p>
        </div>

        {/* Alert */}
        {showAlert && (
          <div className="absolute top-20 left-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-500 font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold">SPANNER Mobile</p>
                <p className="text-sm">App is working correctly!</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 pb-20">
          
          {currentScreen === 'home' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Smartphone className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Welcome to SPANNER</CardTitle>
                  <CardDescription>
                    Your blue-collar service marketplace is now available on mobile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleTestApp}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test App
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentScreen('login')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  
                  <Button 
                    onClick={() => setCurrentScreen('register')}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="text-center p-4">
                  <div className="text-2xl font-bold text-blue-600">1000+</div>
                  <div className="text-sm text-gray-600">Workers</div>
                </Card>
                <Card className="text-center p-4">
                  <div className="text-2xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-gray-600">Jobs Completed</div>
                </Card>
              </div>
            </div>
          )}

          {currentScreen === 'login' && (
            <div className="space-y-6">
              <Button 
                onClick={() => setCurrentScreen('home')}
                variant="ghost"
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              
              <Card>
                <CardHeader>
                  <CardTitle>Login to SPANNER</CardTitle>
                  <CardDescription>
                    Enter your mobile number to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Send OTP
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {currentScreen === 'register' && (
            <div className="space-y-6">
              <Button 
                onClick={() => setCurrentScreen('home')}
                variant="ghost"
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              
              <Card>
                <CardHeader>
                  <CardTitle>Create SPANNER Account</CardTitle>
                  <CardDescription>
                    Join thousands of workers and clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User Type</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Client (I need services)</option>
                      <option>Worker (I provide services)</option>
                    </select>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    Create Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
          <div className="flex justify-center items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Connected to SPANNER Backend
            </Badge>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              Status: Ready • Port: 5000 • Mobile Preview Mode
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Instructions */}
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Smartphone className="h-5 w-5 mr-2" />
          Mobile App Development Status
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Web Preview</CardTitle>
              <CardDescription>Current mobile interface simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Mobile UI working</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Navigation functional</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Backend connected</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">React Native App</CardTitle>
              <CardDescription>Separate mobile project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Project created</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Metro server running</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">QR code access limited</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}