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
  DollarSign,
  Activity,
  Database,
  Users,
  Briefcase,
  Bell,
  Lock,
  Globe,
  Zap,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Save
} from "lucide-react";

export default function PlatformSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [platformFee, setPlatformFee] = useState("15");
  const [paymentProcessingFee, setPaymentProcessingFee] = useState("2.5");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Updated",
        description: "Platform settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update platform settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              Configure platform-wide settings and commission structure
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Commission Structure */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Commission Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                    <Input
                      id="platform-fee"
                      type="number"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      min="0"
                      max="50"
                      step="0.1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Current platform commission rate
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-fee">Payment Processing Fee (%)</Label>
                    <Input
                      id="payment-fee"
                      type="number"
                      value={paymentProcessingFee}
                      onChange={(e) => setPaymentProcessingFee(e.target.value)}
                      min="0"
                      max="10"
                      step="0.1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Gateway processing charges
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Commission Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Worker receives:</span>
                      <span className="font-medium text-green-600">
                        {100 - parseFloat(platformFee) - parseFloat(paymentProcessingFee)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee:</span>
                      <span className="font-medium">{platformFee}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment processing:</span>
                      <span className="font-medium">{paymentProcessingFee}%</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>

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
                    All platform services are running normally across Tamil Nadu districts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Super Admin Tools */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Super Admin Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <User className="w-4 h-4" />
                  Create Admin User
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  District Manager
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Lock className="w-4 h-4" />
                  Security Settings
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Database className="w-4 h-4" />
                  Database Management
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Zap className="w-4 h-4" />
                  System Configuration
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Globe className="w-4 h-4" />
                  Advanced Analytics
                </Button>
              </CardContent>
            </Card>

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