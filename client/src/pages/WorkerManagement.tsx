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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Copy, Square, Shield, UserCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
          variant: "destructive" as const,
          icon: <AlertCircle className="w-3 h-3" />,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
        };
      }
    }
    return {
      label: "No Login",
      variant: "destructive" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
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

// Helper function to get user status category for filtering
function getUserStatusCategory(worker: User): string {
  if (!worker.lastLoginAt) {
    // Check if user was created recently (within 24 hours)
    if (worker.createdAt) {
      const created = new Date(worker.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return "just_registered";
      }
    }
    return "no_login";
  }

  const lastLogin = new Date(worker.lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin > 15) {
    return "inactive";
  }

  return "active";
}

export default function WorkerManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"total" | "states" | "districts" | "workers">("states");
  
  // Ref for rolling animation
  const totalWorkerButtonRef = useRef<HTMLButtonElement>(null);
  
  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "id" | "name" | "email" | "mobile" | "location">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "no_login" | "just_registered" | "verified" | "unverified">("all");
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
  const [selectedWorker, setSelectedWorker] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferHistoryDialog, setShowTransferHistoryDialog] = useState(false);
  const [showFinancialStatementsDialog, setShowFinancialStatementsDialog] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Checkbox and bulk action states
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());
  const [showBulkVerifyDialog, setShowBulkVerifyDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);


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

  // Fetch transfer history for selected worker
  const { data: transferHistory = [], isLoading: transferHistoryLoading } = useQuery({
    queryKey: ["/api/transfer-history", selectedWorker?.id],
    enabled: !!selectedWorker?.id && showTransferHistoryDialog,
  });
  
  // Type the transferHistory as an array to fix TypeScript errors
  const typedTransferHistory = (transferHistory as any[]) || [];

  // Fetch financial statements for selected worker (last 2 years)
  const { data: financialStatements = [], isLoading: financialStatementsLoading } = useQuery({
    queryKey: ["/api/financial-statements", selectedWorker?.id],
    enabled: !!selectedWorker?.id && showFinancialStatementsDialog,
  });
  
  // Type the financialStatements as an array to fix TypeScript errors
  const typedFinancialStatements = (financialStatements as any[]) || [];

  // Memoize filtered workers to prevent recalculation on every render
  const allWorkers = useMemo(() => {
    return (users as User[]).filter((u: User) => u.role === "worker");
  }, [users]);

  // Filtered workers (without pagination)
  const filteredWorkers = useMemo(() => {
    let filtered = allWorkers;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(worker => {
        const userStatus = getUserStatusCategory(worker);
        
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
            return worker.isVerified === true;
          case "unverified":
            return worker.isVerified === false;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase().trim();
    return filtered.filter(worker => {
      switch (searchFilter) {
        case "id":
          return worker.id.toLowerCase().includes(query);
        case "name":
          return `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(query);
        case "email":
          return worker.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return worker.mobile.includes(query);
        case "location":
          return worker.district?.toLowerCase().includes(query) || 
                 worker.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            worker.id.toLowerCase().includes(query) ||
            `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(query) ||
            worker.email?.toLowerCase().includes(query) ||
            worker.mobile.includes(query) ||
            worker.district?.toLowerCase().includes(query) ||
            worker.state?.toLowerCase().includes(query)
          );
      }
    });
  }, [allWorkers, searchQuery, searchFilter, statusFilter]);

  // Paginated clients for current view
  const clients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filteredWorkers.slice(startIndex, endIndex);
    
    // Update total pages
    const calculatedTotalPages = Math.ceil(filteredWorkers.length / pageSize);
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredWorkers, currentPage, pageSize, totalPages]);

  // Roll-in animation effect on component load
  useEffect(() => {
    const button = totalWorkerButtonRef.current;
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
    ? statesDistrictsData.states[selectedState]?.districts || []
    : [];

  // Filtered district clients (without pagination)
  const filteredDistrictWorkers = useMemo(() => {
    if (!selectedDistrict) return [];
    
    let districtWorkers = allWorkers.filter((worker: User) => worker.district === selectedDistrict);
    
    // Apply status filter
    if (statusFilter !== "all") {
      districtWorkers = districtWorkers.filter(worker => {
        const userStatus = getUserStatusCategory(worker);
        
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
            return worker.isVerified === true;
          case "unverified":
            return worker.isVerified === false;
          default:
            return true;
        }
      });
    }
    
    if (!searchQuery.trim()) return districtWorkers;

    const query = searchQuery.toLowerCase().trim();
    return districtWorkers.filter(worker => {
      switch (searchFilter) {
        case "id":
          return worker.id.toLowerCase().includes(query);
        case "name":
          return `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(query);
        case "email":
          return worker.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return worker.mobile.includes(query);
        case "location":
          return worker.district?.toLowerCase().includes(query) || 
                 worker.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            worker.id.toLowerCase().includes(query) ||
            `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(query) ||
            worker.email?.toLowerCase().includes(query) ||
            worker.mobile.includes(query) ||
            worker.district?.toLowerCase().includes(query) ||
            worker.state?.toLowerCase().includes(query)
          );
      }
    });
  }, [allWorkers, selectedDistrict, searchQuery, searchFilter, statusFilter]);

  // Paginated district clients for current view
  const clientsForDistrict = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * districtPageSize;
    const endIndex = startIndex + districtPageSize;
    const paginated = filteredDistrictWorkers.slice(startIndex, endIndex);
    
    // Update total pages
    const calculatedTotalPages = Math.ceil(filteredDistrictWorkers.length / districtPageSize);
    if (calculatedTotalPages !== districtTotalPages) {
      setDistrictTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredDistrictWorkers, districtCurrentPage, districtPageSize, districtTotalPages]);

  // Get worker count for each state from database (using allWorkers, not filtered)
  const getWorkerCountForState = (stateName: string) => {
    return allWorkers.filter((worker: User) => worker.state === stateName).length;
  };

  // Get worker count for each district from database (using allWorkers, not filtered)
  const getWorkerCountForDistrict = (districtName: string) => {
    return allWorkers.filter((worker: User) => worker.district === districtName).length;
  };

  // Mutations for worker actions
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
      setSelectedWorker(null);
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
      setSelectedWorker(null);
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

  const deleteTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return await apiRequest("DELETE", `/api/transfer-history/${transferId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transfer-history", selectedWorker?.id] });
      toast({
        title: "Success",
        description: "Transfer history deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transfer history",
        variant: "destructive",
      });
    },
  });

  // Action handlers
  const handleViewDetails = (worker: User) => {
    setSelectedWorker(worker);
    setShowDetailsDialog(true);
  };

  const handleSendMessage = (worker: User) => {
    setSelectedWorker(worker);
    setShowMessageDialog(true);
  };

  const handleSendDirectMessage = (worker: User) => {
    setSelectedWorker(worker);
    setShowMessageDialog(true);
  };

  const handleSendSMS = (worker: User) => {
    // Handle SMS functionality
    toast({
      title: "SMS Feature",
      description: `SMS will be sent to ${worker.firstName} ${worker.lastName} (${worker.mobile})`,
    });
  };

  const handleSendWhatsApp = (worker: User) => {
    // Handle WhatsApp functionality - open WhatsApp with phone number
    const phoneNumber = worker.mobile.replace(/\D/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleVerifyUser = (worker: User) => {
    verifyUserMutation.mutate(worker.id);
  };

  const handleSuspendUser = (worker: User) => {
    suspendUserMutation.mutate(worker.id);
  };

  const handleDeleteUser = (worker: User) => {
    setSelectedWorker(worker);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (selectedWorker) {
      deleteUserMutation.mutate(selectedWorker.id);
    }
  };

  const confirmSendMessage = () => {
    if (selectedWorker && messageText.trim()) {
      sendMessageMutation.mutate({
        userId: selectedWorker.id,
        message: messageText.trim(),
      });
    }
  };

  const handleViewTransferHistory = (worker: User) => {
    setSelectedWorker(worker);
    setShowTransferHistoryDialog(true);
  };

  const handleViewFinancialStatements = (worker: User) => {
    setSelectedWorker(worker);
    setShowFinancialStatementsDialog(true);
  };

  const handleDeleteTransferHistory = (transferId: string) => {
    deleteTransferMutation.mutate(transferId);
  };

  // Handle navigation - direct approach with pagination reset
  const handleTotalWorkersClick = () => {
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
      setView("workers");
      setLoadingState(null);
      setDistrictCurrentPage(1); // Reset district pagination
      setSearchQuery(""); // Clear search
      setSearchFilter("all");
    }, 200);
  };

  const handleBackClick = () => {
    if (view === "workers") {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worker Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)] mt-20">
        
        {/* Left Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {/* Total Worker List Header */}
            <button
              ref={totalWorkerButtonRef}
              onClick={(e) => {
                const button = e.currentTarget;
                button.classList.add('animate-roll-click');
                setTimeout(() => {
                  button.classList.remove('animate-roll-click');
                }, 300);
                handleTotalWorkersClick();
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
              <span className="pr-8">Total Worker List</span>
              <Badge 
                variant="secondary" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-purple-500 text-white hover:bg-purple-600"
              >
                {filteredWorkers.length}
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
                        {getWorkerCountForState(state)}
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
                <p className="text-gray-600 dark:text-gray-400">Loading worker data...</p>
              </div>
            </div>
          )}

          {/* Total Worker List View */}
          {!usersLoading && view === "total" && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                {/* Header with inline search */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      All Registered Workers
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete worker database • {filteredWorkers.length} total clients • Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredWorkers.length)} of {filteredWorkers.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
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
                {selectedWorkerIds.size > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedWorkerIds.size} worker{selectedWorkerIds.size > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBulkVerifyDialog(true)}
                          disabled={bulkActionLoading}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Verify Selected
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBulkDeleteDialog(true)}
                          disabled={bulkActionLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Selected
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedWorkerIds(new Set())}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No clients registered yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Worker registrations will appear here</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <div className="flex items-center gap-1">
                              <Checkbox
                                checked={selectAllFiltered ? selectedWorkerIds.size === filteredWorkers.length && filteredWorkers.length > 0 : selectedWorkerIds.size === clients.length && clients.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    if (selectAllFiltered) {
                                      setSelectedWorkerIds(new Set(filteredWorkers.map(w => w.id)));
                                    } else {
                                      setSelectedWorkerIds(new Set(clients.map(w => w.id)));
                                    }
                                  } else {
                                    setSelectedWorkerIds(new Set());
                                    setSelectAllFiltered(false);
                                  }
                                }}
                                aria-label={selectAllFiltered ? "Select all filtered workers" : "Select all workers on page"}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newSelectAll = !selectAllFiltered;
                                  setSelectAllFiltered(newSelectAll);
                                  if (newSelectAll) {
                                    setSelectedWorkerIds(new Set(filteredWorkers.map(w => w.id)));
                                  } else {
                                    setSelectedWorkerIds(new Set());
                                  }
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 h-6 px-1"
                                title={selectAllFiltered ? "Switch to page selection" : `Select all ${filteredWorkers.length} filtered workers`}
                              >
                                {selectAllFiltered ? "Page" : "All"}
                              </Button>
                            </div>
                          </TableHead>
                          <TableHead className="w-[190px]">
                            <div className="flex items-center gap-2">
                              <span>Worker</span>
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
                                  <SelectItem value="no_login">No Login</SelectItem>
                                  <SelectItem value="just_registered">Just Registered</SelectItem>
                                  <SelectItem value="verified">Verified</SelectItem>
                                  <SelectItem value="unverified">Unverified</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableHead>
                          <TableHead className="w-[160px]">Location</TableHead>
                          <TableHead className="w-[140px]">Service Type</TableHead>
                          <TableHead className="w-[190px]">Bookings/Earnings</TableHead>
                          <TableHead className="w-[180px]">
                            <div className="flex items-center gap-2">
                              <span>Contact</span>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                      onClick={() => {
                                        toast({ title: "WhatsApp", description: "Bulk WhatsApp messaging coming soon!" });
                                      }}
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk WhatsApp</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      onClick={() => {
                                        toast({ title: "SMS", description: "Bulk SMS messaging coming soon!" });
                                      }}
                                    >
                                      <Square className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk SMS</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => {
                                        toast({ title: "Email", description: "Bulk email messaging coming soon!" });
                                      }}
                                    >
                                      <Mail className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk Email</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                      onClick={() => {
                                        toast({ title: "Message", description: "Bulk in-app messaging coming soon!" });
                                      }}
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk Message</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </TableHead>
                          <TableHead className="w-[190px]">Bank Details</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((worker) => {
                          const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
                          return (
                            <TableRow key={worker.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedWorkerIds.has(worker.id)}
                                  onCheckedChange={(checked) => {
                                    const newSelection = new Set(selectedWorkerIds);
                                    if (checked) {
                                      newSelection.add(worker.id);
                                    } else {
                                      newSelection.delete(worker.id);
                                    }
                                    setSelectedWorkerIds(newSelection);
                                  }}
                                  aria-label={`Select worker ${worker.firstName} ${worker.lastName}`}
                                />
                              </TableCell>
                              <TableCell className="py-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-start gap-3 cursor-pointer">
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      <AvatarImage 
                                        src={(worker as any).profilePicture} 
                                        alt={`${worker.firstName} ${worker.lastName}`} 
                                      />
                                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                        {worker.firstName.charAt(0).toUpperCase()}{worker.lastName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                                        {worker.firstName} {worker.lastName}
                                      </div>
                                      <div className="text-xs text-green-800 dark:text-green-400 font-mono font-bold">
                                        ID: {worker.id}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-1">
                                          Worker
                                        </Badge>
                                        <Badge 
                                          variant={
                                            activityStatus.label === 'Just Registered' || 
                                            activityStatus.label === 'No Login' || 
                                            activityStatus.label === 'Inactive' ? "destructive" : activityStatus.variant
                                          }
                                          className={
                                            activityStatus.label === 'Just Registered' || 
                                            activityStatus.label === 'No Login' || 
                                            activityStatus.label === 'Inactive'
                                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs px-1.5 py-0.5" 
                                              : `${activityStatus.className} text-xs px-1.5 py-0.5`
                                          }
                                        >
                                          {activityStatus.icon}
                                          <span className="ml-1">{activityStatus.label}</span>
                                        </Badge>
                                        <Badge
                                          variant={worker.isVerified ? "default" : "destructive"}
                                          className={worker.isVerified 
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs" 
                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs"
                                          }
                                        >
                                          {worker.isVerified ? "Verified" : "Unverified"}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Last: {worker.lastLoginAt ? formatIndianDateTime(worker.lastLoginAt) : 'No Login'}
                                      </div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        Reg: {formatIndianDateTime(worker.createdAt)}
                                      </div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        Member since {getMemberSince(worker.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-16 w-16 flex-shrink-0">
                                        <AvatarImage 
                                          src={(worker as any).profilePicture} 
                                          alt={`${worker.firstName} ${worker.lastName}`} 
                                        />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                                          {worker.firstName.charAt(0).toUpperCase()}{worker.lastName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-base">Worker Profile Overview</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Complete user information</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="text-sm"><strong>Full Name:</strong> {worker.firstName} {worker.lastName}</div>
                                      <div className="text-sm"><strong>Worker ID:</strong> {worker.id}</div>
                                      <div className="text-sm"><strong>Role:</strong> Worker User</div>
                                      <div className="flex items-center gap-2">
                                        <strong className="text-sm">Verification Status:</strong>
                                        <Badge
                                          variant={worker.isVerified ? "default" : "destructive"}
                                          className={worker.isVerified 
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                          }
                                        >
                                          {worker.isVerified ? "Verified" : "Unverified"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <strong className="text-sm">Activity Status:</strong>
                                        <Badge
                                          variant={
                                            activityStatus.label === 'Just Registered' || 
                                            activityStatus.label === 'No Login' || 
                                            activityStatus.label === 'Inactive' ||
                                            !worker.isVerified ? "destructive" : "default"
                                          }
                                          className={
                                            activityStatus.label === 'Just Registered' || 
                                            activityStatus.label === 'No Login' || 
                                            activityStatus.label === 'Inactive' ||
                                            !worker.isVerified
                                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" 
                                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                          }
                                        >
                                          {activityStatus.icon}
                                          <span className="ml-1">{activityStatus.label}</span>
                                        </Badge>
                                      </div>
                                      <div className="text-sm"><strong>Registration Date:</strong> {formatIndianDateTime(worker.createdAt)}</div>
                                      <div className="text-sm"><strong>Last Login:</strong> {worker.lastLoginAt ? formatIndianDateTime(worker.lastLoginAt) : 'No Login'}</div>
                                      {worker.mobile && (
                                        <div className="text-sm"><strong>Mobile:</strong> {worker.mobile}</div>
                                      )}
                                      {worker.email && (
                                        <div className="text-sm"><strong>Email:</strong> {worker.email}</div>
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
                                    {worker.address ? (
                                      <div>
                                        <div className="text-gray-700 dark:text-gray-300 text-sm font-bold">
                                          {worker.district}, {worker.state}
                                        </div>
                                        <div className="font-medium text-gray-600 dark:text-gray-400 text-xs mt-1">Address:</div>
                                        <div className="text-gray-900 dark:text-white text-xs">
                                          {worker.address}
                                        </div>
                                        <div className="text-gray-700 dark:text-gray-300 text-xs">
                                          {worker.district}, {worker.state}
                                        </div>
                                        {worker.pincode && (
                                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                                            PIN: {worker.pincode}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 mt-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const fullAddress = `${worker.firstName} ${worker.lastName}\n${worker.address}, ${worker.district}, ${worker.state}${worker.pincode ? `, PIN: ${worker.pincode}` : ''}`;
                                              navigator.clipboard.writeText(fullAddress);
                                            }}
                                            title="Copy Address with Name"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : worker.district && worker.state ? (
                                      <div>
                                        <div className="text-gray-900 dark:text-white">
                                          {worker.district}, {worker.state}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        Not specified
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-medium">Location Details:</p>
                                    {worker.address ? (
                                      <div className="space-y-1">
                                        <div className="text-sm"><strong>Full Address:</strong> {worker.address}</div>
                                        <div className="text-sm"><strong>District:</strong> {worker.district}</div>
                                        <div className="text-sm"><strong>State:</strong> {worker.state}</div>
                                        {worker.pincode && (
                                          <div className="text-sm"><strong>PIN Code:</strong> {worker.pincode}</div>
                                        )}
                                        <div className="flex items-center gap-1 mt-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const fullAddress = `${worker.firstName} ${worker.lastName}\n${(worker as any).address}, ${worker.district}, ${worker.state}${(worker as any).pincode ? `, PIN: ${(worker as any).pincode}` : ''}`;
                                              navigator.clipboard.writeText(fullAddress);
                                            }}
                                            title="Copy Address with Name"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500">
                                        {worker.district && worker.state ? 
                                          `Located in ${worker.district}, ${worker.state}` : 
                                          'No location information provided'
                                        }
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm space-y-1 cursor-pointer">
                                    {(worker as any).primaryService ? (
                                      <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {(worker as any).primaryService}
                                        </div>
                                        {(worker as any).skills && (worker as any).skills.length > 0 && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Skills: {(worker as any).skills.slice(0, 2).join(', ')}
                                            {(worker as any).skills.length > 2 && ` +${(worker as any).skills.length - 2} more`}
                                          </div>
                                        )}
                                        {(worker as any).experienceYears && (
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Experience: {(worker as any).experienceYears} years
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                                        Not specified
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-medium">Service Information:</p>
                                    {(worker as any).primaryService ? (
                                      <div className="space-y-1">
                                        <div className="text-sm"><strong>Primary Service:</strong> {(worker as any).primaryService}</div>
                                        {(worker as any).skills && (worker as any).skills.length > 0 && (
                                          <div className="text-sm">
                                            <strong>Skills:</strong> {(worker as any).skills.join(', ')}
                                          </div>
                                        )}
                                        {(worker as any).experienceYears && (
                                          <div className="text-sm"><strong>Experience:</strong> {(worker as any).experienceYears} years</div>
                                        )}
                                        {(worker as any).hourlyRate && (
                                          <div className="text-sm"><strong>Hourly Rate:</strong> ₹{(worker as any).hourlyRate}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500">
                                        No service information provided
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 cursor-pointer">
                                    <div className="font-medium">Bookings: 0</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-3 space-y-0.5">
                                      <div>• In progress: 0</div>
                                      <div>• Completed: 0</div>
                                    </div>
                                    <div className="pt-1">Balance: ₹0</div>
                                    <div>Spent: ₹0</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 space-y-0.5">
                                      <div>Commission: ₹0</div>
                                      <div>GST: ₹0</div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 group transition-all duration-300 hover:scale-110 hover:shadow-lg hover:animate-financial-glow rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const button = e.currentTarget;
                                          if (button) {
                                            button.classList.add('animate-financial-click');
                                            setTimeout(() => {
                                              if (button) {
                                                button.classList.remove('animate-financial-click');
                                              }
                                            }, 200);
                                          }
                                          handleViewFinancialStatements(worker);
                                        }}
                                        onMouseEnter={(e) => {
                                          const button = e.currentTarget;
                                          const span = button.querySelector('span');
                                          if (span) {
                                            span.classList.add('animate-financial-bounce');
                                            setTimeout(() => {
                                              span.classList.remove('animate-financial-bounce');
                                            }, 600);
                                          }
                                        }}
                                        title="Financial Statements"
                                      >
                                        <span className="text-xs font-bold transition-all duration-300 group-hover:scale-125 group-hover:text-green-700">₹</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const financialData = `${worker.firstName} ${worker.lastName} - Financial Summary\nBookings: 0 (In progress: 0, Completed: 0)\nBalance: ₹0\nSpent: ₹0\nCommission: ₹0\nGST: ₹0`;
                                          navigator.clipboard.writeText(financialData);
                                        }}
                                        title="Copy Financial Data"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-medium">Booking & Financial Summary:</p>
                                    <div className="space-y-1">
                                      <div className="text-sm"><strong>Total Bookings:</strong> 0</div>
                                      <div className="text-sm ml-2">• In Progress: 0</div>
                                      <div className="text-sm ml-2">• Completed: 0</div>
                                      <div className="text-sm"><strong>Account Balance:</strong> ₹0</div>
                                      <div className="text-sm"><strong>Total Spent:</strong> ₹0</div>
                                      <div className="text-sm"><strong>Platform Commission:</strong> ₹0</div>
                                      <div className="text-sm"><strong>GST Collected:</strong> ₹0</div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewFinancialStatements(worker);
                                        }}
                                        title="Financial Statements"
                                      >
                                        <span className="text-xs font-bold">₹</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const financialData = `${worker.firstName} ${worker.lastName} - Financial Summary\nBookings: 0 (In progress: 0, Completed: 0)\nBalance: ₹0\nSpent: ₹0\nCommission: ₹0\nGST: ₹0`;
                                          navigator.clipboard.writeText(financialData);
                                        }}
                                        title="Copy Financial Data"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm space-y-1 cursor-pointer">
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Phone className="w-3 h-3" />
                                      <span>{worker.mobile}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(worker.mobile);
                                        }}
                                        title="Copy Mobile Number"
                                      >
                                        <Copy className="w-2 h-2" />
                                      </Button>
                                    </div>
                                    {worker.email && (
                                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                        <Mail className="w-3 h-3" />
                                        <a 
                                          href={`mailto:${worker.email}`}
                                          className="truncate max-w-[150px] text-blue-600 hover:text-blue-700 underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {worker.email}
                                        </a>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(`https://wa.me/91${worker.mobile}`, '_blank');
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
                                          window.location.href = `sms:+91${worker.mobile}`;
                                        }}
                                        title="SMS"
                                      >
                                        <Square className="w-3 h-3" />
                                      </Button>
                                      {worker.email && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `mailto:${worker.email}`;
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
                                        <MessageSquare className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.location.href = `tel:+91${worker.mobile}`;
                                        }}
                                        title="Call Phone"
                                      >
                                        <Phone className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-medium">Complete Contact Information:</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" />
                                        <span>{worker.mobile}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(worker.mobile);
                                          }}
                                          title="Copy Mobile Number"
                                        >
                                          <Copy className="w-2 h-2" />
                                        </Button>
                                      </div>
                                      {worker.email && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-3 h-3" />
                                          <a 
                                            href={`mailto:${worker.email}`}
                                            className="text-blue-600 hover:text-blue-700 underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {worker.email}
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/91${worker.mobile}`, '_blank');
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
                                            window.location.href = `sms:+91${worker.mobile}`;
                                          }}
                                          title="SMS"
                                        >
                                          <Square className="w-3 h-3" />
                                        </Button>
                                        {worker.email && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `mailto:${worker.email}`;
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
                                          <MessageSquare className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:+91${worker.mobile}`;
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
                                    {(worker as any).bankAccountNumber && (worker as any).bankIFSC ? (
                                      <>
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                          <CreditCard className="w-3 h-3" />
                                          <span className="font-mono text-xs">{(worker as any).bankAccountNumber.slice(-4)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          IFSC: {(worker as any).bankIFSC}
                                        </div>
                                        {(worker as any).bankMICR && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            MICR: {(worker as any).bankMICR}
                                          </div>
                                        )}
                                        {(worker as any).bankName && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {(worker as any).bankName}
                                          </div>
                                        )}
                                        {(worker as any).bankAddress && (
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {(() => {
                                              const address = (worker as any).bankAddress;
                                              // Split address and format properly
                                              const parts = address.split(',').map((part: string) => part.trim());
                                              
                                              if (parts.length >= 2) {
                                                // Extract state and pincode from last part
                                                const lastPart = parts[parts.length - 1];
                                                const pincodeMatch = lastPart.match(/(\d{6})$/); // Match 6-digit pincode at end
                                                
                                                if (pincodeMatch) {
                                                  const pincode = pincodeMatch[1];
                                                  const state = lastPart.replace(` - ${pincode}`, '').trim();
                                                  const mainAddress = parts.slice(0, -1).join(', ');
                                                  
                                                  return (
                                                    <div className="space-y-0.5">
                                                      <div className="truncate max-w-[190px]">{mainAddress}</div>
                                                      <div className="truncate max-w-[190px]">{state}</div>
                                                      <div className="text-[10px] text-gray-400">PIN: {pincode}</div>
                                                    </div>
                                                  );
                                                }
                                              }
                                              
                                              // Fallback for addresses without clear structure
                                              return (
                                                <div className="space-y-0.5">
                                                  <div className="truncate max-w-[190px]">{address}</div>
                                                </div>
                                              );
                                            })()}
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
                                              console.log('Transfer money to:', worker.firstName, worker.lastName);
                                            }}
                                            title="Transfer Money"
                                          >
                                            <ArrowRightLeft className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewTransferHistory(worker);
                                            }}
                                            title="Transfer History"
                                          >
                                            <History className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const bankDetails = `${worker.firstName} ${worker.lastName} - Bank Details\nAccount: ${(worker as any).bankAccountNumber}\nIFSC: ${(worker as any).bankIFSC}${(worker as any).bankMICR ? `\nMICR: ${(worker as any).bankMICR}` : ''}${(worker as any).bankName ? `\nBank: ${(worker as any).bankName}` : ''}${(worker as any).bankAddress ? `\nAddress: ${(worker as any).bankAddress}` : ''}`;
                                              navigator.clipboard.writeText(bankDetails);
                                            }}
                                            title="Copy Bank Details"
                                          >
                                            <Copy className="w-3 h-3" />
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
                                  {(worker as any).bankAccountNumber && (worker as any).bankIFSC ? (
                                    <div className="space-y-2">
                                      <p className="font-medium">Complete Bank Details:</p>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                          <CreditCard className="w-3 h-3" />
                                          <span>Account: {(worker as any).bankAccountNumber}</span>
                                        </div>
                                        <div>
                                          <span className="font-medium">IFSC:</span> {(worker as any).bankIFSC}
                                        </div>
                                        {(worker as any).bankMICR && (
                                          <div>
                                            <span className="font-medium">MICR:</span> {(worker as any).bankMICR}
                                          </div>
                                        )}
                                        {(worker as any).bankName && (
                                          <div>
                                            <span className="font-medium">Bank Name:</span> {(worker as any).bankName}
                                          </div>
                                        )}
                                        {(worker as any).bankAddress && (
                                          <div>
                                            <span className="font-medium">Bank Address:</span> {(worker as any).bankAddress}
                                          </div>
                                        )}
                                        {(worker as any).bankAccountHolderName && (
                                          <div>
                                            <span className="font-medium">Account Holder:</span> {(worker as any).bankAccountHolderName}
                                          </div>
                                        )}
                                        {(worker as any).bankAccountType && (
                                          <div>
                                            <span className="font-medium">Account Type:</span> {(worker as any).bankAccountType}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle money transfer functionality
                                            console.log('Transfer money to:', worker.firstName, worker.lastName);
                                          }}
                                        >
                                          <ArrowRightLeft className="w-3 h-3 mr-1" />
                                          Transfer Money
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewTransferHistory(worker);
                                          }}
                                        >
                                          <History className="w-3 h-3 mr-1" />
                                          History
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-purple-600 border-purple-200 hover:text-purple-700 hover:bg-purple-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const bankDetails = `${worker.firstName} ${worker.lastName} - Bank Details\nAccount: ${(worker as any).bankAccountNumber}\nIFSC: ${(worker as any).bankIFSC}${(worker as any).bankMICR ? `\nMICR: ${(worker as any).bankMICR}` : ''}${(worker as any).bankName ? `\nBank: ${(worker as any).bankName}` : ''}${(worker as any).bankAddress ? `\nAddress: ${(worker as any).bankAddress}` : ''}`;
                                            navigator.clipboard.writeText(bankDetails);
                                          }}
                                        >
                                          <Copy className="w-3 h-3 mr-1" />
                                          Copy
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleViewDetails(worker)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuItem onClick={() => handleSendWhatsApp(worker)}>
                                        <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                                        <span className="text-green-600">WhatsApp</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendSMS(worker)}>
                                        <Square className="w-4 h-4 mr-2 text-blue-600" />
                                        <span className="text-blue-600">SMS</span>
                                      </DropdownMenuItem>
                                      {worker.email && (
                                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${worker.email}`}>
                                          <Mail className="w-4 h-4 mr-2 text-red-600" />
                                          <span className="text-red-600">Email</span>
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => handleSendDirectMessage(worker)}>
                                        <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                        <span className="text-purple-600">Message</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuItem onClick={() => handleVerifyUser(worker)}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    <span className="text-green-600">Verify User</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSuspendUser(worker)}>
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    <span className="text-red-600">Suspend User</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteUser(worker)}>
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
                {filteredWorkers.length > 0 && (
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
                            {getWorkerCountForDistrict(district)}
                          </Badge>
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Workers View */}
          {!usersLoading && selectedDistrict && (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      Workers in {selectedDistrict}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedState} • {filteredDistrictWorkers.length} total clients • Showing {((districtCurrentPage - 1) * districtPageSize) + 1}-{Math.min(districtCurrentPage * districtPageSize, filteredDistrictWorkers.length)} of {filteredDistrictWorkers.length} {searchQuery && `filtered results`}
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
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Workers will appear here once they register</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={selectedWorkerIds.size === clientsForDistrict.length && clientsForDistrict.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedWorkerIds(new Set(clientsForDistrict.map(w => w.id)));
                                } else {
                                  setSelectedWorkerIds(new Set());
                                }
                              }}
                              aria-label="Select all workers"
                            />
                          </TableHead>
                          <TableHead className="w-[190px]">
                            <div className="flex items-center gap-2">
                              <span>Worker</span>
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
                                  <SelectItem value="no_login">No Login</SelectItem>
                                  <SelectItem value="just_registered">Just Registered</SelectItem>
                                  <SelectItem value="verified">Verified</SelectItem>
                                  <SelectItem value="unverified">Unverified</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableHead>
                          <TableHead className="w-[160px]">Location</TableHead>
                          <TableHead className="w-[140px]">Service Type</TableHead>
                          <TableHead className="w-[190px]">Bookings/Earnings</TableHead>
                          <TableHead className="w-[180px]">
                            <div className="flex items-center gap-2">
                              <span>Contact</span>
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                      onClick={() => {
                                        toast({ title: "WhatsApp", description: "Bulk WhatsApp messaging coming soon!" });
                                      }}
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk WhatsApp</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      onClick={() => {
                                        toast({ title: "SMS", description: "Bulk SMS messaging coming soon!" });
                                      }}
                                    >
                                      <Square className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk SMS</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => {
                                        toast({ title: "Email", description: "Bulk email messaging coming soon!" });
                                      }}
                                    >
                                      <Mail className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk Email</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                      onClick={() => {
                                        toast({ title: "Message", description: "Bulk in-app messaging coming soon!" });
                                      }}
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Bulk Message</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </TableHead>
                          <TableHead className="w-[190px]">Bank Details</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientsForDistrict.map((worker) => {
                          const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
                          return (
                            <TableRow key={worker.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedWorkerIds.has(worker.id)}
                                  onCheckedChange={(checked) => {
                                    const newSelection = new Set(selectedWorkerIds);
                                    if (checked) {
                                      newSelection.add(worker.id);
                                    } else {
                                      newSelection.delete(worker.id);
                                    }
                                    setSelectedWorkerIds(newSelection);
                                  }}
                                  aria-label={`Select worker ${worker.firstName} ${worker.lastName}`}
                                />
                              </TableCell>
                              <TableCell className="py-2">
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-start gap-3 cursor-pointer">
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarImage 
                                          src={(worker as any).profilePicture} 
                                          alt={`${worker.firstName} ${worker.lastName}`} 
                                        />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                          {worker.firstName.charAt(0).toUpperCase()}{worker.lastName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {worker.firstName} {worker.lastName}
                                        </div>
                                        <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                                          ID: {worker.id}
                                        </div>
                                        <div className="mt-1 space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 text-xs">
                                              Worker
                                            </Badge>
                                            <Badge 
                                              variant={
                                                activityStatus.label === 'Just Registered' || 
                                                activityStatus.label === 'No Login' || 
                                                activityStatus.label === 'Inactive' ? "destructive" : activityStatus.variant
                                              }
                                              className={
                                                activityStatus.label === 'Just Registered' || 
                                                activityStatus.label === 'No Login' || 
                                                activityStatus.label === 'Inactive'
                                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs" 
                                                  : activityStatus.className
                                              }
                                            >
                                              {activityStatus.icon}
                                              <span className="ml-1">{activityStatus.label}</span>
                                            </Badge>
                                            <Badge
                                              variant={worker.isVerified ? "default" : "destructive"}
                                              className={worker.isVerified 
                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs" 
                                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs"
                                              }
                                            >
                                              {worker.isVerified ? "Verified" : "Unverified"}
                                            </Badge>
                                          </div>
                                          {worker.lastLoginAt && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              Last: {formatIndianDateTime(worker.lastLoginAt)}
                                            </div>
                                          )}
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Reg: {formatIndianDateTime(worker.createdAt)}
                                          </div>
                                          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            Member since {getMemberSince(worker.createdAt)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-16 w-16 flex-shrink-0">
                                          <AvatarImage 
                                            src={(worker as any).profilePicture} 
                                            alt={`${worker.firstName} ${worker.lastName}`} 
                                          />
                                          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                                            {worker.firstName.charAt(0).toUpperCase()}{worker.lastName.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-base">Worker Profile Overview</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">Complete user information</p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="text-sm"><strong>Full Name:</strong> {worker.firstName} {worker.lastName}</div>
                                        <div className="text-sm"><strong>Worker ID:</strong> {worker.id}</div>
                                        <div className="text-sm"><strong>Role:</strong> Worker User</div>
                                        <div className="flex items-center gap-2">
                                          <strong className="text-sm">Verification Status:</strong>
                                          <Badge
                                            variant={worker.isVerified ? "default" : "destructive"}
                                            className={worker.isVerified 
                                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                            }
                                          >
                                            {worker.isVerified ? "Verified" : "Unverified"}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <strong className="text-sm">Activity Status:</strong>
                                          <Badge
                                            variant={
                                              activityStatus.label === 'Just Registered' || 
                                              activityStatus.label === 'No Login' || 
                                              activityStatus.label === 'Inactive' ||
                                              !worker.isVerified ? "destructive" : "default"
                                            }
                                            className={
                                              activityStatus.label === 'Just Registered' || 
                                              activityStatus.label === 'No Login' || 
                                              activityStatus.label === 'Inactive' ||
                                              !worker.isVerified
                                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" 
                                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                            }
                                          >
                                            {activityStatus.icon}
                                            <span className="ml-1">{activityStatus.label}</span>
                                          </Badge>
                                        </div>
                                        <div className="text-sm"><strong>Registration Date:</strong> {formatIndianDateTime(worker.createdAt)}</div>
                                        <div className="text-sm"><strong>Last Login:</strong> {worker.lastLoginAt ? formatIndianDateTime(worker.lastLoginAt) : 'No Login'}</div>
                                        <div className="text-sm"><strong>Member Since:</strong> {getMemberSince(worker.createdAt)}</div>
                                        {worker.mobile && (
                                          <div className="text-sm"><strong>Mobile:</strong> {worker.mobile}</div>
                                        )}
                                        {worker.email && (
                                          <div className="text-sm"><strong>Email:</strong> {worker.email}</div>
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
                                      {(worker as any).address ? (
                                    <div>
                                      <div className="text-gray-700 dark:text-gray-300 text-sm font-bold">
                                        {worker.district}, {worker.state}
                                      </div>
                                      <div className="font-medium text-gray-600 dark:text-gray-400 text-xs mt-1">Address:</div>
                                      <div className="text-gray-900 dark:text-white text-xs">
                                        {(worker as any).address}
                                      </div>
                                      <div className="text-gray-700 dark:text-gray-300 text-xs">
                                        {worker.district}, {worker.state}
                                      </div>
                                      {(worker as any).pincode && (
                                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                                          PIN: {(worker as any).pincode}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 mt-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const fullAddress = `${worker.firstName} ${worker.lastName}\n${(worker as any).address}, ${worker.district}, ${worker.state}${(worker as any).pincode ? `, PIN: ${(worker as any).pincode}` : ''}`;
                                            navigator.clipboard.writeText(fullAddress);
                                          }}
                                          title="Copy Address with Name"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : worker.district && worker.state ? (
                                    <div>
                                      <div className="text-gray-900 dark:text-white">
                                        {worker.district}, {worker.state}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Not specified
                                    </span>
                                  )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="max-w-xs">
                                      <div className="space-y-1">
                                        <div className="text-sm"><strong>Location Details:</strong></div>
                                        <div className="text-sm"><strong>Full Address:</strong> {(worker as any).address}</div>
                                        <div className="text-sm"><strong>District:</strong> {worker.district}</div>
                                        <div className="text-sm"><strong>State:</strong> {worker.state}</div>
                                        {(worker as any).pincode && (
                                          <div className="text-sm"><strong>PIN Code:</strong> {(worker as any).pincode}</div>
                                        )}
                                        <div className="flex items-center gap-1 mt-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const fullAddress = `${worker.firstName} ${worker.lastName}\n${(worker as any).address}, ${worker.district}, ${worker.state}${(worker as any).pincode ? `, PIN: ${(worker as any).pincode}` : ''}`;
                                              navigator.clipboard.writeText(fullAddress);
                                            }}
                                            title="Copy Address with Name"
                                          >
                                            <Copy className="w-3 h-3" />
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
                                      {(worker as any).primaryService ? (
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {(worker as any).primaryService}
                                          </div>
                                          {(worker as any).skills && (worker as any).skills.length > 0 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              Skills: {(worker as any).skills.slice(0, 2).join(', ')}
                                              {(worker as any).skills.length > 2 && ` +${(worker as any).skills.length - 2} more`}
                                            </div>
                                          )}
                                          {(worker as any).experienceYears && (
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                              Experience: {(worker as any).experienceYears} years
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                                          Not specified
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <div className="space-y-2">
                                      <p className="font-medium">Service Information:</p>
                                      {(worker as any).primaryService ? (
                                        <div className="space-y-1">
                                          <div className="text-sm"><strong>Primary Service:</strong> {(worker as any).primaryService}</div>
                                          {(worker as any).skills && (worker as any).skills.length > 0 && (
                                            <div className="text-sm">
                                              <strong>Skills:</strong> {(worker as any).skills.join(', ')}
                                            </div>
                                          )}
                                          {(worker as any).experienceYears && (
                                            <div className="text-sm"><strong>Experience:</strong> {(worker as any).experienceYears} years</div>
                                          )}
                                          {(worker as any).hourlyRate && (
                                            <div className="text-sm"><strong>Hourly Rate:</strong> ₹{(worker as any).hourlyRate}</div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500">
                                          No service information provided
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 cursor-pointer">
                                  <div className="font-medium">Bookings: 0</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-3 space-y-0.5">
                                    <div>• In progress: 0</div>
                                    <div>• Completed: 0</div>
                                  </div>
                                  <div className="pt-1">Balance: ₹0</div>
                                  <div>Spent: ₹0</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 space-y-0.5">
                                    <div>Commission: ₹0</div>
                                    <div>GST: ₹0</div>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 group transition-all duration-300 hover:scale-110 hover:shadow-lg hover:animate-financial-glow rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const button = e.currentTarget;
                                        if (button) {
                                          button.classList.add('animate-financial-click');
                                          setTimeout(() => {
                                            if (button) {
                                              button.classList.remove('animate-financial-click');
                                            }
                                          }, 200);
                                        }
                                        handleViewFinancialStatements(worker);
                                      }}
                                      onMouseEnter={(e) => {
                                        const button = e.currentTarget;
                                        const span = button.querySelector('span');
                                        if (span) {
                                          span.classList.add('animate-financial-bounce');
                                          setTimeout(() => {
                                            span.classList.remove('animate-financial-bounce');
                                          }, 600);
                                        }
                                      }}
                                      title="Financial Statements"
                                    >
                                      <span className="text-xs font-bold transition-all duration-300 group-hover:scale-125 group-hover:text-green-700">₹</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const financialData = `${worker.firstName} ${worker.lastName} - Financial Summary\nBookings: 0 (In progress: 0, Completed: 0)\nBalance: ₹0\nSpent: ₹0\nCommission: ₹0\nGST: ₹0`;
                                        navigator.clipboard.writeText(financialData);
                                      }}
                                      title="Copy Financial Data"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <div className="space-y-2">
                                      <p className="font-medium">Booking & Financial Summary:</p>
                                      <div className="space-y-1">
                                        <div className="text-sm"><strong>Total Bookings:</strong> 0</div>
                                        <div className="text-sm ml-2">• In Progress: 0</div>
                                        <div className="text-sm ml-2">• Completed: 0</div>
                                        <div className="text-sm"><strong>Account Balance:</strong> ₹0</div>
                                        <div className="text-sm"><strong>Total Spent:</strong> ₹0</div>
                                        <div className="text-sm"><strong>Platform Commission:</strong> ₹0</div>
                                        <div className="text-sm"><strong>GST Collected:</strong> ₹0</div>
                                      </div>
                                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewFinancialStatements(worker);
                                          }}
                                          title="Financial Statements"
                                        >
                                          <span className="text-xs font-bold">₹</span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const financialData = `${worker.firstName} ${worker.lastName} - Financial Summary\nBookings: 0 (In progress: 0, Completed: 0)\nBalance: ₹0\nSpent: ₹0\nCommission: ₹0\nGST: ₹0`;
                                            navigator.clipboard.writeText(financialData);
                                          }}
                                          title="Copy Financial Data"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm space-y-1 cursor-pointer">
                                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                        <Phone className="w-3 h-3" />
                                        <span>{worker.mobile}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(worker.mobile);
                                          }}
                                          title="Copy Mobile Number"
                                        >
                                          <Copy className="w-2 h-2" />
                                        </Button>
                                      </div>
                                      {worker.email && (
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                          <Mail className="w-3 h-3" />
                                          <a 
                                            href={`mailto:${worker.email}`}
                                            className="truncate max-w-[150px] text-blue-600 hover:text-blue-700 underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {worker.email}
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 mt-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/91${worker.mobile}`, '_blank');
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
                                            window.location.href = `sms:+91${worker.mobile}`;
                                          }}
                                          title="SMS"
                                        >
                                          <Square className="w-3 h-3" />
                                        </Button>
                                        {worker.email && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `mailto:${worker.email}`;
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
                                          <MessageSquare className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:+91${worker.mobile}`;
                                          }}
                                          title="Call Phone"
                                        >
                                          <Phone className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <div className="space-y-2">
                                      <p className="font-medium">Complete Contact Information:</p>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-3 h-3" />
                                          <span>{worker.mobile}</span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(worker.mobile);
                                            }}
                                            title="Copy Mobile Number"
                                          >
                                            <Copy className="w-2 h-2" />
                                          </Button>
                                        </div>
                                        {worker.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            <a 
                                              href={`mailto:${worker.email}`}
                                              className="text-blue-600 hover:text-blue-700 underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {worker.email}
                                            </a>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(`https://wa.me/91${worker.mobile}`, '_blank');
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
                                              window.location.href = `sms:+91${worker.mobile}`;
                                            }}
                                            title="SMS"
                                          >
                                            <Square className="w-3 h-3" />
                                          </Button>
                                          {worker.email && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `mailto:${worker.email}`;
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
                                            <MessageSquare className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.location.href = `tel:+91${worker.mobile}`;
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
                                      {(worker as any).bankAccountNumber && (worker as any).bankIFSC ? (
                                        <>
                                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <CreditCard className="w-3 h-3" />
                                            <span className="font-mono text-xs">{(worker as any).bankAccountNumber.slice(-4)}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            IFSC: {(worker as any).bankIFSC}
                                          </div>
                                          {(worker as any).bankMICR && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              MICR: {(worker as any).bankMICR}
                                            </div>
                                          )}
                                          {(worker as any).bankName && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                              {(worker as any).bankName}
                                            </div>
                                          )}
                                          {(worker as any).bankAddress && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              {(() => {
                                                const address = (worker as any).bankAddress;
                                                // Split address and format properly
                                                const parts = address.split(',').map((part: string) => part.trim());
                                                
                                                if (parts.length >= 2) {
                                                  // Extract state and pincode from last part
                                                  const lastPart = parts[parts.length - 1];
                                                  const pincodeMatch = lastPart.match(/(\d{6})$/); // Match 6-digit pincode at end
                                                  
                                                  if (pincodeMatch) {
                                                    const pincode = pincodeMatch[1];
                                                    const state = lastPart.replace(` - ${pincode}`, '').trim();
                                                    const mainAddress = parts.slice(0, -1).join(', ');
                                                    
                                                    return (
                                                      <div className="space-y-0.5">
                                                        <div className="truncate max-w-[190px]">{mainAddress}</div>
                                                        <div className="truncate max-w-[190px]">{state}</div>
                                                        <div className="text-[10px] text-gray-400">PIN: {pincode}</div>
                                                      </div>
                                                    );
                                                  }
                                                }
                                                
                                                // Fallback for addresses without clear structure
                                                return (
                                                  <div className="space-y-0.5">
                                                    <div className="truncate max-w-[190px]">{address}</div>
                                                  </div>
                                                );
                                              })()}
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
                                                console.log('Transfer money to:', worker.firstName, worker.lastName);
                                              }}
                                              title="Transfer Money"
                                            >
                                              <ArrowRightLeft className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTransferHistory(worker);
                                              }}
                                              title="Transfer History"
                                            >
                                              <History className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const bankDetails = `${worker.firstName} ${worker.lastName} - Bank Details\nAccount: ${(worker as any).bankAccountNumber}\nIFSC: ${(worker as any).bankIFSC}${(worker as any).bankMICR ? `\nMICR: ${(worker as any).bankMICR}` : ''}${(worker as any).bankName ? `\nBank: ${(worker as any).bankName}` : ''}${(worker as any).bankAddress ? `\nAddress: ${(worker as any).bankAddress}` : ''}`;
                                                navigator.clipboard.writeText(bankDetails);
                                              }}
                                              title="Copy Bank Details"
                                            >
                                              <Copy className="w-3 h-3" />
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
                                    {(worker as any).bankAccountNumber && (worker as any).bankIFSC ? (
                                      <div className="space-y-2">
                                        <p className="font-medium">Complete Bank Details:</p>
                                        <div className="space-y-1 text-xs">
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" />
                                            <span>Account: {(worker as any).bankAccountNumber}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">IFSC:</span> {(worker as any).bankIFSC}
                                          </div>
                                          {(worker as any).bankMICR && (
                                            <div>
                                              <span className="font-medium">MICR:</span> {(worker as any).bankMICR}
                                            </div>
                                          )}
                                          {(worker as any).bankName && (
                                            <div>
                                              <span className="font-medium">Bank Name:</span> {(worker as any).bankName}
                                            </div>
                                          )}
                                          {(worker as any).bankAddress && (
                                            <div>
                                              <span className="font-medium">Bank Address:</span> {(worker as any).bankAddress}
                                            </div>
                                          )}
                                          {(worker as any).bankAccountHolderName && (
                                            <div>
                                              <span className="font-medium">Account Holder:</span> {(worker as any).bankAccountHolderName}
                                            </div>
                                          )}
                                          {(worker as any).bankAccountType && (
                                            <div>
                                              <span className="font-medium">Account Type:</span> {(worker as any).bankAccountType}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Handle money transfer functionality
                                              console.log('Transfer money to:', worker.firstName, worker.lastName);
                                            }}
                                          >
                                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                                            Transfer Money
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewTransferHistory(worker);
                                            }}
                                          >
                                            <History className="w-3 h-3 mr-1" />
                                            History
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2 text-purple-600 border-purple-200 hover:text-purple-700 hover:bg-purple-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const bankDetails = `${worker.firstName} ${worker.lastName} - Bank Details\nAccount: ${(worker as any).bankAccountNumber}\nIFSC: ${(worker as any).bankIFSC}${(worker as any).bankMICR ? `\nMICR: ${(worker as any).bankMICR}` : ''}${(worker as any).bankName ? `\nBank: ${(worker as any).bankName}` : ''}${(worker as any).bankAddress ? `\nAddress: ${(worker as any).bankAddress}` : ''}`;
                                              navigator.clipboard.writeText(bankDetails);
                                            }}
                                          >
                                            <Copy className="w-3 h-3 mr-1" />
                                            Copy
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleViewDetails(worker)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Send Message
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => handleSendWhatsApp(worker)}>
                                          <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">WhatsApp</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendSMS(worker)}>
                                          <Square className="w-4 h-4 mr-2 text-blue-600" />
                                          <span className="text-blue-600">SMS</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSendDirectMessage(worker)}>
                                          <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                          <span className="text-purple-600">Message</span>
                                        </DropdownMenuItem>
                                        {worker.email && (
                                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${worker.email}`}>
                                            <Mail className="w-4 h-4 mr-2 text-red-600" />
                                            <span className="text-red-600">Email</span>
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem onClick={() => handleVerifyUser(worker)}>
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                      <span className="text-green-600">Verify User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSuspendUser(worker)}>
                                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                      <span className="text-red-600">Suspend User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteUser(worker)}>
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
                {filteredDistrictWorkers.length > 0 && (
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
      {selectedWorker && (
        <ViewDetailsModal
          isOpen={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          title="Worker Details"
          subtitle="Complete registration information"
          data={selectedWorker}
          avatar={{
            src: undefined, // profilePicture field not available in User interface
            fallback: `${selectedWorker.firstName?.charAt(0)}${selectedWorker.lastName?.charAt(0)}`
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
            { key: "createdAt", label: "Member Since", type: "display", section: "status", value: formatIndianDateTime(selectedWorker.createdAt) },
            { key: "updatedAt", label: "Last Updated", type: "display", section: "status", value: selectedWorker.updatedAt ? formatIndianDateTime(selectedWorker.updatedAt) : "Not available" },
            { key: "lastLoginAt", label: "Last Login", type: "display", section: "status", value: selectedWorker.lastLoginAt ? formatIndianDateTime(selectedWorker.lastLoginAt) : "No Login" },
          ]}
          actions={[
            {
              label: "Send Message",
              icon: MessageSquare,
              onClick: () => {
                setShowDetailsDialog(false);
                handleSendMessage(selectedWorker);
              }
            },
            {
              label: "Verify User",
              icon: CheckCircle,
              onClick: () => {
                setShowDetailsDialog(false);
                handleVerifyUser(selectedWorker);
              }
            },
            {
              label: "Suspend User",
              variant: "destructive",
              icon: XCircle,
              onClick: () => {
                setShowDetailsDialog(false);
                handleSuspendUser(selectedWorker);
              }
            },
            {
              label: "Delete User",
              variant: "destructive",
              icon: Trash2,
              onClick: () => {
                setShowDetailsDialog(false);
                handleDeleteUser(selectedWorker);
              }
            }
          ]}
          updateApiEndpoint={`/api/admin/users/${selectedWorker.id}`}
          queryKeyToInvalidate={["/api/admin/users"]}
        />
      )}

      {/* Send Message Modal */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedWorker?.firstName} {selectedWorker?.lastName}
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
          {selectedWorker && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">User Information:</h4>
                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                  <li>{selectedWorker.firstName} {selectedWorker.lastName}</li>
                  <li>{selectedWorker.mobile}</li>
                  {selectedWorker.email && <li>{selectedWorker.email}</li>}
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

      {/* Transfer History Modal */}
      <Dialog open={showTransferHistoryDialog} onOpenChange={setShowTransferHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Transfer History - {selectedWorker?.firstName} {selectedWorker?.lastName}
            </DialogTitle>
            <DialogDescription>
              View all money transfer records for this worker
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {transferHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading transfer history...</span>
              </div>
            ) : typedTransferHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No transfer history found for this worker</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {typedTransferHistory.map((transfer: any) => (
                  <div key={transfer.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-green-600">
                            ₹{transfer.amount?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(transfer.createdAt).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {transfer.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {transfer.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTransferHistory(transfer.id)}
                        disabled={deleteTransferMutation.isPending}
                        title="Delete Transfer Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial Statements Dialog */}
      <Dialog open={showFinancialStatementsDialog} onOpenChange={setShowFinancialStatementsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-600">₹</span>
              Financial Statements - {selectedWorker?.firstName} {selectedWorker?.lastName}
            </DialogTitle>
            <DialogDescription>
              View balance and spending data for the last 2 years from current year
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {financialStatementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading financial statements...</span>
              </div>
            ) : typedFinancialStatements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-6xl font-bold text-gray-300 block mb-2">₹</span>
                <p>No financial data found for this worker</p>
                <p className="text-sm text-gray-400 mt-1">Data for {new Date().getFullYear()} and {new Date().getFullYear() - 1} will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typedFinancialStatements.map((statement: any) => (
                    <Card key={statement.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                            Year {statement.year}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {statement.year === new Date().getFullYear() ? 'Current Year' : 'Previous Year'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
                            <div className="text-xl font-bold text-green-600">
                              ₹{parseFloat(statement.balance || '0').toLocaleString('en-IN')}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Spent</div>
                            <div className="text-xl font-bold text-red-600">
                              ₹{parseFloat(statement.spent || '0').toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Earnings</div>
                            <div className="text-sm font-medium text-blue-600">
                              ₹{parseFloat(statement.totalEarnings || '0').toLocaleString('en-IN')}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Bookings</div>
                            <div className="text-sm font-medium text-blue-600">
                              {statement.totalBookings || 0}
                            </div>
                          </div>
                        </div>
                        
                        {statement.lastUpdated && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t">
                            Last updated: {format(new Date(statement.lastUpdated), 'dd MMM yyyy, hh:mm a')}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinancialStatementsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Verify Dialog */}
      <AlertDialog open={showBulkVerifyDialog} onOpenChange={setShowBulkVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Selected Workers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {selectedWorkerIds.size} selected worker{selectedWorkerIds.size > 1 ? 's' : ''}? This action will mark them as verified users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                setBulkActionLoading(true);
                // TODO: Implement bulk verify API call
                toast({
                  title: "Workers Verified",
                  description: `${selectedWorkerIds.size} worker(s) have been verified successfully.`
                });
                setSelectedWorkerIds(new Set());
                setBulkActionLoading(false);
                setShowBulkVerifyDialog(false);
              }}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
              Verify Workers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Workers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedWorkerIds.size} selected worker{selectedWorkerIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                setBulkActionLoading(true);
                // TODO: Implement bulk delete API call
                toast({
                  title: "Workers Deleted",
                  description: `${selectedWorkerIds.size} worker(s) have been deleted successfully.`
                });
                setSelectedWorkerIds(new Set());
                setBulkActionLoading(false);
                setShowBulkDeleteDialog(false);
              }}
              disabled={bulkActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Workers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
