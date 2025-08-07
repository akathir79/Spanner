import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  BarChart3,
  UserCheck,
  Clock,
  Filter,
  Search,
  DollarSign,
  Briefcase,
  Star,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Ban,
  Unlock,
  MessageSquare,
  ChevronDown,
  Check,
  Upload,
  User,
  X,
  Database,
  Download,
  CloudUpload,
  Save,
  FileUp,
  FileDown,
  RefreshCw,
  FileText
} from "lucide-react";
import { useLocation } from "wouter";
import WorkerApprovalSection from "@/components/WorkerApprovalSection";
import { FloatingMessaging } from "@/components/FloatingMessaging";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Form schema for creating admin users
const createAdminSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  districtId: z.string().min(1, "Please select a district"),
  profilePicture: z.string().optional()
});

type CreateAdminForm = z.infer<typeof createAdminSchema>;

export default function AdminDashboard() {
  const { user, isLoading: authLoading, login } = useAuth();
  const currentUser = user; // Reference for clarity in nested components
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [bookingFilter, setBookingFilter] = useState("");

  const [activeTab, setActiveTab] = useState("approvals");
  const [messageDialogUser, setMessageDialogUser] = useState<any>(null);
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [databaseManagementOpen, setDatabaseManagementOpen] = useState(false);
  const [districtManagerOpen, setDistrictManagerOpen] = useState(false);
  const [adminProfilePreview, setAdminProfilePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Create admin form
  const createAdminForm = useForm<CreateAdminForm>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      address: "",
      districtId: "",
      profilePicture: ""
    }
  });

  // Fetch admin data (hooks must be called unconditionally)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then(res => res.json()),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin")
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    queryFn: () => fetch("/api/admin/bookings").then(res => res.json()),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin")
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
    queryFn: () => fetch("/api/districts").then(res => res.json()),
    enabled: !!user && (user.role === "admin" || user.role === "super_admin")
  });

  // Update user verification status
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/verify`, { isVerified });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User verification status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Create admin user mutation
  const createAdminMutation = useMutation({
    mutationFn: async (adminData: CreateAdminForm) => {
      const response = await apiRequest("POST", "/api/admin/create-admin", {
        ...adminData,
        role: "admin"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin Created",
        description: "New admin user has been created successfully. They can now login using OTP.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateAdminModalOpen(false);
      createAdminForm.reset();
      setAdminProfilePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    },
  });

  // Database management mutations
  const exportDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/database/export");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Database Pull Complete",
        description: "Database exported successfully. Current data pulled to backup system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Pull Failed",
        description: error.message || "Failed to export database",
        variant: "destructive",
      });
    },
  });

  const restoreDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/database/restore");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Database Push Complete",
        description: "Database restored successfully. Backup data pushed and overwrites existing data.",
      });
      // Refresh all data after restore
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Push Failed",
        description: error.message || "Failed to restore database",
        variant: "destructive",
      });
    },
  });

  const downloadBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/database/download", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to download backup");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `spanner-database-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Save Complete",
        description: "Database backup downloaded to your local system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to download backup",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation (super admin only)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/delete-user/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User and all associated data have been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Handle admin creation form submission
  const onCreateAdminSubmit = (data: CreateAdminForm) => {
    createAdminMutation.mutate(data);
  };

  // Handle user verification
  const handleVerifyUser = (userId: string, isVerified: boolean) => {
    verifyUserMutation.mutate({ userId, isVerified });
  };

  // Handle user deletion
  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
    setDeleteConfirmUser(null);
  };

  // Handle admin profile picture upload
  const handleAdminProfilePictureUpload = (file: File | null) => {
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setAdminProfilePreview(base64String);
      createAdminForm.setValue("profilePicture", base64String);
    };
    reader.readAsDataURL(file);
  };

  // Remove admin profile picture
  const removeAdminProfilePicture = () => {
    setAdminProfilePreview(null);
    createAdminForm.setValue("profilePicture", "");
    // Reset the file input
    const fileInput = document.getElementById("adminProfilePictureInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };



  // Quick login for demo purposes
  const quickLogin = async () => {
    try {
      setIsLoading(true);
      
      // Step 1: Request OTP for super admin
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: "9000000001", // Super admin mobile
          role: "super_admin"
        })
      });
      
      const loginResult = await loginResponse.json();
      
      if (loginResult.success && loginResult.otp) {
        // Step 2: Verify OTP automatically (since we got it from the response)
        const verifyResponse = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: "9000000001",
            otp: loginResult.otp,
            purpose: "login"
          })
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (verifyResponse.ok && verifyResult.user) {
          // Update auth context with the user
          login(verifyResult.user);
          toast({
            title: "Success",
            description: "Super admin login successful!",
          });
          // Navigate to admin dashboard without reload
          setLocation("/admin-dashboard");
        } else {
          toast({
            title: "Error",
            description: "Failed to verify super admin login",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error", 
          description: loginResult.message || "Failed to send super admin OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Quick login failed:", error);
      toast({
        title: "Error",
        description: "Super admin login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Authentication redirect logic in useEffect to avoid render warnings
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation("/");
      } else if (user.role !== "admin" && user.role !== "super_admin") {
        if (user.role === "client") {
          setLocation("/dashboard");
        } else if (user.role === "worker") {
          setLocation("/worker-dashboard");
        }
      }
    }
  }, [user, authLoading, setLocation]);

  // Show login interface for unauthenticated users
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <CardHeader className="text-center">
            <CardTitle>Admin Dashboard Access</CardTitle>
            <CardDescription>
              You need to be logged in as an admin to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={quickLogin} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Quick Login as Super Admin"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")} 
              className="w-full"
            >
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state during authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Return null if wrong role (redirect happens in useEffect)
  if (user && user.role !== "admin" && user.role !== "super_admin") {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "accepted": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "in_progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Calculate detailed stats - ensure arrays before filtering
  const allUsers = Array.isArray(users) ? users : [];
  const allBookings = Array.isArray(bookings) ? bookings : [];
  
  const stats = {
    // For regular admins, only count clients and workers as "total users"
    totalUsers: user?.role === "super_admin" ? 
      allUsers.length : 
      allUsers.filter((u: any) => u.role === "client" || u.role === "worker").length,
    totalClients: allUsers.filter((u: any) => u.role === "client").length,
    totalWorkers: allUsers.filter((u: any) => u.role === "worker").length,
    totalAdmins: allUsers.filter((u: any) => u.role === "admin").length,
    totalSuperAdmins: allUsers.filter((u: any) => u.role === "super_admin").length,
    pendingVerifications: allUsers.filter((u: any) => u.role === "worker" && u.workerProfile && !u.workerProfile.isBackgroundVerified).length,
    totalBookings: allBookings.length,
    pendingBookings: allBookings.filter((b: any) => b.status === "pending").length,
    completedBookings: allBookings.filter((b: any) => b.status === "completed").length,
    totalRevenue: allBookings.filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0), 0),
    // Calculate worker earnings (85% of total revenue)
    totalWorkerEarnings: allBookings.filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0) * 0.85, 0),
  };

  const platformFee = stats.totalRevenue * 0.15;





  // Filter bookings - ensure bookings is an array before filtering
  const filteredBookings = (Array.isArray(bookings) ? bookings : [])?.filter((booking: any) => {
    if (!bookingFilter) return true;
    const searchLower = bookingFilter.toLowerCase();
    return (
      booking.id?.toLowerCase().includes(searchLower) ||
      booking.serviceCategory?.toLowerCase().includes(searchLower) ||
      booking.status?.toLowerCase().includes(searchLower) ||
      booking.client?.firstName?.toLowerCase().includes(searchLower) ||
      booking.worker?.firstName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {user?.role === "super_admin" ? "Super Admin" : "Admin"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, bookings, and platform operations across Tamil Nadu.
          </p>
        </div>

        {/* Enhanced Stats Overview with User Type Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${user?.role === "super_admin" ? "xl:grid-cols-6" : "xl:grid-cols-5"} gap-6 mb-8`}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === "super_admin" ? "All platform users" : `${stats.totalClients} clients, ${stats.totalWorkers} workers`}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-green-200"
            onClick={() => setLocation("/admin/clients")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Service requesters</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalWorkers}</p>
                  <p className="text-xs text-muted-foreground">Service providers</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          {/* Total Admins Card - Only for Super Admin */}
          {user.role === "super_admin" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Admins</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalAdmins + stats.totalSuperAdmins}</p>
                    <p className="text-xs text-muted-foreground">{stats.totalAdmins} admin, {stats.totalSuperAdmins} super</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-yellow-200"
            onClick={() => {
              setActiveTab("approvals");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Verifications</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
                  <p className="text-xs text-muted-foreground">Worker applications</p>
                </div>
                <UserCheck className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹{platformFee.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">15% of ₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user?.role === "super_admin" ? "grid-cols-5" : "grid-cols-4"} admin-tabs`}>
            <TabsTrigger value="approvals">Worker Approvals</TabsTrigger>
            <TabsTrigger value="bookings">Booking Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {/* Platform Settings - Only for Super Admin */}
            {user?.role === "super_admin" && (
              <TabsTrigger value="settings">Platform Settings</TabsTrigger>
            )}
          </TabsList>

          {/* Worker Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <WorkerApprovalSection />
          </TabsContent>



          {/* Booking Management Tab */}
          <TabsContent value="bookings" className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Booking Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search bookings..."
                        value={bookingFilter}
                        onChange={(e) => setBookingFilter(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking: any) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <p className="font-mono text-sm">
                                {booking.id.substring(0, 8)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="capitalize">
                                {booking.serviceCategory?.replace('_', ' ')}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {booking.client?.firstName} {booking.client?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.client?.mobile}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {booking.worker?.firstName} {booking.worker?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.worker?.mobile}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(booking.status)}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(booking.status)}
                                  <span className="capitalize">
                                    {booking.status?.replace('_', ' ')}
                                  </span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {booking.totalAmount ? (
                                <p className="font-semibold text-green-600">
                                  ₹{booking.totalAmount}
                                </p>
                              ) : (
                                <p className="text-muted-foreground">TBD</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(booking.scheduledDate).toLocaleDateString()}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredBookings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No bookings found</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messaging Tab */}


          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Revenue Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Transaction Volume:</span>
                      <span className="font-semibold">₹{stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee (15%):</span>
                      <span className="font-semibold text-green-600">₹{platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Worker Earnings (85%):</span>
                      <span className="font-semibold">₹{(stats.totalRevenue - platformFee).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Growth</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{stats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clients:</span>
                      <span className="font-semibold text-blue-600">{stats.totalClients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workers:</span>
                      <span className="font-semibold text-green-600">{stats.totalWorkers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client:Worker Ratio:</span>
                      <span className="font-semibold">
                        {stats.totalWorkers > 0 ? (stats.totalClients / stats.totalWorkers).toFixed(1) : 0}:1
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Booking Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Bookings:</span>
                      <span className="font-semibold">{stats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-semibold text-green-600">
                        {stats.totalBookings > 0 ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Booking Value:</span>
                      <span className="font-semibold">
                        ₹{stats.completedBookings > 0 ? (stats.totalRevenue / stats.completedBookings).toFixed(0) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>District Coverage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {districts?.map((district: any) => (
                    <div key={district.id} className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm">{district.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {users?.filter((u: any) => u.districtId === district.id).length || 0} users
                      </p>
                    </div>
                  )) || (
                    <div className="col-span-full text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading district data...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings Tab - Only for Super Admin */}
          {user?.role === "super_admin" && (
            <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Platform Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4">Commission Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Platform Fee (%)</Label>
                        <Input value="15" disabled />
                        <p className="text-sm text-muted-foreground">
                          Current platform commission rate
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Processing Fee (%)</Label>
                        <Input value="2.5" disabled />
                        <p className="text-sm text-muted-foreground">
                          Gateway processing charges
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Platform Status</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Platform Status: Active</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Operational
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="font-semibold">Security</p>
                          <p className="text-sm text-muted-foreground">All systems secure</p>
                        </div>
                        
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="font-semibold">Payments</p>
                          <p className="text-sm text-muted-foreground">Gateway online</p>
                        </div>
                        
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <p className="font-semibold">Support</p>
                          <p className="text-sm text-muted-foreground">24/7 available</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {user?.role === "super_admin" && (
                    <div>
                      <h4 className="font-semibold mb-4">Super Admin Tools</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => setCreateAdminModalOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Create Admin User
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => setLocation("/admin/workers")}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Worker Management
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => setDatabaseManagementOpen(true)}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Database Management
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => setDistrictManagerOpen(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          District Manager
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          System Configuration
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <Shield className="h-4 w-4 mr-2" />
                          Security Settings
                        </Button>
                        <Button variant="outline" className="justify-start">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Advanced Analytics
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Create Admin User Modal */}
      <Dialog open={createAdminModalOpen} onOpenChange={setCreateAdminModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Admin User</DialogTitle>
            <DialogDescription>
              Create a new admin user who can login using mobile OTP. They will have admin privileges to manage the platform.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createAdminForm}>
            <form onSubmit={createAdminForm.handleSubmit(onCreateAdminSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createAdminForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createAdminForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createAdminForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter 10-digit mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createAdminForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createAdminForm.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District *</FormLabel>
                    <Popover open={districtDropdownOpen} onOpenChange={setDistrictDropdownOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={districtDropdownOpen}
                            className="w-full justify-between"
                          >
                            {field.value
                              ? (() => {
                                  const selectedDistrict = districts.find((district: any) => district.id === field.value);
                                  return selectedDistrict ? `${selectedDistrict.name} (${selectedDistrict.tamilName})` : "Select district";
                                })()
                              : "Select district"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search districts..." />
                          <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                              {districts.map((district: any) => (
                                <CommandItem
                                  key={district.id}
                                  value={`${district.name} ${district.tamilName}`}
                                  onSelect={() => {
                                    field.onChange(district.id);
                                    setDistrictDropdownOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === district.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {district.name} ({district.tamilName})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createAdminForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter full address including city, state, postal code" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createAdminForm.control}
                name="profilePicture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                          {adminProfilePreview ? (
                            <img 
                              src={adminProfilePreview} 
                              alt="Admin profile preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="relative"
                              asChild
                            >
                              <label htmlFor="adminProfilePictureInput" className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photo
                              </label>
                            </Button>
                            {adminProfilePreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeAdminProfilePicture}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <input
                            id="adminProfilePictureInput"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAdminProfilePictureUpload(e.target.files?.[0] || null)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG up to 5MB (Optional for admin profile)
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setCreateAdminModalOpen(false);
                    createAdminForm.reset();
                    setAdminProfilePreview(null);
                  }}
                  disabled={createAdminMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAdminMutation.isPending}
                >
                  {createAdminMutation.isPending ? "Creating..." : "Create Admin User"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Database Management Modal */}
      <Dialog open={databaseManagementOpen} onOpenChange={setDatabaseManagementOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Management</span>
            </DialogTitle>
            <DialogDescription>
              Manage database backups, restore data, and download backup files to your local system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Database Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Database Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold">37 Districts</p>
                    <p className="text-sm text-muted-foreground">Tamil Nadu Coverage</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold">6,430 Areas</p>
                    <p className="text-sm text-muted-foreground">Villages & Towns</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold">9 Services</p>
                    <p className="text-sm text-muted-foreground">Blue-collar Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database Operations</CardTitle>
                <CardDescription>
                  Pull current data, push backup data, or save backups to your local system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pull Operation */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileDown className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Pull Database</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Export current database to backup system. Updates the backup files with latest data.
                    </p>
                    <Button 
                      onClick={() => exportDatabaseMutation.mutate()}
                      disabled={exportDatabaseMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {exportDatabaseMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Pulling...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          Pull Current Data
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Push Operation */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileUp className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Push Database</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Restore database from backup files. Overwrites existing data with backup data.
                    </p>
                    <Button 
                      onClick={() => restoreDatabaseMutation.mutate()}
                      disabled={restoreDatabaseMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {restoreDatabaseMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Pushing...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4 mr-2" />
                          Push Backup Data
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Save Operation */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Download className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">Save to Local</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download backup file to your computer. Saves current backup to local system.
                    </p>
                    <Button 
                      onClick={() => downloadBackupMutation.mutate()}
                      disabled={downloadBackupMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {downloadBackupMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Save to Computer
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Important Notes</h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                        <li>• <strong>Pull:</strong> Updates backup files with current database state</li>
                        <li>• <strong>Push:</strong> Overwrites current database with backup data</li>
                        <li>• <strong>Save:</strong> Downloads backup file to your local computer</li>
                        <li>• Push operation will replace ALL existing data with backup data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>


      {/* District Manager Modal */}
      <Dialog open={districtManagerOpen} onOpenChange={setDistrictManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              District Data Manager
            </DialogTitle>
            <DialogDescription>
              Manage authentic Indian states and districts data used throughout the application
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Data Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Current Data File
                  </CardTitle>
                  <CardDescription>
                    Location: <code className="bg-muted px-2 py-1 rounded">shared/states-districts.json</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Data Source Information:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Authentic Indian government district data</li>
                      <li>• 28 States + 8 Union Territories</li>
                      <li>• 700+ Districts total</li>
                      <li>• Source: GitHub sab99r/Indian-States-And-Districts</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => {
                      toast({
                        title: "File Location",
                        description: "Check the 'shared/states-districts.json' file in your project directory for the current data.",
                      });
                    }} 
                    className="w-full" 
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Current Data File Location
                  </Button>
                </CardContent>
              </Card>

              {/* File Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Update Data File
                  </CardTitle>
                  <CardDescription>
                    Instructions for updating the districts data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          How to Update Districts Data:
                        </h4>
                        <ol className="space-y-2 text-blue-700 dark:text-blue-300">
                          <li>1. Navigate to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">shared/states-districts.json</code></li>
                          <li>2. Edit the JSON file directly in the file explorer</li>
                          <li>3. Add/remove states or districts as needed</li>
                          <li>4. Save the file - changes take effect immediately</li>
                          <li>5. Test by selecting states in the registration forms</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      JSON Structure:
                    </h4>
                    <pre className="text-xs text-yellow-700 dark:text-yellow-300 overflow-x-auto">
{`{
  "states": [
    {
      "state": "Tamil Nadu",
      "districts": [
        "Chennai",
        "Coimbatore",
        "Madurai",
        ...
      ]
    }
  ]
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* API Test Section */}
            <Card>
              <CardHeader>
                <CardTitle>Test Districts API</CardTitle>
                <CardDescription>
                  Verify that the districts API is working with the current data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="test-state">Test State Name</Label>
                    <Input
                      id="test-state"
                      placeholder="e.g., Tamil Nadu, Telangana, Maharashtra"
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter') {
                          const stateName = (e.target as HTMLInputElement).value;
                          if (!stateName.trim()) return;
                          try {
                            const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
                            const districts = await response.json();
                            toast({
                              title: "API Test Result",
                              description: `Found ${districts.length} districts for ${stateName}`,
                            });
                          } catch (error) {
                            toast({
                              title: "API Test Failed",
                              description: "Could not fetch districts",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={async () => {
                        const testInput = document.getElementById('test-state') as HTMLInputElement;
                        const stateName = testInput?.value;
                        if (!stateName?.trim()) {
                          toast({
                            title: "Enter State Name",
                            description: "Please enter a state name to test",
                            variant: "destructive",
                          });
                          return;
                        }
                        try {
                          const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
                          const districts = await response.json();
                          toast({
                            title: "API Test Result",
                            description: `Found ${districts.length} districts for ${stateName}`,
                          });
                        } catch (error) {
                          toast({
                            title: "API Test Failed",
                            description: "Could not fetch districts",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Test API
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Messaging Component */}
      <FloatingMessaging />
    </div>
  );
}
