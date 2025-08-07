import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Wrench, Star } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, WorkerProfile } from "@shared/schema";

// Enhanced worker type with profile information
interface WorkerWithProfile extends User {
  workerProfile?: WorkerProfile;
}

// Helper function to format date in Indian timezone
function formatIndianDateTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Helper function to get activity status
function getActivityStatus(lastLoginAt: string | null, createdAt: string) {
  if (!lastLoginAt) {
    // Check if user was created recently (within 24 hours)
    const created = new Date(createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation < 24) {
      return {
        label: "Just Registered",
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        icon: <AlertCircle className="w-3 h-3" />
      };
    }
    return {
      label: "No Login",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      icon: <XCircle className="w-3 h-3" />
    };
  }

  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin > 15) {
    return {
      label: "Inactive",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      icon: <XCircle className="w-3 h-3" />
    };
  }

  return {
    label: "Active",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    icon: <CheckCircle className="w-3 h-3" />
  };
}

// Helper function to get worker status category for filtering
function getWorkerStatusCategory(worker: WorkerWithProfile): string {
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
  const [searchFilter, setSearchFilter] = useState<"all" | "id" | "name" | "email" | "mobile" | "location" | "service">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "no_login" | "just_registered" | "verified" | "unverified" | "approved" | "pending">("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  
  // Pagination states for handling large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  
  // District-specific pagination states
  const [districtCurrentPage, setDistrictCurrentPage] = useState(1);
  const [districtPageSize, setDistrictPageSize] = useState(50);
  const [districtTotalPages, setDistrictTotalPages] = useState(1);
  
  // Modal states
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithProfile | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferHistoryDialog, setShowTransferHistoryDialog] = useState(false);
  const [showFinancialStatementsDialog, setShowFinancialStatementsDialog] = useState(false);
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

  // Fetch transfer history for selected worker
  const { data: transferHistory = [], isLoading: transferHistoryLoading } = useQuery({
    queryKey: ["/api/transfer-history", selectedWorker?.id],
    enabled: !!selectedWorker?.id && showTransferHistoryDialog,
  });

  // Fetch financial statements for selected worker (last 2 years)
  const { data: financialStatements = [], isLoading: financialStatementsLoading } = useQuery({
    queryKey: ["/api/financial-statements", selectedWorker?.id],
    enabled: !!selectedWorker?.id && showFinancialStatementsDialog,
  });

  // Memoize filtered workers to prevent recalculation on every render
  const allWorkers = useMemo(() => {
    return (users as WorkerWithProfile[]).filter((u: WorkerWithProfile) => u.role === "worker");
  }, [users]);

  // Filtered workers (without pagination)
  const filteredWorkers = useMemo(() => {
    let filtered = allWorkers;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(worker => {
        const userStatus = getWorkerStatusCategory(worker);
        
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
          case "approved":
            return worker.status === "approved";
          case "pending":
            return worker.status === "pending";
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(worker => {
        switch (searchFilter) {
          case "id":
            return worker.id.toLowerCase().includes(query);
          case "name":
            return `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(query);
          case "email":
            return worker.email?.toLowerCase().includes(query);
          case "mobile":
            return worker.mobile.includes(query);
          case "location":
            return `${worker.district} ${worker.state}`.toLowerCase().includes(query);
          case "service":
            return worker.workerProfile?.primaryService?.toLowerCase().includes(query);
          case "all":
          default:
            return (
              worker.id.toLowerCase().includes(query) ||
              `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(query) ||
              worker.email?.toLowerCase().includes(query) ||
              worker.mobile.includes(query) ||
              `${worker.district} ${worker.state}`.toLowerCase().includes(query) ||
              worker.workerProfile?.primaryService?.toLowerCase().includes(query)
            );
        }
      });
    }

    return filtered;
  }, [allWorkers, statusFilter, searchQuery, searchFilter]);

  // Apply pagination to filtered workers
  const workers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedWorkers = filteredWorkers.slice(startIndex, endIndex);
    
    // Update total pages
    const totalPages = Math.ceil(filteredWorkers.length / pageSize);
    setTotalPages(totalPages);
    
    return paginatedWorkers;
  }, [filteredWorkers, currentPage, pageSize]);

  // Memoize state and district summary data
  const { stateData, districtData } = useMemo(() => {
    const stateMap = new Map<string, { workers: number; districts: Set<string> }>();
    const districtMap = new Map<string, { workers: number; state: string }>();

    allWorkers.forEach(worker => {
      if (worker.state && worker.district) {
        // State data
        if (!stateMap.has(worker.state)) {
          stateMap.set(worker.state, { workers: 0, districts: new Set() });
        }
        const stateInfo = stateMap.get(worker.state)!;
        stateInfo.workers++;
        stateInfo.districts.add(worker.district);

        // District data
        const districtKey = `${worker.state}-${worker.district}`;
        if (!districtMap.has(districtKey)) {
          districtMap.set(districtKey, { workers: 0, state: worker.state });
        }
        districtMap.get(districtKey)!.workers++;
      }
    });

    const stateDataArray = Array.from(stateMap.entries()).map(([state, info]) => ({
      state,
      workers: info.workers,
      districts: info.districts.size,
    })).sort((a, b) => b.workers - a.workers);

    const districtDataArray = Array.from(districtMap.entries()).map(([key, info]) => {
      const [state, district] = key.split('-');
      return {
        district,
        state: info.state,
        workers: info.workers,
      };
    }).sort((a, b) => b.workers - a.workers);

    return { stateData: stateDataArray, districtData: districtDataArray };
  }, [allWorkers]);

  // Filter district data by selected state
  const filteredDistrictData = useMemo(() => {
    if (!selectedState) return districtData;
    return districtData.filter(d => d.state === selectedState);
  }, [districtData, selectedState]);

  // Apply pagination to district data
  const paginatedDistrictData = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * districtPageSize;
    const endIndex = startIndex + districtPageSize;
    const paginatedDistricts = filteredDistrictData.slice(startIndex, endIndex);
    
    // Update total pages for districts
    const totalPages = Math.ceil(filteredDistrictData.length / districtPageSize);
    setDistrictTotalPages(totalPages);
    
    return paginatedDistricts;
  }, [filteredDistrictData, districtCurrentPage, districtPageSize]);

  // Generate workers mutation
  const generateWorkersMutation = useMutation({
    mutationFn: async () => {
      setLoadingState("Generating workers...");
      await apiRequest("/api/admin/generate-workers", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "Workers generated successfully!" });
      setLoadingState(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate workers" });
      setLoadingState(null);
    },
  });

  // Delete worker mutation
  const deleteWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      await apiRequest(`/api/admin/users/${workerId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "Worker deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedWorker(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete worker" });
    },
  });

  // Navigation functions
  const navigateToStates = () => {
    setView("states");
    setSelectedState(null);
    setSelectedDistrict(null);
  };

  const navigateToDistricts = (state: string) => {
    setSelectedState(state);
    setView("districts");
    setDistrictCurrentPage(1);
  };

  const navigateToWorkers = (state: string, district: string) => {
    setSelectedState(state);
    setSelectedDistrict(district);
    setView("workers");
    setCurrentPage(1);
  };

  const navigateToWorkersTotal = () => {
    setView("workers");
    setSelectedState(null);
    setSelectedDistrict(null);
    setCurrentPage(1);
  };

  // Handle rolling animation on total workers button
  const handleTotalWorkersClick = () => {
    if (totalWorkerButtonRef.current) {
      totalWorkerButtonRef.current.style.animation = 'none';
      totalWorkerButtonRef.current.offsetHeight; // Trigger reflow
      totalWorkerButtonRef.current.style.animation = 'rollBounce 0.6s ease-in-out';
    }
    navigateToWorkersTotal();
  };

  const handleWorkerAction = (action: string, worker: WorkerWithProfile) => {
    setSelectedWorker(worker);
    switch (action) {
      case "view":
        setShowDetailsDialog(true);
        break;
      case "message":
        setShowMessageDialog(true);
        break;
      case "delete":
        setShowDeleteDialog(true);
        break;
      case "transfer-history":
        setShowTransferHistoryDialog(true);
        break;
      case "financial-statements":
        setShowFinancialStatementsDialog(true);
        break;
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worker Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage worker accounts and profiles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => generateWorkersMutation.mutate()}
                disabled={generateWorkersMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generateWorkersMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Generate Workers
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Sidebar */}
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-80px)]`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Total Workers Card */}
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleTotalWorkersClick}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      {!sidebarCollapsed && (
                        <>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Workers</p>
                          <p 
                            ref={totalWorkerButtonRef}
                            className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                          >
                            {allWorkers.length.toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>
                    <Wrench className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              {/* Status Overview */}
              {!sidebarCollapsed && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Worker Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Active</span>
                      <span className="font-medium text-green-600">{allWorkers.filter(w => getWorkerStatusCategory(w) === "active").length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Verified</span>
                      <span className="font-medium text-blue-600">{allWorkers.filter(w => w.isVerified).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Approved</span>
                      <span className="font-medium text-purple-600">{allWorkers.filter(w => w.status === "approved").length}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Breadcrumb */}
            <div className="bg-gray-100 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <button
                  onClick={navigateToStates}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 ${view === "states" ? "text-blue-600 dark:text-blue-400 font-medium" : ""}`}
                >
                  States ({stateData.length})
                </button>
                {selectedState && (
                  <>
                    <span>/</span>
                    <button
                      onClick={() => navigateToDistricts(selectedState)}
                      className={`hover:text-blue-600 dark:hover:text-blue-400 ${view === "districts" ? "text-blue-600 dark:text-blue-400 font-medium" : ""}`}
                    >
                      {selectedState} Districts ({filteredDistrictData.length})
                    </button>
                  </>
                )}
                {selectedDistrict && (
                  <>
                    <span>/</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {selectedDistrict} Workers ({allWorkers.filter(w => w.state === selectedState && w.district === selectedDistrict).length})
                    </span>
                  </>
                )}
                {view === "workers" && !selectedState && !selectedDistrict && (
                  <>
                    <span>/</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      All Workers ({filteredWorkers.length})
                    </span>
                  </>
                )}
              </div>
            </div>

            {view === "states" && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stateData.map((state) => (
                    <Card key={state.state} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToDistricts(state.state)}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{state.state}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{state.districts} districts</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{state.workers} workers</p>
                          </div>
                          <Wrench className="w-8 h-8 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {view === "districts" && selectedState && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedDistrictData.map((district) => (
                    <Card key={`${district.state}-${district.district}`} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToWorkers(district.state, district.district)}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{district.district}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{district.state}</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{district.workers} workers</p>
                          </div>
                          <Wrench className="w-8 h-8 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* District Pagination */}
                {districtTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((districtCurrentPage - 1) * districtPageSize) + 1} to {Math.min(districtCurrentPage * districtPageSize, filteredDistrictData.length)} of {filteredDistrictData.length} districts
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(Math.max(1, districtCurrentPage - 1))}
                        disabled={districtCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {districtCurrentPage} of {districtTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(Math.min(districtTotalPages, districtCurrentPage + 1))}
                        disabled={districtCurrentPage === districtTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === "workers" && (
              <div className="flex-1 flex flex-col">
                {/* Search and Filter Controls */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search workers..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="flex-1"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setCurrentPage(1);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Select value={searchFilter} onValueChange={(value) => {
                      setSearchFilter(value as any);
                      setCurrentPage(1); // Reset to first page when changing filter
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {workers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No workers registered yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Worker registrations will appear here</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">Worker</TableHead>
                            <TableHead className="w-[70px]">Role</TableHead>
                            <TableHead className="w-[140px]">Service</TableHead>
                            <TableHead className="w-[140px]">Location</TableHead>
                            <TableHead className="w-[140px]">Jobs/Earnings</TableHead>
                            <TableHead className="w-[140px]">
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
                                        <FaWhatsapp className="w-3 h-3" />
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
                                        <Smartphone className="w-3 h-3" />
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
                            <TableHead className="w-[130px]">Bank Details</TableHead>
                            <TableHead className="w-[90px]">
                              <div className="flex items-center gap-2">
                                <span>Status</span>
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
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workers.map((worker) => {
                            const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
                            return (
                              <TableRow key={worker.id}>
                                <TableCell className="py-2">
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {worker.firstName} {worker.lastName}
                                  </div>
                                  <div className="text-xs text-green-800 dark:text-green-400 font-mono font-bold">
                                    ID: {worker.id}
                                  </div>
                                  <Badge 
                                    variant={activityStatus.variant}
                                    className={`${activityStatus.className} text-xs px-1.5 py-0.5`}
                                  >
                                    {activityStatus.icon}
                                    <span className="ml-1">{activityStatus.label}</span>
                                  </Badge>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Last: {worker.lastLoginAt ? formatIndianDateTime(worker.lastLoginAt) : 'Never'}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Reg: {formatIndianDateTime(worker.createdAt)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-100 text-xs px-2 py-1">
                                  <Wrench className="w-3 h-3 mr-1" />
                                  Worker
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {worker.workerProfile?.primaryService || "Not Set"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {worker.workerProfile?.experienceYears || 0} years exp
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {worker.workerProfile?.rating || "0.0"}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {worker.district}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {worker.state}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="font-bold text-gray-900 dark:text-white">Jobs:</span> {worker.workerProfile?.totalJobs || 0}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-bold text-gray-900 dark:text-white">Rate:</span> ₹{worker.workerProfile?.hourlyRate || 0}/hr
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Commission: ₹0
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    GST: ₹0
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Phone className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{worker.mobile}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {worker.email && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                          <Mail className="w-4 h-4 text-gray-600" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{worker.email}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="space-y-1">
                                  {worker.bankAccountNumber ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Complete
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Missing
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="space-y-1">
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={worker.status === "approved" ? "default" : "secondary"} className="text-xs">
                                      {worker.status === "approved" ? "Approved" : "Pending"}
                                    </Badge>
                                    <Badge variant={worker.isVerified ? "default" : "secondary"} className="text-xs">
                                      {worker.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleWorkerAction("view", worker)}
                                        className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      >
                                        <Eye className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>
                                </div>
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}