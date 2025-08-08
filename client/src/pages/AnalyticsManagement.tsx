import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Activity,
  Target,
  Briefcase,
  Star
} from "lucide-react";

export default function AnalyticsManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
    totalAdmins: allUsers.filter((u: any) => u.role === "admin").length,
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

  const platformFee = stats.totalRevenue * 0.15;
  const workerEarnings = stats.totalRevenue - platformFee;

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to view analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={() => setLocation("/admin")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analytics Overview</h1>
            <p className="text-muted-foreground">
              Comprehensive platform analytics and insights across Tamil Nadu
            </p>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Revenue Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All completed bookings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fee (15%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">₹{platformFee.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Platform commission</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Worker Earnings (85%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">₹{workerEarnings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Total paid to workers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Booking Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{stats.completedBookings > 0 ? Math.round(stats.totalRevenue / stats.completedBookings).toLocaleString() : '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per completed booking</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Analytics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            User Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">Active platform users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalClients}</div>
                <p className="text-xs text-muted-foreground mt-1">Service requesters</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalWorkers}</div>
                <p className="text-xs text-muted-foreground mt-1">Service providers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Client:Worker Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalWorkers > 0 ? (stats.totalClients / stats.totalWorkers).toFixed(1) : '0'}:1
                </div>
                <p className="text-xs text-muted-foreground mt-1">Demand vs supply</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Analytics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Booking Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgressBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">Cancelled bookings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completion percentage</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-red-600" />
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</div>
                <p className="text-xs text-muted-foreground mt-1">Workers awaiting approval</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Verified Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalWorkers - stats.pendingVerifications}</div>
                <p className="text-xs text-muted-foreground mt-1">Active service providers</p>
              </CardContent>
            </Card>
            
            {user?.role === "super_admin" && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.totalAdmins}</div>
                    <p className="text-xs text-muted-foreground mt-1">District administrators</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.totalSuperAdmins}</div>
                    <p className="text-xs text-muted-foreground mt-1">Platform administrators</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Business Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Revenue Growth:</span>
                <span className="font-semibold text-green-600">
                  {stats.completedBookings > 0 ? '+' : ''}
                  {stats.completedBookings > 0 ? Math.round(((stats.totalRevenue - 50000) / 50000) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">User Growth:</span>
                <span className="font-semibold text-blue-600">
                  {stats.totalUsers > 0 ? '+' : ''}
                  {Math.round(((stats.totalUsers - 10) / 10) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Booking Volume:</span>
                <span className="font-semibold text-purple-600">
                  {stats.totalBookings > 0 ? '+' : ''}
                  {Math.round(((stats.totalBookings - 5) / 5) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Key Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Platform Utilization:</span>
                <span className="font-semibold">
                  {stats.totalUsers > 0 ? Math.round((stats.totalBookings / stats.totalUsers) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Worker Efficiency:</span>
                <span className="font-semibold text-green-600">
                  {stats.totalWorkers > 0 ? Math.round((stats.completedBookings / stats.totalWorkers) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Client Satisfaction:</span>
                <span className="font-semibold text-yellow-600">
                  {stats.totalBookings > 0 ? Math.round(((stats.totalBookings - stats.cancelledBookings) / stats.totalBookings) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}