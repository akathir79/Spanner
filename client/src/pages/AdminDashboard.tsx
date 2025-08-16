import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AdvertisementManager from "@/components/AdvertisementManager";
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
  MessageCircle
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChatSystem } from "@/components/ChatSystem";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adsEnabled, setAdsEnabled] = useState(true);

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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, bookings, and platform operations across Tamil Nadu
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {user.role === "super_admin" ? "Super Admin" : "Admin"}
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

        {/* Advertisement Management Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Megaphone className="h-5 w-5" />
                  <span>Advertisement Management</span>
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Label htmlFor="ads-toggle" className="text-sm font-medium">
                    {adsEnabled ? "Ads Enabled" : "Ads Disabled"}
                  </Label>
                  <Switch
                    id="ads-toggle"
                    checked={adsEnabled}
                    onCheckedChange={handleAdToggle}
                    className={adsEnabled ? "" : "bg-gray-200"}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {adsEnabled ? (
                <AdvertisementManager />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Advertisements are currently disabled</p>
                  <p className="text-sm">Toggle the switch above to enable advertisement display across the platform.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Management Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Client Messages & Support
              </CardTitle>
              <p className="text-muted-foreground">
                Manage conversations with clients and workers, respond to support requests
              </p>
            </CardHeader>
            <CardContent>
              <ChatSystem 
                userId={user?.id || ''} 
                userRole={user?.role === 'admin' || user?.role === 'super_admin' ? 'admin' : 'client'}
                userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin'}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}