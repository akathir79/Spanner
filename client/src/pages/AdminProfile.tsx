import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Edit3,
  Save,
  X,
  MapPin,
  Camera,
  Shield,
  Mail,
  Phone,
  Building,
  ArrowLeft,
  CheckCircle,
  Lock,
  Globe,
  Activity,
  Search
} from "lucide-react";

const AdminProfile = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    houseNumber: user?.houseNumber || '',
    streetName: user?.streetName || '',
    areaName: user?.areaName || '',
    district: user?.district || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    fullAddress: user?.fullAddress || '',
    department: '', // This field doesn't exist in User type, just for admin display
    profilePicture: user?.profilePicture || '',
    bankAccountNumber: user?.bankAccountNumber || '',
    bankAccountHolderName: user?.bankAccountHolderName || '',
    bankIFSC: user?.bankIFSC || '',
    bankName: user?.bankName || '',
    bankBranch: user?.bankBranch || '',
    bankAddress: user?.bankAddress || ''
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearchingIFSC, setIsSearchingIFSC] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle profile picture upload
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({ ...prev, profilePicture: reader.result as string }));
        toast({
          title: "Image selected",
          description: "Your new profile picture will be saved when you click Save"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-detect location
  const handleDetectLocation = async () => {
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Using Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) throw new Error('Failed to fetch location details');
          
          const data = await response.json();
          const address = data.address || {};
          
          setEditData(prev => ({
            ...prev,
            houseNumber: address.house_number || '',
            streetName: address.road || address.street || '',
            areaName: address.neighbourhood || address.suburb || address.village || '',
            district: address.state_district || address.county || '',
            state: address.state || '',
            pincode: address.postcode || ''
          }));
          
          toast({
            title: "Location Detected",
            description: "Your location has been auto-filled successfully!"
          });
        } catch (error) {
          console.error('Error detecting location:', error);
          toast({
            title: "Detection Failed",
            description: "Could not detect your location. Please enter manually.",
            variant: "destructive"
          });
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Access Denied",
          description: "Please enable location access and try again.",
          variant: "destructive"
        });
        setIsDetecting(false);
      }
    );
  };

  // Handle IFSC lookup - same as worker registration
  const handleIFSCLookup = async () => {
    if (!editData.bankIFSC || editData.bankIFSC.length !== 11) {
      toast({
        title: "Invalid IFSC",
        description: "Please enter a valid 11-character IFSC code",
        variant: "destructive"
      });
      return;
    }

    setIsSearchingIFSC(true);
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${editData.bankIFSC.toUpperCase()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('IFSC code not found');
        }
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format the address properly from the API response
      const addressParts = [data.ADDRESS];
      if (data.CITY && data.CITY !== data.CENTRE) {
        addressParts.push(data.CITY);
      }
      if (data.STATE) {
        addressParts.push(data.STATE);
      }
      
      // Update form with bank details
      setEditData(prev => ({
        ...prev,
        bankName: data.BANK,
        bankBranch: data.BRANCH,
        bankAddress: addressParts.join(', ')
      }));
      
      toast({
        title: "Bank Details Found",
        description: `${data.BANK} - ${data.BRANCH}, ${data.CITY}`,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (errorMessage.includes('IFSC code not found')) {
        toast({
          title: "IFSC Not Found",
          description: "The IFSC code you entered is not valid. Please verify and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Unable to fetch bank details at the moment. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    }
    setIsSearchingIFSC(false);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, editData);
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your admin profile has been updated successfully!"
        });
        setIsEditing(false);
        // Refresh user data
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  const isSuper = user.role === "super_admin";

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin-dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{isSuper ? "Super Admin" : "Admin"} Profile</span>
            </CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Admin Identity Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={isEditing ? editData.profilePicture : user.profilePicture} 
                      alt={user.firstName} 
                    />
                    <AvatarFallback className={`text-xl ${isSuper ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                      />
                    </>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSuper ? "Super Administrator" : "Administrator"}
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
                    <Label className="text-sm text-muted-foreground">First Name</Label>
                    {isEditing ? (
                      <Input
                        value={editData.firstName}
                        onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Name</Label>
                    {isEditing ? (
                      <Input
                        value={editData.lastName}
                        onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user.lastName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Department</Label>
                    {isEditing ? (
                      <Input
                        placeholder="Department"
                        value={editData.department}
                        onChange={(e) => setEditData(prev => ({ ...prev, department: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">
                        {isSuper ? "System Administration" : "Operations Management"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
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
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium p-2 bg-muted rounded border">{user.email || "Not provided"}</p>
                  )}
                </div>
              </div>

              {/* Office Location */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Office Location
                </h4>
                {isEditing && (
                  <Button 
                    onClick={handleDetectLocation} 
                    disabled={isDetecting}
                    className="w-full"
                    variant="outline"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {isDetecting ? "Detecting..." : "Auto Detect"}
                  </Button>
                )}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Office/Building Number</Label>
                      {isEditing ? (
                        <Input
                          placeholder="Number"
                          value={editData.houseNumber}
                          onChange={(e) => setEditData(prev => ({ ...prev, houseNumber: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium p-2 bg-muted rounded border">{user.houseNumber || "Not specified"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Street Name</Label>
                      {isEditing ? (
                        <Input
                          placeholder="Street"
                          value={editData.streetName}
                          onChange={(e) => setEditData(prev => ({ ...prev, streetName: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium p-2 bg-muted rounded border">{user.streetName || "Not specified"}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Area/Locality</Label>
                    {isEditing ? (
                      <Input
                        placeholder="Area"
                        value={editData.areaName}
                        onChange={(e) => setEditData(prev => ({ ...prev, areaName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user.areaName || "Not specified"}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">District</Label>
                      {isEditing ? (
                        <Input
                          placeholder="District"
                          value={editData.district}
                          onChange={(e) => setEditData(prev => ({ ...prev, district: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium p-2 bg-muted rounded border">{user.district}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">State</Label>
                      {isEditing ? (
                        <Input
                          placeholder="State"
                          value={editData.state}
                          onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                        />
                      ) : (
                        <p className="font-medium p-2 bg-muted rounded border">{user.state}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">PIN Code</Label>
                    {isEditing ? (
                      <Input
                        placeholder="PIN Code"
                        value={editData.pincode}
                        onChange={(e) => setEditData(prev => ({ ...prev, pincode: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user.pincode || "Not specified"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Bank Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Number</Label>
                    {isEditing ? (
                      <Input
                        placeholder="Account Number"
                        value={editData.bankAccountNumber}
                        onChange={(e) => setEditData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user.bankAccountNumber || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Holder Name</Label>
                    {isEditing ? (
                      <Input
                        placeholder="Account Holder Name"
                        value={editData.bankAccountHolderName}
                        onChange={(e) => setEditData(prev => ({ ...prev, bankAccountHolderName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user?.bankAccountHolderName || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">IFSC Code</Label>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="IFSC Code"
                          value={editData.bankIFSC}
                          onChange={(e) => setEditData(prev => ({ ...prev, bankIFSC: e.target.value.toUpperCase() }))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleIFSCLookup}
                          disabled={isSearchingIFSC || editData.bankIFSC.length !== 11}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          {isSearchingIFSC ? "Searching..." : "Search"}
                        </Button>
                      </div>
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user?.bankIFSC || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Bank Name</Label>
                    {isEditing ? (
                      <Input
                        placeholder="Bank Name"
                        value={editData.bankName}
                        onChange={(e) => setEditData(prev => ({ ...prev, bankName: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user.bankName || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Branch Name</Label>
                    {isEditing ? (
                      <Input
                        placeholder="Branch Name"
                        value={editData.bankBranch}
                        onChange={(e) => setEditData(prev => ({ ...prev, bankBranch: e.target.value }))}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user?.bankBranch || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Bank Address</Label>
                    {isEditing ? (
                      <Textarea
                        placeholder="Bank Address"
                        value={editData.bankAddress}
                        onChange={(e) => setEditData(prev => ({ ...prev, bankAddress: e.target.value }))}
                        rows={2}
                      />
                    ) : (
                      <p className="font-medium p-2 bg-muted rounded border">{user?.bankAddress || "Not specified"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* System Access & Activity Section */}
            <div className="space-y-6">
              <h4 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                System Access Level
              </h4>
              <div className="space-y-3">
                <Badge className={`inline-flex ${isSuper ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {isSuper ? "Full System Access" : "Admin Access"}
                </Badge>
                {isSuper && (
                  <Badge className="inline-flex bg-green-100 text-green-800 ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Admin Creation
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Worker Verifications</p>
                    <p className="text-xs text-muted-foreground">1 pending verifications</p>
                    <p className="text-xs text-blue-600 mt-1">Today</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium">Platform Overview</p>
                    <p className="text-xs text-muted-foreground">0 total bookings managed</p>
                    <p className="text-xs text-green-600 mt-1">Active</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Administrative Scope */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Administrative Scope
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Platform Coverage</span>
                    <span className="text-sm font-medium">All India</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total States</span>
                    <span className="text-sm font-medium">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Districts</span>
                    <span className="text-sm font-medium">699</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Service Categories</span>
                    <span className="text-sm font-medium">9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Quick Actions</h4>
            <div className="flex gap-2">
              {isSuper && (
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Create Admin
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AdminProfile;