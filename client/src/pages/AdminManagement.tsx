import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Phone, Mail, Calendar, Search, X, Menu, Loader2, MessageCircle, Filter, Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, Smartphone, Shield, Crown, Copy, Square, MessageSquareText, CreditCard, ArrowRightLeft, History, DollarSign } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import statesDistrictsData from "@/../../shared/states-districts.json";

// Types
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
  profilePicture?: string;
}

interface StateData {
  state: string;
  districts: string[];
}

// Helper functions
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

export default function AdminManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Refs for animations
  const totalAdminButtonRef = useRef<HTMLButtonElement>(null);

  // State for view management
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
  const [districtCurrentPage, setDistrictCurrentPage] = useState(1);
  const pageSize = 50;
  const districtPageSize = 50;

  // Data fetching
  const { data: allAdmins = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/admins"],
  });

  // Get states from districts data
  const states = useMemo(() => {
    if (!statesDistrictsData?.states || !Array.isArray(statesDistrictsData.states)) return [];
    return statesDistrictsData.states.map((state: any) => state.state).sort();
  }, []);

  // Get districts for selected state
  const districts = useMemo(() => {
    if (!selectedState || !statesDistrictsData?.states) return [];
    const stateData = statesDistrictsData.states.find((state: any) => state.state === selectedState);
    return stateData ? stateData.districts.sort() : [];
  }, [selectedState]);

  // Filter admins by role (admin and super_admin)
  const admins = useMemo(() => {
    return allAdmins.filter((user: User) => user.role === "admin" || user.role === "super_admin");
  }, [allAdmins]);

  // Get admin count for each state from database
  const getAdminCountForState = (stateName: string) => {
    return admins.filter((admin: User) => admin.state === stateName).length;
  };

  // Get admin count for each district from database
  const getAdminCountForDistrict = (districtName: string) => {
    return admins.filter((admin: User) => admin.district === districtName).length;
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-10">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)] mt-20">
        
        {/* Left Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
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
                {admins.length}
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

        {/* Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-12 h-12" />
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Admin Management System</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Manage all administrator accounts and permissions</p>
          </div>
        </div>
      </div>
    </div>
  );
}