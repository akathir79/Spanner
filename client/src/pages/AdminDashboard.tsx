import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Unlock
} from "lucide-react";
import { useLocation } from "wouter";
import WorkerApprovalSection from "@/components/WorkerApprovalSection";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userFilter, setUserFilter] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
  const [userDetailsModal, setUserDetailsModal] = useState<any>(null);

  // Quick login for demo purposes
  const quickLogin = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: "9000000001",
          userType: "super_admin",
          otp: "123456"
        })
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Quick login failed:", error);
    }
  };

  // Redirect if not authenticated or wrong role
  if (!user) {
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
            <Button onClick={quickLogin} className="w-full">
              Quick Login as Super Admin
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/login")} 
              className="w-full"
            >
              Go to Login Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    if (user.role === "client") {
      setLocation("/dashboard");
    } else if (user.role === "worker") {
      setLocation("/worker-dashboard");
    }
    return null;
  }

  // Fetch admin data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then(res => res.json())
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    queryFn: () => fetch("/api/admin/bookings").then(res => res.json())
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
    queryFn: () => fetch("/api/districts").then(res => res.json())
  });

  // Update user verification status
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      // This would need to be implemented in the backend
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

  const handleVerifyUser = (userId: string, isVerified: boolean) => {
    verifyUserMutation.mutate({ userId, isVerified });
  };

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
    totalUsers: allUsers.length,
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

  // Get users by type with detailed info
  const getUsersByType = (userType: string) => {
    return allUsers.filter((u: any) => {
      if (userType === "admin") return u.role === "admin" || u.role === "super_admin";
      return u.role === userType;
    }).map((user: any) => {
      const userDistrict = districts.find((d: any) => d.id === user.districtId);
      const userBookings = allBookings.filter((b: any) => 
        (user.role === "client" && b.clientId === user.id) || 
        (user.role === "worker" && b.workerId === user.id)
      );
      const completedBookings = userBookings.filter((b: any) => b.status === "completed");
      
      return {
        ...user,
        location: userDistrict ? `${userDistrict.name} (${userDistrict.tamilName})` : "Not specified",
        serviceType: user.workerProfile?.primaryService?.replace('_', ' ') || 
                    (user.role === "client" ? "General Services" : "N/A"),
        totalBookings: userBookings.length,
        balance: user.role === "client" ? 
          completedBookings.reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0), 0) : 0,
        totalEarnings: user.role === "worker" ? 
          completedBookings.reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0) * 0.85, 0) : 0,
      };
    });
  };

  // Filter users - ensure users is an array before filtering
  const filteredUsers = (() => {
    let usersToFilter = selectedUserType ? getUsersByType(selectedUserType) : allUsers;
    
    if (!userFilter) return usersToFilter;
    
    const searchLower = userFilter.toLowerCase();
    return usersToFilter.filter((user: any) => (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.mobile?.includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower) ||
      user.serviceType?.toLowerCase().includes(searchLower) ||
      user.location?.toLowerCase().includes(searchLower)
    ));
  })();

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
            {user.role === "super_admin" ? "Super Admin" : "Admin"} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, bookings, and platform operations across Tamil Nadu.
          </p>
        </div>

        {/* Enhanced Stats Overview with User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-blue-200"
            onClick={() => {
              setSelectedUserType(null);
              const usersTab = document.querySelector('[value="users"]') as HTMLElement;
              if (usersTab) usersTab.click();
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">All platform users</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-green-200"
            onClick={() => {
              setSelectedUserType("client");
              const usersTab = document.querySelector('[value="users"]') as HTMLElement;
              if (usersTab) usersTab.click();
            }}
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
          
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-purple-200"
            onClick={() => {
              setSelectedUserType("worker");
              const usersTab = document.querySelector('[value="users"]') as HTMLElement;
              if (usersTab) usersTab.click();
            }}
          >
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
          
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-orange-200"
            onClick={() => {
              setSelectedUserType("admin");
              const usersTab = document.querySelector('[value="users"]') as HTMLElement;
              if (usersTab) usersTab.click();
            }}
          >
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
          
          <Card>
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

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="approvals">Worker Approvals</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="bookings">Booking Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          </TabsList>

          {/* Worker Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <WorkerApprovalSection />
          </TabsContent>

          {/* Enhanced User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Management</span>
                    {selectedUserType && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedUserType === "admin" ? "Admins & Super Admins" : 
                         selectedUserType === "client" ? "Clients" : 
                         selectedUserType === "worker" ? "Workers" : "All Users"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUserType && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUserType(null)}
                      >
                        Clear Filter
                      </Button>
                    )}
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Bookings/Earnings</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ID: {user.id.substring(0, 8)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  user.role === "super_admin" ? "default" :
                                  user.role === "admin" ? "secondary" :
                                  user.role === "worker" ? "outline" : "secondary"
                                }
                                className={
                                  user.role === "super_admin" ? "bg-red-100 text-red-800" :
                                  user.role === "admin" ? "bg-orange-100 text-orange-800" :
                                  user.role === "worker" ? "bg-purple-100 text-purple-800" :
                                  "bg-green-100 text-green-800"
                                }
                              >
                                {user.role === "super_admin" ? "Super Admin" :
                                 user.role === "admin" ? "Admin" :
                                 user.role === "worker" ? "Worker" : "Client"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{user.location}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">{user.serviceType}</p>
                                {user.workerProfile?.skills && (
                                  <p className="text-muted-foreground">
                                    {user.workerProfile.skills.slice(0, 2).join(", ")}
                                    {user.workerProfile.skills.length > 2 && "..."}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">
                                  {user.totalBookings} bookings
                                </p>
                                {user.role === "client" && (
                                  <p className="text-muted-foreground">
                                    Spent: ₹{user.balance.toLocaleString()}
                                  </p>
                                )}
                                {user.role === "worker" && (
                                  <p className="text-green-600 font-medium">
                                    Earned: ₹{user.totalEarnings.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{user.mobile}</span>
                                </p>
                                {user.email && (
                                  <p className="text-muted-foreground flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{user.email}</span>
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.isVerified ? "default" : "secondary"}
                                className={user.isVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                              >
                                {user.isVerified ? "Verified" : "Pending"}
                              </Badge>
                              {user.role === "worker" && user.workerProfile?.isBackgroundVerified && (
                                <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-800">
                                  BG Verified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setUserDetailsModal(user)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Message
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleVerifyUser(user.id, !user.isVerified)}
                                    className={user.isVerified ? "text-yellow-600" : "text-green-600"}
                                  >
                                    {user.isVerified ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Unverify User
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Verify User
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {user.role === "worker" && (
                                    <DropdownMenuItem className="text-blue-600">
                                      <Settings className="mr-2 h-4 w-4" />
                                      Manage Profile
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                        <p className="text-muted-foreground">
                          {userFilter ? "Try adjusting your search terms." : "No users match the current filter."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Details Modal */}
          <Dialog open={!!userDetailsModal} onOpenChange={() => setUserDetailsModal(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Details: {userDetailsModal?.firstName} {userDetailsModal?.lastName}</span>
                </DialogTitle>
                <DialogDescription>
                  Comprehensive user information and platform activity
                </DialogDescription>
              </DialogHeader>
              
              {userDetailsModal && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                        <p className="font-medium">{userDetailsModal.firstName} {userDetailsModal.lastName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                        <p className="font-mono text-sm">{userDetailsModal.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                        <Badge 
                          className={
                            userDetailsModal.role === "super_admin" ? "bg-red-100 text-red-800" :
                            userDetailsModal.role === "admin" ? "bg-orange-100 text-orange-800" :
                            userDetailsModal.role === "worker" ? "bg-purple-100 text-purple-800" :
                            "bg-green-100 text-green-800"
                          }
                        >
                          {userDetailsModal.role === "super_admin" ? "Super Admin" :
                           userDetailsModal.role === "admin" ? "Admin" :
                           userDetailsModal.role === "worker" ? "Worker" : "Client"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                        <p>{userDetailsModal.location || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Mobile</Label>
                        <p className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{userDetailsModal.mobile}</span>
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{userDetailsModal.email || "Not provided"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service Information for Workers */}
                  {userDetailsModal.role === "worker" && userDetailsModal.workerProfile && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Service Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Primary Service</Label>
                          <p className="capitalize">{userDetailsModal.workerProfile.primaryService?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Experience</Label>
                          <p>{userDetailsModal.workerProfile.experienceYears} years</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Hourly Rate</Label>
                          <p className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>₹{userDetailsModal.workerProfile.hourlyRate}/hour</span>
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Rating</Label>
                          <p className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{userDetailsModal.workerProfile.rating || "No ratings yet"}</span>
                          </p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Skills</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userDetailsModal.workerProfile.skills?.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {userDetailsModal.workerProfile.bio && (
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                            <p className="text-sm mt-1">{userDetailsModal.workerProfile.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Platform Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Platform Activity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Bookings</Label>
                        <p className="text-2xl font-bold text-blue-600">{userDetailsModal.totalBookings || 0}</p>
                      </div>
                      {userDetailsModal.role === "client" && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Total Spent</Label>
                          <p className="text-2xl font-bold text-green-600">₹{(userDetailsModal.balance || 0).toLocaleString()}</p>
                        </div>
                      )}
                      {userDetailsModal.role === "worker" && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Total Earnings</Label>
                          <p className="text-2xl font-bold text-green-600">₹{(userDetailsModal.totalEarnings || 0).toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                        <p>{new Date(userDetailsModal.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <div className="flex space-x-2">
                          <Badge variant={userDetailsModal.isVerified ? "default" : "secondary"}>
                            {userDetailsModal.isVerified ? "Verified" : "Pending"}
                          </Badge>
                          {userDetailsModal.role === "worker" && userDetailsModal.workerProfile?.isBackgroundVerified && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Background Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button variant="outline" className="flex-1">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleVerifyUser(userDetailsModal.id, !userDetailsModal.isVerified)}
                    >
                      {userDetailsModal.isVerified ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Unverify
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button variant="destructive" className="flex-1">
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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

          {/* Platform Settings Tab */}
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
                  
                  {user.role === "super_admin" && (
                    <div>
                      <h4 className="font-semibold mb-4">Super Admin Tools</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="justify-start">
                          <Users className="h-4 w-4 mr-2" />
                          Create Admin User
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
        </Tabs>
      </div>
    </div>
  );
}
