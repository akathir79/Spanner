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
import { ArrowLeft, Phone, Mail, Calendar, MoreHorizontal, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, AlertCircle, Search, X, Menu, Loader2, MessageCircle, Smartphone, CreditCard, Send, ArrowRightLeft, History, DollarSign, Filter, Copy, Square, ClipboardList, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import statesDistrictsData from "@/../../shared/states-districts.json";

interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  workerId: string;
  workerName: string;
  serviceCategory: string;
  status: string;
  amount: number;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  description?: string;
  location?: string;
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

// Helper functions for date formatting and booking status
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

function getBookingAge(createdAt: string): string {
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

function getBookingStatus(status?: string, scheduledAt?: string | null, completedAt?: string) {
  if (status === 'completed' && completedAt) {
    return {
      label: "Completed",
      icon: <CheckCircle className="w-3 h-3" />,
      variant: "default" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    };
  }

  if (status === 'in_progress') {
    return {
      label: "In Progress",
      icon: <Clock className="w-3 h-3" />,
      variant: "secondary" as const,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
    };
  }

  if (status === 'scheduled' && scheduledAt) {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffHours = Math.abs(now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return {
        label: "Due Soon",
        icon: <AlertCircle className="w-3 h-3" />,
        variant: "secondary" as const,
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
      };
    } else {
      return {
        label: "Scheduled",
        icon: <Calendar className="w-3 h-3" />,
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      };
    }
  }

  if (status === 'cancelled') {
    return {
      label: "Cancelled",
      icon: <XCircle className="w-3 h-3" />,
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
  }

  return {
    label: "Pending",
    icon: <Clock className="w-3 h-3" />,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
  };
}

export default function BookingManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    amount: 0,
    description: "",
    location: "",
    district: "",
    state: ""
  });
  const [filterState, setFilterState] = useState<string>("");
  const [filterDistrict, setFilterDistrict] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [selectedBookingForFinancial, setSelectedBookingForFinancial] = useState<Booking | null>(null);

  // Fetch bookings
  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/bookings'],
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch districts
  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ['/api/districts'],
    staleTime: 300000,
  });

  // Get unique states and districts from the JSON data
  const statesList = statesDistrictsData.map(item => item.state);
  
  const getDistrictsForState = (stateName: string): string[] => {
    const stateData = statesDistrictsData.find(item => item.state === stateName);
    return stateData ? stateData.districts : [];
  };

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({
        title: "Success",
        description: "Booking deleted successfully.",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking.",
        variant: "destructive",
      });
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Booking> }) => {
      const response = await fetch(`/api/admin/bookings/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({
        title: "Success",
        description: "Booking updated successfully.",
        variant: "default",
      });
      setIsEditDialogOpen(false);
      setBookingToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking.",
        variant: "destructive",
      });
    },
  });

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: Booking) => {
      const matchesSearch = 
        booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.serviceCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = !filterState || booking.state === filterState;
      const matchesDistrict = !filterDistrict || booking.district === filterDistrict;
      
      let matchesStatus = true;
      if (filterStatus) {
        const bookingStatus = getBookingStatus(booking.status, booking.scheduledAt, booking.completedAt);
        if (filterStatus === 'completed') {
          matchesStatus = booking.status === 'completed';
        } else if (filterStatus === 'in_progress') {
          matchesStatus = booking.status === 'in_progress';
        } else if (filterStatus === 'scheduled') {
          matchesStatus = booking.status === 'scheduled';
        } else if (filterStatus === 'cancelled') {
          matchesStatus = booking.status === 'cancelled';
        } else if (filterStatus === 'pending') {
          matchesStatus = booking.status === 'pending' || !booking.status;
        }
      }

      return matchesSearch && matchesState && matchesDistrict && matchesStatus;
    });
  }, [bookings, searchTerm, filterState, filterDistrict, filterStatus]);

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

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setEditForm({
      status: booking.status || "",
      amount: booking.amount || 0,
      description: booking.description || "",
      location: booking.location || "",
      district: booking.district || "",
      state: booking.state || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateBooking = () => {
    if (!bookingToEdit) return;
    
    updateBookingMutation.mutate({
      id: bookingToEdit.id,
      updates: editForm
    });
  };

  const handleViewFinancialStatements = (booking: Booking) => {
    setSelectedBookingForFinancial(booking);
    setIsFinancialModalOpen(true);
  };

  // Get district counts
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((booking: Booking) => {
      if (booking.district) {
        counts[booking.district] = (counts[booking.district] || 0) + 1;
      }
    });
    return counts;
  }, [bookings]);

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
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading bookings...</p>
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
            Failed to load bookings. Please try again.
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage service bookings and transactions</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search bookings by client, worker, service, or booking ID..."
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bookings.filter((b: Booking) => b.status === 'completed').length}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {bookings.filter((b: Booking) => b.status === 'in_progress').length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredBookings.length}</p>
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
                <Badge variant="secondary" className="text-xs">{bookings.length} total</Badge>
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

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Payment & Status</TableHead>
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
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <ClipboardList className="w-12 h-12 text-gray-400" />
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            No bookings found
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Bookings will appear here once services are booked
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => {
                      const bookingStatus = getBookingStatus(booking.status, booking.scheduledAt, booking.completedAt);
                      
                      return (
                        <TableRow key={booking.id}>
                          {/* Booking Info */}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-start gap-3 cursor-pointer">
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage 
                                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${booking.serviceCategory}`} 
                                      alt={`${booking.serviceCategory}`} 
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                      {booking.serviceCategory?.charAt(0).toUpperCase() || "S"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {booking.serviceCategory || "Service Booking"}
                                    </div>
                                    <div className="text-xs text-orange-800 dark:text-orange-400 font-mono font-bold">
                                      #{booking.id.slice(-8)}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-1">
                                        Booking
                                      </Badge>
                                      <Badge 
                                        variant={bookingStatus.variant}
                                        className={`${bookingStatus.className} text-xs px-1.5 py-0.5`}
                                      >
                                        {bookingStatus.icon}
                                        <span className="ml-1">{bookingStatus.label}</span>
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Client: {booking.clientName || "Unknown"}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Worker: {booking.workerName || "Unassigned"}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                      Created: {formatIndianDateTime(booking.createdAt)}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                      Age: {getBookingAge(booking.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-16 w-16 flex-shrink-0">
                                      <AvatarImage 
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${booking.serviceCategory}`} 
                                        alt={`${booking.serviceCategory}`} 
                                      />
                                      <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                                        {booking.serviceCategory?.charAt(0).toUpperCase() || "S"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-base">Booking Overview</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Complete booking information</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-sm"><strong>Service:</strong> {booking.serviceCategory}</div>
                                    <div className="text-sm"><strong>Booking ID:</strong> {booking.id}</div>
                                    <div className="text-sm"><strong>Client:</strong> {booking.clientName || "Unknown"}</div>
                                    <div className="text-sm"><strong>Worker:</strong> {booking.workerName || "Unassigned"}</div>
                                    <div className="flex items-center gap-2">
                                      <strong className="text-sm">Status:</strong>
                                      <Badge
                                        variant={bookingStatus.variant}
                                        className={bookingStatus.className}
                                      >
                                        {bookingStatus.icon}
                                        <span className="ml-1">{bookingStatus.label}</span>
                                      </Badge>
                                    </div>
                                    <div className="text-sm"><strong>Amount:</strong> ₹{booking.amount || 0}</div>
                                    <div className="text-sm"><strong>Created:</strong> {formatIndianDateTime(booking.createdAt)}</div>
                                    {booking.scheduledAt && (
                                      <div className="text-sm"><strong>Scheduled:</strong> {formatIndianDateTime(booking.scheduledAt)}</div>
                                    )}
                                    {booking.completedAt && (
                                      <div className="text-sm"><strong>Completed:</strong> {formatIndianDateTime(booking.completedAt)}</div>
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
                                  {booking.district && booking.state ? (
                                    <div>
                                      <div className="text-gray-900 dark:text-white">
                                        {booking.district}, {booking.state}
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
                                  <p className="font-medium">Service Location:</p>
                                  <div className="text-sm text-gray-500">
                                    {booking.district && booking.state ? 
                                      `Service in ${booking.district}, ${booking.state}` : 
                                      'No location information provided'
                                    }
                                  </div>
                                  {booking.location && (
                                    <div className="text-sm"><strong>Address:</strong> {booking.location}</div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Payment & Status */}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 cursor-pointer">
                                  <div className="font-medium">Amount: ₹{booking.amount || 0}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-3 space-y-0.5">
                                    <div>• Platform fee: ₹{Math.round((booking.amount || 0) * 0.05)}</div>
                                    <div>• Worker gets: ₹{Math.round((booking.amount || 0) * 0.95)}</div>
                                  </div>
                                  <div className="pt-1">Status: {bookingStatus.label}</div>
                                  {booking.scheduledAt && (
                                    <div>Due: {formatIndianDateTime(booking.scheduledAt).split(' ')[0]}</div>
                                  )}
                                  {booking.completedAt && (
                                    <div>Done: {formatIndianDateTime(booking.completedAt).split(' ')[0]}</div>
                                  )}
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
                                        handleViewFinancialStatements(booking);
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
                                      title="Payment Details"
                                    >
                                      <span className="text-xs font-bold transition-all duration-300 group-hover:scale-125 group-hover:text-green-700">₹</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const paymentData = `${booking.serviceCategory} - Payment Details\nAmount: ₹${booking.amount || 0}\nPlatform fee: ₹${Math.round((booking.amount || 0) * 0.05)}\nWorker gets: ₹${Math.round((booking.amount || 0) * 0.95)}\nStatus: ${bookingStatus.label}`;
                                        navigator.clipboard.writeText(paymentData);
                                      }}
                                      title="Copy Payment Data"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div className="space-y-2">
                                  <p className="font-medium">Payment & Status Summary:</p>
                                  <div className="space-y-1">
                                    <div className="text-sm"><strong>Total Amount:</strong> ₹{booking.amount || 0}</div>
                                    <div className="text-sm"><strong>Platform Fee (5%):</strong> ₹{Math.round((booking.amount || 0) * 0.05)}</div>
                                    <div className="text-sm"><strong>Worker Receives:</strong> ₹{Math.round((booking.amount || 0) * 0.95)}</div>
                                    <div className="text-sm"><strong>Current Status:</strong> {bookingStatus.label}</div>
                                    {booking.scheduledAt && (
                                      <div className="text-sm"><strong>Scheduled Date:</strong> {formatIndianDateTime(booking.scheduledAt)}</div>
                                    )}
                                    {booking.completedAt && (
                                      <div className="text-sm"><strong>Completed Date:</strong> {formatIndianDateTime(booking.completedAt)}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewFinancialStatements(booking);
                                      }}
                                      title="Payment Details"
                                    >
                                      <span className="text-xs font-bold">₹</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const paymentData = `${booking.serviceCategory} - Payment Details\nAmount: ₹${booking.amount || 0}\nPlatform fee: ₹${Math.round((booking.amount || 0) * 0.05)}\nWorker gets: ₹${Math.round((booking.amount || 0) * 0.95)}\nStatus: ${bookingStatus.label}`;
                                        navigator.clipboard.writeText(paymentData);
                                      }}
                                      title="Copy Payment Data"
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
                                    <span>Contact Both</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const contactData = `Booking #${booking.id} - Client: ${booking.clientName}, Worker: ${booking.workerName}`;
                                        navigator.clipboard.writeText(contactData);
                                      }}
                                      title="Copy Contact Info"
                                    >
                                      <Copy className="w-2 h-2" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">Via Platform</span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "WhatsApp Group",
                                          description: "Creating group chat for this booking...",
                                        });
                                      }}
                                      title="WhatsApp Group"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "SMS Alert",
                                          description: "Sending booking update via SMS...",
                                        });
                                      }}
                                      title="SMS Both"
                                    >
                                      <Square className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Email Notification",
                                          description: "Sending booking update via email...",
                                        });
                                      }}
                                      title="Email Both"
                                    >
                                      <Mail className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Platform Message",
                                          description: "Sending internal message...",
                                        });
                                      }}
                                      title="Send Platform Message"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Conference Call",
                                          description: "Initiating 3-way call...",
                                        });
                                      }}
                                      title="Call Both"
                                    >
                                      <Phone className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div className="space-y-2">
                                  <p className="font-medium">Booking Communication:</p>
                                  <div className="space-y-1">
                                    <div className="text-sm"><strong>Client:</strong> {booking.clientName || "Unknown"}</div>
                                    <div className="text-sm"><strong>Worker:</strong> {booking.workerName || "Unassigned"}</div>
                                    <div className="text-sm"><strong>Service:</strong> {booking.serviceCategory}</div>
                                    <div className="text-sm"><strong>Booking ID:</strong> {booking.id.slice(-8)}</div>
                                  </div>
                                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "WhatsApp Group",
                                          description: "Creating group chat for this booking...",
                                        });
                                      }}
                                      title="WhatsApp Group"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "SMS Alert",
                                          description: "Sending booking update via SMS...",
                                        });
                                      }}
                                      title="SMS Both"
                                    >
                                      <Square className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Email Notification",
                                          description: "Sending booking update via email...",
                                        });
                                      }}
                                      title="Email Both"
                                    >
                                      <Mail className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Platform Message",
                                          description: "Sending internal message...",
                                        });
                                      }}
                                      title="Send Platform Message"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toast({
                                          title: "Conference Call",
                                          description: "Initiating 3-way call...",
                                        });
                                      }}
                                      title="Call Both"
                                    >
                                      <Phone className="w-3 h-3" />
                                    </Button>
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
                                <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditBooking(booking)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Booking
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteBooking(booking)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modals and Dialogs */}
        {selectedBooking && (
          <ViewDetailsModal
            user={selectedBooking as any}
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedBooking(null);
            }}
          />
        )}

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the booking
                "#{bookingToDelete?.id.slice(-8)}" and remove all related data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => bookingToDelete && deleteBookingMutation.mutate(bookingToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Booking
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>
                Update booking information. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBooking} disabled={updateBookingMutation.isPending}>
                {updateBookingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Booking"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Details Modal */}
        <Dialog open={isFinancialModalOpen} onOpenChange={setIsFinancialModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                {selectedBookingForFinancial && `Payment breakdown for booking #${selectedBookingForFinancial.id.slice(-8)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-semibold mb-2">Payment Processing Coming Soon</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed payment tracking and transaction history will be available in the next update.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}