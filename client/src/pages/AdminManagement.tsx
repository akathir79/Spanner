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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Copy, Square, Shield, Crown } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BiMessageSquareDetail } from "react-icons/bi";
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
          label: "Just Created",
          variant: "outline" as const,
          icon: <Calendar className="w-3 h-3" />,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        };
      }
    }
    return {
      label: "Never Logged In",
      variant: "secondary" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
    };
  }

  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin === 0) {
    return {
      label: "Active Today",
      variant: "default" as const,
      icon: <CheckCircle className="w-3 h-3" />,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    };
  } else if (daysSinceLogin <= 7) {
    return {
      label: "Active",
      variant: "default" as const,
      icon: <CheckCircle className="w-3 h-3" />,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    };
  } else if (daysSinceLogin <= 30) {
    return {
      label: "Less Active",
      variant: "outline" as const,
      icon: <Calendar className="w-3 h-3" />,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
    };
  } else {
    return {
      label: "Inactive",
      variant: "destructive" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
  }
}

function getUserStatusCategory(user: User): string {
  if (!user.lastLoginAt) {
    if (user.createdAt) {
      const created = new Date(user.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return "just_registered";
      }
    }
    return "no_login";
  }

  const lastLogin = new Date(user.lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin <= 30) {
    return "active";
  } else {
    return "inactive";
  }
}

export default function AdminManagement() {
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
  const [searchFilter, setSearchFilter] = useState<"all" | "id" | "name" | "email" | "mobile" | "location">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "no_login" | "just_registered" | "verified" | "unverified">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [districtCurrentPage, setDistrictCurrentPage] = useState(1);
  const [districtTotalPages, setDistrictTotalPages] = useState(1);
  const pageSize = 50;
  const districtPageSize = 50;

  // Modal states
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [userToMessage, setUserToMessage] = useState<User | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Animation refs
  const totalAdminButtonRef = useRef<HTMLButtonElement>(null);

  // Data fetching
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/admins"],
  });

  // Type the financialStatements as an array to fix TypeScript errors
  const typedFinancialStatements = ([] as any[]) || [];

  // Memoize filtered admins to prevent recalculation on every render
  const allAdmins = useMemo(() => {
    return (users as User[]).filter((u: User) => u.role === "admin" || u.role === "super_admin");
  }, [users]);

  // Filtered admins (without pagination)
  const filteredAdmins = useMemo(() => {
    let filtered = allAdmins;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(admin => {
        const userStatus = getUserStatusCategory(admin);
        
        switch (statusFilter) {
          case "active":
            return userStatus === "active";
          case "inactive":
            return userStatus === "inactive";
          case "no_login":
            return userStatus === "no_login";
          case "just_registered":
            return userStatus === "just_registered";
          case "verified":
            return admin.isVerified === true;
          case "unverified":
            return admin.isVerified === false;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase().trim();
    return filtered.filter(admin => {
      switch (searchFilter) {
        case "id":
          return admin.id.toLowerCase().includes(query);
        case "name":
          return `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(query);
        case "email":
          return admin.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return admin.mobile.includes(query);
        case "location":
          return admin.district?.toLowerCase().includes(query) || 
                 admin.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            admin.id.toLowerCase().includes(query) ||
            `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(query) ||
            admin.email?.toLowerCase().includes(query) ||
            admin.mobile.includes(query) ||
            admin.district?.toLowerCase().includes(query) ||
            admin.state?.toLowerCase().includes(query)
          );
      }
    });
  }, [allAdmins, searchQuery, searchFilter, statusFilter]);

  // Paginated admins for current view
  const admins = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredAdmins.slice(startIndex, endIndex);
    
    // Update total pages
    const calculatedTotalPages = Math.ceil(filteredAdmins.length / pageSize);
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredAdmins, currentPage, pageSize, totalPages]);

  // Roll-in animation effect on component load
  useEffect(() => {
    const button = totalAdminButtonRef.current;
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
  const states = (statesDistrictsData.states as StateData[]).map(s => s.state).sort();

  // Get districts for selected state from JSON file
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as StateData[]).find(s => s.state === selectedState)?.districts || []
    : [];

  // Filtered district admins (without pagination)
  const filteredDistrictAdmins = useMemo(() => {
    if (!selectedDistrict) return [];
    
    let districtAdmins = allAdmins.filter((admin: User) => admin.district === selectedDistrict);
    
    // Apply status filter
    if (statusFilter !== "all") {
      districtAdmins = districtAdmins.filter(admin => {
        const userStatus = getUserStatusCategory(admin);
        
        switch (statusFilter) {
          case "active":
            return userStatus === "active";
          case "inactive":
            return userStatus === "inactive";
          case "no_login":
            return userStatus === "no_login";
          case "just_registered":
            return userStatus === "just_registered";
          case "verified":
            return admin.isVerified === true;
          case "unverified":
            return admin.isVerified === false;
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if (!searchQuery.trim()) return districtAdmins;

    const query = searchQuery.toLowerCase().trim();
    return districtAdmins.filter(admin => {
      switch (searchFilter) {
        case "id":
          return admin.id.toLowerCase().includes(query);
        case "name":
          return `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(query);
        case "email":
          return admin.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return admin.mobile.includes(query);
        case "location":
          return admin.district?.toLowerCase().includes(query) || 
                 admin.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            admin.id.toLowerCase().includes(query) ||
            `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(query) ||
            admin.email?.toLowerCase().includes(query) ||
            admin.mobile.includes(query) ||
            admin.district?.toLowerCase().includes(query) ||
            admin.state?.toLowerCase().includes(query)
          );
      }
    });
  }, [allAdmins, selectedDistrict, searchQuery, searchFilter, statusFilter]);

  // Paginated district admins
  const districtAdmins = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * districtPageSize;
    const endIndex = startIndex + districtPageSize;
    const paginated = filteredDistrictAdmins.slice(startIndex, endIndex);
    
    // Update total pages for district view
    const calculatedTotalPages = Math.ceil(filteredDistrictAdmins.length / districtPageSize);
    if (calculatedTotalPages !== districtTotalPages) {
      setDistrictTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredDistrictAdmins, districtCurrentPage, districtPageSize, districtTotalPages]);

  // Navigation handlers
  const handleTotalAdminsClick = () => {
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

  const getAdminCountForState = (state: string): number => {
    return allAdmins.filter((admin: User) => admin.state === state).length;
  };

  const getAdminCountForDistrict = (district: string): number => {
    return allAdmins.filter((admin: User) => admin.district === district).length;
  };

  // Action handlers
  const handleViewDetails = (admin: User) => {
    setSelectedUser(admin);
    setIsViewDetailsOpen(true);
  };

  const handleEditUser = (admin: User) => {
    // Implement edit functionality
    toast({
      title: "Edit Admin",
      description: `Edit functionality for ${admin.firstName} ${admin.lastName} will be implemented.`,
    });
  };

  const handleDeleteUser = (admin: User) => {
    setUserToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/delete-user/${userToDelete.id}`);
      
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/admins"]
      });
      
      toast({
        title: "Admin Deleted",
        description: `${userToDelete.firstName} ${userToDelete.lastName} has been successfully deleted.`,
      });
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete admin. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = (admin: User) => {
    setUserToMessage(admin);
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

  const handleCallAdmin = (admin: User) => {
    if (admin.mobile) {
      window.open(`tel:${admin.mobile}`, '_blank');
    } else {
      toast({
        title: "No Phone Number",
        description: "This admin doesn't have a phone number registered.",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppAdmin = (admin: User) => {
    if (admin.mobile) {
      // Remove any non-digit characters from mobile number
      const phoneNumber = admin.mobile.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast({
        title: "No Phone Number",
        description: "This admin doesn't have a phone number registered.",
        variant: "destructive"
      });
    }
  };

  const handleSendSMS = (admin: User) => {
    // Handle SMS functionality
    toast({
      title: "SMS Feature",
      description: `SMS will be sent to ${admin.firstName} ${admin.lastName} (${admin.mobile})`,
    });
  };

  const handleVerifyUser = (admin: User) => {
    // Handle user verification
    toast({
      title: "Verify User",
      description: `Verification status updated for ${admin.firstName} ${admin.lastName}`,
    });
  };

  const handleSuspendUser = (admin: User) => {
    // Handle user suspension
    toast({
      title: "Suspend User",
      description: `${admin.firstName} ${admin.lastName} has been suspended`,
    });
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

  if (usersError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load admin data. Please try refreshing the page.
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)] mt-20">
          {/* Left Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden relative z-10`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              {/* Total Admin List Header */}
              <button
                ref={totalAdminButtonRef}
                onClick={(e) => {
                  const button = e.currentTarget;
                  button.classList.add('animate-roll-click');
                  setTimeout(() => {
                    button.classList.remove('animate-roll-click');
                  }, 300);
                  handleTotalAdminsClick();
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
                <span className="pr-8">Total Admin List</span>
                <Badge 
                  variant="secondary" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-purple-500 text-white hover:bg-purple-600"
                >
                  {filteredAdmins.length}
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
                          {getAdminCountForState(state)}
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
            {usersLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading admin data...</p>
                </div>
              </div>
            )}

            {/* Total Admin List View */}
            {!usersLoading && view === "total" && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  {/* Header with inline search */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        All Platform Administrators
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Complete administrator database • {filteredAdmins.length} total admins • Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredAdmins.length)} of {filteredAdmins.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls - moved inline */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search admins..."
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
                          <SelectItem value="id">Admin ID</SelectItem>
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
                  {admins.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Shield className="w-12 h-12" />
                          <Crown className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No administrators found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Administrator accounts will appear here</p>
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
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="no_login">Never Logged In</SelectItem>
                                    <SelectItem value="just_registered">Just Created</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableHead>
                            <TableHead className="w-[140px]">
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                  <span>Location</span>
                                  <Copy className="w-3 h-3 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click to copy location info</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Management</span>
                                <div className="flex gap-1">
                                  <Shield className="w-3 h-3 text-gray-400" />
                                  <Crown className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Contact</span>
                                <div className="flex gap-1">
                                  <FaWhatsapp className="w-4 h-4 text-green-500" />
                                  <MessageSquare className="w-4 h-4 text-blue-500" />
                                  <Mail className="w-4 h-4 text-red-500" />
                                  <BiMessageSquareDetail className="w-4 h-4 text-purple-500" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {admins.map((admin) => {
                            const activityStatus = getActivityStatus(admin.lastLoginAt, admin.createdAt);
                            
                            return (
                              <TableRow key={admin.id}>
                                {/* User Info */}
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-start gap-3 cursor-pointer">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarImage 
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${admin.firstName}%20${admin.lastName}`} 
                                            alt={`${admin.firstName} ${admin.lastName}`} 
                                          />
                                          <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                                            {admin.firstName?.charAt(0).toUpperCase()}{admin.lastName?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                              {admin.firstName} {admin.lastName}
                                            </div>
                                            {admin.role === "super_admin" && (
                                              <Crown className="w-4 h-4 text-yellow-500" title="Super Admin" />
                                            )}
                                            {admin.role === "admin" && (
                                              <Shield className="w-4 h-4 text-blue-500" title="Admin" />
                                            )}
                                          </div>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                                                ID: {admin.id}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="font-mono">{admin.id}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <div className="mt-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Badge 
                                                variant={activityStatus.variant}
                                                className={activityStatus.className}
                                              >
                                                {activityStatus.icon}
                                                <span className="ml-1">{activityStatus.label}</span>
                                              </Badge>
                                              <Badge 
                                                variant={admin.isVerified ? "default" : "secondary"}
                                                className={
                                                  admin.isVerified 
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                                }
                                              >
                                                {admin.isVerified ? "Verified" : "Unverified"}
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              Created: {getMemberSince(admin.createdAt)} ago
                                            </div>
                                            {admin.lastLoginAt && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Last login: {formatIndianDateTime(admin.lastLoginAt)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-left">
                                        <p className="font-semibold">{admin.firstName} {admin.lastName}</p>
                                        <p className="text-sm">ID: {admin.id}</p>
                                        <p className="text-sm">Role: {admin.role === "super_admin" ? "Super Admin" : "Admin"}</p>
                                        <p className="text-sm">Status: {activityStatus.label}</p>
                                        <p className="text-sm">Verification: {admin.isVerified ? "Verified" : "Unverified"}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>

                                {/* Location */}
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {admin.district || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Address: Not provided
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {admin.state || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    PIN: Not provided
                                  </div>
                                </TableCell>

                                {/* Management */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Role: </span>
                                      <span className="font-medium">
                                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Users managed: 0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Approvals: 0
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Permissions: </span>
                                      <span className="font-medium">
                                        {admin.role === "super_admin" ? "Full" : "Limited"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Actions taken: 0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Reports generated: 0
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {admin.role === "super_admin" ? (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                          <Crown className="w-3 h-3 mr-1" />
                                          Super Admin
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                          <Shield className="w-3 h-3 mr-1" />
                                          Admin
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Contact */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Phone className="w-3 h-3" />
                                      <span className="font-mono">{admin.mobile}</span>
                                    </div>
                                    {admin.email && (
                                      <div className="flex items-center gap-1 text-xs truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{admin.email}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                      <FaWhatsapp className="w-4 h-4 text-green-600 cursor-pointer" onClick={() => handleWhatsAppAdmin(admin)} />
                                      <MessageSquare className="w-4 h-4 text-blue-600 cursor-pointer" onClick={() => handleCallAdmin(admin)} />
                                      <Mail className="w-4 h-4 text-red-600 cursor-pointer" onClick={() => copyToClipboard(admin.email || '', "Email")} />
                                      <BiMessageSquareDetail className="w-4 h-4 text-purple-600 cursor-pointer" onClick={() => handleSendMessage(admin)} />
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Bank Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-400 italic">Not provided</span>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleViewDetails(admin)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Send Message
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => handleWhatsAppAdmin(admin)}>
                                            <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                                            <span className="text-green-600">WhatsApp</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleSendSMS(admin)}>
                                            <Square className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-blue-600">SMS</span>
                                          </DropdownMenuItem>
                                          {admin.email && (
                                            <DropdownMenuItem onClick={() => window.location.href = `mailto:${admin.email}`}>
                                              <Mail className="w-4 h-4 mr-2 text-red-600" />
                                              <span className="text-red-600">Email</span>
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => handleSendMessage(admin)}>
                                            <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                            <span className="text-purple-600">Message</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuItem onClick={() => handleVerifyUser(admin)}>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        <span className="text-green-600">Verify User</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSuspendUser(admin)}>
                                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                        <span className="text-red-600">Suspend User</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteUser(admin)}>
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAdmins.length)} of {filteredAdmins.length} admins
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
            {!usersLoading && view === "districts" && selectedState && (
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
                    Browse administrators by district in {selectedState}
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
                                {getAdminCountForDistrict(district)} administrators
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {getAdminCountForDistrict(district)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* District Admins View */}
            {!usersLoading && view === "district" && selectedDistrict && (
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
                        Administrators in {selectedDistrict}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedState} • {filteredDistrictAdmins.length} administrators • Showing {((districtCurrentPage - 1) * districtPageSize) + 1}-{Math.min(districtCurrentPage * districtPageSize, filteredDistrictAdmins.length)} of {filteredDistrictAdmins.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search admins..."
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
                          <SelectItem value="id">Admin ID</SelectItem>
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
                  {districtAdmins.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Shield className="w-12 h-12" />
                          <Crown className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No administrators found in {selectedDistrict}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Administrator accounts from this district will appear here</p>
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
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="no_login">Never Logged In</SelectItem>
                                    <SelectItem value="just_registered">Just Created</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableHead>
                            <TableHead className="w-[140px]">
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                  <span>Location</span>
                                  <Copy className="w-3 h-3 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click to copy location info</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Management</span>
                                <div className="flex gap-1">
                                  <Shield className="w-3 h-3 text-gray-400" />
                                  <Crown className="w-3 h-3 text-gray-400" />
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
                          {districtAdmins.map((admin) => {
                            const activityStatus = getActivityStatus(admin.lastLoginAt, admin.createdAt);
                            
                            return (
                              <TableRow key={admin.id}>
                                {/* User Info */}
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-start gap-3 cursor-pointer">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarImage 
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${admin.firstName}%20${admin.lastName}`} 
                                            alt={`${admin.firstName} ${admin.lastName}`} 
                                          />
                                          <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                                            {admin.firstName?.charAt(0).toUpperCase()}{admin.lastName?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                              {admin.firstName} {admin.lastName}
                                            </div>
                                            {admin.role === "super_admin" && (
                                              <Crown className="w-4 h-4 text-yellow-500" title="Super Admin" />
                                            )}
                                            {admin.role === "admin" && (
                                              <Shield className="w-4 h-4 text-blue-500" title="Admin" />
                                            )}
                                          </div>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                                                ID: {admin.id}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="font-mono">{admin.id}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          <div className="mt-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <Badge 
                                                variant={activityStatus.variant}
                                                className={activityStatus.className}
                                              >
                                                {activityStatus.icon}
                                                <span className="ml-1">{activityStatus.label}</span>
                                              </Badge>
                                              <Badge 
                                                variant={admin.isVerified ? "default" : "secondary"}
                                                className={
                                                  admin.isVerified 
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                                }
                                              >
                                                {admin.isVerified ? "Verified" : "Unverified"}
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              Created: {getMemberSince(admin.createdAt)} ago
                                            </div>
                                            {admin.lastLoginAt && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Last login: {formatIndianDateTime(admin.lastLoginAt)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-left">
                                        <p className="font-semibold">{admin.firstName} {admin.lastName}</p>
                                        <p className="text-sm">ID: {admin.id}</p>
                                        <p className="text-sm">Role: {admin.role === "super_admin" ? "Super Admin" : "Admin"}</p>
                                        <p className="text-sm">Status: {activityStatus.label}</p>
                                        <p className="text-sm">Verification: {admin.isVerified ? "Verified" : "Unverified"}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>

                                {/* Location */}
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {admin.district || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Address: Not provided
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {admin.state || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    PIN: Not provided
                                  </div>
                                </TableCell>

                                {/* Management */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Role: </span>
                                      <span className="font-medium">
                                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Users managed: 0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Approvals: 0
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Permissions: </span>
                                      <span className="font-medium">
                                        {admin.role === "super_admin" ? "Full" : "Limited"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Actions taken: 0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Reports generated: 0
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {admin.role === "super_admin" ? (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                          <Crown className="w-3 h-3 mr-1" />
                                          Super Admin
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                          <Shield className="w-3 h-3 mr-1" />
                                          Admin
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Contact */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Phone className="w-3 h-3" />
                                      <span className="font-mono">{admin.mobile}</span>
                                    </div>
                                    {admin.email && (
                                      <div className="flex items-center gap-1 text-xs truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{admin.email}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                      <FaWhatsapp className="w-4 h-4 text-green-600 cursor-pointer" onClick={() => handleWhatsAppAdmin(admin)} />
                                      <MessageSquare className="w-4 h-4 text-blue-600 cursor-pointer" onClick={() => handleCallAdmin(admin)} />
                                      <Mail className="w-4 h-4 text-red-600 cursor-pointer" onClick={() => copyToClipboard(admin.email || '', "Email")} />
                                      <BiMessageSquareDetail className="w-4 h-4 text-purple-600 cursor-pointer" onClick={() => handleSendMessage(admin)} />
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Bank Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="text-gray-400 italic">Not provided</span>
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
                                      <DropdownMenuItem onClick={() => handleViewDetails(admin)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Send Message
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => handleWhatsAppAdmin(admin)}>
                                            <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                                            <span className="text-green-600">WhatsApp</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleSendSMS(admin)}>
                                            <Square className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-blue-600">SMS</span>
                                          </DropdownMenuItem>
                                          {admin.email && (
                                            <DropdownMenuItem onClick={() => window.location.href = `mailto:${admin.email}`}>
                                              <Mail className="w-4 h-4 mr-2 text-red-600" />
                                              <span className="text-red-600">Email</span>
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={() => handleSendMessage(admin)}>
                                            <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                            <span className="text-purple-600">Message</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuItem onClick={() => handleVerifyUser(admin)}>
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                        <span className="text-green-600">Verify User</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSuspendUser(admin)}>
                                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                        <span className="text-red-600">Suspend User</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteUser(admin)}>
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

                  {/* District Pagination */}
                  {districtTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((districtCurrentPage - 1) * districtPageSize) + 1} to {Math.min(districtCurrentPage * districtPageSize, filteredDistrictAdmins.length)} of {filteredDistrictAdmins.length} admins in {selectedDistrict}
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
        {selectedUser && (
          <ViewDetailsModal
            isOpen={isViewDetailsOpen}
            onClose={() => setIsViewDetailsOpen(false)}
            title="Administrator Details"
            subtitle="Complete administrator registration information"
            data={selectedUser}
            avatar={{
              src: undefined,
              fallback: `${selectedUser.firstName?.charAt(0)}${selectedUser.lastName?.charAt(0)}`
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
              
              // Verification Status
              { key: "isVerified", label: "Verification Status", type: "badge", section: "status" },
            ]}
          />
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this user? This action cannot be undone and will remove:
              </AlertDialogDescription>
            </AlertDialogHeader>
            {userToDelete && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">User Information:</h4>
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                    <li>{userToDelete.firstName} {userToDelete.lastName}</li>
                    <li>{userToDelete.mobile}</li>
                    {userToDelete.email && <li>{userToDelete.email}</li>}
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
              >
                Delete Permanently
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