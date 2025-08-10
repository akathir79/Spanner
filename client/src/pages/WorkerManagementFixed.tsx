import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedStatusBadge } from "@/components/ui/animated-status-badge";
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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Copy, Square, Users, Shield } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
// ViewDetailsModal removed - using inline dialog instead
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
}

interface StateData {
  state: string;
  districts: string[];
}

function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "Not available";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Convert to IST
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcDate.getTime() + istOffset);
    
    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
    
    return istFormatter.format(date) + " IST";
  } catch (error) {
    return "Invalid date";
  }
}

function getTimeSince(dateString: string): string {
  if (!dateString) return "Never";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    }
    
    const months = Math.floor(diffDays / 30);
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  } catch (error) {
    return "Unknown";
  }
}

function getUserBadgeData(user: User): { color: string; text: string; variant: "default" | "destructive" | "secondary" | "outline" } {
  if (!user.lastLoginAt) {
    if (user.createdAt) {
      const created = new Date(user.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return {
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
          text: "Just Registered",
          variant: "secondary"
        };
      }
    }
    return {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      text: "Never Logged In",
      variant: "destructive"
    };
  }

  const lastLogin = new Date(user.lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin <= 30) {
    return {
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      text: "Active",
      variant: "default"
    };
  } else {
    return {
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      text: "Inactive",
      variant: "secondary"
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

export default function WorkerManagementFixed() {
  // ALL HOOKS MUST BE DEFINED AT THE TOP LEVEL - NO CONDITIONAL HOOKS
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Core state
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

  // Animation refs
  const totalWorkerButtonRef = useRef<HTMLButtonElement>(null);

  // Constants
  const pageSize = 50;
  const districtPageSize = 50;

  // Data fetching - MUST BE BEFORE ANY EARLY RETURNS
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Worker mutations - MUST BE BEFORE ANY EARLY RETURNS
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

  // Memoized calculations - MUST BE BEFORE ANY EARLY RETURNS
  const allWorkers = useMemo(() => {
    return (users as User[]).filter((u: User) => u.role === "worker");
  }, [users]);

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

  const calculatedTotalPages = useMemo(() => {
    return Math.ceil(filteredWorkers.length / pageSize);
  }, [filteredWorkers.length, pageSize]);

  const workers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWorkers.slice(startIndex, endIndex);
  }, [filteredWorkers, currentPage, pageSize]);

  // Effects - MUST BE BEFORE ANY EARLY RETURNS
  useEffect(() => {
    if (calculatedTotalPages !== totalPages) {
      setTotalPages(calculatedTotalPages);
    }
  }, [calculatedTotalPages, totalPages]);

  useEffect(() => {
    const button = totalWorkerButtonRef.current;
    if (button) {
      button.classList.add('animate-roll-in');
      const timer = setTimeout(() => {
        button.classList.remove('animate-roll-in');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Event handlers
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
        setWorkerToVerify(null);
        setVerificationComment("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process verification",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
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

  // EARLY RETURNS MUST BE AFTER ALL HOOKS
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

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading worker data...</p>
        </div>
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
          {/* Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden relative z-10`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                ref={totalWorkerButtonRef}
                onClick={() => setView("total")}
                className={`w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center font-medium border transition-all duration-300 ${
                  view === "total" 
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300' 
                    : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="pr-8">Total Worker List</span>
                <Badge variant="secondary" className="ml-2 bg-blue-600 text-white hover:bg-blue-700">
                  {allWorkers.length}
                </Badge>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <Label className="text-sm font-medium">Search Workers</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search workers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Search By</Label>
                <Select value={searchFilter} onValueChange={(value: any) => setSearchFilter(value)}>
                  <SelectTrigger className="mt-1">
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

              <div>
                <Label className="text-sm font-medium">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="no_login">Never Logged In</SelectItem>
                    <SelectItem value="just_registered">Just Registered</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-6 overflow-y-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        {view === "total" && "All Workers"}
                        {view === "districts" && `Workers in ${selectedState}`}
                        {view === "district" && `Workers in ${selectedDistrict}, ${selectedState}`}
                      </h2>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                          Total: {filteredWorkers.length}
                        </Badge>
                        {filteredWorkers.length !== allWorkers.length && (
                          <Badge variant="secondary" className="text-sm">
                            Filtered from {allWorkers.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Workers Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Avatar</TableHead>
                          <TableHead>Worker Details</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workers.map((worker) => (
                          <TableRow key={worker.id}>
                            <TableCell>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src="" alt={`${worker.firstName} ${worker.lastName}`} />
                                <AvatarFallback>
                                  {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {worker.firstName} {worker.lastName}
                                  </p>
                                  {worker.isVerified && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {worker.id}</p>
                                {worker.district && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {worker.district}, {worker.state}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{worker.mobile}</span>
                                </div>
                                {worker.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{worker.email}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <AnimatedStatusBadge
                                  status={(worker.status as "verified" | "pending" | "approved" | "rejected" | "unknown") || "pending"}
                                  className="text-xs"
                                />
                                <Badge
                                  variant={getUserBadgeData(worker).variant}
                                  className={`text-xs ${getUserBadgeData(worker).color}`}
                                >
                                  {getUserBadgeData(worker).text}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                <p>Joined: {getTimeSince(worker.createdAt)} ago</p>
                                {worker.lastLoginAt && (
                                  <p>Last login: {getTimeSince(worker.lastLoginAt)} ago</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(worker);
                                    setIsViewDetailsOpen(true);
                                  }}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  
                                  {worker.status === "pending" && (
                                    <DropdownMenuItem onClick={() => handleVerifyWorker(worker)}>
                                      <Shield className="w-4 h-4 mr-2" />
                                      Verify Worker
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem onClick={() => copyToClipboard(worker.mobile, "Mobile number")}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Mobile
                                  </DropdownMenuItem>
                                  
                                  {worker.email && (
                                    <DropdownMenuItem onClick={() => copyToClipboard(worker.email!, "Email")}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy Email
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredWorkers.length)} of {filteredWorkers.length} workers
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Verification Dialog */}
        <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Worker</DialogTitle>
              <DialogDescription>
                Please provide verification details for {workerToVerify?.firstName} {workerToVerify?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-comment">Verification Comment *</Label>
                <Textarea
                  id="verification-comment"
                  placeholder="Enter verification method and details..."
                  value={verificationComment}
                  onChange={(e) => setVerificationComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVerificationDialogOpen(false)}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirmVerification(false)}
                disabled={isVerifying || !verificationComment.trim()}
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify Only
              </Button>
              <Button
                onClick={() => handleConfirmVerification(true)}
                disabled={isVerifying || !verificationComment.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDetailsOpen} onOpenChange={(open) => {
          setIsViewDetailsOpen(open);
          if (!open) setSelectedUser(null);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Worker Details</DialogTitle>
              {selectedUser && (
                <DialogDescription>
                  View details for {selectedUser.firstName} {selectedUser.lastName}
                </DialogDescription>
              )}
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="" alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                    <AvatarFallback>
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-sm text-gray-500">ID: {selectedUser.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <AnimatedStatusBadge
                        status={(selectedUser.status as "verified" | "pending" | "approved" | "rejected" | "unknown") || "pending"}
                        className="text-xs"
                      />
                      {selectedUser.isVerified && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Contact Information</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{selectedUser.mobile}</span>
                      </div>
                      {selectedUser.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedUser.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm">{selectedUser.district}, {selectedUser.state}</p>
                      {selectedUser.address && (
                        <p className="text-sm text-gray-600">{selectedUser.address}</p>
                      )}
                      {selectedUser.pincode && (
                        <p className="text-sm text-gray-600">PIN: {selectedUser.pincode}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Account Information</Label>
                    <div className="space-y-1 mt-2">
                      <p className="text-sm">Joined: {formatDateForDisplay(selectedUser.createdAt)}</p>
                      {selectedUser.lastLoginAt && (
                        <p className="text-sm">Last Login: {formatDateForDisplay(selectedUser.lastLoginAt)}</p>
                      )}
                    </div>
                  </div>

                  {selectedUser.bankAccountNumber && (
                    <div>
                      <Label className="text-sm font-medium">Banking Details</Label>
                      <div className="space-y-1 mt-2">
                        <p className="text-sm">Account: ****{selectedUser.bankAccountNumber.slice(-4)}</p>
                        <p className="text-sm">IFSC: {selectedUser.bankIFSC}</p>
                        <p className="text-sm">Holder: {selectedUser.bankAccountHolderName}</p>
                        {selectedUser.bankName && (
                          <p className="text-sm">Bank: {selectedUser.bankName}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}