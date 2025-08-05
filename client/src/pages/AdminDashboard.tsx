import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Briefcase,
  Calendar,
  Settings,
  Search,
  FileText,
  Download,
  Upload,
  Database,
  UserPlus,
  Shield,
  Trash2,
  Eye,
  MessageCircle,
  Map,
  Building,
  DollarSign,
  Star,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useLocation } from "wouter";
import WorkerApprovalSection from "@/components/WorkerApprovalSection";
import { MessagingSystem } from "@/components/MessagingSystem";
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
  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { user, isLoading: authLoading } = useAuth();
  const currentUser = user; // Reference for clarity in nested components
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userFilter, setUserFilter] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [userDetailsModal, setUserDetailsModal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("approvals");
  const [messageDialogUser, setMessageDialogUser] = useState<any>(null);
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [databaseManagementOpen, setDatabaseManagementOpen] = useState(false);
  const [districtManagerOpen, setDistrictManagerOpen] = useState(false);
  const [adminProfilePreview, setAdminProfilePreview] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any>(null);

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
    enabled: !authLoading && !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 30000, // Cache for 30 seconds to reduce re-fetching
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    queryFn: () => fetch("/api/admin/bookings").then(res => res.json()),
    enabled: !authLoading && !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 30000,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
    queryFn: () => fetch("/api/districts").then(res => res.json()),
    enabled: !authLoading && !!user && (user.role === "admin" || user.role === "super_admin"),
    staleTime: 300000, // Cache districts for 5 minutes as they don't change often
  });

  // ALL MUTATIONS MUST BE DECLARED BEFORE CONDITIONAL RETURNS
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

  // Use effect for redirects to avoid calling setLocation during render
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin" && user.role !== "super_admin") {
      // Only redirect if user is not an admin/super_admin
      if (user.role === "client") {
        setLocation("/dashboard");
      } else if (user.role === "worker") {
        setLocation("/worker-dashboard");
      }
    }
  }, [user, authLoading, setLocation]);

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated or being redirected
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  // Helper functions and handlers
  
  // Handle OTP verification for workers  
  const handleOtpVerification = (userId: string) => {
    verifyUserMutation.mutate({ userId, isVerified: true });
  };

  // Handle create admin form submission
  const onCreateAdminSubmit = (data: CreateAdminForm) => {
    createAdminMutation.mutate(data);
  };

  // Handle delete confirmation
  const confirmDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
    setDeleteConfirmUser(null);
  };

  // Calculate stats from users data
  const stats = {
    totalUsers: Array.isArray(users) ? users.length : 0,
    totalClients: Array.isArray(users) ? users.filter((u: any) => u.role === "client").length : 0,
    totalWorkers: Array.isArray(users) ? users.filter((u: any) => u.role === "worker").length : 0,
    totalAdmins: Array.isArray(users) ? users.filter((u: any) => u.role === "admin" || u.role === "super_admin").length : 0,
    pendingWorkers: Array.isArray(users) ? users.filter((u: any) => u.role === "worker" && !u.isVerified).length : 0,
    totalBookings: Array.isArray(bookings) ? bookings.length : 0,
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {user.role === "super_admin" ? "Super Admin" : "Admin"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, bookings, and platform operations across India.
          </p>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalClients}</p>
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
                </div>
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingWorkers}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="approvals">Worker Approvals</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <WorkerApprovalSection />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all platform users, their verification status, and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <div className="text-center py-8">
                  <p className="text-muted-foreground">User management interface will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {user.role === "super_admin" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Admin User</CardTitle>
                    <CardDescription>
                      Create new admin accounts for regional management.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setCreateAdminModalOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create New Admin
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Database Management</CardTitle>
                  <CardDescription>
                    Manage database backups and data synchronization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => exportDatabaseMutation.mutate()}
                    disabled={exportDatabaseMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {exportDatabaseMutation.isPending ? "Pulling..." : "Pull Data"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => restoreDatabaseMutation.mutate()}
                    disabled={restoreDatabaseMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {restoreDatabaseMutation.isPending ? "Pushing..." : "Push Data"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => downloadBackupMutation.mutate()}
                    disabled={downloadBackupMutation.isPending}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {downloadBackupMutation.isPending ? "Saving..." : "Save Locally"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Admin Modal */}
        <Dialog open={createAdminModalOpen} onOpenChange={setCreateAdminModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin account. They will be able to login using OTP authentication.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createAdminForm}>
              <form onSubmit={createAdminForm.handleSubmit(onCreateAdminSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createAdminForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createAdminForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createAdminForm.control}
                  name="districtId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {districts.map((district: any) => (
                            <SelectItem key={district.id} value={district.id}>
                              {district.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createAdminForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter complete address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateAdminModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAdminMutation.isPending}>
                    {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}