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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">user management</h1>
            </div>
          </div>
        </div>

        {/* Two Panel Layout */}
        <div className="flex h-[600px] border-2 border-black bg-white dark:bg-gray-800">
          
          {/* Left Panel */}
          <div className="w-1/4 border-r-2 border-black p-4 space-y-2">
            {/* Total Client List Button */}
            <Button
              variant={view === "total" ? "default" : "outline"}
              className="w-full h-12 text-left justify-start border-2 border-black font-medium"
              onClick={handleTotalClientsClick}
            >
              Total Client List
            </Button>

            {/* State Buttons */}
            <div className="space-y-2">
              {states.map((state) => (
                <Button
                  key={state}
                  variant={selectedState === state ? "default" : "outline"}
                  className="w-full h-12 text-left justify-start border-2 border-black font-medium"
                  onClick={() => handleStateClick(state)}
                >
                  {state}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-4">
            {/* Loading State */}
            {usersLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              </div>
            )}

            {/* Districts View */}
            {!usersLoading && view === "districts" && selectedState && (
              <div className="grid grid-cols-3 gap-3">
                {districtsForState.map((district) => (
                  <Button
                    key={district.id}
                    variant="outline"
                    className="h-12 border-2 border-black font-medium"
                    onClick={() => handleDistrictClick(district.name)}
                  >
                    {district.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Clients View */}
            {!usersLoading && view === "clients" && selectedDistrict && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Clients in {selectedDistrict}, {selectedState}
                  </h3>
                  <Button variant="outline" onClick={handleBackClick}>
                    Back to Districts
                  </Button>
                </div>
                
                {clientsForDistrict.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No clients found in this district</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientsForDistrict.map((client) => (
                      <Card key={client.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {client.firstName} {client.lastName}
                            </h4>
                            <Badge 
                              variant={client.isVerified ? "default" : "destructive"}
                              className={client.isVerified ? "bg-green-100 text-green-800" : ""}
                            >
                              {client.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {client.mobile}
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              Joined {new Date(client.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                            ID: {client.id.slice(0, 8)}...
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {!usersLoading && view === "states" && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Select a state from the left panel to view districts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}