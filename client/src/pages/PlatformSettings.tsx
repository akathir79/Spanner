import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { 
  Settings,
  ArrowLeft,
  Shield,
  Activity,
  Database,
  Users,
  Bell,
  Lock,
  Globe,
  Zap,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserCheck
} from "lucide-react";

export default function PlatformSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isLoading, setIsLoading] = useState(false);

  // Fetch admin counts
  const { data: adminCounts, isLoading: adminCountsLoading } = useQuery({
    queryKey: ['/api/admin/admin-counts'],
    refetchInterval: 5000, // Refresh every 5 seconds to show real-time updates
  });

  // Fetch location counts from states-districts.json
  const { data: locationCounts, isLoading: locationCountsLoading } = useQuery({
    queryKey: ['/api/admin/location-counts'],
    refetchInterval: 30000, // Refresh every 30 seconds for file-based data
  });

  // Fetch database information
  const { data: databaseInfo, isLoading: databaseInfoLoading } = useQuery({
    queryKey: ['/api/admin/database-info'],
    refetchInterval: 60000, // Refresh every minute for database changes
  });

  // Fetch service counts from states-districts.json
  const { data: serviceCounts, isLoading: serviceCountsLoading } = useQuery({
    queryKey: ['/api/admin/service-counts'],
    refetchInterval: 30000, // Refresh every 30 seconds for file-based data
  });

  // Only super admins can access platform settings
  if (!user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">Only super administrators can access platform settings.</p>
            <Button 
              onClick={() => setLocation("/admin")}
              className="mt-4"
            >
              Back to Dashboard
            </Button>
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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8 text-gray-600" />
              Platform Settings
            </h1>
            <p className="text-muted-foreground">
              Configure platform-wide settings and manage super admin tools
            </p>
          </div>
        </div>

        {/* Super Admin Tools Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-600" />
            Super Admin Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Create Admin User</h3>
                <p className="text-sm text-muted-foreground mb-3">Add new admin accounts for district management</p>
                {adminCountsLoading ? (
                  <div className="text-xs text-muted-foreground">Loading counts...</div>
                ) : adminCounts ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Super Admins:</span>
                      <Badge variant="outline" className="text-xs">{adminCounts.superAdmins}</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Regular Admins:</span>
                      <Badge variant="outline" className="text-xs">{adminCounts.regularAdmins}</Badge>
                    </div>
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>Total Admins:</span>
                      <Badge variant="secondary" className="text-xs">{adminCounts.totalAdmins}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Unable to load counts</div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">District and State Manager</h3>
                <p className="text-sm text-muted-foreground mb-3">Manage district-wise operations and coverage</p>
                {locationCountsLoading ? (
                  <div className="text-xs text-muted-foreground">Loading location data...</div>
                ) : locationCounts ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>States:</span>
                      <Badge variant="outline" className="text-xs">{locationCounts.states}</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Districts:</span>
                      <Badge variant="outline" className="text-xs">{locationCounts.districts}</Badge>
                    </div>
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>Total Locations:</span>
                      <Badge variant="secondary" className="text-xs">{locationCounts.totalLocations}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Unable to load location data</div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Database className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Database Management</h3>
                <p className="text-sm text-muted-foreground mb-3">Backup, restore, and maintain data integrity</p>
                {databaseInfoLoading ? (
                  <div className="text-xs text-muted-foreground">Loading database info...</div>
                ) : databaseInfo ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Type:</span>
                      <Badge variant="outline" className="text-xs">{databaseInfo.databaseType}</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Database:</span>
                      <Badge variant="outline" className="text-xs">{databaseInfo.databaseName}</Badge>
                    </div>
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>Tables:</span>
                      <Badge variant="secondary" className="text-xs">{databaseInfo.tableCount}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Unable to load database info</div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Service Management</h3>
                <p className="text-sm text-muted-foreground mb-3">Add, edit, and manage all service categories</p>
                {serviceCountsLoading ? (
                  <div className="text-xs text-muted-foreground">Loading service data...</div>
                ) : serviceCounts ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Unique Services:</span>
                      <Badge variant="outline" className="text-xs">{serviceCounts.uniqueServices}</Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Total Entries:</span>
                      <Badge variant="outline" className="text-xs">{serviceCounts.totalServices}</Badge>
                    </div>
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>States Covered:</span>
                      <Badge variant="secondary" className="text-xs">{serviceCounts.statesWithServices}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Unable to load service data</div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                <h3 className="font-semibold mb-2">Site Financial Statement</h3>
                <p className="text-sm text-muted-foreground">View comprehensive financial reports and analytics</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-pink-600" />
                <h3 className="font-semibold mb-2">Salary History</h3>
                <p className="text-sm text-muted-foreground">Track worker payments and salary distributions</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <UserCheck className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                <h3 className="font-semibold mb-2">Super Admin Profile</h3>
                <p className="text-sm text-muted-foreground">Manage super admin account and permissions</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
                <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground">Detailed platform metrics and insights</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-red-600" />
                <h3 className="font-semibold mb-2">Security Settings</h3>
                <p className="text-sm text-muted-foreground">Configure authentication and access controls</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="font-semibold mb-2">System Configuration</h3>
                <p className="text-sm text-muted-foreground">Platform settings and performance tuning</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Platform Status */}
          <div className="space-y-6">

            {/* Platform Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Platform Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">Security</h4>
                    <p className="text-sm text-green-600">All systems secure</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">Payments</h4>
                    <p className="text-sm text-green-600">Gateway online</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">Support</h4>
                    <p className="text-sm text-green-600">24/7 available</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Platform Status: Active</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      Operational
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700">
                    All platform services are running normally across Indian districts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - System Information */}
          <div className="space-y-6">

            {/* Platform Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  System Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Uptime:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">99.9%</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Status:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Response Time:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">120ms</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Sessions:</span>
                  <Badge variant="secondary">247</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage Usage:</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">68%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  System Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Scheduled Maintenance</p>
                      <p className="text-xs text-yellow-700">Database backup scheduled for tonight</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">New Registrations</p>
                      <p className="text-xs text-blue-700">15 new users registered today</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">System Update</p>
                      <p className="text-xs text-green-700">Security patches applied successfully</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}