import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import ViewDetailsModal from "@/components/ViewDetailsModal";
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
  updatedAt?: string;
  lastLoginAt?: string;
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

// Helper functions for date formatting and activity status
function formatIndianDateTime(dateString: string | Date): string {
  if (!dateString) return "Not available";
  try {
    // Parse the UTC date string or Date object
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Use Intl.DateTimeFormat to properly convert to IST timezone
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return istFormatter.format(date) + " IST";
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid date";
  }
}

function getActivityStatus(lastLoginAt?: string, createdAt?: string) {
  if (!lastLoginAt) {
    // Check if user was created recently (within 24 hours)
    if (createdAt) {
      const created = new Date(createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return {
          label: "Just Registered",
          variant: "secondary" as const,
          icon: <AlertCircle className="w-3 h-3" />,
        };
      }
    }
    return {
      label: "No Login",
      variant: "secondary" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
    };
  }

  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin > 15) {
    return {
      label: "Inactive",
      variant: "destructive" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
  }

  return {
    label: "Active",
    variant: "default" as const,
    icon: <CheckCircle className="w-3 h-3" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  };
}

export default function ClientManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"total" | "states" | "districts" | "clients">("states");
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "id" | "name" | "email" | "mobile" | "location">("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  
  // Modal states
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageText, setMessageText] = useState("");


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
  const allClients = (users as User[]).filter((u: User) => u.role === "client");

  // Search filter function
  const filterClients = (clientList: User[]) => {
    if (!searchQuery.trim()) return clientList;

    const query = searchQuery.toLowerCase().trim();
    return clientList.filter(client => {
      switch (searchFilter) {
        case "id":
          return client.id.toLowerCase().includes(query);
        case "name":
          return `${client.firstName} ${client.lastName}`.toLowerCase().includes(query);
        case "email":
          return client.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return client.mobile.includes(query);
        case "location":
          return client.district?.toLowerCase().includes(query) || 
                 client.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            client.id.toLowerCase().includes(query) ||
            `${client.firstName} ${client.lastName}`.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.mobile.includes(query) ||
            client.district?.toLowerCase().includes(query) ||
            client.state?.toLowerCase().includes(query)
          );
      }
    });
  };

  // Apply search filter to clients
  const clients = filterClients(allClients);

  // Get states from JSON file
  const states = (statesDistrictsData.states as StateData[]).map(s => s.state).sort();

  // Get districts for selected state from JSON file
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as StateData[]).find(s => s.state === selectedState)?.districts || []
    : [];

  // Get clients for selected district (with search applied)
  const clientsForDistrict = selectedDistrict 
    ? filterClients(allClients.filter((client: User) => client.district === selectedDistrict))
    : [];

  // Get client count for each state from database (using allClients, not filtered)
  const getClientCountForState = (stateName: string) => {
    return allClients.filter((client: User) => client.state === stateName).length;
  };

  // Get client count for each district from database (using allClients, not filtered)
  const getClientCountForDistrict = (districtName: string) => {
    return allClients.filter((client: User) => client.district === districtName).length;
  };

  // Mutations for client actions
  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PUT", `/api/admin/verify-user/${userId}`);
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
      return await apiRequest("PUT", `/api/admin/suspend-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User suspended successfully",
      });
    },
    onError: (error: any) => {
      console.error("Suspend user error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to suspend user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/delete-user/${userId}`);
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
      return await apiRequest("POST", "/api/admin/send-message", { userId, message });
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

  const handleSendDirectMessage = (client: User) => {
    setSelectedClient(client);
    setShowMessageDialog(true);
  };

  const handleSendSMS = (client: User) => {
    // Handle SMS functionality
    toast({
      title: "SMS Feature",
      description: `SMS will be sent to ${client.firstName} ${client.lastName} (${client.mobile})`,
    });
  };

  const handleSendWhatsApp = (client: User) => {
    // Handle WhatsApp functionality - open WhatsApp with phone number
    const phoneNumber = client.mobile.replace(/\D/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
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
  const handleTotalClientsClick = async () => {
    setLoadingState("total");
    setTimeout(() => {
      setView("total");
      setSelectedState(null);
      setSelectedDistrict(null);
      setLoadingState(null);
    }, 200);
  };

  const handleStateClick = async (state: string) => {
    setLoadingState(state);
    setTimeout(() => {
      setSelectedState(state);
      setSelectedDistrict(null);
      setView("districts");
      setLoadingState(null);
    }, 200);
  };

  const handleDistrictClick = async (district: string) => {
    setLoadingState(district);
    setTimeout(() => {
      setSelectedDistrict(district);
      setView("clients");
      setLoadingState(null);
    }, 200);
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center justify-center w-8 h-8"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)] mt-20">
        
        {/* Left Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {/* Total Client List Header */}
            <button
              onClick={handleTotalClientsClick}
              disabled={loadingState === "total"}
              className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center font-medium border transition-colors relative ${
                view === "total" 
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300' 
                  : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              } ${loadingState === "total" ? 'opacity-75' : ''}`}
            >
              {loadingState === "total" ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <>
                  <span className="pr-8">Total Client List</span>
                  <Badge 
                    variant="secondary" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-purple-500 text-white hover:bg-purple-600"
                  >
                    {clients.length}
                  </Badge>
                </>
              )}
            </button>
          </div>
          
          {/* Scrollable States List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-1">
              {states.map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateClick(state)}
                  disabled={loadingState === state}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    selectedState === state
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${loadingState === state ? 'opacity-75' : ''}`}
                >
                  {loadingState === state ? (
                    <div className="flex items-center">
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <span className="pr-8">{state}</span>
                      <Badge 
                        variant="secondary" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-blue-500 text-white hover:bg-blue-600"
                      >
                        {getClientCountForState(state)}
                      </Badge>
                    </>
                  )}
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
                {/* Header with inline search */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      All Registered Clients
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete client database • {clients.length} total clients {searchQuery && `• ${clients.length} filtered results`}
                    </p>
                  </div>
                  
                  {/* Search Controls - moved inline */}
                  <div className="flex gap-3 items-center ml-6">
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-8"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Select value={searchFilter} onValueChange={(value) => setSearchFilter(value as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                          <TableHead className="w-[140px]">User</TableHead>
                          <TableHead className="w-[70px]">Role</TableHead>
                          <TableHead className="w-[140px]">Location</TableHead>
                          <TableHead className="w-[140px]">Bookings/Earnings</TableHead>
                          <TableHead className="w-[140px]">Contact</TableHead>
                          <TableHead className="w-[90px]">Status</TableHead>
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
                                <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold">
                                  ID: {client.id}
                                </div>
                                <div className="mt-1 space-y-1">
                                  <Badge 
                                    variant={activityStatus.variant}
                                    className={activityStatus.className}
                                  >
                                    {activityStatus.icon}
                                    <span className="ml-1">{activityStatus.label}</span>
                                  </Badge>
                                  {client.lastLoginAt ? (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Last: {formatIndianDateTime(client.lastLoginAt)}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                      Never logged in
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Reg: {formatIndianDateTime(client.createdAt)}
                                  </div>
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
                                <div>Balance: ₹0</div>
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
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuItem onClick={() => handleSendDirectMessage(client)}>
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Message
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendSMS(client)}>
                                        <Smartphone className="w-4 h-4 mr-2" />
                                        SMS
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendWhatsApp(client)}>
                                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                                        <span className="text-green-600">WhatsApp</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {districtsForState.map((district) => (
                    <Button
                      key={district}
                      variant="outline"
                      onClick={() => handleDistrictClick(district)}
                      disabled={loadingState === district}
                      className={`h-12 justify-start font-medium hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 relative pr-10 ${
                        loadingState === district ? 'opacity-75' : ''
                      }`}
                    >
                      {loadingState === district ? (
                        <div className="flex items-center">
                          <Loader2 className="w-3 h-3 animate-spin mr-2" />
                          <span className="truncate">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <span className="truncate">{district}</span>
                          <Badge 
                            variant="secondary" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600"
                          >
                            {getClientCountForDistrict(district)}
                          </Badge>
                        </>
                      )}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      Clients in {selectedDistrict}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedState} • {clientsForDistrict.length} clients found {searchQuery && `• ${clientsForDistrict.length} filtered results`}
                    </p>
                  </div>
                  
                  {/* Search Controls for District View */}
                  <div className="flex gap-3 items-center ml-6">
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search in this district..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-8"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Select value={searchFilter} onValueChange={(value) => setSearchFilter(value as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                      </SelectContent>
                    </Select>
                    
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
                          <TableHead className="w-[140px]">User</TableHead>
                          <TableHead className="w-[70px]">Role</TableHead>
                          <TableHead className="w-[140px]">Location</TableHead>
                          <TableHead className="w-[140px]">Bookings/Earnings</TableHead>
                          <TableHead className="w-[140px]">Contact</TableHead>
                          <TableHead className="w-[90px]">Status</TableHead>
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
                                  <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold">
                                    ID: {client.id}
                                  </div>
                                  <div className="mt-1 space-y-1">
                                    <Badge 
                                      variant={activityStatus.variant}
                                      className={activityStatus.className}
                                    >
                                      {activityStatus.icon}
                                      <span className="ml-1">{activityStatus.label}</span>
                                    </Badge>
                                    {client.lastLoginAt ? (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Last: {formatIndianDateTime(client.lastLoginAt)}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        Never logged in
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Reg: {formatIndianDateTime(client.createdAt)}
                                    </div>
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
                                  <div>Balance: ₹0</div>
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
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Send Message
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => handleSendDirectMessage(client)}>
                                          <MessageCircle className="w-4 h-4 mr-2" />
                                          Message
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendSMS(client)}>
                                          <Smartphone className="w-4 h-4 mr-2" />
                                          SMS
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendWhatsApp(client)}>
                                          <Phone className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">WhatsApp</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
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
            src: undefined, // profilePicture field not available in User interface
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
            
            // Address Information
            { key: "address", label: "Full Address", type: "textarea", editable: true, section: "address" },
            { key: "state", label: "State", type: "text", editable: true, section: "address" },
            { key: "district", label: "District", type: "text", editable: true, section: "address" },
            { key: "pincode", label: "Pincode", type: "text", editable: true, section: "address" },
            
            // Bank Details (Now editable with IFSC API functionality)
            { key: "bankAccountHolderName", label: "Account Holder Name", type: "text", editable: true, required: true, section: "bankDetails" },
            { key: "bankAccountNumber", label: "Account Number", type: "text", editable: true, required: true, section: "bankDetails" },
            { key: "bankIFSC", label: "IFSC Code", type: "ifsc", editable: true, required: true, section: "bankDetails" },
            { key: "bankName", label: "Bank Name", type: "text", editable: true, section: "bankDetails" },
            { key: "bankBranch", label: "Branch Name", type: "text", editable: true, section: "bankDetails" },
            { key: "bankAddress", label: "Bank Address", type: "textarea", editable: true, section: "bankDetails" },
            { key: "bankMICR", label: "MICR Code", type: "text", editable: true, section: "bankDetails" },
            { 
              key: "bankAccountType", 
              label: "Account Type", 
              type: "select", 
              editable: true, 
              section: "bankDetails",
              options: [
                { value: "savings", label: "Savings" },
                { value: "current", label: "Current" }
              ]
            },
            
            // Status Information
            { key: "isVerified", label: "Verification Status", type: "badge", section: "status" },
            { key: "isActive", label: "Account Status", type: "display", section: "status" },
            { key: "createdAt", label: "Member Since", type: "display", section: "status", value: formatIndianDateTime(selectedClient.createdAt) },
            { key: "updatedAt", label: "Last Updated", type: "display", section: "status", value: selectedClient.updatedAt ? formatIndianDateTime(selectedClient.updatedAt) : "Not available" },
            { key: "lastLoginAt", label: "Last Login", type: "display", section: "status", value: selectedClient.lastLoginAt ? formatIndianDateTime(selectedClient.lastLoginAt) : "Never logged in" },
          ]}
          actions={[
            {
              label: "Send Message",
              icon: MessageSquare,
              onClick: () => {
                setShowDetailsDialog(false);
                handleSendMessage(selectedClient);
              }
            },
            {
              label: "Verify User",
              icon: CheckCircle,
              onClick: () => {
                setShowDetailsDialog(false);
                handleVerifyUser(selectedClient);
              }
            },
            {
              label: "Suspend User",
              variant: "destructive",
              icon: XCircle,
              onClick: () => {
                setShowDetailsDialog(false);
                handleSuspendUser(selectedClient);
              }
            },
            {
              label: "Delete User",
              variant: "destructive",
              icon: Trash2,
              onClick: () => {
                setShowDetailsDialog(false);
                handleDeleteUser(selectedClient);
              }
            }
          ]}
          updateApiEndpoint={`/api/admin/users/${selectedClient.id}`}
          queryKeyToInvalidate={["/api/admin/users"]}
        />
      )}

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
