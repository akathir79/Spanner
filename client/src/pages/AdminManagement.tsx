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
    
    // Format in Indian timezone (UTC+5:30)
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    
    const day = istDate.getDate().toString().padStart(2, '0');
    const month = (istDate.getMonth() + 1).toString().padStart(2, '0');
    const year = istDate.getFullYear();
    const hours = istDate.getHours().toString().padStart(2, '0');
    const minutes = istDate.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return "Date error";
  }
}

function getMemberSince(createdAt: string): string {
  if (!createdAt) return "Unknown";
  try {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? "1 month" : `${months} months`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "1 year" : `${years} years`;
  } catch (error) {
    return "Unknown";
  }
}

function getActivityStatus(lastLoginAt?: string | null, createdAt?: string) {
  if (!lastLoginAt) {
    // Check if recently registered (within 24 hours)
    if (createdAt) {
      const now = new Date();
      const created = new Date(createdAt);
      const diffHours = Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        return {
          label: "Just Registered",
          icon: <CheckCircle className="w-3 h-3" />,
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
        };
      }
    }
    return {
      label: "No Login",
      icon: <XCircle className="w-3 h-3" />,
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
  }

  const now = new Date();
  const lastLogin = new Date(lastLoginAt);
  const diffHours = Math.abs(now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 1) {
    return {
      label: "Just Now",
      icon: <CheckCircle className="w-3 h-3" />,
      variant: "default" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    };
  } else if (diffHours < 24) {
    return {
      label: `${Math.floor(diffHours)}h ago`,
      icon: <CheckCircle className="w-3 h-3" />,
      variant: "default" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    };
  } else if (diffDays < 7) {
    return {
      label: `${Math.floor(diffDays)}d ago`,
      icon: <AlertCircle className="w-3 h-3" />,
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
    };
  } else {
    return {
      label: "Inactive",
      icon: <XCircle className="w-3 h-3" />,
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
  }
}

export default function AdminManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    district: "",
    state: "",
    isVerified: false
  });
  const [filterState, setFilterState] = useState<string>("");
  const [filterDistrict, setFilterDistrict] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [selectedUserForFinancial, setSelectedUserForFinancial] = useState<User | null>(null);

  // Fetch admins
  const { data: admins = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/admins'],
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Ensure admins is always an array
  const safeAdmins = Array.isArray(admins) ? admins : [];

  // Fetch districts
  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ['/api/districts'],
    staleTime: 300000,
  });

  // Get unique states and districts from the JSON data
  const statesList = statesDistrictsData?.states ? statesDistrictsData.states.map(item => item.state) : [];
  
  const getDistrictsForState = (stateName: string): string[] => {
    if (!statesDistrictsData?.states) return [];
    const stateData = statesDistrictsData.states.find(item => item.state === stateName);
    return stateData ? stateData.districts : [];
  };

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete admin');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] });
      toast({
        title: "Success",
        description: "Admin deleted successfully.",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin.",
        variant: "destructive",
      });
    },
  });

  // Update admin mutation
  const updateAdminMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/admins/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update admin');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] });
      toast({
        title: "Success",
        description: "Admin updated successfully.",
        variant: "default",
      });
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin.",
        variant: "destructive",
      });
    },
  });

  // Filter admins
  const filteredAdmins = useMemo(() => {
    return safeAdmins.filter((admin: User) => {
      const matchesSearch = 
        admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.mobile?.includes(searchTerm) ||
        admin.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = !filterState || admin.state === filterState;
      const matchesDistrict = !filterDistrict || admin.district === filterDistrict;
      
      let matchesStatus = true;
      if (filterStatus) {
        const activityStatus = getActivityStatus(admin.lastLoginAt, admin.createdAt);
        if (filterStatus === 'verified') {
          matchesStatus = admin.isVerified;
        } else if (filterStatus === 'unverified') {
          matchesStatus = !admin.isVerified;
        } else if (filterStatus === 'active') {
          matchesStatus = activityStatus.label !== 'No Login' && activityStatus.label !== 'Inactive';
        } else if (filterStatus === 'inactive') {
          matchesStatus = activityStatus.label === 'No Login' || activityStatus.label === 'Inactive';
        }
      }

      return matchesSearch && matchesState && matchesDistrict && matchesStatus;
    });
  }, [admins, searchTerm, filterState, filterDistrict, filterStatus]);

  // Get unique districts for selected state
  const availableDistricts = useMemo(() => {
    return filterState ? getDistrictsForState(filterState) : [];
  }, [filterState]);

  // Reset district filter when state changes
  useEffect(() => {
    if (filterState && !availableDistricts.includes(filterDistrict)) {
      setFilterDistrict("");
    }
  }, [filterState, filterDistrict, availableDistricts]);

  const handleViewAdmin = (admin: User) => {
    setSelectedUser(admin);
    setIsViewModalOpen(true);
  };

  const handleEditAdmin = (admin: User) => {
    setUserToEdit(admin);
    setEditForm({
      firstName: admin.firstName || "",
      lastName: admin.lastName || "",
      email: admin.email || "",
      mobile: admin.mobile || "",
      district: admin.district || "",
      state: admin.state || "",
      isVerified: admin.isVerified || false
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteAdmin = (admin: User) => {
    setUserToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateAdmin = () => {
    if (!userToEdit) return;
    
    updateAdminMutation.mutate({
      id: userToEdit.id,
      updates: editForm
    });
  };

  const handleViewFinancialStatements = (admin: User) => {
    setSelectedUserForFinancial(admin);
    setIsFinancialModalOpen(true);
  };

  // Get district counts
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    safeAdmins.forEach((admin: User) => {
      if (admin.district) {
        counts[admin.district] = (counts[admin.district] || 0) + 1;
      }
    });
    return counts;
  }, [admins]);

  // Get top districts
  const topDistricts = useMemo(() => {
    return Object.entries(districtCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }, [districtCounts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading admins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load admins. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage admin accounts and permissions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search admins by name, email, mobile, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filterState || filterDistrict || filterStatus) && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {[filterState, filterDistrict, filterStatus].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="filter-state">State</Label>
                    <Select value={filterState} onValueChange={setFilterState}>
                      <SelectTrigger>
                        <SelectValue placeholder="All states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All states</SelectItem>
                        {statesList.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-district">District</Label>
                    <Select value={filterDistrict} onValueChange={setFilterDistrict} disabled={!filterState}>
                      <SelectTrigger>
                        <SelectValue placeholder="All districts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All districts</SelectItem>
                        {availableDistricts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-status">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterState("");
                        setFilterDistrict("");
                        setFilterStatus("");
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{safeAdmins.length}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {safeAdmins.filter((a: User) => a.isVerified).length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unverified</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {safeAdmins.filter((a: User) => !a.isVerified).length}
                  </p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredAdmins.length}</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Districts */}
        {topDistricts.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Districts</h3>
                <Badge variant="secondary" className="text-xs">{safeAdmins.length} total</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {topDistricts.map(([district, count]) => (
                  <Button
                    key={district}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterDistrict(district);
                      // Set the state for this district if not already set
                      if (!filterState) {
                        const stateForDistrict = statesDistrictsData.find(s => 
                          s.districts.includes(district)
                        )?.state;
                        if (stateForDistrict) {
                          setFilterState(stateForDistrict);
                        }
                      }
                    }}
                    className="h-5 px-2 min-w-[20px] rounded-md text-xs bg-green-500 text-white hover:bg-green-600"
                  >
                    <span>{district}</span>
                    <Badge variant="secondary" className="ml-1 text-xs bg-white text-green-700">
                      {count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admins Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Management & Oversight</TableHead>
                    <TableHead>
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
                          <TooltipContent>
                            <p>Bulk WhatsApp</p>
                          </TooltipContent>
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
                          <TooltipContent>
                            <p>Bulk SMS</p>
                          </TooltipContent>
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
                          <TooltipContent>
                            <p>Bulk Email</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                              onClick={() => {
                                toast({ title: "Messages", description: "Bulk internal messaging coming soon!" });
                              }}
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bulk Messages</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => {
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
                                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {admin.firstName} {admin.lastName}
                                  </div>
                                  <div className="text-xs text-orange-800 dark:text-orange-400 font-mono font-bold">
                                    #{admin.id.slice(-8)}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-100 text-xs px-2 py-1">
                                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
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
                                      variant={admin.isVerified ? "default" : "destructive"}
                                      className={admin.isVerified 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs" 
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs"
                                      }
                                    >
                                      {admin.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Last: {admin.lastLoginAt ? formatIndianDateTime(admin.lastLoginAt) : 'No Login'}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Reg: {formatIndianDateTime(admin.createdAt)}
                                  </div>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Member since {getMemberSince(admin.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-16 w-16 flex-shrink-0">
                                    <AvatarImage 
                                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${admin.firstName}%20${admin.lastName}`} 
                                      alt={`${admin.firstName} ${admin.lastName}`} 
                                    />
                                    <AvatarFallback className="bg-purple-100 text-purple-600 font-bold text-lg">
                                      {admin.firstName.charAt(0).toUpperCase()}{admin.lastName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-base">Admin Profile Overview</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Complete user information</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm"><strong>Full Name:</strong> {admin.firstName} {admin.lastName}</div>
                                  <div className="text-sm"><strong>Admin ID:</strong> {admin.id}</div>
                                  <div className="text-sm"><strong>Role:</strong> {admin.role === "super_admin" ? "Super Admin" : "Admin"}</div>
                                  <div className="flex items-center gap-2">
                                    <strong className="text-sm">Verification Status:</strong>
                                    <Badge
                                      variant={admin.isVerified ? "default" : "destructive"}
                                      className={admin.isVerified 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                      }
                                    >
                                      {admin.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <strong className="text-sm">Activity Status:</strong>
                                    <Badge
                                      variant={
                                        activityStatus.label === 'Just Registered' || 
                                        activityStatus.label === 'No Login' || 
                                        activityStatus.label === 'Inactive' ||
                                        !admin.isVerified ? "destructive" : "default"
                                      }
                                      className={
                                        activityStatus.label === 'Just Registered' || 
                                        activityStatus.label === 'No Login' || 
                                        activityStatus.label === 'Inactive' ||
                                        !admin.isVerified
                                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" 
                                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                      }
                                    >
                                      {activityStatus.icon}
                                      <span className="ml-1">{activityStatus.label}</span>
                                    </Badge>
                                  </div>
                                  <div className="text-sm"><strong>Registration Date:</strong> {formatIndianDateTime(admin.createdAt)}</div>
                                  <div className="text-sm"><strong>Last Login:</strong> {admin.lastLoginAt ? formatIndianDateTime(admin.lastLoginAt) : 'No Login'}</div>
                                  {admin.mobile && (
                                    <div className="text-sm"><strong>Mobile:</strong> {admin.mobile}</div>
                                  )}
                                  {admin.email && (
                                    <div className="text-sm"><strong>Email:</strong> {admin.email}</div>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        
                        {/* Location */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm space-y-1 cursor-pointer">
                                {admin.district && admin.state ? (
                                  <div>
                                    <div className="text-gray-900 dark:text-white">
                                      {admin.district}, {admin.state}
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
                                <div className="text-sm text-gray-500">
                                  {admin.district && admin.state ? 
                                    `Located in ${admin.district}, ${admin.state}` : 
                                    'No location information provided'
                                  }
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Management & Oversight */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 cursor-pointer">
                                <div className="font-medium">Managed Users: 0</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-3 space-y-0.5">
                                  <div>• Clients: 0</div>
                                  <div>• Workers: 0</div>
                                </div>
                                <div className="pt-1">Approvals: 0</div>
                                <div>Rejections: 0</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 space-y-0.5">
                                  <div>Created: {formatIndianDateTime(admin.createdAt).split(' ')[0]}</div>
                                  <div>Last Active: {admin.lastLoginAt ? formatIndianDateTime(admin.lastLoginAt).split(' ')[0] : 'Never'}</div>
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
                                      handleViewFinancialStatements(admin);
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
                                    title="Management Reports"
                                  >
                                    <span className="text-xs font-bold transition-all duration-300 group-hover:scale-125 group-hover:text-green-700">🗂</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const managementData = `${admin.firstName} ${admin.lastName} - Admin Summary\nManaged Users: 0 (Clients: 0, Workers: 0)\nApprovals: 0\nRejections: 0\nCreated: ${formatIndianDateTime(admin.createdAt)}\nLast Active: ${admin.lastLoginAt ? formatIndianDateTime(admin.lastLoginAt) : 'Never'}`;
                                      navigator.clipboard.writeText(managementData);
                                    }}
                                    title="Copy Admin Data"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-2">
                                <p className="font-medium">Management & Oversight Summary:</p>
                                <div className="space-y-1">
                                  <div className="text-sm"><strong>Managed Users:</strong> 0</div>
                                  <div className="text-sm ml-2">• Clients: 0</div>
                                  <div className="text-sm ml-2">• Workers: 0</div>
                                  <div className="text-sm"><strong>Total Approvals:</strong> 0</div>
                                  <div className="text-sm"><strong>Total Rejections:</strong> 0</div>
                                  <div className="text-sm"><strong>Account Created:</strong> {formatIndianDateTime(admin.createdAt)}</div>
                                  <div className="text-sm"><strong>Last Active:</strong> {admin.lastLoginAt ? formatIndianDateTime(admin.lastLoginAt) : 'Never'}</div>
                                </div>
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewFinancialStatements(admin);
                                    }}
                                    title="Management Reports"
                                  >
                                    <span className="text-xs font-bold">🗂</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const managementData = `${admin.firstName} ${admin.lastName} - Admin Summary\nManaged Users: 0 (Clients: 0, Workers: 0)\nApprovals: 0\nRejections: 0\nCreated: ${formatIndianDateTime(admin.createdAt)}\nLast Active: ${admin.lastLoginAt ? formatIndianDateTime(admin.lastLoginAt) : 'Never'}`;
                                      navigator.clipboard.writeText(managementData);
                                    }}
                                    title="Copy Admin Data"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm space-y-1 cursor-pointer">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Phone className="w-3 h-3" />
                                  <span>{admin.mobile}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(admin.mobile);
                                    }}
                                    title="Copy Mobile Number"
                                  >
                                    <Copy className="w-2 h-2" />
                                  </Button>
                                </div>
                                {admin.email && (
                                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Mail className="w-3 h-3" />
                                    <a 
                                      href={`mailto:${admin.email}`}
                                      className="truncate max-w-[150px] text-blue-600 hover:text-blue-700 underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {admin.email}
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
                                      window.open(`https://wa.me/91${admin.mobile}`, '_blank');
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
                                      window.location.href = `sms:+91${admin.mobile}`;
                                    }}
                                    title="SMS"
                                  >
                                    <Square className="w-3 h-3" />
                                  </Button>
                                  {admin.email && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `mailto:${admin.email}`;
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
                                      window.location.href = `tel:+91${admin.mobile}`;
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
                                    <span>{admin.mobile}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(admin.mobile);
                                      }}
                                      title="Copy Mobile Number"
                                    >
                                      <Copy className="w-2 h-2" />
                                    </Button>
                                  </div>
                                  {admin.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3" />
                                      <a 
                                        href={`mailto:${admin.email}`}
                                        className="text-blue-600 hover:text-blue-700 underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {admin.email}
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
                                        window.open(`https://wa.me/91${admin.mobile}`, '_blank');
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
                                        window.location.href = `sms:+91${admin.mobile}`;
                                      }}
                                      title="SMS"
                                    >
                                      <Square className="w-3 h-3" />
                                    </Button>
                                    {admin.email && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.location.href = `mailto:${admin.email}`;
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
                                        window.location.href = `tel:+91${admin.mobile}`;
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

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewAdmin(admin)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAdmin(admin)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAdmin(admin)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Admin
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
          </CardContent>
        </Card>

        {/* Modals and Dialogs */}
        {selectedUser && (
          <ViewDetailsModal
            user={selectedUser}
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedUser(null);
            }}
          />
        )}

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the admin
                "{userToDelete?.firstName} {userToDelete?.lastName}" and remove all their data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDelete && deleteAdminMutation.mutate(userToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Admin</DialogTitle>
              <DialogDescription>
                Update admin information. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={editForm.state}
                    onValueChange={(value) => {
                      setEditForm(prev => ({ ...prev, state: value, district: "" }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {statesList.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select
                    value={editForm.district}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, district: value }))}
                    disabled={!editForm.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {editForm.state && getDistrictsForState(editForm.state).map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={editForm.isVerified}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isVerified: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isVerified">Verified Admin</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAdmin} disabled={updateAdminMutation.isPending}>
                {updateAdminMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Admin"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Management Reports Modal */}
        <Dialog open={isFinancialModalOpen} onOpenChange={setIsFinancialModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Management Reports</DialogTitle>
              <DialogDescription>
                {selectedUserForFinancial && `Management overview for ${selectedUserForFinancial.firstName} ${selectedUserForFinancial.lastName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Shield className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <p className="text-lg font-semibold mb-2">Management Reports Coming Soon</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed management reports and user oversight analytics will be available in the next update.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}