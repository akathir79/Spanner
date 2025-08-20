import { useState, useMemo, useEffect, useRef } from "react";
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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Copy, Square, Clock, FileText, MapPin } from "lucide-react";
// import { FaWhatsapp } from "react-icons/fa"; // Replaced with MessageCircle for consistency
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

interface Booking {
  id: string;
  clientId: string;
  workerId?: string;
  serviceType: string;
  description: string;
  status: string;
  scheduledAt?: string;
  completedAt?: string;
  amount?: number;
  location: string;
  createdAt: string;
  updatedAt?: string;
  client?: User;
  worker?: User;
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

function getBookingAge(createdDate: string): string {
  const now = new Date();
  const created = new Date(createdDate);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    const hours = Math.ceil(diffTime / (1000 * 60 * 60));
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''} ago`;
  }
}

function getBookingStatus(booking: Booking) {
  switch (booking.status) {
    case "pending":
      return {
        label: "Pending",
        variant: "outline" as const,
        icon: <Clock className="w-3 h-3" />,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      };
    case "accepted":
      return {
        label: "Accepted",
        variant: "default" as const,
        icon: <CheckCircle className="w-3 h-3" />,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      };
    case "in_progress":
      return {
        label: "In Progress",
        variant: "default" as const,
        icon: <Clock className="w-3 h-3" />,
        className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
      };
    case "completed":
      return {
        label: "Completed",
        variant: "default" as const,
        icon: <CheckCircle className="w-3 h-3" />,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      };
    case "cancelled":
      return {
        label: "Cancelled",
        variant: "destructive" as const,
        icon: <XCircle className="w-3 h-3" />,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      };
    default:
      return {
        label: "Unknown",
        variant: "secondary" as const,
        icon: <AlertCircle className="w-3 h-3" />,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
      };
  }
}

function getBookingStatusCategory(booking: Booking): string {
  return booking.status;
}

export default function BookingManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Current view state
  const [view, setView] = useState<"total" | "districts" | "district">("total");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "id" | "service" | "client" | "worker" | "location">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "in_progress" | "completed" | "cancelled">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [districtCurrentPage, setDistrictCurrentPage] = useState(1);
  const [districtTotalPages, setDistrictTotalPages] = useState(1);
  const pageSize = 50;
  const districtPageSize = 50;

  // Modal states
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [userToMessage, setUserToMessage] = useState<User | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Animation refs
  const totalBookingButtonRef = useRef<HTMLButtonElement>(null);

  // Data fetching
  const { data: bookings = [], isLoading: bookingsLoading, error: bookingsError } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  // Type the financialStatements as an array to fix TypeScript errors
  const typedFinancialStatements = ([] as any[]) || [];

  // Memoize filtered bookings to prevent recalculation on every render
  const allBookings = useMemo(() => {
    return (bookings as Booking[]);
  }, [bookings]);

  // Filtered bookings (without pagination)
  const filteredBookings = useMemo(() => {
    let filtered = allBookings;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply search filter
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase().trim();
    return filtered.filter(booking => {
      switch (searchFilter) {
        case "id":
          return booking.id.toLowerCase().includes(query);
        case "service":
          return booking.serviceType.toLowerCase().includes(query);
        case "client":
          return booking.client ? 
            `${booking.client.firstName} ${booking.client.lastName}`.toLowerCase().includes(query) : false;
        case "worker":
          return booking.worker ? 
            `${booking.worker.firstName} ${booking.worker.lastName}`.toLowerCase().includes(query) : false;
        case "location":
          return booking.location?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            booking.id.toLowerCase().includes(query) ||
            booking.serviceType.toLowerCase().includes(query) ||
            booking.description.toLowerCase().includes(query) ||
            (booking.location?.toLowerCase().includes(query)) ||
            (booking.client && `${booking.client.firstName} ${booking.client.lastName}`.toLowerCase().includes(query)) ||
            (booking.worker && `${booking.worker.firstName} ${booking.worker.lastName}`.toLowerCase().includes(query))
          );
      }
    });
  }, [allBookings, searchQuery, searchFilter, statusFilter]);

  // Paginated bookings for current view
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredBookings.slice(startIndex, endIndex);
    
    // Update total pages
    const calculatedTotalPages = Math.ceil(filteredBookings.length / pageSize);
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredBookings, currentPage, pageSize, totalPages]);

  // Roll-in animation effect on component load
  useEffect(() => {
    const button = totalBookingButtonRef.current;
    if (button) {
      button.classList.add('animate-roll-in');
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        button.classList.remove('animate-roll-in');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Get states from JSON file
  const states = Object.keys(statesDistrictsData.states).sort();

  // Get districts for selected state from JSON file  
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as any)[selectedState]?.districts || []
    : [];

  // Filtered district bookings (without pagination)
  const filteredDistrictBookings = useMemo(() => {
    if (!selectedDistrict) return [];
    
    let districtBookings = allBookings.filter((booking: Booking) => booking.location?.includes(selectedDistrict));
    
    // Apply status filter
    if (statusFilter !== "all") {
      districtBookings = districtBookings.filter(booking => booking.status === statusFilter);
    }
    
    // Apply search filter
    if (!searchQuery.trim()) return districtBookings;

    const query = searchQuery.toLowerCase().trim();
    return districtBookings.filter(booking => {
      switch (searchFilter) {
        case "id":
          return booking.id.toLowerCase().includes(query);
        case "service":
          return booking.serviceType.toLowerCase().includes(query);
        case "client":
          return booking.client ? 
            `${booking.client.firstName} ${booking.client.lastName}`.toLowerCase().includes(query) : false;
        case "worker":
          return booking.worker ? 
            `${booking.worker.firstName} ${booking.worker.lastName}`.toLowerCase().includes(query) : false;
        case "location":
          return booking.location?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            booking.id.toLowerCase().includes(query) ||
            booking.serviceType.toLowerCase().includes(query) ||
            booking.description.toLowerCase().includes(query) ||
            (booking.location?.toLowerCase().includes(query)) ||
            (booking.client && `${booking.client.firstName} ${booking.client.lastName}`.toLowerCase().includes(query)) ||
            (booking.worker && `${booking.worker.firstName} ${booking.worker.lastName}`.toLowerCase().includes(query))
          );
      }
    });
  }, [allBookings, selectedDistrict, searchQuery, searchFilter, statusFilter]);

  // Paginated district bookings
  const districtBookings = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * districtPageSize;
    const endIndex = startIndex + districtPageSize;
    const paginated = filteredDistrictBookings.slice(startIndex, endIndex);
    
    // Update total pages for district view
    const calculatedTotalPages = Math.ceil(filteredDistrictBookings.length / districtPageSize);
    if (calculatedTotalPages !== districtTotalPages) {
      setDistrictTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredDistrictBookings, districtCurrentPage, districtPageSize, districtTotalPages]);

  // Navigation handlers
  const handleTotalBookingsClick = () => {
    setView("total");
    setSelectedState(null);
    setSelectedDistrict(null);
    setSearchQuery("");
    setSearchFilter("all");
    setCurrentPage(1);
  };

  const handleStateClick = async (state: string) => {
    setLoadingState(state);
    // Simulate loading delay for better UX
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
      setView("district");
      setLoadingState(null);
      setDistrictCurrentPage(1);
    }, 200);
  };

  const handleBackClick = () => {
    if (view === "district") {
      setView("districts");
      setSelectedDistrict(null);
    } else if (view === "districts") {
      setView("total");
      setSelectedState(null);
    }
  };

  const getBookingCountForState = (state: string): number => {
    return allBookings.filter((booking: Booking) => booking.location?.includes(state)).length;
  };

  const getBookingCountForDistrict = (district: string): number => {
    return allBookings.filter((booking: Booking) => booking.location?.includes(district)).length;
  };

  // Action handlers
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDetailsOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    // Implement edit functionality
    toast({
      title: "Edit Booking",
      description: `Edit functionality for booking ${booking.id} will be implemented.`,
    });
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      await apiRequest(`/api/admin/bookings/${bookingToDelete.id}`, {
        method: "DELETE"
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/bookings"]
      });
      
      toast({
        title: "Booking Deleted",
        description: `Booking ${bookingToDelete.id} has been successfully deleted.`,
      });
      
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = (user: User) => {
    setUserToMessage(user);
    setMessageText("");
    setIsMessageDialogOpen(true);
  };

  const sendMessage = async () => {
    if (!userToMessage || !messageText.trim()) return;
    
    setSendingMessage(true);
    
    try {
      await apiRequest("/api/admin/send-message", {
        method: "POST",
        body: JSON.stringify({
          userId: userToMessage.id,
          message: messageText.trim()
        })
      });
      
      toast({
        title: "Message Sent",
        description: `Message sent successfully to ${userToMessage.firstName} ${userToMessage.lastName}.`,
      });
      
      setIsMessageDialogOpen(false);
      setUserToMessage(null);
      setMessageText("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleContactClient = (booking: Booking) => {
    if (booking.client?.mobile) {
      window.open(`tel:${booking.client.mobile}`, '_blank');
    } else {
      toast({
        title: "No Phone Number",
        description: "This client doesn't have a phone number registered.",
        variant: "destructive"
      });
    }
  };

  const handleContactWorker = (booking: Booking) => {
    if (booking.worker?.mobile) {
      window.open(`tel:${booking.worker.mobile}`, '_blank');
    } else {
      toast({
        title: "No Worker Assigned",
        description: "No worker has been assigned to this booking yet.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
      });
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDistrictPageChange = (page: number) => {
    setDistrictCurrentPage(page);
  };

  if (bookingsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load booking data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
        {/* Fixed Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-16 left-0 right-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <Button 
                variant="outline" 
                onClick={() => setLocation("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>

              {/* Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex items-center justify-center w-8 h-8"
              >
                <Menu className="w-4 h-4" />
              </Button>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)] mt-20">
          {/* Left Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden relative z-10`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              {/* Total Bookings List Header */}
              <button
                ref={totalBookingButtonRef}
                onClick={(e) => {
                  const button = e.currentTarget;
                  button.classList.add('animate-roll-click');
                  setTimeout(() => {
                    button.classList.remove('animate-roll-click');
                  }, 300);
                  handleTotalBookingsClick();
                }}
                onMouseEnter={(e) => {
                  const button = e.currentTarget;
                  if (!button.classList.contains('animate-roll-hover')) {
                    button.classList.add('animate-roll-hover');
                  }
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget;
                  button.classList.remove('animate-roll-hover');
                }}
                className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center font-medium border transition-all duration-300 relative transform-gpu ${
                  view === "total" 
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300' 
                    : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="pr-8">Total Bookings</span>
                <Badge 
                  variant="secondary" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-orange-500 text-white hover:bg-orange-600"
                >
                  {filteredBookings.length}
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
                          {getBookingCountForState(state)}
                        </Badge>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto relative z-0">
            {/* Loading State */}
            {bookingsLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading booking data...</p>
                </div>
              </div>
            )}

            {/* Total Bookings List View */}
            {!bookingsLoading && view === "total" && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  {/* Header with inline search */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        All Service Bookings
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Complete booking database • {filteredBookings.length} total bookings • Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredBookings.length)} of {filteredBookings.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls - moved inline */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search bookings..."
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
                          <SelectItem value="id">Booking ID</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {paginatedBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <FileText className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No bookings found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Service bookings will appear here</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[190px]">
                              <div className="flex items-center gap-2">
                                <span>User</span>
                                <Select value={statusFilter} onValueChange={(value) => {
                                  setStatusFilter(value as any);
                                  setCurrentPage(1); // Reset to first page when filtering
                                }}>
                                  <SelectTrigger className="w-8 h-8 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded">
                                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableHead>
                            <TableHead className="w-[140px]">Location</TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Bookings/Earnings</span>
                                <div className="flex gap-1">
                                  <FileText className="w-3 h-3 text-gray-400" />
                                  <DollarSign className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Contact</span>
                                <div className="flex gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <MessageSquare className="w-3 h-3 text-gray-400" />
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <Send className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedBookings.map((booking) => {
                            const bookingStatus = getBookingStatus(booking);
                            
                            return (
                              <TableRow key={booking.id}>
                                {/* User Info */}
                                <TableCell>
                                  <div className="flex items-start gap-3">
                                    {booking.client ? (
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage 
                                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${booking.client.firstName}%20${booking.client.lastName}`} 
                                          alt={`${booking.client.firstName} ${booking.client.lastName}`} 
                                        />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                          {booking.client.firstName?.charAt(0).toUpperCase()}{booking.client.lastName?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <div className="h-10 w-10 flex-shrink-0 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'No Client'}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          Client
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-orange-800 dark:text-orange-400 font-mono font-bold truncate">
                                        #{booking.id.slice(-8)}
                                      </div>
                                      <div className="mt-1 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge 
                                            variant={bookingStatus.variant}
                                            className={bookingStatus.className}
                                          >
                                            {bookingStatus.icon}
                                            <span className="ml-1">{bookingStatus.label}</span>
                                          </Badge>
                                          {booking.worker && (
                                            <Badge variant="secondary" className="text-xs">
                                              Worker: {booking.worker.firstName} {booking.worker.lastName}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Created: {getBookingAge(booking.createdAt)} ago
                                        </div>
                                        {booking.scheduledAt && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Scheduled: {formatIndianDateTime(booking.scheduledAt)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Location */}
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {booking.location || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Address: {booking.location || "Not provided"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    State: Not specified
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    PIN: Not provided
                                  </div>
                                </TableCell>

                                {/* Bookings/Earnings */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Service: </span>
                                      <span className="font-medium">{booking.serviceType}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Status: {bookingStatus.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Duration: {getBookingAge(booking.createdAt)}
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Amount: </span>
                                      <span className="font-medium">
                                        {booking.amount ? `₹${booking.amount}` : "TBD"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Payment: {booking.completedAt ? "Completed" : "Pending"}
                                    </div>
                                    {booking.description && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        Notes: {booking.description}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-1">
                                      <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Booking
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Contact */}
                                <TableCell>
                                  <div className="space-y-1">
                                    {booking.client ? (
                                      <>
                                        <div className="flex items-center gap-1 text-sm">
                                          <Phone className="w-3 h-3" />
                                          <span className="font-mono">{booking.client.mobile}</span>
                                        </div>
                                        {booking.client.email && (
                                          <div className="flex items-center gap-1 text-xs truncate">
                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{booking.client.email}</span>
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Client: {booking.client.firstName} {booking.client.lastName}
                                        </div>
                                        {booking.worker && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Worker: {booking.worker.firstName} {booking.worker.lastName}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-400 italic">No contact info</div>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                      <Phone className="w-3 h-3 text-blue-600 cursor-pointer" />
                                      <MessageSquare className="w-3 h-3 text-green-600 cursor-pointer" />
                                      <Mail className="w-3 h-3 text-gray-600 cursor-pointer" />
                                      <Send className="w-3 h-3 text-purple-600 cursor-pointer" />
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Bank Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-400 italic">Transaction details</span>
                                    </div>
                                    {booking.amount && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Amount: ₹{booking.amount}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Payment: {booking.completedAt ? "Complete" : "Pending"}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Booking
                                      </DropdownMenuItem>
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Contact
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {booking.client && (
                                            <DropdownMenuItem onClick={() => handleContactClient(booking)}>
                                              <Phone className="w-4 h-4 mr-2" />
                                              Call Client
                                            </DropdownMenuItem>
                                          )}
                                          {booking.worker && (
                                            <DropdownMenuItem onClick={() => handleContactWorker(booking)}>
                                              <Phone className="w-4 h-4 mr-2" />
                                              Call Worker
                                            </DropdownMenuItem>
                                          )}
                                          {booking.client && (
                                            <DropdownMenuItem onClick={() => handleSendMessage(booking.client!)}>
                                              <Send className="w-4 h-4 mr-2" />
                                              Message Client
                                            </DropdownMenuItem>
                                          )}
                                          {booking.worker && (
                                            <DropdownMenuItem onClick={() => handleSendMessage(booking.worker!)}>
                                              <Send className="w-4 h-4 mr-2" />
                                              Message Worker
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteBooking(booking)}
                                        className="text-red-600 dark:text-red-400"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Booking
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredBookings.length)} of {filteredBookings.length} bookings
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Districts View */}
            {!bookingsLoading && view === "districts" && selectedState && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="sm" onClick={handleBackClick}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to All States
                    </Button>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {selectedState} Districts
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse bookings by district in {selectedState}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {districtsForState.map((district) => (
                      <Card 
                        key={district} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleDistrictClick(district)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{district}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {getBookingCountForDistrict(district)} bookings
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {getBookingCountForDistrict(district)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* District Bookings View */}
            {!bookingsLoading && view === "district" && selectedDistrict && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="sm" onClick={handleBackClick}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to {selectedState} Districts
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        Bookings in {selectedDistrict}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedState} • {filteredDistrictBookings.length} bookings • Showing {((districtCurrentPage - 1) * districtPageSize) + 1}-{Math.min(districtCurrentPage * districtPageSize, filteredDistrictBookings.length)} of {filteredDistrictBookings.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search bookings..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setDistrictCurrentPage(1);
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
                          <SelectItem value="id">Booking ID</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="worker">Worker</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {districtBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <FileText className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No bookings found in {selectedDistrict}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Bookings from this district will appear here</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[190px]">
                              <div className="flex items-center gap-2">
                                <span>User</span>
                                <Select value={statusFilter} onValueChange={(value) => {
                                  setStatusFilter(value as any);
                                  setDistrictCurrentPage(1);
                                }}>
                                  <SelectTrigger className="w-8 h-8 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded">
                                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableHead>
                            <TableHead className="w-[140px]">Location</TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Bookings/Earnings</span>
                                <div className="flex gap-1">
                                  <FileText className="w-3 h-3 text-gray-400" />
                                  <DollarSign className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Contact</span>
                                <div className="flex gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <MessageSquare className="w-3 h-3 text-gray-400" />
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <Send className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {districtBookings.map((booking) => {
                            const bookingStatus = getBookingStatus(booking);
                            
                            return (
                              <TableRow key={booking.id}>
                                {/* User Info */}
                                <TableCell>
                                  <div className="flex items-start gap-3">
                                    {booking.client ? (
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage 
                                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${booking.client.firstName}%20${booking.client.lastName}`} 
                                          alt={`${booking.client.firstName} ${booking.client.lastName}`} 
                                        />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                          {booking.client.firstName?.charAt(0).toUpperCase()}{booking.client.lastName?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <div className="h-10 w-10 flex-shrink-0 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'No Client'}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          Client
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-orange-800 dark:text-orange-400 font-mono font-bold truncate">
                                        #{booking.id.slice(-8)}
                                      </div>
                                      <div className="mt-1 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge 
                                            variant={bookingStatus.variant}
                                            className={bookingStatus.className}
                                          >
                                            {bookingStatus.icon}
                                            <span className="ml-1">{bookingStatus.label}</span>
                                          </Badge>
                                          {booking.worker && (
                                            <Badge variant="secondary" className="text-xs">
                                              Worker: {booking.worker.firstName} {booking.worker.lastName}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Created: {getBookingAge(booking.createdAt)} ago
                                        </div>
                                        {booking.scheduledAt && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Scheduled: {formatIndianDateTime(booking.scheduledAt)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Location */}
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {booking.location || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Address: {booking.location || "Not provided"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    State: Not specified
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    PIN: Not provided
                                  </div>
                                </TableCell>

                                {/* Bookings/Earnings */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Service: </span>
                                      <span className="font-medium">{booking.serviceType}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Status: {bookingStatus.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Duration: {getBookingAge(booking.createdAt)}
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Amount: </span>
                                      <span className="font-medium">
                                        {booking.amount ? `₹${booking.amount}` : "TBD"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Payment: {booking.completedAt ? "Completed" : "Pending"}
                                    </div>
                                    {booking.description && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        Notes: {booking.description}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-1">
                                      <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Booking
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Contact */}
                                <TableCell>
                                  <div className="space-y-1">
                                    {booking.client ? (
                                      <>
                                        <div className="flex items-center gap-1 text-sm">
                                          <Phone className="w-3 h-3" />
                                          <span className="font-mono">{booking.client.mobile}</span>
                                        </div>
                                        {booking.client.email && (
                                          <div className="flex items-center gap-1 text-xs truncate">
                                            <Mail className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{booking.client.email}</span>
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Client: {booking.client.firstName} {booking.client.lastName}
                                        </div>
                                        {booking.worker && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Worker: {booking.worker.firstName} {booking.worker.lastName}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-400 italic">No contact info</div>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                      <Phone className="w-3 h-3 text-blue-600 cursor-pointer" />
                                      <MessageSquare className="w-3 h-3 text-green-600 cursor-pointer" />
                                      <Mail className="w-3 h-3 text-gray-600 cursor-pointer" />
                                      <Send className="w-3 h-3 text-purple-600 cursor-pointer" />
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Bank Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-400 italic">Transaction details</span>
                                    </div>
                                    {booking.amount && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Amount: ₹{booking.amount}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Payment: {booking.completedAt ? "Complete" : "Pending"}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleViewDetails(booking)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Booking
                                      </DropdownMenuItem>
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Contact
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {booking.client && (
                                            <DropdownMenuItem onClick={() => handleContactClient(booking)}>
                                              <Phone className="w-4 h-4 mr-2" />
                                              Call Client
                                            </DropdownMenuItem>
                                          )}
                                          {booking.worker && (
                                            <DropdownMenuItem onClick={() => handleContactWorker(booking)}>
                                              <Phone className="w-4 h-4 mr-2" />
                                              Call Worker
                                            </DropdownMenuItem>
                                          )}
                                          {booking.client && (
                                            <DropdownMenuItem onClick={() => handleSendMessage(booking.client!)}>
                                              <Send className="w-4 h-4 mr-2" />
                                              Message Client
                                            </DropdownMenuItem>
                                          )}
                                          {booking.worker && (
                                            <DropdownMenuItem onClick={() => handleSendMessage(booking.worker!)}>
                                              <Send className="w-4 h-4 mr-2" />
                                              Message Worker
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteBooking(booking)}
                                        className="text-red-600 dark:text-red-400"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Booking
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

                  {/* District Pagination */}
                  {districtTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((districtCurrentPage - 1) * districtPageSize) + 1} to {Math.min(districtCurrentPage * districtPageSize, filteredDistrictBookings.length)} of {filteredDistrictBookings.length} bookings in {selectedDistrict}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={districtCurrentPage === 1}
                          onClick={() => handleDistrictPageChange(districtCurrentPage - 1)}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: Math.min(5, districtTotalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={districtCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleDistrictPageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={districtCurrentPage === districtTotalPages}
                          onClick={() => handleDistrictPageChange(districtCurrentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information for booking #{selectedBooking?.id.slice(-8)}
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Booking ID</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">#{selectedBooking.id.slice(-8)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Service Type</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.serviceType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="outline" className={getBookingStatus(selectedBooking).className}>
                      {getBookingStatus(selectedBooking).icon}
                      <span className="ml-1">{getBookingStatus(selectedBooking).label}</span>
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedBooking.amount ? `₹${selectedBooking.amount}` : "To be determined"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.location}</p>
                </div>
                
                {selectedBooking.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBooking.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatIndianDateTime(selectedBooking.createdAt)}
                    </p>
                  </div>
                  {selectedBooking.scheduledAt && (
                    <div>
                      <Label className="text-sm font-medium">Scheduled</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatIndianDateTime(selectedBooking.scheduledAt)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedBooking.completedAt && (
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatIndianDateTime(selectedBooking.completedAt)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete booking #{bookingToDelete?.id.slice(-8)}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteBooking}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {userToMessage?.firstName} {userToMessage?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={sendMessage} 
                disabled={!messageText.trim() || sendingMessage}
              >
                {sendingMessage ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}