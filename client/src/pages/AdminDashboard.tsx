import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
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
  User
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
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
              {user.districtName || "All Districts"}
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
            <Card 
              className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-gray-200"
              onClick={() => setLocation("/admin/settings")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platform Settings</p>
                    <p className="text-2xl font-bold text-gray-600">Active</p>
                    <p className="text-xs text-muted-foreground">System configuration</p>
                  </div>
                  <Settings className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Regular admin sees a different card */}
          {user?.role !== "super_admin" && (
            <Card className="opacity-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Platform Settings</p>
                    <p className="text-2xl font-bold text-gray-400">Restricted</p>
                    <p className="text-xs text-muted-foreground">Super admin only</p>
                  </div>
                  <Settings className="h-8 w-8 text-gray-400" />
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

        {/* Admin Profile Section - Unique for Admin/Super Admin */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{user.role === "super_admin" ? "Super Admin" : "Admin"} Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Admin Identity Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.profilePicture} alt={user.firstName} />
                    <AvatarFallback className="text-xl bg-purple-100 text-purple-600">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.role === "super_admin" ? "Super Administrator" : "Administrator"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrative Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Role Level</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.role === "super_admin" ? "Super Administrator" : "Regional Administrator"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Department</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.role === "super_admin" ? "System Administration" : "Operations Management"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Assigned District</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.districtName || "All Districts"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Mobile</Label>
                      <p className="font-medium p-2 bg-muted rounded border">{user.mobile}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium p-2 bg-muted rounded border">{user.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Access & Permissions */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    System Access Level
                  </h4>
                  <div className="space-y-3">
                    {user.role === "super_admin" ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">Full System Access</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">User Management</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">Admin Creation</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">Database Management</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">Financial Reports</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">District Management</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="text-sm">Worker Verification</span>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <span className="text-sm">User Management</span>
                          <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm">Admin Creation</span>
                          <Badge variant="outline">
                            <UserX className="h-3 w-3 mr-1" />
                            Restricted
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm">Database Management</span>
                          <Badge variant="outline">
                            <UserX className="h-3 w-3 mr-1" />
                            Restricted
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Administrative Scope
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">State Coverage</Label>
                        <p className="text-sm font-medium">
                          {user.role === "super_admin" ? "All India" : user.state || "Tamil Nadu"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Districts</Label>
                        <p className="text-sm font-medium">
                          {user.role === "super_admin" ? "38 Districts" : "1 District"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Users Managed</Label>
                        <p className="text-sm font-medium">{stats.totalUsers}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Active Since</Label>
                        <p className="text-sm font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity & Responsibilities */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Worker Verifications</span>
                        <Badge variant="secondary" className="text-xs">Today</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingVerifications} pending verifications
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Platform Overview</span>
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalBookings} total bookings managed
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">User Support</span>
                        <Badge variant="secondary" className="text-xs">Ongoing</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalClients} clients, {stats.totalWorkers} workers
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Key Responsibilities
                  </h4>
                  <div className="space-y-2">
                    {user.role === "super_admin" ? (
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Overall platform management and security</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Create and manage admin accounts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>System configuration and settings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Financial oversight and reporting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Database maintenance and backups</span>
                        </li>
                      </ul>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>District-level user management</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Worker verification and approval</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Monitor booking activities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Handle user complaints and issues</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>Generate district reports</span>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>

                {/* Quick Actions for Super Admin */}
                {user.role === "super_admin" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-semibold">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Create Admin
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}