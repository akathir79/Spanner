import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

import { Switch } from "@/components/ui/switch";
import { 
  Users,
  Calendar,
  Settings,
  BarChart3,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  Shield,
  Building,
  Mail,
  Phone,
  Activity,
  Lock,
  Globe,
  User,
  Edit3,
  Save,
  X,
  MapPin,
  Camera,
  Megaphone,
  MessageCircle,
  IndianRupee
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NotificationBell } from "@/components/NotificationBell";


export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function to refresh user data
  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/user/refresh"] });
  };

  // Fetch advertisement toggle state
  useEffect(() => {
    const fetchAdToggle = async () => {
      try {
        const response = await fetch('/api/settings/advertisement-toggle');
        const data = await response.json();
        setAdsEnabled(data.enabled);
      } catch (error) {
        console.error('Error fetching advertisement toggle:', error);
      }
    };
    fetchAdToggle();
  }, []);

  // Handle advertisement toggle change
  const handleAdToggle = async (enabled: boolean) => {
    try {
      await apiRequest('PUT', '/api/settings/advertisement-toggle', { enabled });
      setAdsEnabled(enabled);
      // Invalidate advertisement queries to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements'] });
      toast({
        title: enabled ? "Advertisements Enabled" : "Advertisements Disabled",
        description: enabled 
          ? "Advertisements will now be displayed to users." 
          : "All advertisements have been disabled.",
      });
    } catch (error) {
      console.error('Error updating advertisement toggle:', error);
      toast({
        title: "Error",
        description: "Failed to update advertisement settings",
        variant: "destructive",
      });
    }
  };

  // Fetch data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
  });

  // Calculate statistics
  const allUsers = Array.isArray(users) ? users : [];
  const allBookings = Array.isArray(bookings) ? bookings : [];
  
  const stats = {
    totalUsers: user?.role === "super_admin" ? 
      allUsers.length : 
      allUsers.filter((u: any) => u.role === "client" || u.role === "worker").length,
    totalClients: allUsers.filter((u: any) => u.role === "client").length,
    totalWorkers: allUsers.filter((u: any) => u.role === "worker").length,
    totalAdmins: allUsers.filter((u: any) => u.role === "admin" || u.role === "super_admin").length,
    totalSuperAdmins: allUsers.filter((u: any) => u.role === "super_admin").length,
    pendingVerifications: allUsers.filter((u: any) => u.role === "worker" && !u.isVerified).length,
    totalBookings: allBookings.length,
    pendingBookings: allBookings.filter((b: any) => b.status === "pending").length,
    acceptedBookings: allBookings.filter((b: any) => b.status === "accepted").length,
    inProgressBookings: allBookings.filter((b: any) => b.status === "in_progress").length,
    completedBookings: allBookings.filter((b: any) => b.status === "completed").length,
    cancelledBookings: allBookings.filter((b: any) => b.status === "cancelled").length,
    totalRevenue: allBookings.filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0), 0),
  };

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {user.role === "super_admin" ? "Super Admin Dashboard" : "Regular Admin Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              Manage users, bookings, and platform operations across India
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {user.role === "super_admin" ? "Super Admin" : "Regular Admin"}
            </Badge>
            <Badge variant="outline">
              {user.district || "All Districts"}
            </Badge>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{usersLoading ? "..." : stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Platform users</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookingsLoading ? "..." : stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Service requests</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Verifications</p>
                  <p className="text-2xl font-bold text-yellow-600">{usersLoading ? "..." : stats.pendingVerifications}</p>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹{bookingsLoading ? "..." : stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total completed</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards - Navigation to Dedicated Pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-blue-200"
            onClick={() => setLocation("/admin/bookings")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Booking Management</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">Manage all bookings</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-purple-200"
            onClick={() => setLocation("/admin/analytics")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Analytics</p>
                  <p className="text-2xl font-bold text-purple-600">View</p>
                  <p className="text-xs text-muted-foreground">Platform insights</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          {/* Platform Settings - Only for Super Admin */}
          {user?.role === "super_admin" && (
            <Card className="transition-all hover:shadow-md border-2 hover:border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platform Settings</p>
                    <p className="text-2xl font-bold text-gray-600">Active</p>
                    <p className="text-xs text-muted-foreground">System configuration</p>
                  </div>
                  <Settings className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setLocation("/admin-profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setLocation("/admin/settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Regular admin sees a different card */}
          {user?.role !== "super_admin" && (
            <Card className="transition-all hover:shadow-md border-2 hover:border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin Management</p>
                    <p className="text-2xl font-bold text-purple-600">Active</p>
                    <p className="text-xs text-muted-foreground">Admin tools</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setLocation("/admin-profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Client Management */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-blue-200"
            onClick={() => setLocation("/admin/clients")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client Management</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Manage clients</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Worker Management */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-green-200"
            onClick={() => setLocation("/admin/workers")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Worker Management</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalWorkers}</p>
                  <p className="text-xs text-muted-foreground">Manage workers</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Admin Management - Only for Super Admin */}
          {user?.role === "super_admin" && (
            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-purple-200"
              onClick={() => setLocation("/admin/admins")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin Management</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalAdmins}</p>
                    <p className="text-xs text-muted-foreground">Super Admin: {stats.totalSuperAdmins} | Regular Admin: {stats.totalAdmins - stats.totalSuperAdmins}</p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regular admin sees pending verifications instead */}
          {user?.role !== "super_admin" && (
            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-yellow-200"
              onClick={() => setLocation("/admin/pending-verifications")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Verifications</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
                    <p className="text-xs text-muted-foreground">Workers to verify</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200" onClick={() => setLocation('/admin/advertisements')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Megaphone className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertisement Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Create, edit and manage platform advertisements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200" onClick={() => setLocation('/admin/messages')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Client & Worker Messages</h3>
                  <p className="text-sm text-gray-600 mt-1">Handle support requests and communications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200" onClick={() => setLocation('/admin/financial')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <IndianRupee className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Financial Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure payment models and wallet management</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="management"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Management
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              Profile
              {/* Show UPDATE_REQUIRED fields count (matching NotificationBell logic for admins) */}
              {user && (() => {
                const fieldsToCheck = [
                  user.lastName,
                  user.email,
                  user.district,
                  user.state
                ];
                
                let count = 0;
                fieldsToCheck.forEach(field => {
                  if (field === "UPDATE_REQUIRED" || field === "" || field === null || field === undefined) {
                    count++;
                  }
                });
                
                return count > 0 ? (
                  <Badge variant="secondary" className="ml-2 bg-red-500 text-white text-xs px-1 py-0 h-5 min-w-[20px] rounded-full flex items-center justify-center">
                    {count}
                  </Badge>
                ) : null;
              })()}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Quick Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>User Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
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
                        <span>Booking Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-semibold text-yellow-600">{stats.pendingBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>In Progress:</span>
                          <span className="font-semibold text-blue-600">{stats.inProgressBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-semibold text-green-600">{stats.completedBookings}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Platform Health</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>System Status:</span>
                          <Badge className="bg-green-100 text-green-800">Online</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="font-semibold text-green-600">
                            {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Users:</span>
                          <span className="font-semibold">{stats.totalUsers}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="space-y-6">
            {/* Main Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200" onClick={() => setLocation('/admin/advertisements')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Megaphone className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Advertisement Management</h3>
                      <p className="text-sm text-gray-600 mt-1">Create, edit and manage platform advertisements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200" onClick={() => setLocation('/admin/messages')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <MessageCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Client & Worker Messages</h3>
                      <p className="text-sm text-gray-600 mt-1">Handle support requests and communications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200" onClick={() => setLocation('/admin/financial')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <IndianRupee className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Financial Management</h3>
                      <p className="text-sm text-gray-600 mt-1">Configure payment models and wallet management</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Admin Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={user?.firstName || 'N/A'} disabled />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input 
                        value={user?.lastName || 'UPDATE_REQUIRED'} 
                        disabled 
                        className={(!user?.lastName || user?.lastName === 'UPDATE_REQUIRED') ? 'border-red-500 bg-red-50' : ''}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        value={user?.email || 'UPDATE_REQUIRED'} 
                        disabled 
                        className={!user?.email ? 'border-red-500 bg-red-50' : ''}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input value={user?.role || 'N/A'} disabled />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>District</Label>
                      <Input 
                        value={user?.district || 'UPDATE_REQUIRED'} 
                        disabled 
                        className={(!user?.district || user?.district === 'UPDATE_REQUIRED') ? 'border-red-500 bg-red-50' : ''}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input 
                        value={user?.state || 'UPDATE_REQUIRED'} 
                        disabled 
                        className={(!user?.state || user?.state === 'UPDATE_REQUIRED') ? 'border-red-500 bg-red-50' : ''}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {user?.role === "super_admin" ? "Super Admin" : "Regular Admin"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>





      </div>
    </div>
  );
}