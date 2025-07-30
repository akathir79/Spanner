import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Search
} from "lucide-react";
import { useLocation } from "wouter";
import { WorkerApprovalSection } from "@/components/WorkerApprovalSection";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userFilter, setUserFilter] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");

  // Redirect if not authenticated or wrong role
  if (!user) {
    setLocation("/login");
    return null;
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

  // Calculate stats
  const stats = {
    totalUsers: users?.length || 0,
    totalClients: users?.filter((u: any) => u.role === "client").length || 0,
    totalWorkers: users?.filter((u: any) => u.role === "worker").length || 0,
    pendingVerifications: users?.filter((u: any) => u.role === "worker" && u.workerProfile && !u.workerProfile.isBackgroundVerified).length || 0,
    totalBookings: bookings?.length || 0,
    pendingBookings: bookings?.filter((b: any) => b.status === "pending").length || 0,
    completedBookings: bookings?.filter((b: any) => b.status === "completed").length || 0,
    totalRevenue: bookings?.filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0), 0) || 0,
  };

  const platformFee = stats.totalRevenue * 0.15;

  // Filter users
  const filteredUsers = users?.filter((user: any) => {
    if (!userFilter) return true;
    const searchLower = userFilter.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.mobile?.includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Filter bookings
  const filteredBookings = bookings?.filter((booking: any) => {
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalClients} clients, {stats.totalWorkers} workers
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingBookings} pending, {stats.completedBookings} completed
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
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

          {/* Worker Approval Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <WorkerApprovalSection />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>User Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
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
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
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
                                {user.workerProfile && (
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {user.workerProfile.primaryService?.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.role === "worker" ? "default" : "secondary"}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{user.mobile}</p>
                                {user.email && <p className="text-muted-foreground">{user.email}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {user.isVerified ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Unverified
                                  </Badge>
                                )}
                                {user.workerProfile && !user.workerProfile.isBackgroundVerified && (
                                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending BG Check
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {!user.isVerified && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleVerifyUser(user.id, true)}
                                    disabled={verifyUserMutation.isPending}
                                  >
                                    Verify
                                  </Button>
                                )}
                                {user.workerProfile && !user.workerProfile.isBackgroundVerified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      toast({
                                        title: "Feature Coming Soon",
                                        description: "Background verification approval will be implemented soon.",
                                      });
                                    }}
                                  >
                                    Approve BG
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No users found</p>
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
