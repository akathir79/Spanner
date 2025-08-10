import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedStatusBadge, useStatusTransition } from "@/components/ui/animated-status-badge";
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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Copy, Square, Users, Shield, Ban, RotateCcw } from "lucide-react";
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
  status?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  district?: string;
  state?: string;
  address?: string;
  pincode?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankMICR?: string;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  hasRejoinRequest?: boolean;
  rejoinRequestedAt?: string;
  rejoinRequestReason?: string;
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
          variant: "outline" as const,
          icon: <Calendar className="w-3 h-3" />,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        };
      }
    }
    return {
      label: "No Login",
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

export default function WorkerManagement() {
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "no_login" | "just_registered" | "verified" | "unverified" | "pending" | "approved" | "rejected">("all");

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
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [verificationComment, setVerificationComment] = useState("");
  const [workerToVerify, setWorkerToVerify] = useState<User | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinRequestWorker, setRejoinRequestWorker] = useState<User | null>(null);

  // Animation refs
  const totalWorkerButtonRef = useRef<HTMLButtonElement>(null);

  // Data fetching
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Handle error state after all hooks are declared
  if (usersError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load worker data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Type the financialStatements as an array to fix TypeScript errors
  const typedFinancialStatements: any[] = [];

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
          case "pending":
            return worker.status === "pending";
          case "approved":
            return worker.status === "approved";
          case "rejected":
            return worker.status === "rejected";
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

  // Paginated workers for current view
  const workers = useMemo(() => {
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
  const states = (statesDistrictsData.states as StateData[]).map(s => s.state).sort();

  // Get districts for selected state from JSON file
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as StateData[]).find(s => s.state === selectedState)?.districts || []
    : [];

  // Filtered district workers (without pagination)
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
          case "pending":
            return worker.status === "pending";
          case "approved":
            return worker.status === "approved";
          case "rejected":
            return worker.status === "rejected";
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
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

  // Paginated district workers
  const districtWorkers = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * districtPageSize;
    const endIndex = startIndex + districtPageSize;
    const paginated = filteredDistrictWorkers.slice(startIndex, endIndex);
    
    // Update total pages for district view
    const calculatedTotalPages = Math.ceil(filteredDistrictWorkers.length / districtPageSize);
    if (calculatedTotalPages !== districtTotalPages) {
      setDistrictTotalPages(calculatedTotalPages);
    }
    
    return paginated;
  }, [filteredDistrictWorkers, districtCurrentPage, districtPageSize, districtTotalPages]);

  // Navigation handlers
  const handleTotalWorkersClick = () => {
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

  const getWorkerCountForState = (state: string): number => {
    return allWorkers.filter((worker: User) => worker.state === state).length;
  };

  const getWorkerCountForDistrict = (district: string): number => {
    return allWorkers.filter((worker: User) => worker.district === district).length;
  };

  // Action handlers
  const handleViewDetails = (worker: User) => {
    setSelectedUser(worker);
    setIsViewDetailsOpen(true);
  };

  const handleEditUser = (worker: User) => {
    // Implement edit functionality
    toast({
      title: "Edit Worker",
      description: `Edit functionality for ${worker.firstName} ${worker.lastName} will be implemented.`,
    });
  };

  const handleDeleteUser = (worker: User) => {
    setUserToDelete(worker);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/delete-user/${userToDelete.id}`);
      
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users"]
      });
      
      toast({
        title: "Worker Deleted",
        description: `${userToDelete.firstName} ${userToDelete.lastName} has been successfully deleted.`,
      });
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete worker. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = (worker: User) => {
    setUserToMessage(worker);
    setMessageText("");
    setIsMessageDialogOpen(true);
  };

  const sendMessage = async () => {
    if (!userToMessage || !messageText.trim()) return;
    
    setSendingMessage(true);
    
    try {
      await apiRequest("/api/admin/send-message", "POST", {
        userId: userToMessage.id,
        message: messageText.trim()
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

  const handleCallWorker = (worker: User) => {
    if (worker.mobile) {
      window.open(`tel:${worker.mobile}`, '_blank');
    } else {
      toast({
        title: "No Phone Number",
        description: "This worker doesn't have a phone number registered.",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppWorker = (worker: User) => {
    if (worker.mobile) {
      // Remove any non-digit characters from mobile number
      const phoneNumber = worker.mobile.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast({
        title: "No Phone Number",
        description: "This worker doesn't have a phone number registered.",
        variant: "destructive"
      });
    }
  };

  const handleSendSMS = (worker: User) => {
    // Handle SMS functionality
    toast({
      title: "SMS Feature",
      description: `SMS will be sent to ${worker.firstName} ${worker.lastName} (${worker.mobile})`,
    });
  };

  const handleVerifyUser = (worker: User) => {
    // Handle user verification
    toast({
      title: "Verify User",
      description: `Verification status updated for ${worker.firstName} ${worker.lastName}`,
    });
  };

  // Worker suspension mutation
  const suspendWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return await apiRequest("POST", `/api/admin/suspend-worker/${workerId}`, { reason: "Suspended by admin" });
    },
    onSuccess: (_, workerId) => {
      toast({
        title: "Worker Suspended",
        description: "Worker has been suspended and cannot access their dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Suspension Failed",
        description: error.message || "Failed to suspend worker",
        variant: "destructive",
      });
    },
  });

  // Worker resume mutation
  const resumeWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return await apiRequest("POST", `/api/admin/resume-worker/${workerId}`, {});
    },
    onSuccess: (_, workerId) => {
      toast({
        title: "Worker Resumed",
        description: "Worker has been resumed and can now access their dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Resume Failed",
        description: error.message || "Failed to resume worker",
        variant: "destructive",
      });
    },
  });

  const handleSuspendUser = (worker: User) => {
    suspendWorkerMutation.mutate(worker.id);
  };

  const handleResumeUser = (worker: User) => {
    resumeWorkerMutation.mutate(worker.id);
  };

  const handleViewRejoinRequest = (worker: User) => {
    setRejoinRequestWorker(worker);
    setShowRejoinModal(true);
  };

  // Worker approval mutation
  const approveWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return await apiRequest("POST", `/api/admin/approve-worker/${workerId}`, {});
    },
    onSuccess: (_, workerId) => {
      toast({
        title: "Worker Approved",
        description: "Worker has been approved and can now access their dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve worker",
        variant: "destructive",
      });
    },
  });

  // Worker rejection mutation
  const rejectWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return await apiRequest("DELETE", `/api/admin/reject-worker/${workerId}`, {});
    },
    onSuccess: (_, workerId) => {
      toast({
        title: "Worker Rejected",
        description: "Worker application has been rejected and removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject worker",
        variant: "destructive",
      });
    },
  });

  const handleVerifyWorker = (worker: User) => {
    setWorkerToVerify(worker);
    setVerificationComment("");
    setIsVerificationDialogOpen(true);
  };

  const handleConfirmVerification = async (shouldApprove: boolean) => {
    if (!workerToVerify || !verificationComment.trim()) {
      toast({
        title: "Error", 
        description: "Please provide a verification comment",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const endpoint = shouldApprove ? "approve-worker" : "verify-worker";
      const response = await apiRequest("POST", `/api/admin/${endpoint}/${workerToVerify.id}`, { comment: verificationComment });

      if (response) {
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        toast({
          title: shouldApprove ? "Worker Approved" : "Worker Verified",
          description: shouldApprove ? "Worker has been verified and approved successfully" : "Worker has been verified successfully",
        });
        setIsVerificationDialogOpen(false);
        setVerificationComment("");
        setWorkerToVerify(null);
      }
    } catch (error) {
      console.error("Error processing worker:", error);
      toast({
        title: "Error",
        description: "Failed to process worker verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApproveWorker = (worker: User) => {
    approveWorkerMutation.mutate(worker.id);
  };

  const handleRejectWorker = (worker: User) => {
    rejectWorkerMutation.mutate(worker.id);
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worker Management</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)] mt-20">
          {/* Left Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden relative z-10`}>
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600"
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
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto relative z-0">
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
                        Complete worker database • {filteredWorkers.length} total workers • Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredWorkers.length)} of {filteredWorkers.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls - moved inline */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search workers..."
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
                          <SelectItem value="id">Worker ID</SelectItem>
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
                  {workers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Users className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No workers registered yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Worker registrations will appear here</p>
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
                                    <SelectItem value="pending">Pending Approval</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
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
                            <TableHead>Location</TableHead>
                            <TableHead>Bookings/Earnings</TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Contact</span>
                                <div className="flex gap-1">
                                  <FaWhatsapp className="w-3 h-3 text-gray-400" />
                                  <MessageSquare className="w-3 h-3 text-gray-400" />
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <BiMessageSquareDetail className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead>Bank Details</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workers.map((worker) => {
                            const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
                            const previousApprovalStatus = useStatusTransition(worker.status || "unknown");
                            
                            return (
                              <TableRow key={worker.id}>
                                {/* User Info */}
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-start gap-3 cursor-pointer">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarImage 
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${worker.firstName}%20${worker.lastName}`} 
                                            alt={`${worker.firstName} ${worker.lastName}`} 
                                          />
                                          <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                                            {worker.firstName?.charAt(0).toUpperCase()}{worker.lastName?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {worker.firstName} {worker.lastName}
                                          </div>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                                                ID: {worker.id}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="font-mono">{worker.id}</p>
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
                                                variant={worker.isVerified ? "default" : "secondary"}
                                                className={
                                                  worker.isVerified 
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                                }
                                              >
                                                {worker.isVerified ? "Verified" : "Unverified"}
                                              </Badge>
                                              <AnimatedStatusBadge
                                                status={worker.status as "pending" | "approved" | "rejected" || "pending"}
                                                previousStatus={previousApprovalStatus as "pending" | "approved" | "rejected" || "pending"}
                                                size="sm"
                                                showIcon={true}
                                              />
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              Member since: {getMemberSince(worker.createdAt)}
                                            </div>
                                            {worker.lastLoginAt && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Last login: {formatIndianDateTime(worker.lastLoginAt)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-left">
                                        <p className="font-semibold">{worker.firstName} {worker.lastName}</p>
                                        <p className="text-sm">ID: {worker.id}</p>
                                        <p className="text-sm">Status: {activityStatus.label}</p>
                                        <p className="text-sm">Verification: {worker.isVerified ? "Verified" : "Unverified"}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>

                                {/* Location */}
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {worker.district || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Address:
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {worker.address ? worker.address.slice(0, 50) + (worker.address.length > 50 ? '...' : '') : 'Not provided'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {worker.state || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    PIN: {worker.pincode || "Not provided"}
                                  </div>
                                </TableCell>

                                {/* Bookings/Earnings */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Bookings: </span>
                                      <span className="font-medium">0</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • In progress: 0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Completed: 0
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Balance: </span>
                                      <span className="font-medium">₹0</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Spent: ₹0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Commission: ₹0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      GST: ₹0
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Contact */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Phone className="w-3 h-3" />
                                      <span className="font-mono">{worker.mobile}</span>
                                    </div>
                                    {worker.email && (
                                      <div className="flex items-center gap-1 text-xs truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{worker.email}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-2">
                                      <Phone className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => handleCallWorker(worker)} />
                                      <MessageSquare className="w-4 h-4 text-green-600 hover:text-green-700 cursor-pointer" onClick={() => handleWhatsAppWorker(worker)} />
                                      <Mail className="w-4 h-4 text-red-600 hover:text-red-700 cursor-pointer" onClick={() => copyToClipboard(worker.email || '', "Email")} />
                                      <Send className="w-4 h-4 text-purple-600 hover:text-purple-700 cursor-pointer" onClick={() => handleSendMessage(worker)} />
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Bank Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {(worker as any).workerBankDetails ? (
                                        <>
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            ****{((worker as any).workerBankDetails.accountNumber || '').slice(-4)}
                                          </div>
                                          <div className="text-xs">
                                            IFSC: {(worker as any).workerBankDetails.ifscCode || "Not provided"}
                                          </div>
                                          <div className="text-xs">
                                            MICR: {(worker as any).workerBankDetails.micrCode || "Not provided"}
                                          </div>
                                          <div className="text-xs font-medium">
                                            {worker.bankName}
                                          </div>
                                          <div className="text-xs">
                                            {worker.bankBranch || "Not provided"}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            PIN: {worker.pincode || "Not provided"}
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-gray-400 italic">Not provided</span>
                                      )}
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
                                      <DropdownMenuItem onClick={() => handleViewDetails(worker)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      
                                      {/* Show verification actions for pending workers */}
                                      {worker.status === "pending" && (
                                        <>
                                          <DropdownMenuItem 
                                            onClick={() => handleVerifyWorker(worker)}
                                            disabled={isVerifying}
                                          >
                                            <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-blue-600">
                                              {isVerifying ? "Verifying..." : "Verify User"}
                                            </span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleRejectWorker(worker)}
                                            disabled={rejectWorkerMutation.isPending}
                                          >
                                            <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                            <span className="text-red-600">
                                              {rejectWorkerMutation.isPending ? "Rejecting..." : "Reject Application"}
                                            </span>
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      {/* Show approval action for verified workers */}
                                      {worker.status === "verified" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleApproveWorker(worker)}
                                          disabled={approveWorkerMutation.isPending}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">
                                            {approveWorkerMutation.isPending ? "Approving..." : "Approve User"}
                                          </span>
                                        </DropdownMenuItem>
                                      )}
                                      
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Send Message
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => handleWhatsAppWorker(worker)}>
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
                                          <DropdownMenuItem onClick={() => handleSendMessage(worker)}>
                                            <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                            <span className="text-purple-600">Message</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      
                                      {/* Suspend/Resume actions for approved workers */}
                                      {worker.status === "approved" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleSuspendUser(worker)}
                                          disabled={suspendWorkerMutation.isPending}
                                        >
                                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                          <span className="text-red-600">
                                            {suspendWorkerMutation.isPending ? "Suspending..." : "Suspend User"}
                                          </span>
                                        </DropdownMenuItem>
                                      )}

                                      {/* Resume action for suspended workers */}
                                      {worker.status === "suspended" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleResumeUser(worker)}
                                          disabled={resumeWorkerMutation.isPending}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">
                                            {resumeWorkerMutation.isPending ? "Resuming..." : "Resume User"}
                                          </span>
                                        </DropdownMenuItem>
                                      )}
                                      
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredWorkers.length)} of {filteredWorkers.length} workers
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
                    Browse workers by district in {selectedState}
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
                                {getWorkerCountForDistrict(district)} workers
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {getWorkerCountForDistrict(district)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* District Workers View */}
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
                        Workers in {selectedDistrict}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedState} • {filteredDistrictWorkers.length} workers • Showing {((districtCurrentPage - 1) * districtPageSize) + 1}-{Math.min(districtCurrentPage * districtPageSize, filteredDistrictWorkers.length)} of {filteredDistrictWorkers.length} {(searchQuery || statusFilter !== 'all') ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search workers..."
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
                          <SelectItem value="id">Worker ID</SelectItem>
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
                  {districtWorkers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <Users className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No workers found in {selectedDistrict}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Worker registrations from this district will appear here</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[190px]">
                              <div className="flex items-center gap-2">
                                <span>Worker</span>
                                <Select value={statusFilter} onValueChange={(value) => {
                                  setStatusFilter(value as any);
                                  setDistrictCurrentPage(1);
                                }}>
                                  <SelectTrigger className="w-8 h-8 p-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded">
                                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending Approval</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
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
                            <TableHead className="w-[120px]">Earnings</TableHead>
                            <TableHead className="w-[160px]">
                              <div className="flex items-center gap-1">
                                <span>Contact</span>
                                <div className="flex gap-1">
                                  <FaWhatsapp className="w-3 h-3 text-gray-400" />
                                  <MessageSquare className="w-3 h-3 text-gray-400" />
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <BiMessageSquareDetail className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {districtWorkers.map((worker) => {
                            const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
                            const previousApprovalStatus = useStatusTransition(worker.status || "unknown");
                            
                            return (
                              <TableRow key={worker.id}>
                                {/* User Info */}
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-start gap-3 cursor-pointer">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarImage 
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${worker.firstName}%20${worker.lastName}`} 
                                            alt={`${worker.firstName} ${worker.lastName}`} 
                                          />
                                          <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                                            {worker.firstName?.charAt(0).toUpperCase()}{worker.lastName?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {worker.firstName} {worker.lastName}
                                          </div>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                                                ID: {worker.id}
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="font-mono">{worker.id}</p>
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
                                                variant={worker.isVerified ? "default" : "secondary"}
                                                className={
                                                  worker.isVerified 
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                                }
                                              >
                                                {worker.isVerified ? "Verified" : "Unverified"}
                                              </Badge>
                                              <AnimatedStatusBadge
                                                status={worker.status as "pending" | "approved" | "rejected" || "pending"}
                                                previousStatus={previousApprovalStatus as "pending" | "approved" | "rejected" || "pending"}
                                                size="sm"
                                                showIcon={true}
                                              />
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              Member since: {getMemberSince(worker.createdAt)}
                                            </div>
                                            {worker.lastLoginAt && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Last login: {formatIndianDateTime(worker.lastLoginAt)}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-left">
                                        <p className="font-semibold">{worker.firstName} {worker.lastName}</p>
                                        <p className="text-sm">ID: {worker.id}</p>
                                        <p className="text-sm">Status: {activityStatus.label}</p>
                                        <p className="text-sm">Verification: {worker.isVerified ? "Verified" : "Unverified"}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>

                                {/* Location */}
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {worker.district || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Address:
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {worker.address ? worker.address.slice(0, 50) + (worker.address.length > 50 ? '...' : '') : 'Not provided'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {worker.state || "Not specified"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    PIN: {worker.pincode || "Not provided"}
                                  </div>
                                </TableCell>

                                {/* Bookings/Earnings */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Bookings: </span>
                                      <span className="font-medium">0</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • In progress: 0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      • Completed: 0
                                    </div>
                                    <div className="text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Balance: </span>
                                      <span className="font-medium">₹0</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Spent: ₹0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Commission: ₹0
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      GST: ₹0
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Contact */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Phone className="w-3 h-3" />
                                      <span className="font-mono">{worker.mobile}</span>
                                    </div>
                                    {worker.email && (
                                      <div className="flex items-center gap-1 text-xs truncate">
                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{worker.email}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Phone className="w-4 h-4 text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => handleCallWorker(worker)} />
                                      <MessageSquare className="w-4 h-4 text-green-600 hover:text-green-700 cursor-pointer" onClick={() => handleWhatsAppWorker(worker)} />
                                      <Mail className="w-4 h-4 text-red-600 hover:text-red-700 cursor-pointer" onClick={() => copyToClipboard(worker.email || '', "Email")} />
                                      <Send className="w-4 h-4 text-purple-600 hover:text-purple-700 cursor-pointer" onClick={() => handleSendMessage(worker)} />
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Bank Details */}
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {(worker as any).workerBankDetails ? (worker as any).workerBankDetails.bankName : worker.bankName ? (
                                        <>
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            ****{((worker as any).workerBankDetails?.accountNumber || worker.bankAccountNumber || '').slice(-4)}
                                          </div>
                                          <div className="text-xs">
                                            IFSC: {(worker as any).workerBankDetails?.ifscCode || worker.bankIFSC || "Not provided"}
                                          </div>
                                          <div className="text-xs">
                                            MICR: {(worker as any).workerBankDetails?.micrCode || worker.bankMICR || "Not provided"}
                                          </div>
                                          <div className="text-xs font-medium">
                                            {(worker as any).workerBankDetails?.bankName || worker.bankName}
                                          </div>
                                          <div className="text-xs">
                                            {(worker as any).workerBankDetails?.branchName || worker.bankBranch || "Not provided"}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Type: {(worker as any).workerBankDetails?.accountType || worker.bankAccountType || "savings"}
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-gray-400 italic">Not provided</span>
                                      )}
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
                                      <DropdownMenuItem onClick={() => handleViewDetails(worker)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      
                                      {/* Show verification actions for pending workers */}
                                      {worker.status === "pending" && (
                                        <>
                                          <DropdownMenuItem 
                                            onClick={() => handleVerifyWorker(worker)}
                                            disabled={isVerifying}
                                          >
                                            <Shield className="w-4 h-4 mr-2 text-blue-600" />
                                            <span className="text-blue-600">
                                              {isVerifying ? "Verifying..." : "Verify User"}
                                            </span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleRejectWorker(worker)}
                                            disabled={rejectWorkerMutation.isPending}
                                          >
                                            <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                            <span className="text-red-600">
                                              {rejectWorkerMutation.isPending ? "Rejecting..." : "Reject Application"}
                                            </span>
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      {/* Show approval action for verified workers */}
                                      {worker.status === "verified" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleApproveWorker(worker)}
                                          disabled={approveWorkerMutation.isPending}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">
                                            {approveWorkerMutation.isPending ? "Approving..." : "Approve User"}
                                          </span>
                                        </DropdownMenuItem>
                                      )}
                                      
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Send Message
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => handleWhatsAppWorker(worker)}>
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
                                          <DropdownMenuItem onClick={() => handleSendMessage(worker)}>
                                            <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
                                            <span className="text-purple-600">Message</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      
                                      {/* Suspend/Resume actions for approved workers */}
                                      {worker.status === "approved" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleSuspendUser(worker)}
                                          disabled={suspendWorkerMutation.isPending}
                                        >
                                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                          <span className="text-red-600">
                                            {suspendWorkerMutation.isPending ? "Suspending..." : "Suspend User"}
                                          </span>
                                        </DropdownMenuItem>
                                      )}

                                      {/* Resume action for suspended workers */}
                                      {worker.status === "suspended" && (
                                        <DropdownMenuItem 
                                          onClick={() => handleSuspendUser(worker)}
                                          disabled={resumeWorkerMutation.isPending}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                          <span className="text-green-600">
                                            {resumeWorkerMutation.isPending ? "Resuming..." : "Resume User"}
                                          </span>
                                        </DropdownMenuItem>
                                      )}
                                      
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

                  {/* District Pagination */}
                  {districtTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((districtCurrentPage - 1) * districtPageSize) + 1} to {Math.min(districtCurrentPage * districtPageSize, filteredDistrictWorkers.length)} of {filteredDistrictWorkers.length} workers in {selectedDistrict}
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
            title="Worker Details"
            subtitle="Complete worker registration information"
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

        {/* Worker Verification Dialog */}
        <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Verify Worker
              </DialogTitle>
              <DialogDescription>
                {workerToVerify && (
                  <>
                    Please provide a verification comment for{" "}
                    <span className="font-medium">{workerToVerify.firstName} {workerToVerify.lastName}</span>.
                    This will help track verification methods and reasons.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="verificationComment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Verification Comment *
                </label>
                <textarea
                  id="verificationComment"
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  placeholder="e.g., Verified documents manually, ID checked via video call, etc."
                  className="mt-1 w-full p-3 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                  disabled={isVerifying}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This comment will be saved and displayed when hovering over the worker's name.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerificationDialogOpen(false);
                  setVerificationComment("");
                  setWorkerToVerify(null);
                }}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirmVerification(false)}
                disabled={isVerifying || !verificationComment.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Only
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleConfirmVerification(true)}
                disabled={isVerifying || !verificationComment.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Approve
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejoin Request Review Modal */}
        <Dialog open={showRejoinModal} onOpenChange={setShowRejoinModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Rejoin Request</DialogTitle>
              <DialogDescription>
                {rejoinRequestWorker && (
                  <>
                    Review the rejoin request from{" "}
                    <span className="font-medium">{rejoinRequestWorker.firstName} {rejoinRequestWorker.lastName}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Worker Information
                </label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-sm"><strong>ID:</strong> {rejoinRequestWorker?.id}</p>
                  <p className="text-sm"><strong>Mobile:</strong> {rejoinRequestWorker?.mobile}</p>
                  <p className="text-sm"><strong>Suspended:</strong> {rejoinRequestWorker?.suspendedAt ? new Date(rejoinRequestWorker.suspendedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rejoin Request Reason
                </label>
                <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {rejoinRequestWorker?.rejoinRequestReason || "No reason provided"}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Original Suspension Reason
                </label>
                <div className="mt-1 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    {rejoinRequestWorker?.suspensionReason || "No reason provided"}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejoinModal(false);
                  setRejoinRequestWorker(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (rejoinRequestWorker) {
                    handleResumeUser(rejoinRequestWorker);
                    setShowRejoinModal(false);
                    setRejoinRequestWorker(null);
                  }
                }}
                disabled={resumeWorkerMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {resumeWorkerMutation.isPending ? "Approving..." : "Approve & Resume"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}