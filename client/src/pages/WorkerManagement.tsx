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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
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
  workerProfile?: {
    primaryService: string;
    serviceTypes: string[];
    experience: number;
    hourlyRate: number;
    rating: number;
    completedJobs: number;
    isAvailable: boolean;
  };
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
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "Invalid date";
    
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
    if (createdAt) {
      const created = new Date(createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return {
          label: "Just registered",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      }
    }
    return {
      label: "Never logged in",
      color: "text-gray-500",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    };
  }
  
  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLogin < 1) {
    return {
      label: "Active now",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    };
  } else if (hoursSinceLogin < 24) {
    return {
      label: "Active today",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    };
  } else if (hoursSinceLogin < 168) {
    return {
      label: "Active this week",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    };
  } else {
    return {
      label: "Inactive",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    };
  }
}

export default function WorkerManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusAction, setStatusAction] = useState<'verify' | 'unverify'>('verify');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data fetching
  const { data: allWorkers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/workers'],
    refetchInterval: 30000,
  });

  // Get all available service types from states-districts.json
  const allServiceTypes = useMemo(() => {
    const serviceTypesSet = new Set<string>();
    Object.values(statesDistrictsData).forEach((stateData: any) => {
      if (stateData.serviceTypes) {
        stateData.serviceTypes.forEach((serviceType: string) => {
          serviceTypesSet.add(serviceType);
        });
      }
    });
    return Array.from(serviceTypesSet).sort();
  }, []);

  // Calculate worker counts by state
  const workersByState = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allWorkers.forEach((worker: User) => {
      if (worker.district) {
        // Find the state for this district
        Object.entries(statesDistrictsData).forEach(([stateName, stateData]: [string, any]) => {
          if (stateData.districts && stateData.districts.includes(worker.district)) {
            counts[stateName] = (counts[stateName] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [allWorkers]);

  // Filter workers based on selected criteria
  const filteredWorkers = useMemo(() => {
    return allWorkers.filter((worker: User) => {
      // State filter
      if (selectedStates.length > 0) {
        const workerState = Object.entries(statesDistrictsData).find(([, stateData]: [string, any]) => 
          stateData.districts && stateData.districts.includes(worker.district)
        )?.[0];
        if (!workerState || !selectedStates.includes(workerState)) return false;
      }

      // District filter
      if (selectedDistricts.length > 0 && worker.district) {
        if (!selectedDistricts.includes(worker.district)) return false;
      }

      // Service type filter
      if (selectedServiceTypes.length > 0) {
        if (!worker.workerProfile?.primaryService || 
            !selectedServiceTypes.includes(worker.workerProfile.primaryService)) {
          // Also check serviceTypes array if available
          if (!worker.workerProfile?.serviceTypes?.some(service => 
            selectedServiceTypes.includes(service))) {
            return false;
          }
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          worker.firstName.toLowerCase().includes(query) ||
          worker.lastName.toLowerCase().includes(query) ||
          worker.mobile.includes(query) ||
          worker.email?.toLowerCase().includes(query) ||
          worker.id.toLowerCase().includes(query) ||
          worker.district?.toLowerCase().includes(query) ||
          worker.workerProfile?.primaryService?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allWorkers, selectedStates, selectedDistricts, selectedServiceTypes, searchQuery]);

  // Get districts for selected states
  const availableDistricts = useMemo(() => {
    if (selectedStates.length === 0) return [];
    
    const districts: string[] = [];
    selectedStates.forEach(stateName => {
      const stateData = statesDistrictsData[stateName as keyof typeof statesDistrictsData] as any;
      if (stateData?.districts) {
        districts.push(...stateData.districts);
      }
    });
    return districts.sort();
  }, [selectedStates]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (selectedStates.length === 0) {
      setSelectedDistricts([]);
      setSelectedServiceTypes([]);
    } else {
      // Keep only districts that belong to selected states
      setSelectedDistricts(prev => prev.filter(district => availableDistricts.includes(district)));
    }
  }, [selectedStates, availableDistricts]);

  const clearAllFilters = () => {
    setSelectedStates([]);
    setSelectedDistricts([]);
    setSelectedServiceTypes([]);
    setSearchQuery("");
  };

  const hasActiveFilters = selectedStates.length > 0 || selectedDistricts.length > 0 || selectedServiceTypes.length > 0 || searchQuery;

  // Message worker
  const sendMessageMutation = useMutation({
    mutationFn: async ({ workerId, message }: { workerId: string; message: string }) => {
      return apiRequest(`/api/admin/workers/${workerId}/message`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      setShowMessageDialog(false);
      setMessageText("");
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Update worker status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ workerId, status }: { workerId: string; status: 'verified' | 'unverified' }) => {
      return apiRequest(`/api/admin/workers/${workerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Worker ${statusAction}d successfully`,
      });
      setShowStatusDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error updating worker status:', error);
      toast({
        title: "Error",
        description: "Failed to update worker status",
        variant: "destructive",
      });
    }
  });

  // Delete worker
  const deleteWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return apiRequest(`/api/admin/workers/${workerId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Worker deleted successfully",
      });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error deleting worker:', error);
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!selectedUser || !messageText.trim()) return;
    sendMessageMutation.mutate({
      workerId: selectedUser.id,
      message: messageText
    });
  };

  const handleStatusChange = () => {
    if (!selectedUser) return;
    updateStatusMutation.mutate({
      workerId: selectedUser.id,
      status: statusAction
    });
  };

  const handleDeleteWorker = () => {
    if (!selectedUser) return;
    deleteWorkerMutation.mutate(selectedUser.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Worker Management</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className={`bg-white border-r border-gray-200 w-64 min-h-screen ${showMobileMenu ? 'block' : 'hidden lg:block'}`}>
          <div className="p-4">
            <div className="space-y-6">
              {/* Total Worker List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Total Worker List</h3>
                  <Badge variant="default" className="bg-blue-600">
                    {filteredWorkers.length}
                  </Badge>
                </div>
              </div>

              {/* States List */}
              <div className="space-y-2">
                {Object.entries(statesDistrictsData).map(([stateName, stateData]) => {
                  const workerCount = workersByState[stateName] || 0;
                  return (
                    <div key={stateName} className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedStates.includes(stateName)) {
                            setSelectedStates(selectedStates.filter(s => s !== stateName));
                          } else {
                            setSelectedStates([...selectedStates, stateName]);
                          }
                        }}
                        className={`justify-start text-left h-auto py-2 px-3 w-full ${
                          selectedStates.includes(stateName) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate text-sm">{stateName}</span>
                      </Button>
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 text-xs">
                        {workerCount}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {!selectedStates.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ArrowLeft className="h-8 w-8 text-gray-400 transform rotate-180" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a state from the left panel to view districts</h3>
                <p className="text-gray-500 text-center">Choose any state to see available districts and workers.</p>
              </CardContent>
            </Card>
          ) : !selectedDistricts.length ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Districts in {selectedStates.join(', ')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableDistricts.map(district => (
                    <Button
                      key={district}
                      variant="outline"
                      onClick={() => {
                        if (selectedDistricts.includes(district)) {
                          setSelectedDistricts(selectedDistricts.filter(d => d !== district));
                        } else {
                          setSelectedDistricts([...selectedDistricts, district]);
                        }
                      }}
                      className={`justify-start text-left h-auto py-3 px-4 ${
                        selectedDistricts.includes(district) ? 'bg-blue-50 border-blue-200 text-blue-700' : ''
                      }`}
                    >
                      {district}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Filters and Search */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search workers by name, phone, email, ID, or service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (selectedServiceTypes.includes(value)) {
                        setSelectedServiceTypes(selectedServiceTypes.filter(s => s !== value));
                      } else {
                        setSelectedServiceTypes([...selectedServiceTypes, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by Service" />
                    </SelectTrigger>
                    <SelectContent>
                      {allServiceTypes.map(serviceType => (
                        <SelectItem key={serviceType} value={serviceType}>
                          {serviceType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Active Filters Display */}
                {(selectedStates.length > 0 || selectedDistricts.length > 0 || selectedServiceTypes.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedStates.map(state => (
                      <Badge key={state} variant="secondary" className="cursor-pointer" onClick={() => 
                        setSelectedStates(selectedStates.filter(s => s !== state))
                      }>
                        State: {state} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    {selectedDistricts.map(district => (
                      <Badge key={district} variant="secondary" className="cursor-pointer" onClick={() => 
                        setSelectedDistricts(selectedDistricts.filter(d => d !== district))
                      }>
                        District: {district} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    {selectedServiceTypes.map(service => (
                      <Badge key={service} variant="secondary" className="cursor-pointer" onClick={() => 
                        setSelectedServiceTypes(selectedServiceTypes.filter(s => s !== service))
                      }>
                        Service: {service} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Workers Table */}
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading workers...</span>
                    </div>
                  ) : filteredWorkers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No workers found</h3>
                      <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Worker</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Member Since</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWorkers.map((worker) => {
                          const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
                          
                          return (
                            <TableRow key={worker.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {worker.firstName[0]}{worker.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {worker.firstName} {worker.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">ID: {worker.id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{worker.workerProfile?.primaryService || 'Not specified'}</div>
                                  {worker.workerProfile?.hourlyRate && (
                                    <div className="text-gray-500">₹{worker.workerProfile.hourlyRate}/hr</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-900">{worker.district || 'Not specified'}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center text-gray-900">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {worker.mobile}
                                  </div>
                                  {worker.email && (
                                    <div className="flex items-center text-gray-500 mt-1">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {worker.email}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <Badge variant={worker.isVerified ? "default" : "secondary"} className="w-fit">
                                    {worker.isVerified ? "Verified" : "Unverified"}
                                  </Badge>
                                  {worker.workerProfile?.isAvailable !== undefined && (
                                    <Badge variant={worker.workerProfile.isAvailable ? "outline" : "secondary"} className="w-fit">
                                      {worker.workerProfile.isAvailable ? "Available" : "Unavailable"}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-500">
                                  {getMemberSince(worker.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`${activityStatus.bgColor} ${activityStatus.borderColor} ${activityStatus.color} border`}
                                >
                                  {activityStatus.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(worker);
                                        setShowDetailsModal(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(worker);
                                        setShowMessageDialog(true);
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(worker);
                                        setStatusAction(worker.isVerified ? 'unverify' : 'verify');
                                        setShowStatusDialog(true);
                                      }}
                                    >
                                      {worker.isVerified ? (
                                        <>
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Unverify Worker
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Verify Worker
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(worker);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Worker
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedUser && (
        <ViewDetailsModal
          user={selectedUser}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Worker</DialogTitle>
            <DialogDescription>
              Send a message to {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusAction === 'verify' ? 'Verify' : 'Unverify'} Worker
            </DialogTitle>
            <DialogDescription>
              {statusAction === 'verify' 
                ? `Verify ${selectedUser?.firstName} ${selectedUser?.lastName} as a trusted worker`
                : `Remove verification from ${selectedUser?.firstName} ${selectedUser?.lastName}`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              variant={statusAction === 'verify' ? 'default' : 'destructive'}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                statusAction === 'verify' ? 'Verify Worker' : 'Unverify Worker'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorker}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteWorkerMutation.isPending}
            >
              {deleteWorkerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Worker'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}