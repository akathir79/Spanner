import { useState, useEffect } from "react";
import { ArrowLeft, Users, MapPin, Calendar, Phone, Mail, Eye, MessageSquare, CheckCircle, XCircle, Trash2, MoreHorizontal, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// Types
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string;
  role: string;
  district: string | null;
  state: string | null;
  isVerified: boolean;
  profilePicture: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  // Additional fields for details modal
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  pincode?: string;
  alternatePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  occupation?: string;
  annualIncome?: string;
  identityProof?: string;
  identityNumber?: string;
  addressProof?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  upiId?: string;
  preferredPaymentMethod?: string;
  languagePreference?: string;
  communicationPreferences?: string;
  notificationSettings?: string;
  referralSource?: string;
  specialRequirements?: string;
}

interface District {
  name: string;
  state: string;
}

// Helper functions for date formatting and activity status
function formatIndianDateTime(dateString: string): string {
  if (!dateString) return "Not available";
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch {
    return "Invalid date";
  }
}

function getActivityStatus(lastLoginAt: string | null, createdAt: string) {
  if (!lastLoginAt) {
    return {
      label: "Never",
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      icon: <AlertCircle className="w-3 h-3" />
    };
  }

  const now = new Date();
  const lastLogin = new Date(lastLoginAt);
  const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 15) {
    return {
      label: "Inactive",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      icon: <XCircle className="w-3 h-3" />
    };
  } else if (daysDiff > 7) {
    return {
      label: "Low Activity",
      variant: "secondary" as const,
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      icon: <Clock className="w-3 h-3" />
    };
  } else {
    return {
      label: "Active",
      variant: "default" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      icon: <CheckCircle className="w-3 h-3" />
    };
  }
}

export default function ClientManagement() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"states" | "districts" | "clients" | "total">("total");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all clients
  const { data: clients = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    retry: false,
  });

  // Fetch districts data
  const { data: districts = [] } = useQuery({
    queryKey: ['/api/districts'],
    retry: false,
  });

  // Get unique states from districts
  const states = Array.from(new Set(districts.map((d: District) => d.state))).sort();

  // Helper functions
  const getDistrictsForState = (state: string) => {
    return districts.filter((d: District) => d.state === state).map((d: District) => d.name).sort();
  };

  const getClientsForDistrict = (district: string) => {
    return clients.filter((client: Client) => client.district === district);
  };

  const getDistrictCountForState = (state: string) => {
    return getDistrictsForState(state).length;
  };

  // Event handlers
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
      setSelectedDistrict(null);
      setView("districts");
    } else if (view === "districts") {
      setSelectedState(null);
      setView("states");
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsDialog(true);
  };

  const handleSendMessage = (client: Client) => {
    toast({
      title: "Message Feature",
      description: `Opening message composer for ${client.firstName} ${client.lastName}`,
    });
  };

  const handleVerifyUser = (client: Client) => {
    toast({
      title: "User Verification",
      description: `Verifying user ${client.firstName} ${client.lastName}`,
    });
  };

  const handleSuspendUser = (client: Client) => {
    toast({
      title: "User Suspension",
      description: `Suspending user ${client.firstName} ${client.lastName}`,
      variant: "destructive",
    });
  };

  const handleDeleteUser = (client: Client) => {
    toast({
      title: "User Deletion",
      description: `Deleting user ${client.firstName} ${client.lastName}`,
      variant: "destructive",
    });
  };

  const clientsForDistrict = selectedDistrict ? getClientsForDistrict(selectedDistrict) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Management</h1>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* View Toggle */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Button
                variant={view === "total" ? "default" : "ghost"}
                onClick={() => setView("total")}
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Total Client List
                <Badge variant="secondary" className="ml-auto">
                  {clients.length}
                </Badge>
              </Button>
              <Button
                variant={view === "states" ? "default" : "ghost"}
                onClick={() => setView("states")}
                className="w-full justify-start"
              >
                <MapPin className="w-4 h-4 mr-2" />
                States & Districts
              </Button>
            </div>
          </div>
          
          {/* States List */}
          {(view === "states" || view === "districts" || view === "clients") && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Select State
                </h3>
              </div>
          
              {/* Scrollable States List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-1">
                  {states.map((state) => (
                    <button
                      key={state}
                      onClick={() => handleStateClick(state)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                        selectedState === state
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="pr-8">{state}</span>
                      <Badge 
                        variant="secondary" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {getDistrictCountForState(state)}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto">
          {/* Loading State */}
          {usersLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading client data...</p>
              </div>
            </div>
          )}

          {/* Total Client List View */}
          {!usersLoading && view === "total" && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  All Registered Clients
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete client database • {clients.length} total clients
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No clients registered yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Client registrations will appear here</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Bookings/Earnings</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => {
                          const activityStatus = getActivityStatus(client.lastLoginAt, client.createdAt);
                          return (
                            <TableRow key={client.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {client.firstName} {client.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    ID: {client.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100">
                                  Client
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {client.district && client.state ? (
                                    <span className="text-gray-900 dark:text-white">
                                      {client.district}, {client.state}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Not specified
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <div>0 bookings</div>
                                  <div>Spent: ₹0</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Phone className="w-3 h-3" />
                                    <span>{client.mobile}</span>
                                  </div>
                                  {client.email && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate max-w-[150px]">{client.email}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Registered</span>
                                  </div>
                                  <div className="font-mono text-xs">
                                    {formatIndianDateTime(client.createdAt)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {client.lastLoginAt ? (
                                    <div className="text-gray-600 dark:text-gray-400">
                                      <div className="font-mono text-xs mb-1">
                                        {formatIndianDateTime(client.lastLoginAt)}
                                      </div>
                                      <Badge 
                                        variant={activityStatus.variant}
                                        className={`text-xs ${activityStatus.className}`}
                                      >
                                        <div className="flex items-center gap-1">
                                          {activityStatus.icon}
                                          {activityStatus.label}
                                        </div>
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge 
                                      variant="secondary"
                                      className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                    >
                                      <div className="flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        No Login
                                      </div>
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={client.isVerified ? "default" : "destructive"}
                                  className={client.isVerified ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
                                >
                                  {client.isVerified ? "Verified" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendMessage(client)}>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleVerifyUser(client)}>
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                      <span className="text-green-600">Verify User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSuspendUser(client)}>
                                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                      <span className="text-red-600">Suspend User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteUser(client)}>
                                      <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                                      <span className="text-red-600">Delete User</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Default State - No Selection */}
          {!usersLoading && view === "states" && !selectedState && (
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
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Districts in {selectedState}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a district to view registered clients
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getDistrictsForState(selectedState).map((district) => {
                    const districtClients = getClientsForDistrict(district);
                    return (
                      <div
                        key={district}
                        onClick={() => handleDistrictClick(district)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">{district}</h3>
                          <Badge variant="secondary">
                            {districtClients.length}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {districtClients.length === 0 ? "No clients" : `${districtClients.length} client${districtClients.length !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Clients in District View */}
          {!usersLoading && selectedDistrict && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
              
              <div className="flex-1 overflow-y-auto p-6">
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Bookings/Earnings</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientsForDistrict.map((client) => {
                          const activityStatus = getActivityStatus(client.lastLoginAt, client.createdAt);
                          return (
                            <TableRow key={client.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {client.firstName} {client.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    ID: {client.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100">
                                  Client
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {client.district && client.state ? (
                                    <span className="text-gray-900 dark:text-white">
                                      {client.district}, {client.state}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Not specified
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <div>0 bookings</div>
                                  <div>Spent: ₹0</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Phone className="w-3 h-3" />
                                    <span>{client.mobile}</span>
                                  </div>
                                  {client.email && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Mail className="w-3 h-3" />
                                      <span className="truncate max-w-[150px]">{client.email}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Registered</span>
                                  </div>
                                  <div className="font-mono text-xs">
                                    {formatIndianDateTime(client.createdAt)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {client.lastLoginAt ? (
                                    <div className="text-gray-600 dark:text-gray-400">
                                      <div className="font-mono text-xs mb-1">
                                        {formatIndianDateTime(client.lastLoginAt)}
                                      </div>
                                      <Badge 
                                        variant={activityStatus.variant}
                                        className={`text-xs ${activityStatus.className}`}
                                      >
                                        <div className="flex items-center gap-1">
                                          {activityStatus.icon}
                                          {activityStatus.label}
                                        </div>
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge 
                                      variant="secondary"
                                      className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                    >
                                      <div className="flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        No Login
                                      </div>
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={client.isVerified ? "default" : "destructive"}
                                  className={client.isVerified ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
                                >
                                  {client.isVerified ? "Verified" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendMessage(client)}>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleVerifyUser(client)}>
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                      <span className="text-green-600">Verify User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSuspendUser(client)}>
                                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                      <span className="text-red-600">Suspend User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteUser(client)}>
                                      <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                                      <span className="text-red-600">Delete User</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedClient && (
        <ViewDetailsModal
          isOpen={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          title="Client Details"
          subtitle="Complete registration information"
          data={selectedClient}
          avatar={{
            src: selectedClient.profilePicture,
            fallback: `${selectedClient.firstName?.charAt(0)}${selectedClient.lastName?.charAt(0)}`
          }}
          fields={[
            // Personal Information
            { key: "firstName", label: "First Name", type: "text", editable: true, required: true, section: "personal" },
            { key: "lastName", label: "Last Name", type: "text", editable: true, required: true, section: "personal" },
            { key: "id", label: "User ID", type: "display", section: "personal" },
            { key: "mobile", label: "Mobile Number", type: "tel", editable: true, required: true, section: "personal" },
            { key: "email", label: "Email Address", type: "email", editable: true, section: "personal" },
            { key: "role", label: "User Role", type: "display", section: "personal" },
            
            // Location Information
            { key: "state", label: "State", type: "text", editable: true, section: "location" },
            { key: "district", label: "District", type: "text", editable: true, section: "location" },
            { key: "address", label: "Full Address", type: "textarea", editable: true, section: "location" },
            { key: "pincode", label: "PIN Code", type: "text", editable: true, section: "location" },
            
            // Contact Information
            { key: "alternatePhone", label: "Alternate Phone", type: "tel", editable: true, section: "contact" },
            { key: "emergencyContactName", label: "Emergency Contact Name", type: "text", editable: true, section: "contact" },
            { key: "emergencyContactPhone", label: "Emergency Contact Phone", type: "tel", editable: true, section: "contact" },
            
            // Financial Information
            { key: "bankName", label: "Bank Name", type: "text", editable: true, section: "financial" },
            { key: "accountNumber", label: "Account Number", type: "text", editable: true, section: "financial" },
            { key: "ifscCode", label: "IFSC Code", type: "text", editable: true, section: "financial" },
            { key: "accountHolderName", label: "Account Holder Name", type: "text", editable: true, section: "financial" },
            { key: "upiId", label: "UPI ID", type: "text", editable: true, section: "financial" },
            { key: "preferredPaymentMethod", label: "Preferred Payment Method", type: "text", editable: true, section: "financial" },
            
            // Profile Information
            { key: "dateOfBirth", label: "Date of Birth", type: "date", editable: true, section: "profile" },
            { key: "gender", label: "Gender", type: "text", editable: true, section: "profile" },
            { key: "occupation", label: "Occupation", type: "text", editable: true, section: "profile" },
            { key: "annualIncome", label: "Annual Income", type: "text", editable: true, section: "profile" },
            
            // Documents & Verification
            { key: "identityProof", label: "Identity Proof Type", type: "text", editable: true, section: "documents" },
            { key: "identityNumber", label: "Identity Number", type: "text", editable: true, section: "documents" },
            { key: "addressProof", label: "Address Proof", type: "text", editable: true, section: "documents" },
            { key: "isVerified", label: "Verification Status", type: "display", section: "documents" },
            
            // Preferences
            { key: "languagePreference", label: "Language Preference", type: "text", editable: true, section: "preferences" },
            { key: "communicationPreferences", label: "Communication Preferences", type: "text", editable: true, section: "preferences" },
            { key: "notificationSettings", label: "Notification Settings", type: "text", editable: true, section: "preferences" },
            { key: "referralSource", label: "Referral Source", type: "text", editable: true, section: "preferences" },
            { key: "specialRequirements", label: "Special Requirements", type: "textarea", editable: true, section: "preferences" },
            
            // Timestamps
            { key: "createdAt", label: "Registration Date", type: "display", section: "system", format: "datetime" },
            { key: "lastLoginAt", label: "Last Login", type: "display", section: "system", format: "datetime" }
          ]}
          sections={[
            { key: "personal", title: "Personal Information", icon: "user" },
            { key: "location", title: "Location Details", icon: "map-pin" },
            { key: "contact", title: "Contact Information", icon: "phone" },
            { key: "financial", title: "Financial Details", icon: "credit-card" },
            { key: "profile", title: "Profile Information", icon: "user-check" },
            { key: "documents", title: "Documents & Verification", icon: "file-text" },
            { key: "preferences", title: "Preferences & Settings", icon: "settings" },
            { key: "system", title: "System Information", icon: "database" }
          ]}
          onSave={(updatedData) => {
            // Handle save logic here
            console.log('Updated client data:', updatedData);
            setShowDetailsDialog(false);
            toast({
              title: "Profile Updated",
              description: "Client profile has been updated successfully.",
            });
          }}
        />
      )}
    </div>
  );
}