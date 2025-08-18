import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  UserCheck,
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2
} from "lucide-react";

export default function PlatformSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isLoading, setIsLoading] = useState(false);
  const [keyManagementOpen, setKeyManagementOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [apiKeys, setApiKeys] = useState({
    smsApiKey: '',
    smsApiSecret: '',
    whatsappApiKey: '',
    whatsappBusinessId: '',
    stripePublicKey: '',
    stripeSecretKey: '',
    gpayMerchantId: '',
    gpayMerchantKey: '',
    phonePeMerchantId: '',
    phonePeMerchantKey: '',
    emailApiKey: '',
    emailServiceUrl: '',
    emailFromAddress: ''
  });

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

  // Load existing API keys when dialog opens
  useEffect(() => {
    if (keyManagementOpen) {
      loadApiKeys();
    }
  }, [keyManagementOpen]);

  const loadApiKeys = async () => {
    try {
      const response = await fetch("/api/admin/api-keys");
      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }
      
      const existingKeys = await response.json();
      
      // Transform backend data to frontend format
      const keyMap: Record<string, string> = {};
      existingKeys.forEach((key: any) => {
        const keyIdentifier = `${key.keyType}_${key.keyName}`;
        keyMap[keyIdentifier] = key.keyValue;
      });

      setApiKeys({
        smsApiKey: keyMap['sms_api_key'] || "",
        smsApiSecret: keyMap['sms_secret_key'] || "",
        whatsappApiKey: keyMap['whatsapp_api_key'] || "",
        whatsappBusinessId: keyMap['whatsapp_business_id'] || "",
        stripePublicKey: keyMap['stripe_public_key'] || "",
        stripeSecretKey: keyMap['stripe_secret_key'] || "",
        gpayMerchantId: keyMap['gpay_merchant_id'] || "",
        gpayMerchantKey: keyMap['gpay_merchant_key'] || "",
        phonePeMerchantId: keyMap['phonepe_merchant_id'] || "",
        phonePeMerchantKey: keyMap['phonepe_merchant_key'] || "",
        emailApiKey: keyMap['email_api_key'] || "",
        emailServiceUrl: keyMap['email_service_url'] || "",
        emailFromAddress: keyMap['email_from_address'] || "",
      });
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast({
        title: "Warning",
        description: "Could not load existing API keys.",
        variant: "destructive",
      });
    }
  };

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

            <Dialog open={keyManagementOpen} onOpenChange={setKeyManagementOpen}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Key className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
                    <h3 className="font-semibold mb-2">Key Management</h3>
                    <p className="text-sm text-muted-foreground">Manage API keys for SMS, WhatsApp, payments, and email services</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-600" />
                    API Key Management
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* SMS API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        SMS API Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smsApiKey">SMS API Key</Label>
                          <div className="relative">
                            <Input
                              id="smsApiKey"
                              type={showKeys['smsApiKey'] ? 'text' : 'password'}
                              value={apiKeys.smsApiKey}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, smsApiKey: e.target.value }))}
                              placeholder="Enter SMS API Key"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, smsApiKey: !prev.smsApiKey }))}
                            >
                              {showKeys['smsApiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smsApiSecret">SMS API Secret</Label>
                          <div className="relative">
                            <Input
                              id="smsApiSecret"
                              type={showKeys['smsApiSecret'] ? 'text' : 'password'}
                              value={apiKeys.smsApiSecret}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, smsApiSecret: e.target.value }))}
                              placeholder="Enter SMS API Secret"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, smsApiSecret: !prev.smsApiSecret }))}
                            >
                              {showKeys['smsApiSecret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* WhatsApp Bulk API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        WhatsApp Bulk API Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="whatsappApiKey">WhatsApp API Key</Label>
                          <div className="relative">
                            <Input
                              id="whatsappApiKey"
                              type={showKeys['whatsappApiKey'] ? 'text' : 'password'}
                              value={apiKeys.whatsappApiKey}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, whatsappApiKey: e.target.value }))}
                              placeholder="Enter WhatsApp API Key"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, whatsappApiKey: !prev.whatsappApiKey }))}
                            >
                              {showKeys['whatsappApiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsappBusinessId">WhatsApp Business ID</Label>
                          <Input
                            id="whatsappBusinessId"
                            value={apiKeys.whatsappBusinessId}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, whatsappBusinessId: e.target.value }))}
                            placeholder="Enter WhatsApp Business ID"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stripe Payment Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        Stripe Payment Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                          <Input
                            id="stripePublicKey"
                            value={apiKeys.stripePublicKey}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, stripePublicKey: e.target.value }))}
                            placeholder="pk_live_..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                          <div className="relative">
                            <Input
                              id="stripeSecretKey"
                              type={showKeys['stripeSecretKey'] ? 'text' : 'password'}
                              value={apiKeys.stripeSecretKey}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                              placeholder="sk_live_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, stripeSecretKey: !prev.stripeSecretKey }))}
                            >
                              {showKeys['stripeSecretKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GPay Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                        Google Pay Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gpayMerchantId">GPay Merchant ID</Label>
                          <Input
                            id="gpayMerchantId"
                            value={apiKeys.gpayMerchantId}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, gpayMerchantId: e.target.value }))}
                            placeholder="Enter GPay Merchant ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gpayMerchantKey">GPay Merchant Key</Label>
                          <div className="relative">
                            <Input
                              id="gpayMerchantKey"
                              type={showKeys['gpayMerchantKey'] ? 'text' : 'password'}
                              value={apiKeys.gpayMerchantKey}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, gpayMerchantKey: e.target.value }))}
                              placeholder="Enter GPay Merchant Key"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, gpayMerchantKey: !prev.gpayMerchantKey }))}
                            >
                              {showKeys['gpayMerchantKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* PhonePe Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-600" />
                        PhonePe Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phonePeMerchantId">PhonePe Merchant ID</Label>
                          <Input
                            id="phonePeMerchantId"
                            value={apiKeys.phonePeMerchantId}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, phonePeMerchantId: e.target.value }))}
                            placeholder="Enter PhonePe Merchant ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phonePeMerchantKey">PhonePe Merchant Key</Label>
                          <div className="relative">
                            <Input
                              id="phonePeMerchantKey"
                              type={showKeys['phonePeMerchantKey'] ? 'text' : 'password'}
                              value={apiKeys.phonePeMerchantKey}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, phonePeMerchantKey: e.target.value }))}
                              placeholder="Enter PhonePe Merchant Key"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, phonePeMerchantKey: !prev.phonePeMerchantKey }))}
                            >
                              {showKeys['phonePeMerchantKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email API Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-red-600" />
                        Email API Configuration (Forgot Password)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emailApiKey">Email API Key</Label>
                          <div className="relative">
                            <Input
                              id="emailApiKey"
                              type={showKeys['emailApiKey'] ? 'text' : 'password'}
                              value={apiKeys.emailApiKey}
                              onChange={(e) => setApiKeys(prev => ({ ...prev, emailApiKey: e.target.value }))}
                              placeholder="Enter Email API Key"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowKeys(prev => ({ ...prev, emailApiKey: !prev.emailApiKey }))}
                            >
                              {showKeys['emailApiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emailServiceUrl">Email Service URL</Label>
                          <Input
                            id="emailServiceUrl"
                            value={apiKeys.emailServiceUrl}
                            onChange={(e) => setApiKeys(prev => ({ ...prev, emailServiceUrl: e.target.value }))}
                            placeholder="https://api.emailservice.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailFromAddress">From Email Address</Label>
                        <Input
                          id="emailFromAddress"
                          type="email"
                          value={apiKeys.emailFromAddress}
                          onChange={(e) => setApiKeys(prev => ({ ...prev, emailFromAddress: e.target.value }))}
                          placeholder="noreply@spanner.co.in"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setKeyManagementOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          
                          // Transform apiKeys object to match backend format
                          const transformedKeys = {
                            sms: {
                              api_key: apiKeys.smsApiKey,
                              secret_key: apiKeys.smsApiSecret
                            },
                            whatsapp: {
                              api_key: apiKeys.whatsappApiKey,
                              business_id: apiKeys.whatsappBusinessId
                            },
                            stripe: {
                              public_key: apiKeys.stripePublicKey,
                              secret_key: apiKeys.stripeSecretKey
                            },
                            gpay: {
                              merchant_id: apiKeys.gpayMerchantId,
                              merchant_key: apiKeys.gpayMerchantKey
                            },
                            phonepe: {
                              merchant_id: apiKeys.phonePeMerchantId,
                              merchant_key: apiKeys.phonePeMerchantKey
                            },
                            email: {
                              api_key: apiKeys.emailApiKey,
                              service_url: apiKeys.emailServiceUrl,
                              from_address: apiKeys.emailFromAddress
                            }
                          };

                          const response = await fetch("/api/admin/api-keys", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ apiKeys: transformedKeys }),
                          });

                          if (!response.ok) {
                            throw new Error("Failed to save API keys");
                          }

                          toast({
                            title: "API Keys Saved",
                            description: "All API keys have been securely saved to the system.",
                          });
                          setKeyManagementOpen(false);
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to save API keys. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save All Keys"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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