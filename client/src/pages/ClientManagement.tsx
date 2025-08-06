import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import statesDistrictsData from "@/../../shared/states-districts.json";

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

interface StateData {
  state: string;
  districts: string[];
}

export default function ClientManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"total" | "states" | "districts" | "clients">("states");
  
  // Modal states
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
  });

  // Fetch all districts from database for real counts
  const { data: dbDistricts = [] } = useQuery({
    queryKey: ["/api/districts"],
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
  });

  // Filter only clients
  const clients = (users as User[]).filter((u: User) => u.role === "client");

  // Get states from JSON file
  const states = (statesDistrictsData.states as StateData[]).map(s => s.state).sort();

  // Get districts for selected state from JSON file
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as StateData[]).find(s => s.state === selectedState)?.districts || []
    : [];

  // Get clients for selected district
  const clientsForDistrict = selectedDistrict 
    ? clients.filter((client: User) => client.district === selectedDistrict)
    : [];

  // Get district count for each state from database
  const getDistrictCountForState = (stateName: string) => {
    const districtsInState = (dbDistricts as District[]).filter((d: District) => d.state === stateName);
    return districtsInState.length;
  };

  // Get client count for each district from database
  const getClientCountForDistrict = (districtName: string) => {
    return clients.filter((client: User) => client.district === districtName).length;
  };

  // Mutations for client actions
  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/verify-user/${userId}`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User verified successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify user",
        variant: "destructive",
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/suspend-user/${userId}`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User suspended successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/delete-user/${userId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowDeleteDialog(false);
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      return await apiRequest("/api/admin/send-message", {
        method: "POST",
        body: { userId, message },
      });
    },
    onSuccess: () => {
      setShowMessageDialog(false);
      setMessageText("");
      setSelectedClient(null);
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Action handlers
  const handleViewDetails = (client: User) => {
    setSelectedClient(client);
    setShowDetailsDialog(true);
  };

  const handleSendMessage = (client: User) => {
    setSelectedClient(client);
    setShowMessageDialog(true);
  };

  const handleVerifyUser = (client: User) => {
    verifyUserMutation.mutate(client.id);
  };

  const handleSuspendUser = (client: User) => {
    suspendUserMutation.mutate(client.id);
  };

  const handleDeleteUser = (client: User) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (selectedClient) {
      deleteUserMutation.mutate(selectedClient.id);
    }
  };

  const confirmSendMessage = () => {
    if (selectedClient && messageText.trim()) {
      sendMessageMutation.mutate({
        userId: selectedClient.id,
        message: messageText.trim(),
      });
    }
  };

  // Handle navigation
  const handleTotalClientsClick = () => {
    setView("total");
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
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {/* Total Client List Header */}
            <button
              onClick={handleTotalClientsClick}
              className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center font-medium border transition-colors relative ${
                view === "total" 
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300' 
                  : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="pr-8">Total Client List</span>
              <Badge 
                variant="secondary" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-purple-500 text-white hover:bg-purple-600"
              >
                {clients.length}
              </Badge>
            </button>
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
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
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
                        ))}
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {districtsForState.map((district) => (
                    <Button
                      key={district}
                      variant="outline"
                      onClick={() => handleDistrictClick(district)}
                      className="h-12 justify-start font-medium hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 relative pr-10"
                    >
                      <span className="truncate">{district}</span>
                      <Badge 
                        variant="secondary" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600"
                      >
                        {getClientCountForDistrict(district)}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clients View */}
          {!usersLoading && selectedDistrict && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
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
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientsForDistrict.map((client) => (
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
                        ))}
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
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Client Details</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  if (!isEditMode && selectedClient) {
                    setEditFormData(selectedClient);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditMode ? "Cancel Edit" : "Edit Details"}
              </Button>
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Edit client information" : "Complete registration information"}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center justify-center">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedClient.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {selectedClient.firstName?.charAt(0)}{selectedClient.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditMode ? (
                    <Input
                      id="firstName"
                      value={editFormData.firstName || ""}
                      onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {selectedClient.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditMode ? (
                    <Input
                      id="lastName"
                      value={editFormData.lastName || ""}
                      onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {selectedClient.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="userIdDisplay">User ID</Label>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    {selectedClient.id}
                  </p>
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  {isEditMode ? (
                    <Input
                      id="mobile"
                      value={editFormData.mobile || ""}
                      onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {selectedClient.mobile}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {isEditMode ? (
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {selectedClient.email || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="role">User Role</Label>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 p-2 bg-purple-50 dark:bg-purple-900/20 rounded capitalize">
                    {selectedClient.role}
                  </p>
                </div>
              </div>

              {/* Location Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {selectedClient.state || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {selectedClient.district || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Status Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="verificationStatus">Verification Status</Label>
                  <div className="p-2">
                    <Badge className={`${selectedClient.isVerified ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                      {selectedClient.isVerified ? 'Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label htmlFor="memberSince">Member Since</Label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {new Date(selectedClient.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Account Activity */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Account Activity</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹0</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount Spent</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reviews Given</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowDetailsDialog(false);
              setIsEditMode(false);
              setEditFormData({});
            }}>
              Close
            </Button>
            {isEditMode && (
              <Button onClick={() => {
                // TODO: Implement save functionality
                console.log("Save changes:", editFormData);
                setIsEditMode(false);
                toast({
                  title: "Changes Saved",
                  description: "Client details have been updated successfully.",
                });
              }}>
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedClient?.firstName} {selectedClient?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSendMessage} 
              disabled={!messageText.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this user? This action cannot be undone and will remove:
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">User Information:</h4>
                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                  <li>{selectedClient.firstName} {selectedClient.lastName}</li>
                  <li>{selectedClient.mobile}</li>
                  {selectedClient.email && <li>{selectedClient.email}</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">All Associated Data:</h4>
                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                  <li>Profile and account information</li>
                  <li>All bookings and service history</li>
                  <li>Payment records and transactions</li>
                  <li>Messages and communications</li>
                </ul>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}