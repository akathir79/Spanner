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

// Generic interfaces for the template
interface BaseItem {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  district?: string;
  state?: string;
  status?: string;
  [key: string]: any; // Allow additional properties
}

interface StateData {
  state: string;
  districts: string[];
}

interface ManagementConfig {
  // Page Configuration
  title: string;
  backUrl: string;
  totalListLabel: string;
  totalListBadgeColor: string;
  
  // API Configuration
  fetchUrl: string;
  itemRole?: string; // Filter by role if needed
  customFilter?: (items: BaseItem[]) => BaseItem[]; // Custom filter function
  
  // Display Configuration
  itemDisplayName: (item: BaseItem) => string;
  itemDescription?: (item: BaseItem) => string;
  getItemCountForState: (state: string, items: BaseItem[]) => number;
  getItemCountForDistrict: (district: string, items: BaseItem[]) => number;
  
  // Search Configuration
  searchPlaceholder: string;
  searchFilters: Array<{
    value: string;
    label: string;
  }>;
  statusFilters: Array<{
    value: string;
    label: string;
  }>;
  
  // Table Configuration
  tableColumns: Array<{
    key: string;
    label: string;
    render: (item: BaseItem) => React.ReactNode;
  }>;
  
  // Actions Configuration
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (item: BaseItem) => void;
    variant?: "default" | "destructive" | "ghost";
    color?: string;
    tooltip?: string;
  }>;
  
  // Permissions
  requiredRoles: string[];
  
  // Styling
  stateItemBadgeColor?: string;
  loadingText?: string;
  emptyStateText?: string;
  emptyStateIcon?: React.ReactNode;
}

// Helper functions (same as ClientManagement)
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
          label: "Just Registered",
          variant: "outline" as const,
          icon: <Calendar className="w-3 h-3" />,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        };
      }
    }
    return {
      label: "Never Logged In",
      variant: "secondary" as const,
      icon: <AlertCircle className="w-3 h-3" />,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
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

function getItemStatusCategory(item: BaseItem): string {
  if (!item.lastLoginAt) {
    if (item.createdAt) {
      const created = new Date(item.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return "just_registered";
      }
    }
    return "no_login";
  }

  const lastLogin = new Date(item.lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin > 15) {
    return "inactive";
  }

  return "active";
}

interface StateBasedManagementTemplateProps {
  config: ManagementConfig;
}

export default function StateBasedManagementTemplate({ config }: StateBasedManagementTemplateProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [view, setView] = useState<"total" | "states" | "districts" | "items">("states");
  
  // Ref for rolling animation
  const totalItemButtonRef = useRef<HTMLButtonElement>(null);
  
  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState(config.searchFilters[0]?.value || "all");
  const [statusFilter, setStatusFilter] = useState(config.statusFilters[0]?.value || "all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [districtCurrentPage, setDistrictCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Fetch data based on configuration
  const { data: allItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: [config.fetchUrl],
    queryFn: async () => {
      const response = await fetch(config.fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${config.fetchUrl}`);
      }
      let items = await response.json();
      
      // Filter by role if specified
      if (config.itemRole) {
        items = items.filter((item: BaseItem) => item.role === config.itemRole);
      }
      
      // Apply custom filter if specified
      if (config.customFilter) {
        items = config.customFilter(items);
      }
      
      return items;
    },
  });

  // Get states from JSON file
  const states = (statesDistrictsData.states as StateData[]).map(s => s.state).sort();

  // Get districts for selected state from JSON file
  const districtsForState = selectedState 
    ? (statesDistrictsData.states as StateData[]).find(s => s.state === selectedState)?.districts || []
    : [];

  // Filter items for total view
  const filteredItems = useMemo(() => {
    let items = allItems;
    
    // Apply status filter
    if (statusFilter !== "all") {
      items = items.filter(item => {
        const itemStatus = getItemStatusCategory(item);
        
        switch (statusFilter) {
          case "active":
            return itemStatus === "active";
          case "inactive":
            return itemStatus === "inactive";
          case "no_login":
            return itemStatus === "no_login";
          case "just_registered":
            return itemStatus === "just_registered";
          case "verified":
            return item.isVerified === true;
          case "unverified":
            return item.isVerified === false;
          default:
            return true;
        }
      });
    }
    
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      const displayName = config.itemDisplayName(item).toLowerCase();
      
      switch (searchFilter) {
        case "id":
          return item.id.toLowerCase().includes(query);
        case "name":
          return displayName.includes(query);
        case "email":
          return item.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return item.mobile?.includes(query) || false;
        case "location":
          return item.district?.toLowerCase().includes(query) || 
                 item.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            item.id.toLowerCase().includes(query) ||
            displayName.includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.mobile?.includes(query) ||
            item.district?.toLowerCase().includes(query) ||
            item.state?.toLowerCase().includes(query)
          );
      }
    });
  }, [allItems, searchQuery, searchFilter, statusFilter, config]);

  // Filtered district items
  const filteredDistrictItems = useMemo(() => {
    if (!selectedDistrict) return [];
    
    let districtItems = allItems.filter((item: BaseItem) => item.district === selectedDistrict);
    
    // Apply status filter
    if (statusFilter !== "all") {
      districtItems = districtItems.filter(item => {
        const itemStatus = getItemStatusCategory(item);
        
        switch (statusFilter) {
          case "active":
            return itemStatus === "active";
          case "inactive":
            return itemStatus === "inactive";
          case "no_login":
            return itemStatus === "no_login";
          case "just_registered":
            return itemStatus === "just_registered";
          case "verified":
            return item.isVerified === true;
          case "unverified":
            return item.isVerified === false;
          default:
            return true;
        }
      });
    }
    
    if (!searchQuery.trim()) return districtItems;

    const query = searchQuery.toLowerCase().trim();
    return districtItems.filter(item => {
      const displayName = config.itemDisplayName(item).toLowerCase();
      
      switch (searchFilter) {
        case "id":
          return item.id.toLowerCase().includes(query);
        case "name":
          return displayName.includes(query);
        case "email":
          return item.email?.toLowerCase().includes(query) || false;
        case "mobile":
          return item.mobile?.includes(query) || false;
        case "location":
          return item.district?.toLowerCase().includes(query) || 
                 item.state?.toLowerCase().includes(query) || false;
        case "all":
        default:
          return (
            item.id.toLowerCase().includes(query) ||
            displayName.includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.mobile?.includes(query) ||
            item.district?.toLowerCase().includes(query) ||
            item.state?.toLowerCase().includes(query)
          );
      }
    });
  }, [allItems, selectedDistrict, searchQuery, searchFilter, statusFilter, config]);

  // Paginated items for current view
  const itemsForDistrict = useMemo(() => {
    const startIndex = (districtCurrentPage - 1) * pageSize;
    return filteredDistrictItems.slice(startIndex, startIndex + pageSize);
  }, [filteredDistrictItems, districtCurrentPage, pageSize]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const totalDistrictPages = Math.ceil(filteredDistrictItems.length / pageSize);

  // Navigation handlers
  const handleTotalItemsClick = () => {
    setView("total");
    setSelectedState(null);
    setSelectedDistrict(null);
    setSearchQuery("");
    setSearchFilter(config.searchFilters[0]?.value || "all");
    setCurrentPage(1);
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
      setView("items");
      setLoadingState(null);
      setDistrictCurrentPage(1);
      setSearchQuery("");
      setSearchFilter(config.searchFilters[0]?.value || "all");
    }, 200);
  };

  const handleBackClick = () => {
    if (view === "items") {
      setView("districts");
      setSelectedDistrict(null);
    } else if (view === "districts") {
      setView("states");
      setSelectedState(null);
    } else {
      setView("total");
    }
  };

  // Check permissions
  if (!user || !config.requiredRoles.includes(user.role)) {
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
                onClick={() => setLocation(config.backUrl)}
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{config.title}</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)] mt-20">
          
          {/* Left Sidebar */}
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              {/* Total Item List Header */}
              <button
                ref={totalItemButtonRef}
                onClick={(e) => {
                  const button = e.currentTarget;
                  button.classList.add('animate-roll-click');
                  setTimeout(() => {
                    button.classList.remove('animate-roll-click');
                  }, 300);
                  handleTotalItemsClick();
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
                <span className="pr-8">{config.totalListLabel}</span>
                <Badge 
                  variant="secondary" 
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs ${config.totalListBadgeColor} text-white`}
                >
                  {filteredItems.length}
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
                          className={`absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs ${config.stateItemBadgeColor || 'bg-blue-500'} text-white hover:bg-blue-600`}
                        >
                          {config.getItemCountForState(state, allItems)}
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
            {itemsLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">{config.loadingText || "Loading data..."}</p>
                </div>
              </div>
            )}

            {/* Total Item List View */}
            {!itemsLoading && view === "total" && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  {/* Header with inline search */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {config.totalListLabel}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Complete database • {filteredItems.length} total items • Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} {(searchQuery || statusFilter !== config.statusFilters[0]?.value) ? `filtered results` : ''}
                      </p>
                    </div>
                    
                    {/* Search Controls */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder={config.searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
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
                      <Select value={searchFilter} onValueChange={(value) => setSearchFilter(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.searchFilters.map((filter) => (
                            <SelectItem key={filter.value} value={filter.value}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.statusFilters.map((filter) => (
                            <SelectItem key={filter.value} value={filter.value}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {config.tableColumns.map((column) => (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        ))}
                        {config.actions && config.actions.length > 0 && (
                          <TableHead className="text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={config.tableColumns.length + (config.actions ? 1 : 0)} className="text-center py-8">
                            <div className="flex flex-col items-center gap-3">
                              {config.emptyStateIcon || <Search className="w-8 h-8 text-gray-400" />}
                              <p className="text-gray-500 dark:text-gray-400">
                                {config.emptyStateText || "No items found"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedItems.map((item) => (
                          <TableRow key={item.id}>
                            {config.tableColumns.map((column) => (
                              <TableCell key={column.key}>
                                {column.render(item)}
                              </TableCell>
                            ))}
                            {config.actions && config.actions.length > 0 && (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {config.actions.map((action, index) => (
                                      <DropdownMenuItem
                                        key={index}
                                        onClick={() => action.onClick(item)}
                                        className={action.color ? `text-${action.color}-600` : ""}
                                      >
                                        {action.icon}
                                        <span className="ml-2">{action.label}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
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
            )}

            {/* States View */}
            {!itemsLoading && view === "states" && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                    {config.emptyStateIcon || <Search className="w-16 h-16" />}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a state from the left panel to view districts
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose any state to see available districts and items
                  </p>
                </div>
              </div>
            )}

            {/* Districts View */}
            {!itemsLoading && view === "districts" && selectedState && (
              <div className="p-6">
                <div className="mb-6">
                  <Button variant="outline" onClick={handleBackClick} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to States
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Districts in {selectedState}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a district to view items
                  </p>
                </div>

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
                          <div className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span className="truncate">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <span className="truncate">{district}</span>
                          <Badge 
                            variant="secondary" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 px-2 min-w-[20px] rounded-md flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600"
                          >
                            {config.getItemCountForDistrict(district, allItems)}
                          </Badge>
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Items View */}
            {!itemsLoading && view === "items" && selectedDistrict && (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <Button variant="outline" onClick={handleBackClick} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Districts
                  </Button>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        Items in {selectedDistrict}, {selectedState}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {filteredDistrictItems.length} items found • Showing {((districtCurrentPage - 1) * pageSize) + 1}-{Math.min(districtCurrentPage * pageSize, filteredDistrictItems.length)} of {filteredDistrictItems.length}
                      </p>
                    </div>
                    
                    {/* Search Controls */}
                    <div className="flex gap-3 items-center ml-6">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder={config.searchPlaceholder}
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
                      <Select value={searchFilter} onValueChange={(value) => setSearchFilter(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.searchFilters.map((filter) => (
                            <SelectItem key={filter.value} value={filter.value}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {config.statusFilters.map((filter) => (
                            <SelectItem key={filter.value} value={filter.value}>
                              {filter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {config.tableColumns.map((column) => (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        ))}
                        {config.actions && config.actions.length > 0 && (
                          <TableHead className="text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsForDistrict.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={config.tableColumns.length + (config.actions ? 1 : 0)} className="text-center py-8">
                            <div className="flex flex-col items-center gap-3">
                              {config.emptyStateIcon || <Search className="w-8 h-8 text-gray-400" />}
                              <p className="text-gray-500 dark:text-gray-400">
                                {config.emptyStateText || "No items found"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        itemsForDistrict.map((item) => (
                          <TableRow key={item.id}>
                            {config.tableColumns.map((column) => (
                              <TableCell key={column.key}>
                                {column.render(item)}
                              </TableCell>
                            ))}
                            {config.actions && config.actions.length > 0 && (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {config.actions.map((action, index) => (
                                      <DropdownMenuItem
                                        key={index}
                                        onClick={() => action.onClick(item)}
                                        className={action.color ? `text-${action.color}-600` : ""}
                                      >
                                        {action.icon}
                                        <span className="ml-2">{action.label}</span>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalDistrictPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((districtCurrentPage - 1) * pageSize) + 1} to {Math.min(districtCurrentPage * pageSize, filteredDistrictItems.length)} of {filteredDistrictItems.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(Math.max(1, districtCurrentPage - 1))}
                        disabled={districtCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {districtCurrentPage} of {totalDistrictPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDistrictCurrentPage(Math.min(totalDistrictPages, districtCurrentPage + 1))}
                        disabled={districtCurrentPage === totalDistrictPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}