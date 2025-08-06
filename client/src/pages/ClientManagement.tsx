import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Mail, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobile: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  district?: string;
  state?: string;
}

interface District {
  id: string;
  name: string;
  state: string;
}

export default function ClientManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"total" | "states" | "districts" | "clients">("total");

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
  });

  // Fetch districts for filtering
  const { data: allDistricts = [] } = useQuery({
    queryKey: ["/api/districts"],
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
  });

  // Filter only clients
  const clients = (users as User[]).filter((u: User) => u.role === "client");

  // Get unique states from districts
  const states = Array.from(new Set((allDistricts as District[]).map((d: District) => d.state))).sort();

  // Get districts for selected state
  const districtsForState = selectedState 
    ? (allDistricts as District[]).filter((d: District) => d.state === selectedState)
    : [];

  // Get clients for selected district
  const clientsForDistrict = selectedDistrict 
    ? clients.filter((client: User) => client.district === selectedDistrict)
    : [];

  // Handle navigation
  const handleTotalClientsClick = () => {
    setView("states");
    setSelectedState(null);
    setSelectedDistrict(null);
  };

  const handleStateClick = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setView("districts");
  };

  const handleDistrictClick = (district: string) => {
    setSelectedDistrict(district);
    setView("clients");
  };

  const handleBackClick = () => {
    if (view === "clients") {
      setView("districts");
      setSelectedDistrict(null);
    } else if (view === "districts") {
      setView("states");
      setSelectedState(null);
    } else {
      setView("total");
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b fixed top-16 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)] mt-20">
        
        {/* Left Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            {/* Total Client List Header */}
            <div className="mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center font-medium text-gray-900 dark:text-white border">
                Total Client List
              </div>
            </div>

            {/* States List */}
            <div className="space-y-1">
              {states.map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateClick(state)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedState === state
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800">
          {/* Loading State */}
          {usersLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading client data...</p>
              </div>
            </div>
          )}

          {/* Default State - No Selection */}
          {!usersLoading && !selectedState && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">Select a state from the left panel to view districts</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Choose any state to see available districts and clients</p>
              </div>
            </div>
          )}

          {/* Districts View */}
          {!usersLoading && selectedState && !selectedDistrict && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Districts in {selectedState}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a district to view registered clients
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {districtsForState.map((district) => (
                  <Button
                    key={district.id}
                    variant="outline"
                    onClick={() => handleDistrictClick(district.name)}
                    className="h-12 justify-start font-medium hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                  >
                    {district.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Clients View */}
          {!usersLoading && selectedDistrict && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Clients in {selectedDistrict}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedState} • {clientsForDistrict.length} clients found
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleBackClick}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Districts
                </Button>
              </div>
              
              {clientsForDistrict.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No clients found in this district</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Clients will appear here once they register</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientsForDistrict.map((client) => (
                    <Card key={client.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {client.firstName} {client.lastName}
                            </h4>
                          </div>
                          <Badge 
                            variant={client.isVerified ? "default" : "destructive"}
                            className={client.isVerified ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
                          >
                            {client.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="font-mono">{client.mobile}</span>
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Joined {new Date(client.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                            ID: {client.id.slice(0, 8)}...
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}