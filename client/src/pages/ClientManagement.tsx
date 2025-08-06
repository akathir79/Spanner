import { useState, useMemo } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft } from "lucide-react";
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

function getMemberSince(registrationDate: string): string {
  const now = new Date();
  const regDate = new Date(registrationDate);
  const diffTime = Math.abs(now.getTime() - regDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
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
  
  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "id" | "name" | "email" | "mobile" | "location">("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  
  // Pagination states for handling large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Start with 50 records per page
  const [totalPages, setTotalPages] = useState(1);
  
  // District-specific pagination states
  const [districtCurrentPage, setDistrictCurrentPage] = useState(1);
  const [districtPageSize, setDistrictPageSize] = useState(50);
  const [districtTotalPages, setDistrictTotalPages] = useState(1);
  
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

  // Memoize filtered clients to prevent recalculation on every render
  const allClients = useMemo(() => {
    return (users as User[]).filter((u: User) => u.role === "client");
  }, [users]);

  // Filtered clients (without pagination)
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return allClients;

    const query = searchQuery.toLowerCase().trim();
    return allClients.filter(client => {
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
  }, [allClients, searchQuery, searchFilter]);

  // Paginated clients for current view
  const clients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredClients.slice(startIndex, endIndex);
    
    // Update total pages
    const calculatedTotalPages = Math.ceil(filteredClients.length / pageSize);
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredClients, currentPage, pageSize, totalPages]);

  // Get states from JSON file
  const states = (statesDistrictsData.states as StateData[]).map(s => s.state).sort();

  // Get districts for selected state from JSON file
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as StateData[]).find(s => s.state === selectedState)?.districts || []
    : [];

  // Filtered district clients (without pagination)
  const filteredDistrictClients = useMemo(() => {
    if (!selectedDistrict) return [];
    
    const districtClients = allClients.filter((client: User) => client.district === selectedDistrict);
    
    if (!searchQuery.trim()) return districtClients;

    const query = searchQuery.toLowerCase().trim();
    return districtClients.filter(client => {
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
  }, [allClients, selectedDistrict, searchQuery, searchFilter]);

  // Paginated district clients for current view
  const clientsForDistrict = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * districtPageSize;
    const endIndex = startIndex + districtPageSize;
    const paginated = filteredDistrictClients.slice(startIndex, endIndex);
    
    // Update total pages
    const calculatedTotalPages = Math.ceil(filteredDistrictClients.length / districtPageSize);
    if (calculatedTotalPages !== districtTotalPages) {
      setDistrictTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredDistrictClients, districtCurrentPage, districtPageSize, districtTotalPages]);

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

  // Handle navigation - direct approach with pagination reset
  const handleTotalClientsClick = () => {
    // Direct state updates without delays or promises
    setView("total");
    setSelectedState(null);
    setSelectedDistrict(null);
    setSearchQuery("");
    setSearchFilter("all");
    setCurrentPage(1); // Reset to first page
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
      setDistrictCurrentPage(1); // Reset district pagination
      setSearchQuery(""); // Clear search
      setSearchFilter("all");
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
    <TooltipProvider>
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
              className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center font-medium border transition-colors relative ${
                view === "total" 
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300' 
                  : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="pr-8">Total Client List</span>
              <Badge 
                variant="secondary" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-purple-500 text-white hover:bg-purple-600"
              >
                {filteredClients.length}
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
                      Complete client database • {filteredClients.length} total clients • Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredClients.length)} of {filteredClients.length} {searchQuery && `filtered results`}
                    </p>
                  </div>
                  
                  {/* Search Controls - moved inline */}
                  <div className="flex gap-3 items-center ml-6">
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1); // Reset to first page when searching
                        }}
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
                          <TableHead className="w-[130px]">Bank Details</TableHead>
                          <TableHead className="w-[90px]">Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => {
                          const activityStatus = getActivityStatus(client.lastLoginAt, client.createdAt);
                          return (
                            <TableRow key={client.id}>
                              <TableCell className="py-2">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-xs text-green-800 dark:text-green-400 font-mono font-bold">
                                  ID: {client.id}
                                </div>
                                <Badge 
                                  variant={activityStatus.variant}
                                  className={`${activityStatus.className} text-xs px-1.5 py-0.5`}
                                >
                                  {activityStatus.icon}
                                  <span className="ml-1">{activityStatus.label}</span>
                                </Badge>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Last: {client.lastLoginAt ? formatIndianDateTime(client.lastLoginAt) : 'Never'}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                  Reg: {formatIndianDateTime(client.createdAt)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-1">
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm space-y-1 cursor-pointer">
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
                                    {(client as any).address && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <div className="font-medium text-gray-700 dark:text-gray-300">Address:</div>
                                        <div className="break-words line-clamp-2">{(client as any).address}</div>
                                        {(client as any).pincode && (
                                          <div>PIN: {(client as any).pincode}</div>
                                        )}
                                        <div className="flex items-center gap-1 mt-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://wa.me/91${client.mobile}`, '_blank');
                                            }}
                                            title="WhatsApp"
                                          >
                                            <MessageCircle className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `sms:+91${client.mobile}`;
                                            }}
                                            title="SMS"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                          </Button>
                                          {client.email && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `mailto:${client.email}`;
                                              }}
                                              title="Email"
                                            >
                                              <Mail className="w-3 h-3" />
                                            </Button>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Handle internal messaging system
                                            }}
                                            title="Send Message"
                                          >
                                            <Send className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `tel:+91${client.mobile}`;
                                            }}
                                            title="Call Phone"
                                          >
                                            <Phone className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-medium">Complete Contact Information:</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" />
                                        <span>{client.mobile}</span>
                                      </div>
                                      {client.email && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-3 h-3" />
                                          <span>{client.email}</span>
                                        </div>
                                      )}
                                      {(client as any).address && (
                                        <div className="mt-2">
                                          <p className="font-medium text-xs">Complete Address:</p>
                                          <p className="text-xs mt-1">{(client as any).address}</p>
                                          {(client as any).pincode && (
                                            <p className="text-xs">PIN: {(client as any).pincode}</p>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/91${client.mobile}`, '_blank');
                                          }}
                                          title="WhatsApp"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `sms:+91${client.mobile}`;
                                          }}
                                          title="SMS"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                        </Button>
                                        {client.email && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `mailto:${client.email}`;
                                            }}
                                            title="Email"
                                          >
                                            <Mail className="w-3 h-3" />
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle internal messaging system
                                          }}
                                          title="Send Message"
                                        >
                                          <Send className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:+91${client.mobile}`;
                                          }}
                                          title="Call Phone"
                                        >
                                          <Phone className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm space-y-1 cursor-pointer">
                                    {(client as any).bankAccountNumber && (client as any).bankIFSC ? (
                                      <>
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                          <CreditCard className="w-3 h-3" />
                                          <span className="font-mono text-xs">{(client as any).bankAccountNumber.slice(-4)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          IFSC: {(client as any).bankIFSC}
                                        </div>
                                        {(client as any).bankMICR && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            MICR: {(client as any).bankMICR}
                                          </div>
                                        )}
                                        {(client as any).bankName && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {(client as any).bankName}
                                          </div>
                                        )}
                                        {(client as any).bankAddress && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {(client as any).bankAddress}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 mt-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Handle money transfer functionality
                                              console.log('Transfer money to:', client.firstName, client.lastName);
                                            }}
                                            title="Transfer Money"
                                          >
                                            <ArrowRightLeft className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                                        Not provided
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  {(client as any).bankAccountNumber && (client as any).bankIFSC ? (
                                    <div className="space-y-2">
                                      <p className="font-medium">Complete Bank Details:</p>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                          <CreditCard className="w-3 h-3" />
                                          <span>Account: {(client as any).bankAccountNumber}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">IFSC:</span> {(client as any).bankIFSC}
                                        </div>
                                        {(client as any).bankMICR && (
                                          <div>
                                            <span className="font-medium">MICR:</span> {(client as any).bankMICR}
                                          </div>
                                        )}
                                        {(client as any).bankName && (
                                          <div>
                                            <span className="font-medium">Bank Name:</span> {(client as any).bankName}
                                          </div>
                                        )}
                                        {(client as any).bankAddress && (
                                          <div>
                                            <span className="font-medium">Bank Address:</span> {(client as any).bankAddress}
                                          </div>
                                        )}
                                        {(client as any).bankAccountHolderName && (
                                          <div>
                                            <span className="font-medium">Account Holder:</span> {(client as any).bankAccountHolderName}
                                          </div>
                                        )}
                                        {(client as any).bankAccountType && (
                                          <div>
                                            <span className="font-medium">Account Type:</span> {(client as any).bankAccountType}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <p>No bank details provided</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
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
                
                {/* Pagination Controls */}
                {filteredClients.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Show:</span>
                        <Select value={pageSize.toString()} onValueChange={(value) => {
                          setPageSize(parseInt(value));
                          setCurrentPage(1); // Reset to first page when changing page size
                        }}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>per page</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {/* Show page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>
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
                      {selectedState} • {filteredDistrictClients.length} total clients • Showing {((districtCurrentPage - 1) * districtPageSize) + 1}-{Math.min(districtCurrentPage * districtPageSize, filteredDistrictClients.length)} of {filteredDistrictClients.length} {searchQuery && `filtered results`}
                    </p>
                  </div>
                  
                  {/* Search Controls for District View */}
                  <div className="flex gap-3 items-center ml-6">
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search in this district..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setDistrictCurrentPage(1); // Reset to first page when searching
                        }}
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
                          <TableHead className="w-[130px]">Bank Details</TableHead>
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
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                                        ID: {client.id}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-mono">{client.id}</p>
                                    </TooltipContent>
                                  </Tooltip>
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
                                    <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                      Member since {getMemberSince(client.createdAt)}
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
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm space-y-1 cursor-pointer">
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
                                      {(client as any).address && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          <div className="font-medium text-gray-700 dark:text-gray-300">Address:</div>
                                          <div className="break-words line-clamp-2">{(client as any).address}</div>
                                          {(client as any).pincode && (
                                            <div>PIN: {(client as any).pincode}</div>
                                          )}
                                          <div className="flex items-center gap-1 mt-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://wa.me/91${client.mobile}`, '_blank');
                                              }}
                                              title="WhatsApp"
                                            >
                                              <MessageCircle className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `sms:+91${client.mobile}`;
                                              }}
                                              title="SMS"
                                            >
                                              <MessageSquare className="w-3 h-3" />
                                            </Button>
                                            {client.email && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.location.href = `mailto:${client.email}`;
                                                }}
                                                title="Email"
                                              >
                                                <Mail className="w-3 h-3" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle internal messaging system
                                              }}
                                              title="Send Message"
                                            >
                                              <Send className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `tel:+91${client.mobile}`;
                                              }}
                                              title="Call Phone"
                                            >
                                              <Phone className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <div className="space-y-2">
                                      <p className="font-medium">Complete Contact Information:</p>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-3 h-3" />
                                          <span>{client.mobile}</span>
                                        </div>
                                        {client.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            <span>{client.email}</span>
                                          </div>
                                        )}
                                        {(client as any).address && (
                                          <div className="mt-2">
                                            <p className="font-medium text-xs">Complete Address:</p>
                                            <p className="text-xs mt-1">{(client as any).address}</p>
                                            {(client as any).pincode && (
                                              <p className="text-xs">PIN: {(client as any).pincode}</p>
                                            )}
                                            <div className="flex items-center gap-1 mt-2">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(`https://wa.me/91${client.mobile}`, '_blank');
                                                }}
                                                title="WhatsApp"
                                              >
                                                <MessageCircle className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.location.href = `sms:+91${client.mobile}`;
                                                }}
                                                title="SMS"
                                              >
                                                <MessageSquare className="w-3 h-3" />
                                              </Button>
                                              {client.email && (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `mailto:${client.email}`;
                                                  }}
                                                  title="Email"
                                                >
                                                  <Mail className="w-3 h-3" />
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Handle internal messaging system
                                                }}
                                                title="Send Message"
                                              >
                                                <Send className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.location.href = `tel:+91${client.mobile}`;
                                                }}
                                                title="Call Phone"
                                              >
                                                <Phone className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm space-y-1 cursor-pointer">
                                      {(client as any).bankAccountNumber && (client as any).bankIFSC ? (
                                        <>
                                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <CreditCard className="w-3 h-3" />
                                            <span className="font-mono text-xs">{(client as any).bankAccountNumber.slice(-4)}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            IFSC: {(client as any).bankIFSC}
                                          </div>
                                          {(client as any).bankMICR && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              MICR: {(client as any).bankMICR}
                                            </div>
                                          )}
                                          {(client as any).bankName && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                              {(client as any).bankName}
                                            </div>
                                          )}
                                          {(client as any).bankAddress && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                              {(client as any).bankAddress}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1 mt-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle money transfer functionality
                                                console.log('Transfer money to:', client.firstName, client.lastName);
                                              }}
                                              title="Transfer Money"
                                            >
                                              <ArrowRightLeft className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                                          Not provided
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    {(client as any).bankAccountNumber && (client as any).bankIFSC ? (
                                      <div className="space-y-2">
                                        <p className="font-medium">Complete Bank Details:</p>
                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" />
                                            <span>Account: {(client as any).bankAccountNumber}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">IFSC:</span> {(client as any).bankIFSC}
                                          </div>
                                          {(client as any).bankMICR && (
                                            <div>
                                              <span className="font-medium">MICR:</span> {(client as any).bankMICR}
                                            </div>
                                          )}
                                          {(client as any).bankName && (
                                            <div>
                                              <span className="font-medium">Bank Name:</span> {(client as any).bankName}
                                            </div>
                                          )}
                                          {(client as any).bankAddress && (
                                            <div>
                                              <span className="font-medium">Bank Address:</span> {(client as any).bankAddress}
                                            </div>
                                          )}
                                          {(client as any).bankAccountHolderName && (
                                            <div>
                                              <span className="font-medium">Account Holder:</span> {(client as any).bankAccountHolderName}
                                            </div>
                                          )}
                                          {(client as any).bankAccountType && (
                                            <div>
                                              <span className="font-medium">Account Type:</span> {(client as any).bankAccountType}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Handle money transfer functionality
                                              console.log('Transfer money to:', client.firstName, client.lastName);
                                            }}
                                          >
                                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                                            Transfer Money
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p>No bank details provided</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
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
                
                {/* Pagination Controls for District View */}
                {filteredDistrictClients.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Show:</span>
                        <Select value={districtPageSize.toString()} onValueChange={(value) => {
                          setDistrictPageSize(parseInt(value));
                          setDistrictCurrentPage(1); // Reset to first page when changing page size
                        }}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>per page</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(1)}
                        disabled={districtCurrentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={districtCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {/* Show page numbers */}
                        {Array.from({ length: Math.min(5, districtTotalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(districtTotalPages - 4, districtCurrentPage - 2)) + i;
                          if (pageNum > districtTotalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={districtCurrentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setDistrictCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(prev => Math.min(districtTotalPages, prev + 1))}
                        disabled={districtCurrentPage === districtTotalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(districtTotalPages)}
                        disabled={districtCurrentPage === districtTotalPages}
                      >
                        Last
                      </Button>
                    </div>
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
    </TooltipProvider>
  );
}
