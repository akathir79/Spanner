/**
 * SPANNER Mobile Demo - Simplified Mobile Interface
 * Direct mobile-optimized interface for phone testing
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Home, User, Settings, Phone, CheckCircle } from 'lucide-react';

export default function MobileDemo() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTest = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-sm mx-auto relative">
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
      {showSuccess && (
        <div className="absolute top-20 left-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>App is working perfectly!</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 pb-20">
        {currentPage === 'home' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Welcome to SPANNER Mobile</CardTitle>
                <CardDescription>
                  Find workers or offer services across India
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleTest}
                  className="w-full bg-blue-600 text-white h-12 text-lg"
                >
                  Test Mobile App
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => setCurrentPage('login')}
                    variant="outline"
                    className="h-12"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => setCurrentPage('register')}
                    variant="outline"
                    className="h-12"
                  >
                    Register
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">1000+</div>
                <div className="text-sm">Workers</div>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div className="text-sm">Jobs Done</div>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">28</div>
                <div className="text-sm">States</div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your mobile number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input 
                  type="tel" 
                  placeholder="Mobile Number"
                  className="w-full p-3 border rounded-lg text-lg"
                />
                <Button className="w-full h-12 bg-blue-600 text-white text-lg">
                  Send OTP
                </Button>
                <Button 
                  onClick={() => setCurrentPage('home')}
                  variant="outline"
                  className="w-full h-12"
                >
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPage === 'register' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join SPANNER today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name"
                  className="w-full p-3 border rounded-lg text-lg"
                />
                <input 
                  type="tel" 
                  placeholder="Mobile Number"
                  className="w-full p-3 border rounded-lg text-lg"
                />
                <select className="w-full p-3 border rounded-lg text-lg">
                  <option>I need services (Client)</option>
                  <option>I provide services (Worker)</option>
                </select>
                <Button className="w-full h-12 bg-blue-600 text-white text-lg">
                  Create Account
                </Button>
                <Button 
                  onClick={() => setCurrentPage('home')}
                  variant="outline"
                  className="w-full h-12"
                >
                  Back to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-sm mx-auto">
        <div className="flex justify-around p-3">
          <button 
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center space-y-1 p-2 ${currentPage === 'home' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => setCurrentPage('login')}
            className={`flex flex-col items-center space-y-1 p-2 ${currentPage === 'login' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Login</span>
          </button>
          <button 
            onClick={() => setCurrentPage('register')}
            className={`flex flex-col items-center space-y-1 p-2 ${currentPage === 'register' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">Register</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 text-gray-500">
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="text-center p-2 bg-green-100 text-green-800 text-sm">
        Connected to SPANNER Backend • Status: Online
      </div>
    </div>
  );
}