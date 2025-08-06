import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Phone, Mail, Calendar, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

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
  const districtsForState = selectedState === "all" 
    ? (allDistricts as District[])
    : (allDistricts as District[]).filter((d: District) => d.state === selectedState);

  // Filter clients based on search and filters
  const filteredClients = clients.filter((client: User) => {
    const matchesSearch = searchTerm === "" || 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.mobile.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesState = selectedState === "all" || client.state === selectedState;
    const matchesDistrict = selectedDistrict === "all" || client.district === selectedDistrict;
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "verified" && client.isVerified) ||
      (selectedStatus === "pending" && !client.isVerified);

    return matchesSearch && matchesState && matchesDistrict && matchesStatus;
  });

  // Group clients by state and district
  const groupedClients = filteredClients.reduce((acc: any, client: User) => {
    const state = client.state || "Not Specified";
    const district = client.district || "Not Specified";
    
    if (!acc[state]) acc[state] = {};
    if (!acc[state][district]) acc[state][district] = [];
    acc[state][district].push(client);
    
    return acc;
  }, {});

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedState("all");
    setSelectedDistrict("all");
    setSelectedStatus("all");
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage all registered clients across India
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{filteredClients.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districtsForState.map((district: District) => (
                    <SelectItem key={district.id} value={district.name}>{district.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {usersLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading clients...</p>
          </div>
        )}

        {/* Clients List */}
        {!usersLoading && (
          <div className="space-y-6">
            {Object.keys(groupedClients).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No clients found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedClients).map(([state, districts]: [string, any]) => (
                <Card key={state}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      {state}
                      <Badge variant="secondary">
                        {Object.values(districts).flat().length} clients
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(districts).map(([district, districtClients]: [string, any]) => (
                      <div key={district} className="mb-4 last:mb-0">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          {district}
                          <Badge variant="outline">{districtClients.length}</Badge>
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {districtClients.map((client: User) => (
                            <div
                              key={client.id}
                              className="border rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {client.firstName} {client.lastName}
                                </h5>
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
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}