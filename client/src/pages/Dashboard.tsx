import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  X,
  MapPin as MapPinIcon,
  Users,
  CreditCard,
  Camera,
  Home,
  Edit3,
  Save,
  Video,
  Volume2,
  Play,
  Pause,
  Eye,
  EyeOff,
  ChevronUp,
  Mic,
  MicOff,
  Upload,
  FileText,
  Briefcase,
  Settings,
  Info,
  Lightbulb,
  IndianRupee,
  TrendingUp,
  Grid,
  List,
  Palette,
  RotateCcw,
  Layout,
  Maximize,
  Minimize,
  Move,
  Zap,
  BarChart,
  Paperclip,
  Bell,
  UserCheck,
  Wallet,
  Gift,
  Percent
} from "lucide-react";
import { useLocation } from "wouter";
import LocationViewer from "@/components/LocationViewer";
import ClientBankDetailsForm from "@/components/ClientBankDetailsForm";
import { ProfileCompletionAlert } from "@/components/ProfileCompletionAlert";
import AdvertisementCarousel from "@/components/AdvertisementCarousel";
import statesDistrictsData from "@shared/states-districts.json";
// Services and districts are now fetched dynamically from database

// Client Profile Card Component with Edit functionality
const ClientProfileCard = ({ user, refreshUser }: { user: any, refreshUser: () => void }) => {
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
    profilePicture: user?.profilePicture || ''
  });
  const [isDetecting, setIsDetecting] = useState(false);
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

  const handleSave = async () => {
    try {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, editData);
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully!"
        });
        setIsEditing(false);
        refreshUser();
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Client Profile</span>
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
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={isEditing ? editData.profilePicture : user.profilePicture} 
                  alt={user.firstName} 
                />
                <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
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
              <h3 className="text-lg font-semibold">
                {user.firstName}{" "}
                {user.lastName === "UPDATE_REQUIRED" ? (
                  <span className="text-red-500 text-xs">UPDATE_REQUIRED</span>
                ) : (
                  user.lastName
                )}
              </h3>
              <p className="text-sm text-muted-foreground">Client Account</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="font-medium p-2 bg-muted rounded border">
                  {user.lastName === "UPDATE_REQUIRED" ? (
                    <span className="text-red-500 text-xs">UPDATE_REQUIRED</span>
                  ) : (
                    user.lastName
                  )}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Mobile Number</Label>
              <p className="font-medium p-2 bg-muted rounded border">{user.mobile}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email Address</Label>
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

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Details
              </h4>
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {isDetecting ? "Detecting..." : "Auto Detect"}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">House Number</Label>
                {isEditing ? (
                  <Input
                    placeholder="House/Flat/Building No."
                    value={editData.houseNumber}
                    onChange={(e) => setEditData(prev => ({ ...prev, houseNumber: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.houseNumber || "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Street Name</Label>
                {isEditing ? (
                  <Input
                    placeholder="Street/Road Name"
                    value={editData.streetName}
                    onChange={(e) => setEditData(prev => ({ ...prev, streetName: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.streetName || "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Area/Locality</Label>
                {isEditing ? (
                  <Input
                    placeholder="Area/Locality Name"
                    value={editData.areaName}
                    onChange={(e) => setEditData(prev => ({ ...prev, areaName: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.areaName || "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">District</Label>
                {isEditing ? (
                  <Input
                    placeholder="District"
                    value={editData.district}
                    onChange={(e) => setEditData(prev => ({ ...prev, district: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.district || "Not specified"}
                  </p>
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
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.state || "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">PIN Code</Label>
                {isEditing ? (
                  <Input
                    placeholder="6-digit PIN"
                    maxLength={6}
                    value={editData.pincode}
                    onChange={(e) => setEditData(prev => ({ ...prev, pincode: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.pincode || "Not specified"}
                  </p>
                )}
              </div>
            </div>
            
            {(user.fullAddress || isEditing) && (
              <div>
                <Label className="text-sm text-muted-foreground">Complete Address</Label>
                {isEditing ? (
                  <Textarea
                    placeholder="Enter complete address"
                    rows={3}
                    value={editData.fullAddress}
                    onChange={(e) => setEditData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-3 bg-muted rounded border whitespace-pre-line">
                    {user.fullAddress}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Bank Info interface for IFSC API
interface BankInfo {
  BANK: string;
  IFSC: string;
  BRANCH: string;
  ADDRESS: string;
  CONTACT: string;
  CITY: string;
  RTGS: boolean;
  NEFT: boolean;
  SWIFT: string;
  ISO3166: string;
  BANKCODE: string;
  CENTRE: string;
  DISTRICT: string;
  STATE: string;
  MICR: string;
}

// Profile Details Card Component
const ProfileDetailsCard = ({ user, onUpdate }: { user: any, onUpdate: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(user || {});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();



  useEffect(() => {
    setEditData(user || {});
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, updatedData);
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      
      // Force refresh user data from server
      await refreshUser();
      onUpdate();
      
      // Also invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData(user || {});
    setIsEditing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const success = await refreshUser();
    if (success) {
      toast({
        title: "Profile Refreshed",
        description: "Your profile has been updated with the latest information.",
      });
      onUpdate();
    } else {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh profile data",
        variant: "destructive",
      });
    }
    setIsRefreshing(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        try {
          // Update user profile with new photo
          const response = await apiRequest("PUT", `/api/users/${user.id}`, {
            profilePicture: base64String
          });
          
          if (response.ok) {
            toast({
              title: "Photo Updated",
              description: "Your profile photo has been updated successfully",
            });
            onUpdate();
            // Refresh user data
            await refreshUser();
          } else {
            throw new Error("Failed to update photo");
          }
        } catch (error) {
          toast({
            title: "Upload Failed",
            description: "Failed to update profile photo",
            variant: "destructive",
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process image file",
        variant: "destructive",
      });
      setIsUploadingPhoto(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <div className="space-x-2">
            {!isEditing && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            )}
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Avatar Section */}
        <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage 
                src={user?.profilePicture || undefined} 
                alt={`${user?.firstName} ${user?.lastName}`} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="profile-photo-upload"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  disabled={isUploadingPhoto}
                  onClick={() => document.getElementById('profile-photo-upload')?.click()}
                >
                  {isUploadingPhoto ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-muted-foreground">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} • {user?.id}</p>
            <p className="text-sm text-muted-foreground">
              {user?.district ? `${user.district}, ${user.state || 'India'}` : 'Location not set'}
            </p>
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                Click the camera icon to change your profile photo
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={editData.firstName || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First Name"
                />
                <Input
                  value={editData.lastName || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
            {isEditing ? (
              <Input
                value={editData.mobile || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Mobile Number"
              />
            ) : (
              <p className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {user?.mobile}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
            {isEditing ? (
              <Input
                type="email"
                value={editData.email || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email Address"
              />
            ) : (
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user?.email || 'Not provided'}
              </p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
            <p className="font-medium text-xs bg-muted px-2 py-1 rounded">{user?.id}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Full Address</Label>
            {isEditing ? (
              <Textarea
                value={editData.address || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your full address"
                rows={3}
              />
            ) : (
              <p className="font-medium">{user?.address || 'Not provided'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">District</Label>
              <p className="font-medium">{user?.district || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">State</Label>
              <p className="font-medium">{user?.state || 'Not provided'}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Pincode</Label>
            {isEditing ? (
              <Input
                value={editData.pincode || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, pincode: e.target.value }))}
                placeholder="Pincode"
              />
            ) : (
              <p className="font-medium">{user?.pincode || 'Not provided'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
            <div className="flex items-center gap-2">
              {user?.isVerified ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending Verification
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Bank Details Card Component
const BankDetailsCard = ({ user, onUpdate }: { user: any, onUpdate: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(user || {});
  const [isSearchingIFSC, setIsSearchingIFSC] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [ifscErrors, setIfscErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  useEffect(() => {
    setEditData(user || {});
  }, [user]);

  // IFSC lookup function
  const lookupIFSC = useCallback(async (ifscCode: string): Promise<BankInfo | null> => {
    setIsSearchingIFSC(true);
    
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode.toUpperCase()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('IFSC code not found');
        }
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setIsSearchingIFSC(false);
      return data;
    } catch (error) {
      setIsSearchingIFSC(false);
      console.error('IFSC lookup error:', error);
      throw error;
    }
  }, []);

  // Handle IFSC lookup
  const handleIFSCLookup = useCallback(async () => {
    const ifscCode = editData.bankIFSC;
    if (!ifscCode || ifscCode.length !== 11) {
      setIfscErrors(prev => ({ ...prev, bankIFSC: 'Please enter a valid 11-character IFSC code' }));
      return;
    }

    try {
      const result = await lookupIFSC(ifscCode);
      if (result) {
        setBankInfo(result);
        
        // Format the address properly from the API response
        const addressParts = [result.ADDRESS];
        if (result.CITY && result.CITY !== result.CENTRE) {
          addressParts.push(result.CITY);
        }
        if (result.STATE) {
          addressParts.push(result.STATE);
        }
        
        // Update form with bank details
        setEditData(prev => ({
          ...prev,
          bankName: result.BANK,
          bankBranch: result.BRANCH,
          bankMICR: result.MICR || ''
        }));
        
        setIfscErrors(prev => ({ ...prev, bankIFSC: '' }));
        
        toast({
          title: "Bank Details Found",
          description: `${result.BANK} - ${result.BRANCH}, ${result.CITY}`,
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (errorMessage.includes('IFSC code not found')) {
        setIfscErrors(prev => ({ ...prev, bankIFSC: 'Invalid IFSC code. Please check and try again.' }));
        toast({
          title: "IFSC Not Found",
          description: "The IFSC code you entered is not valid. Please verify and try again.",
          variant: "destructive",
        });
      } else {
        setIfscErrors(prev => ({ ...prev, bankIFSC: 'Failed to fetch bank details. Please try again.' }));
        toast({
          title: "Connection Error",
          description: "Unable to fetch bank details at the moment. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    }
  }, [editData.bankIFSC, lookupIFSC, toast]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await apiRequest("PUT", `/api/users/${user.id}`, updatedData);
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Bank Details Updated",
        description: "Your bank details have been updated successfully.",
      });
      setIsEditing(false);
      
      // Force refresh user data from server
      await refreshUser();
      onUpdate();
      
      // Also invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update bank details",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData(user || {});
    setIsEditing(false);
    setBankInfo(null);
    setIfscErrors({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Details
          </CardTitle>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Details Notice */}
        {(!user?.bankAccountNumber) && !isEditing && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              <strong>Complete your profile:</strong> Add your bank details for faster payment processing when using our services.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Account Holder Name</Label>
            {isEditing ? (
              <Input
                value={editData.bankAccountHolderName || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, bankAccountHolderName: e.target.value }))}
                placeholder="Enter account holder name"
              />
            ) : (
              <p className="font-medium">{user?.bankAccountHolderName || 'Not provided'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
            {isEditing ? (
              <Input
                value={editData.bankAccountNumber || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                placeholder="Enter account number"
              />
            ) : (
              <p className="font-medium">{user?.bankAccountNumber || 'Not provided'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={editData.bankIFSC || ''}
                    onChange={(e) => {
                      const ifscValue = e.target.value.toUpperCase();
                      setEditData(prev => ({ ...prev, bankIFSC: ifscValue }));
                      // Clear previous bank info when IFSC changes
                      if (ifscValue !== editData.bankIFSC) {
                        setBankInfo(null);
                      }
                    }}
                    placeholder="Enter 11-character IFSC code"
                    maxLength={11}
                    className={`flex-1 ${ifscErrors.bankIFSC ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    onClick={handleIFSCLookup}
                    disabled={isSearchingIFSC || !editData.bankIFSC || editData.bankIFSC.length !== 11}
                    className="px-6"
                  >
                    {isSearchingIFSC ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {ifscErrors.bankIFSC && (
                  <p className="text-sm text-red-500">{ifscErrors.bankIFSC}</p>
                )}
                {bankInfo && (
                  <Alert className="border-green-200 bg-green-50">
                    <CreditCard className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">{bankInfo.BANK}</p>
                          <p className="text-sm">{bankInfo.BRANCH}</p>
                          <p className="text-xs text-muted-foreground">{bankInfo.ADDRESS}</p>
                          <p className="text-xs text-muted-foreground">{bankInfo.CITY}, {bankInfo.STATE}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <p className="font-medium">{user?.bankIFSC || 'Not provided'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
            {isEditing ? (
              <Input
                value={editData.bankName || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Bank name will be auto-filled from IFSC"
                readOnly={!!bankInfo}
              />
            ) : (
              <p className="font-medium">{user?.bankName || 'Not provided'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Branch Name</Label>
            {isEditing ? (
              <Input
                value={editData.bankBranch || ""}
                onChange={(e) => setEditData(prev => ({ ...prev, bankBranch: e.target.value }))}
                placeholder="Branch name will be auto-filled from IFSC"
                readOnly={!!bankInfo}
              />
            ) : (
              <p className="font-medium">{user?.bankBranch || 'Not provided'}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
            {isEditing ? (
              <Select 
                value={editData.bankAccountType || ''} 
                onValueChange={(val) => setEditData(prev => ({ ...prev, bankAccountType: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium capitalize">{user?.bankAccountType || 'Not provided'}</p>
            )}
          </div>

          {user?.bankMICR && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">MICR Code</Label>
              <p className="font-medium">{user.bankMICR}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Job posting form component
const JobPostingForm = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    serviceCategory: "",
    serviceAddress: "",
    state: "",
    districtId: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    requirements: [] as string[],
  });
  const [newRequirement, setNewRequirement] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Fetch services and districts
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => 
      fetch("/api/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posted successfully! Workers can now bid on your job.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
      // Auto-close the form dialog
      if (onClose) {
        onClose();
      }
      // Reset form
      setFormData({
        title: "",
        description: "",
        serviceCategory: "",
        serviceAddress: "",
        state: "",
        districtId: "",
        budgetMin: "",
        budgetMax: "",
        deadline: "",
        requirements: [],
      });
      setNewRequirement("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !formData.title || !formData.description || !formData.serviceCategory || !formData.serviceAddress) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including service address.",
        variant: "destructive",
      });
      return;
    }

    // Extract state and district from address for database compatibility
    const extractedState = formData.state || (formData.serviceAddress?.includes('Tamil Nadu') ? 'Tamil Nadu' : user?.state || 'Tamil Nadu');
    const extractedDistrict = formData.districtId || user?.district || 'Salem';
    
    const jobData = {
      clientId: user.id,
      title: formData.title,
      description: formData.description,
      serviceCategory: formData.serviceCategory,
      serviceAddress: formData.serviceAddress,
      state: extractedState,
      districtId: extractedDistrict,
      budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
      budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
      deadline: formData.deadline || null,
      requirements: formData.requirements,
    };

    createJobMutation.mutate(jobData);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  const handleLocationFinder = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use real-time district detection
          // Convert statesDistrictsData to districts format for location functions
          const allDistricts = statesDistrictsData.states ? Object.values(statesDistrictsData.states).flatMap((stateData: any, stateIndex: number) => 
            stateData.districts.map((district: string) => ({ 
              id: district, 
              name: district,
              state: Object.keys(statesDistrictsData.states)[stateIndex]
            }))
          ) : [];
          const nearbyDistrict = await findNearestDistrict(latitude, longitude, allDistricts);
          
          if (nearbyDistrict) {
            // Use Nominatim API for detailed address (same as client registration)
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
              );
              
              if (!response.ok) throw new Error('Failed to get location data');
              
              const data = await response.json();
              
              if (data && data.address) {
                const locationData = data.address;
                const detectedPincode = locationData.postcode || '';
                
                // Format professional address in required format
                let formattedAddress = "";
                
                // Build area components for first line
                const areaComponents = [];
                if (locationData.village || locationData.suburb || locationData.neighbourhood) {
                  areaComponents.push(locationData.village || locationData.suburb || locationData.neighbourhood);
                }
                if (locationData.city_district || (locationData.city && locationData.city !== nearbyDistrict.name)) {
                  areaComponents.push(locationData.city_district || locationData.city);
                }
                
                // First line: Area details (like "Narasothipatti, Salem West")
                if (areaComponents.length > 0) {
                  formattedAddress = areaComponents.join(', ');
                } else if (locationData.road) {
                  formattedAddress = locationData.road;
                } else {
                  formattedAddress = "Current Location";
                }
                
                // Second line: District, State (like "Salem, Tamil Nadu")
                formattedAddress += `\n${nearbyDistrict.name}, ${nearbyDistrict.state}`;
                
                // Third line: PIN code if available
                if (detectedPincode) {
                  formattedAddress += `\nPIN: ${detectedPincode}`;
                }
                
                setFormData(prev => ({ 
                  ...prev, 
                  serviceAddress: formattedAddress,
                  state: nearbyDistrict.state,
                  districtId: nearbyDistrict.name 
                }));
                
                toast({
                  title: "Location detected",
                  description: `Address set successfully. You can edit if needed.`,
                });
              } else {
                throw new Error('No address data found');
              }
            } catch (error) {
              // Fallback to basic district info if reverse geocoding fails
              const basicAddress = `Current Location\n${nearbyDistrict.name}, ${nearbyDistrict.state}`;
              setFormData(prev => ({ 
                ...prev, 
                serviceAddress: basicAddress,
                state: nearbyDistrict.state,
                districtId: nearbyDistrict.name 
              }));
              
              toast({
                title: "Location detected",
                description: `Basic location set. Please add specific area details.`,
              });
            }
          } else {
            toast({
              title: "Location not found",
              description: "Please enter the service address manually.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Location processing error:', error);
          toast({
            title: "Location processing failed",
            description: "Please select a district manually.",
            variant: "destructive",
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        let errorMessage = "Could not detect your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "Location access required",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  const findNearestDistrict = async (lat: number, lng: number, districts: any[]) => {
    // Use coordinate-based matching for immediate, reliable results
    return findDistrictByCoordinates(lat, lng, districts);
  };

  const findDistrictByCoordinates = (lat: number, lng: number, districts: any[]) => {
    // Tamil Nadu boundary check
    if (lat < 8.0 || lat > 13.5 || lng < 76.0 || lng > 80.5) {
      return null; // Outside Tamil Nadu
    }
    
    // Precise district coordinate boundaries for accurate detection
    const districtBounds: { [key: string]: { 
      latMin: number; latMax: number; lngMin: number; lngMax: number; center: { lat: number; lng: number } 
    } } = {
      'Chennai': { latMin: 12.74, latMax: 13.35, lngMin: 80.12, lngMax: 80.32, center: { lat: 13.0827, lng: 80.2707 } },
      'Coimbatore': { latMin: 10.75, latMax: 11.40, lngMin: 76.85, lngMax: 77.25, center: { lat: 11.0168, lng: 76.9558 } },
      'Madurai': { latMin: 9.70, latMax: 10.25, lngMin: 77.85, lngMax: 78.35, center: { lat: 9.9252, lng: 78.1198 } },
      'Tiruchirappalli': { latMin: 10.55, latMax: 11.05, lngMin: 78.45, lngMax: 78.95, center: { lat: 10.7905, lng: 78.7047 } },
      'Salem': { latMin: 11.45, latMax: 11.90, lngMin: 77.95, lngMax: 78.35, center: { lat: 11.6643, lng: 78.1460 } },
      'Tirunelveli': { latMin: 8.45, latMax: 8.95, lngMin: 77.45, lngMax: 77.95, center: { lat: 8.7139, lng: 77.7567 } },
      'Vellore': { latMin: 12.65, latMax: 13.15, lngMin: 78.95, lngMax: 79.35, center: { lat: 12.9165, lng: 79.1325 } },
      'Erode': { latMin: 11.15, latMax: 11.55, lngMin: 77.45, lngMax: 77.95, center: { lat: 11.3410, lng: 77.7172 } },
      'Dindigul': { latMin: 10.15, latMax: 10.65, lngMin: 77.75, lngMax: 78.25, center: { lat: 10.3673, lng: 77.9803 } },
      'Thanjavur': { latMin: 10.55, latMax: 11.05, lngMin: 79.05, lngMax: 79.45, center: { lat: 10.7870, lng: 79.1378 } },
      'Kanchipuram': { latMin: 12.55, latMax: 13.05, lngMin: 79.45, lngMax: 79.95, center: { lat: 12.8185, lng: 79.7053 } },
      'Cuddalore': { latMin: 11.45, latMax: 11.95, lngMin: 79.45, lngMax: 79.95, center: { lat: 11.7480, lng: 79.7714 } },
      'Tiruvannamalai': { latMin: 12.05, latMax: 12.45, lngMin: 78.85, lngMax: 79.35, center: { lat: 12.2253, lng: 79.0747 } },
      'Villupuram': { latMin: 11.70, latMax: 12.20, lngMin: 79.25, lngMax: 79.75, center: { lat: 11.9401, lng: 79.4861 } },
      'Karur': { latMin: 10.80, latMax: 11.20, lngMin: 77.85, lngMax: 78.25, center: { lat: 10.9571, lng: 78.0766 } },
      'Sivaganga': { latMin: 9.65, latMax: 10.05, lngMin: 78.25, lngMax: 78.75, center: { lat: 9.8433, lng: 78.4747 } },
      'Virudhunagar': { latMin: 9.35, latMax: 9.85, lngMin: 77.75, lngMax: 78.25, center: { lat: 9.5881, lng: 77.9624 } },
      'Thoothukkudi': { latMin: 8.45, latMax: 8.95, lngMin: 77.95, lngMax: 78.45, center: { lat: 8.7642, lng: 78.1348 } },
      'Nagapattinam': { latMin: 10.45, latMax: 10.95, lngMin: 79.65, lngMax: 80.15, center: { lat: 10.7660, lng: 79.8420 } },
      'Pudukkottai': { latMin: 10.15, latMax: 10.65, lngMin: 78.55, lngMax: 79.05, center: { lat: 10.3833, lng: 78.8200 } },
      'Ramanathapuram': { latMin: 9.15, latMax: 9.65, lngMin: 78.55, lngMax: 79.15, center: { lat: 9.3636, lng: 78.8370 } },
      'Dharmapuri': { latMin: 11.95, latMax: 12.35, lngMin: 77.95, lngMax: 78.35, center: { lat: 12.1357, lng: 78.1580 } },
      'Krishnagiri': { latMin: 12.25, latMax: 12.75, lngMin: 77.95, lngMax: 78.45, center: { lat: 12.5186, lng: 78.2137 } },
      'Ariyalur': { latMin: 10.95, latMax: 11.35, lngMin: 78.85, lngMax: 79.25, center: { lat: 11.1401, lng: 79.0784 } },
      'Namakkal': { latMin: 10.95, latMax: 11.45, lngMin: 77.95, lngMax: 78.35, center: { lat: 11.2189, lng: 78.1677 } },
      'Perambalur': { latMin: 11.05, latMax: 11.45, lngMin: 78.65, lngMax: 79.05, center: { lat: 11.2342, lng: 78.8809 } },
      'Nilgiris': { latMin: 11.15, latMax: 11.65, lngMin: 76.45, lngMax: 76.95, center: { lat: 11.4064, lng: 76.6932 } },
      'Kanyakumari': { latMin: 7.95, latMax: 8.35, lngMin: 77.25, lngMax: 77.75, center: { lat: 8.0883, lng: 77.5385 } },
      'Tiruvallur': { latMin: 12.95, latMax: 13.45, lngMin: 79.65, lngMax: 80.15, center: { lat: 13.1439, lng: 79.9094 } },
      'Tirupur': { latMin: 10.95, latMax: 11.35, lngMin: 77.15, lngMax: 77.55, center: { lat: 11.1085, lng: 77.3411 } },
      'Chengalpattu': { latMin: 12.45, latMax: 12.95, lngMin: 79.75, lngMax: 80.25, center: { lat: 12.6819, lng: 79.9865 } },
      'Tenkasi': { latMin: 8.75, latMax: 9.15, lngMin: 77.05, lngMax: 77.55, center: { lat: 8.9589, lng: 77.3152 } },
      'Tirupathur': { latMin: 12.25, latMax: 12.75, lngMin: 78.35, lngMax: 78.85, center: { lat: 12.4951, lng: 78.5675 } },
      'Ranipet': { latMin: 12.75, latMax: 13.15, lngMin: 79.15, lngMax: 79.55, center: { lat: 12.9249, lng: 79.3389 } },
      'Kallakurichi': { latMin: 11.55, latMax: 11.95, lngMin: 78.75, lngMax: 79.15, center: { lat: 11.7401, lng: 78.9597 } },
      'Mayiladuthurai': { latMin: 10.95, latMax: 11.35, lngMin: 79.45, lngMax: 79.85, center: { lat: 11.1021, lng: 79.6565 } }
    };
    
    // Check if coordinates fall within any district boundary
    for (const district of districts) {
      const bounds = districtBounds[district.name];
      if (bounds && 
          lat >= bounds.latMin && lat <= bounds.latMax && 
          lng >= bounds.lngMin && lng <= bounds.lngMax) {
        return district;
      }
    }
    
    // If no exact match, find nearest district center
    let closestDistrict = null;
    let minDistance = Infinity;
    
    for (const district of districts) {
      const bounds = districtBounds[district.name];
      if (bounds) {
        const distance = Math.sqrt(
          Math.pow(lat - bounds.center.lat, 2) + Math.pow(lng - bounds.center.lng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestDistrict = district;
        }
      }
    }
    
    return closestDistrict;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">

      {/* Job Title Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-blue-100/50 shadow-sm">
        <Label htmlFor="title" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Job Title</span>
          <span className="text-red-500 text-lg">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Fix kitchen plumbing leak"
          className="h-12 text-base border-2 border-blue-200/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white/80 transition-all"
          required
        />
      </div>

      {/* Service Selection Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-green-100/50 shadow-sm">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4 text-green-600" />
          <span>Service Type</span>
          <span className="text-red-500 text-lg">*</span>
        </Label>
        <div className="relative">
          <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={serviceOpen}
                className="w-full justify-between pr-8 h-12 text-base bg-white/80 border-2 border-green-200/50 hover:border-green-400 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              >
                {formData.serviceCategory
                  ? (services as any)?.find((service: any) => service.name === formData.serviceCategory)?.name
                  : "Select service"}
                <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-2 border-green-200/50 shadow-lg">
              <Command>
                <CommandInput placeholder="Search services..." className="h-10 text-base" />
                <CommandList className="max-h-64">
                  <CommandEmpty>No service found.</CommandEmpty>
                  <CommandGroup>
                    {(services as any)?.map((service: any) => (
                      <CommandItem
                        key={service.id}
                        value={service.name}
                        onSelect={() => {
                          setFormData(prev => ({ ...prev, serviceCategory: service.name }));
                          setServiceOpen(false);
                        }}
                        className="flex items-center px-4 py-3 hover:bg-green-50 text-base font-medium"
                      >
                        {service.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {formData.serviceCategory && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-100 text-red-500"
              onClick={() => setFormData(prev => ({ ...prev, serviceCategory: "" }))}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Service Address Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-purple-100/50 shadow-sm">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span>Service Address</span>
            <span className="text-red-500 text-lg">*</span>
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border border-blue-300 rounded-full shadow-sm transition-all"
              onClick={handleLocationFinder}
              disabled={isLocationLoading}
            >
              <MapPinIcon className="h-3 w-3 mr-1" />
              {isLocationLoading ? "Finding..." : "Use Current Location"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 border border-green-300 rounded-full shadow-sm transition-all"
              onClick={() => {
                // Build formatted address with area on separate line
                if (user?.areaName && user?.district && user?.state) {
                  const formattedAddress = `${user.areaName}\n${user.district}, ${user.state}${user.pincode ? `\nPIN: ${user.pincode}` : ''}`;
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    serviceAddress: formattedAddress,
                    state: user?.state || 'Tamil Nadu',
                    districtId: user?.district || ''
                  }));
                } else {
                  toast({
                    title: "Incomplete Profile Location",
                    description: "Please add your area name in the Profile tab first.",
                    variant: "destructive"
                  });
                }
              }}
            >
              <Home className="h-3 w-3 mr-1" />
              Use Profile Address
            </Button>
          </div>
        </div>
        <div className="relative">
          <Textarea
            placeholder="Use buttons above to set service address..."
            value={formData.serviceAddress || ''}
            readOnly
            className="min-h-[110px] resize-none text-base bg-gray-50/80 border-2 border-purple-200/50 cursor-not-allowed transition-all rounded-lg"
          />
          {formData.serviceAddress && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-7 w-7 p-0 hover:bg-red-100 text-red-500 rounded-full"
              onClick={() => setFormData(prev => ({ ...prev, serviceAddress: "" }))}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 rounded-lg border border-purple-200/30">
          <p className="text-xs text-purple-700 font-medium">
            <span className="inline-flex items-center gap-1">
              <Info className="h-3 w-3" />
              Example:
            </span> Area, City, State, PIN Code
          </p>
        </div>
      </div>

      {/* Job Description Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-amber-100/50 shadow-sm">
        <Label htmlFor="description" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-amber-600" />
          <span>Job Description</span>
          <span className="text-red-500 text-lg">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the work needed..."
          rows={4}
          className="text-base resize-none bg-white/80 border-2 border-amber-200/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all rounded-lg"
          required
        />
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-lg border border-amber-200/30">
          <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Be specific about your requirements to attract the right workers
          </p>
        </div>
      </div>

      {/* Budget Range Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-emerald-100/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-semibold text-foreground">Budget Range</Label>
            <p className="text-xs text-muted-foreground">(Leave empty if negotiable)</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budgetMin" className="text-sm font-medium text-emerald-700 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Minimum (₹)
            </Label>
            <Input
              id="budgetMin"
              type="number"
              value={formData.budgetMin}
              onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
              placeholder="799"
              className="h-12 text-base bg-white/80 border-2 border-emerald-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              min="0"
              step="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetMax" className="text-sm font-medium text-emerald-700 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Maximum (₹)
            </Label>
            <Input
              id="budgetMax"
              type="number"
              value={formData.budgetMax}
              onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
              placeholder="999"
              className="h-12 text-base bg-white/80 border-2 border-emerald-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              min="0"
              step="1"
            />
          </div>
        </div>
        {formData.budgetMin && formData.budgetMax && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border-2 border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">Budget Range:</span>
              <span className="text-lg font-bold text-emerald-700">₹{formData.budgetMin} - ₹{formData.budgetMax}</span>
            </div>
          </div>
        )}
      </div>

      {/* Deadline Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-indigo-100/50 shadow-sm">
        <Label htmlFor="deadline" className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <span>Completion Deadline</span>
        </Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          className="h-12 text-base bg-white/80 border-2 border-indigo-200/50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 rounded-lg border border-indigo-200/30">
          <p className="text-xs text-indigo-700 font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            When do you need this work completed? (Optional)
          </p>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-orange-100/50 shadow-sm">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-600" />
          <span>Special Requirements</span>
        </Label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="e.g., Bring own tools, materials, weekend availability..."
              className="h-12 text-base bg-white/80 border-2 border-orange-200/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
            />
          </div>
          <Button 
            type="button" 
            onClick={addRequirement} 
            size="sm"
            className="h-12 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md transition-all"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {formData.requirements.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-2 border-orange-200/30">
            <div className="flex flex-wrap gap-2">
              {formData.requirements.map((req, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="cursor-pointer bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 border border-orange-300 px-3 py-2 font-medium rounded-full transition-all"
                  onClick={() => removeRequirement(index)}
                >
                  {req} 
                  <X className="ml-2 h-3 w-3 text-orange-600" />
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-4 py-2 rounded-lg border border-orange-200/30">
          <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
            <Info className="h-3 w-3" />
            Add any special requirements or preferences for workers
          </p>
        </div>
      </div>

      {/* Submit Section */}
      <div className="pt-4 border-t border-border/40">
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md" 
          disabled={createJobMutation.isPending}
        >
          {createJobMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Posting Job...
            </span>
          ) : (
            "Post Job & Get Bids"
          )}
        </Button>
      </div>
    </form>
  );
};

// User Activity Card Component - shows registration date, last login, member since info
const UserActivityCard = ({ user }: { user: any }) => {
  // Helper function to format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper function to calculate days since registration
  const getDaysSinceRegistration = (createdAt: string | null) => {
    if (!createdAt) return 0;
    
    const registrationDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to get member since text
  const getMemberSinceText = (createdAt: string | null) => {
    if (!createdAt) return 'Member since information not available';
    
    const registrationDate = new Date(createdAt);
    const monthYear = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long'
    }).format(registrationDate);
    
    return `Member since ${monthYear}`;
  };

  const daysSinceMember = getDaysSinceRegistration(user?.createdAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity & Membership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Member Since Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Membership Status</span>
            </div>
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              {getMemberSinceText(user?.createdAt)}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {daysSinceMember} {daysSinceMember === 1 ? 'day' : 'days'} as a valued member
            </p>
          </div>

          {/* Registration Details */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Registration Date & Time</Label>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(user?.createdAt)}
            </p>
          </div>

          {/* Last Login Details */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
            <p className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'Login time not tracked yet'}
            </p>
          </div>

          {/* Account Activity Summary */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium text-muted-foreground">Account Summary</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{daysSinceMember}</p>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{user?.role?.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">Account Type</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isWalletCollapsed, setIsWalletCollapsed] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    service: "",
    district: "",
    search: "",
    description: ""
  });
  const [serviceOpen, setServiceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [selectedJobPosting, setSelectedJobPosting] = useState<any>(null);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  // Enhanced job card states
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editingJobData, setEditingJobData] = useState<any>({});
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [jobMediaFiles, setJobMediaFiles] = useState<{ [jobId: string]: { audio?: string; images: string[]; videos: string[] } }>({});
  
  // Removed dashboard customization state

  // Removed dashboard layout management functions

  // Removed widget management functions


  // Fetch user's bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings/user", user?.id, "client"],
    queryFn: () => fetch(`/api/bookings/user/${user?.id}?role=client`).then(res => res.json()),
    enabled: !!user?.id
  });

  // Fetch user's job postings
  const { data: jobPostings = [], isLoading: jobPostingsLoading } = useQuery({
    queryKey: ["/api/job-postings/client", user?.id],
    queryFn: () => fetch(`/api/job-postings/client/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id
  });

  // Fetch bids for selected job posting
  const { data: jobBids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ["/api/bids/job", selectedJobPosting?.id],
    queryFn: () => fetch(`/api/bids/job/${selectedJobPosting.id}`).then(res => res.json()),
    enabled: !!selectedJobPosting?.id
  });

  // Fetch districts and services
  const { data: districts = [] } = useQuery({
    queryKey: ["/api/districts"],
    queryFn: () => fetch("/api/districts").then(res => res.json())
  });

  const { data: rawServices = [] } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => fetch("/api/services").then(res => res.json())
  });

  // Remove duplicate services by name
  const services = rawServices ? 
    (rawServices as any[]).filter((service, index, arr) => 
      arr.findIndex(s => s.name === service.name) === index
    ) : [];

  // Search workers
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ["/api/workers/search", searchFilters.service, searchFilters.district],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchFilters.service) params.append("service", searchFilters.service);
      if (searchFilters.district) params.append("district", searchFilters.district);
      return fetch(`/api/workers/search?${params}`).then(res => res.json());
    },
    enabled: !!(searchFilters.service || searchFilters.district)
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your service request has been sent to the worker.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      setIsBookingModalOpen(false);
      setSelectedWorker(null);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Delete job posting mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest("DELETE", `/api/job-postings/${jobId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Deleted",
        description: "Your job posting has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
      setSelectedJobPosting(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete job posting",
        variant: "destructive",
      });
    },
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const response = await apiRequest("PUT", `/api/bids/${bidId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Accepted",
        description: "The worker has been notified and can now start the job.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/job", selectedJobPosting?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Accept Failed",
        description: error.message || "Failed to accept bid",
        variant: "destructive",
      });
    },
  });

  // Reject bid mutation
  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const response = await apiRequest("PUT", `/api/bids/${bidId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Rejected",
        description: "The worker has been notified that their bid was not selected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/job", selectedJobPosting?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject bid",
        variant: "destructive",
      });
    },
  });

  // Location detection function
  const handleLocationFinder = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location data');
          }
          
          const data = await response.json();
          
          if (data && data.address) {
            const locationData = data.address;
            const detectedLocation = locationData.state_district || 
                                   locationData.county || 
                                   locationData.city || 
                                   locationData.town ||
                                   locationData.village;
            
            const allDistricts = statesDistrictsData.states ? Object.values(statesDistrictsData.states).flatMap((stateData: any) => 
              stateData.districts.map((district: string) => ({ id: district, name: district }))
            ) : [];
            const matchingDistrict = allDistricts.find((district: any) => {
              const districtName = district.name.toLowerCase();
              const detectedName = detectedLocation?.toLowerCase() || '';
              return districtName.includes(detectedName) || 
                     detectedName.includes(districtName) ||
                     district.tamilName.includes(detectedLocation);
            });
            
            if (matchingDistrict) {
              setSearchFilters(prev => ({ ...prev, district: matchingDistrict.id }));
              toast({
                title: "Location detected",
                description: `Your district has been set to ${matchingDistrict.name}`,
              });
            } else {
              const chennaiDistrict = allDistricts.find((district: any) => 
                district.name.toLowerCase() === "chennai"
              );
              if (chennaiDistrict) {
                setSearchFilters(prev => ({ ...prev, district: chennaiDistrict.id }));
                toast({
                  title: "Location detected",
                  description: "Set to Chennai (nearest major district)",
                });
              } else {
                toast({
                  title: "District not found",
                  description: "Please select your district manually",
                  variant: "destructive",
                });
              }
            }
          }
        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: "Location detection failed",
            description: "Please select your district manually",
            variant: "destructive",
          });
        } finally {
          setIsLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = "Please enable location access and try again";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const resetSearchForm = () => {
    setSearchFilters({
      service: "",
      district: "",
      search: "",
      description: ""
    });
  };

  const handleCreateBooking = (data: any) => {
    if (!selectedWorker || !user) return;

    createBookingMutation.mutate({
      clientId: user.id,
      workerId: selectedWorker.id,
      serviceCategory: selectedWorker.workerProfile.primaryService,
      description: data.description,
      districtId: selectedWorker.districtId, // Remove user.districtId since it doesn't exist in schema
      scheduledDate: new Date(data.scheduledDate).toISOString(),
    });
  };

  const handleContactWorker = (worker: any) => {
    setSelectedWorker(worker);
    setIsBookingModalOpen(true);
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

  // Enhanced job card functions
  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setEditingJobData({
      title: job.title,
      description: job.description,
      budgetMin: job.budgetMin || '',
      budgetMax: job.budgetMax || '',
      serviceCategory: job.serviceCategory,
      requirements: job.requirements || []
    });
    setIsEditModalOpen(true);
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;
    
    try {
      // Ensure budget values are properly converted to numbers
      const updateData = {
        ...editingJobData,
        budgetMin: editingJobData.budgetMin && editingJobData.budgetMin !== '' ? Number(editingJobData.budgetMin) : null,
        budgetMax: editingJobData.budgetMax && editingJobData.budgetMax !== '' ? Number(editingJobData.budgetMax) : null,
      };
      
      console.log("Frontend sending update data:", updateData);
      
      await apiRequest("PUT", `/api/job-postings/${editingJob.id}`, updateData);
      setIsEditModalOpen(false);
      setEditingJob(null);
      setEditingJobData({});
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
      toast({
        title: "Job Updated",
        description: "Your job posting has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update job posting",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingJob(null);
    setEditingJobData({});
  };

  const toggleCardExpanded = (jobId: string) => {
    const newSet = new Set(expandedCardIds);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setExpandedCardIds(newSet);
  };

  // Media recording functions
  const startRecording = async (jobId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        handleAudioUpload(audioBlob, jobId);
        setRecordedChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Media upload functions with size constraints
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video', jobId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Size constraints
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
    
    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    const maxSizeText = type === 'image' ? '5MB' : '50MB';

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `${type} files must be under ${maxSizeText}`,
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      setJobMediaFiles(prev => {
        const current = prev[jobId] || { images: [], videos: [] };
        if (type === 'image') {
          return {
            ...prev,
            [jobId]: {
              ...current,
              images: [...current.images, base64]
            }
          };
        } else {
          return {
            ...prev,
            [jobId]: {
              ...current,
              videos: [...current.videos, base64]
            }
          };
        }
      });

      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Added`,
        description: `${file.name} has been uploaded successfully`,
      });
    };
    reader.readAsDataURL(file);
    
    // Clear input
    event.target.value = '';
  };

  const handleAudioUpload = (audioBlob: Blob, jobId: string) => {
    // Size constraint for audio
    const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB for audio
    
    if (audioBlob.size > MAX_AUDIO_SIZE) {
      toast({
        title: "Recording Too Large",
        description: "Audio recordings must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      setJobMediaFiles(prev => ({
        ...prev,
        [jobId]: {
          ...prev[jobId],
          audio: base64,
          images: prev[jobId]?.images || [],
          videos: prev[jobId]?.videos || []
        }
      }));

      toast({
        title: "Audio Recorded",
        description: "Voice recording has been saved successfully",
      });
    };
    reader.readAsDataURL(audioBlob);
  };

  const deleteMedia = (jobId: string, type: 'audio' | 'image' | 'video', index?: number) => {
    setJobMediaFiles(prev => {
      const current = prev[jobId];
      if (!current) return prev;

      if (type === 'audio') {
        const { audio, ...rest } = current;
        return { ...prev, [jobId]: rest };
      } else if (type === 'image' && typeof index === 'number') {
        const newImages = current.images.filter((_, i) => i !== index);
        return { ...prev, [jobId]: { ...current, images: newImages } };
      } else if (type === 'video' && typeof index === 'number') {
        const newVideos = current.videos.filter((_, i) => i !== index);
        return { ...prev, [jobId]: { ...current, videos: newVideos } };
      }
      
      return prev;
    });

    toast({
      title: "Media Removed",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been deleted`,
    });
  };

  // Authentication redirect logic in useEffect to avoid render warnings
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation("/");
      } else if (user.role !== "client") {
        if (user.role === "worker") {
          setLocation("/worker-dashboard");
        } else if (user.role === "admin" || user.role === "super_admin") {
          setLocation("/admin-dashboard");
        }
      }
    }
  }, [authLoading, user, setLocation]);

  // Authentication checks - MUST be after all hooks
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "client") {
    return null;
  }

  // Removed Layout Settings Panel

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">{/* Removed customization features */}
      <div className="container mx-auto px-4">
        {/* Wallet Card and Promotional Section */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Wallet Card - Left Side */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span>My Wallet</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsWalletCollapsed(!isWalletCollapsed)}
                    className="h-6 w-6 p-0 hover:bg-green-100"
                  >
                    {isWalletCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-green-600" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {!isWalletCollapsed && (
              <CardContent className="space-y-4 p-4">
                {/* Balance Display */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <div className="flex items-center justify-center gap-1">
                    <IndianRupee className="h-8 w-8 text-green-600" />
                    <span className="text-3xl font-bold text-green-600">2,450.00</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 w-full">
                  <Button size="sm" className="flex-1 min-w-0 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center">
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="text-xs">Add</span>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-[1.2] min-w-0 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center">
                    <CreditCard className="h-3 w-3 mr-1" />
                    <span className="text-xs">Withdraw</span>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 min-w-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-pink-100 flex items-center justify-center">
                    <Gift className="h-3 w-3 mr-1" />
                    <span className="text-xs">Coupon</span>
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-sm font-semibold text-green-600">+₹5,230</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-sm font-semibold text-orange-600">₹1,200</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Advertisement and Actions - Right Side */}
          <div className="lg:col-span-3 space-y-4">
            {/* Advertisement Carousel */}
            <AdvertisementCarousel targetAudience="client" />

            {/* Post New Job Button */}
            <div className="flex justify-center mt-4">
              <Dialog open={isJobFormOpen} onOpenChange={setIsJobFormOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full md:w-auto px-8">
                    <Plus className="h-5 w-5 mr-2" />
                    Post a New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Post a New Job</DialogTitle>
                    <p className="text-muted-foreground">
                      Get competitive bids from qualified workers across India
                    </p>
                  </DialogHeader>
                  <JobPostingForm onClose={() => setIsJobFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>



        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted">
            <TabsTrigger 
              value="bookings" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Find Workers
            </TabsTrigger>
            <TabsTrigger 
              value="jobs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Jobs
            </TabsTrigger>
            <TabsTrigger 
              value="bids"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Bids
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Profile
            </TabsTrigger>
          </TabsList>

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {/* Widget Container with Customization Support */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings Widget - Full width by default */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>My Service Bookings</span>
                    </div>
{/* Removed customization controls */}
                  </CardTitle>
                </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by searching for workers and booking your first service.
                    </p>
                    <Button onClick={() => {
                      const searchTab = document.querySelector('[data-state="inactive"][value="search"]') as HTMLElement;
                      if (searchTab) searchTab.click();
                    }}>
                      <Search className="h-4 w-4 mr-2" />
                      Find Workers
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold capitalize">
                                {booking.serviceCategory.replace('_', ' ')} Service
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Booking ID: {booking.id.substring(0, 8)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(booking.status)}
                                <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {new Date(booking.scheduledDate).toLocaleDateString()} at{' '}
                                {new Date(booking.scheduledDate).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.district?.name || 'Location TBD'}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm mt-3 p-3 bg-muted/50 rounded-md">
                            {booking.description}
                          </p>
                          
                          {/* Location Tracking for Active Bookings */}
                          {booking.status === "in_progress" && (
                            <div className="mt-4">
                              <LocationViewer
                                bookingId={booking.id}
                                workerName={`${booking.worker?.firstName || 'Worker'} ${booking.worker?.lastName || ''}`}
                                isActive={true}
                              />
                            </div>
                          )}
                          
                          {booking.totalAmount && (
                            <div className="mt-3 flex justify-between items-center">
                              <span className="font-semibold text-green-600">
                                ₹{booking.totalAmount}
                              </span>
                              <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                                Payment: {booking.paymentStatus}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Find Workers Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Find Workers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Service Type
                      </label>
                      <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={serviceOpen}
                            className="w-full justify-between"
                          >
                            {searchFilters.service
                              ? (services as any)?.find((service: any) => service.id === searchFilters.service)?.name
                              : "Select Service"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search services..." />
                            <CommandList>
                              <CommandEmpty>No service found.</CommandEmpty>
                              <CommandGroup>
                                {(services as any)?.map((service: any) => (
                                  <CommandItem
                                    key={service.id}
                                    value={service.name}
                                    onSelect={() => {
                                      setSearchFilters(prev => ({ ...prev, service: service.id }));
                                      setServiceOpen(false);
                                    }}
                                  >
                                    {service.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {searchFilters.service && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => setSearchFilters(prev => ({ ...prev, service: "" }))}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">
                          District
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={handleLocationFinder}
                          disabled={isLocationLoading}
                        >
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {isLocationLoading ? "Finding..." : "Use Location"}
                        </Button>
                      </div>
                      <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={districtOpen}
                            className="w-full justify-between"
                          >
                            {searchFilters.district
                              ? (() => {
                                  // Find district from statesDistrictsData
                                  const allDistricts = statesDistrictsData.states ? Object.values(statesDistrictsData.states).flatMap((stateData: any) => 
                                    stateData.districts.map((district: string) => ({ id: district, name: district }))
                                  ) : [];
                                  const selectedDistrict = allDistricts.find((district: any) => district.id === searchFilters.district);
                                  return selectedDistrict ? selectedDistrict.name : "Select District";
                                })()
                              : "Select District"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search districts..." />
                            <CommandList>
                              <CommandEmpty>No district found.</CommandEmpty>
                              <CommandGroup>
                                {statesDistrictsData.states && Object.keys(statesDistrictsData.states).length > 0 && 
                                  Object.values(statesDistrictsData.states).flatMap((stateData: any) => 
                                    stateData.districts.map((district: string) => ({ id: district, name: district }))
                                  ).map((district: any) => (
                                    <CommandItem
                                      key={district.id}
                                      value={district.name}
                                    onSelect={() => {
                                      setSearchFilters(prev => ({ ...prev, district: district.id }));
                                      setDistrictOpen(false);
                                    }}
                                  >
                                    {district.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {searchFilters.district && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => setSearchFilters(prev => ({ ...prev, district: "" }))}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Input
                      placeholder="Describe your service requirement..."
                      value={searchFilters.description}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Search Workers
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetSearchForm}
                      className="px-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>

                {workersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-64 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !workers || workers.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No workers found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search filters to find workers in your area.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker: any) => (
                      <Card key={worker.id} className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {worker.firstName} {worker.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {worker.workerProfile.primaryService.replace('_', ' ')}
                              </p>
                            </div>
                            {worker.workerProfile.isAvailable && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Available
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{worker.district?.name || 'Multiple districts'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>
                                {worker.workerProfile.rating || '0.0'} ({worker.workerProfile.totalJobs || 0} jobs)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{worker.workerProfile.experienceYears} years experience</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-600">
                              ₹{worker.workerProfile.hourlyRate}/hour
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleContactWorker(worker)}
                              disabled={!worker.workerProfile.isAvailable}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Book Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab - Client Specific */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Profile Card - Basic Information */}
              <ClientProfileCard user={user} refreshUser={refreshUser} />

              {/* Client Preferences & Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Preferences & Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Communication Preferences */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Communication Preferences
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm">Booking Notifications</Label>
                            <p className="text-xs text-muted-foreground">Get notified about booking updates</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm">Worker Responses</Label>
                            <p className="text-xs text-muted-foreground">Notifications when workers respond</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm">Promotional Updates</Label>
                            <p className="text-xs text-muted-foreground">Receive offers and updates</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Service Preferences */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Service Preferences
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Preferred Service Types</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">Plumbing</Badge>
                            <Badge variant="secondary">Electrical</Badge>
                            <Badge variant="secondary">Painting</Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Preferred Time Slots</Label>
                          <p className="text-sm p-2 bg-muted rounded border mt-1">Morning (9 AM - 12 PM)</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Account Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Account Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Account Status</Label>
                          <Badge className="bg-green-100 text-green-800 mt-1">Active</Badge>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Member Since</Label>
                          <p className="text-sm mt-1">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Total Bookings</Label>
                          <p className="text-sm font-semibold mt-1">{bookings?.length || 0}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Last Login</Label>
                          <p className="text-sm mt-1">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Today"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details Section - Optional for Clients */}
              <BankDetailsCard
                user={user}
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                  refreshUser();
                }}
              />

              {/* User Activity Card */}
              <UserActivityCard user={user} />
            </div>
          </TabsContent>

          {/* My Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Job Postings
                </CardTitle>
              </CardHeader>
              <CardContent>
                  {jobPostingsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-24 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : !jobPostings || jobPostings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                        <Users className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">No job postings yet</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Use the "Post a New Job" button above to connect with skilled workers.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {jobPostings.map((job: any) => {
                        const isExpanded = expandedCardIds.has(job.id);
                        const noBids = !jobBids || jobBids.length === 0;
                        
                        return (
                          <Card 
                            key={job.id} 
                            className={`bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border border-slate-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-blue-400 ${
                              selectedJobPosting?.id === job.id ? 'border-blue-400 ring-2 ring-blue-300' : ''
                            }`}
                          >
                            <CardContent className="p-6 space-y-4">
                              {/* Top Header with ID, Posted Date, Budget, Status Badge and Action Buttons */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-mono font-medium text-green-400 bg-green-900/30 px-3 py-1 rounded-md inline-block border border-green-500/30">
                                    ID: {job.id}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded border border-amber-500/30">
                                    <Clock className="h-3 w-3" />
                                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${
                                    job.budgetMin && job.budgetMax && Number(job.budgetMin) > 0 && Number(job.budgetMax) > 0 ? 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30' : 'text-slate-400 bg-slate-700/30 border-slate-500/30'
                                  }`}>
                                    <span className="font-bold text-white">
                                      {job.budgetMin && job.budgetMax && Number(job.budgetMin) > 0 && Number(job.budgetMax) > 0 ? `₹${job.budgetMin} - ₹${job.budgetMax}` : 'Negotiable'}
                                    </span>
                                  </div>
                                  {noBids && job.status === "open" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs bg-orange-900/20 hover:bg-orange-800/30 text-orange-400 border-orange-500/30"
                                      onClick={() => handleEditJob(job)}
                                    >
                                      Increase Budget
                                    </Button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={`px-3 py-1.5 text-sm font-medium border ${
                                      job.status === "open" ? "bg-emerald-500 text-white border-emerald-400" : 
                                      job.status === "closed" ? "bg-gray-500 text-white border-gray-400" : 
                                      job.status === "in_progress" ? "bg-blue-500 text-white border-blue-400" :
                                      job.status === "completed" ? "bg-green-500 text-white border-green-400" :
                                      "bg-gray-500 text-white border-gray-400"
                                    }`}
                                  >
                                    {job.status === "open" ? "Open" :
                                     job.status === "in_progress" ? "In Progress" :
                                     job.status === "completed" ? "Completed" : job.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                                    onClick={() => handleEditJob(job)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete the job posting "${job.title}"? This action cannot be undone.`)) {
                                        deleteJobMutation.mutate(job.id);
                                      }
                                    }}
                                    disabled={deleteJobMutation.isPending}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Compact Service Address & Media Attachments */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                {/* Service Address */}
                                <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpanded(job.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-2 h-auto text-slate-300 hover:text-blue-300 bg-slate-800/50 border border-slate-600/30 rounded-md">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-xs font-medium">Service Address</span>
                                      </div>
                                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-1">
                                    <div className="text-xs text-slate-300 bg-slate-900/50 border border-slate-600/30 p-2 rounded whitespace-pre-line">
                                      {job.serviceAddress || 'Service address not specified'}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>

                                {/* Media Attachments */}
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-2 h-auto text-slate-300 hover:text-blue-300 bg-slate-800/50 border border-slate-600/30 rounded-md">
                                      <div className="flex items-center gap-2">
                                        <Paperclip className="h-3 w-3" />
                                        <span className="text-xs font-medium">Media</span>
                                      </div>
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-1">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 bg-red-900/20 hover:bg-red-800/30 text-red-300 border-red-500/30 text-xs"
                                        onClick={isRecording ? stopRecording : () => startRecording(job.id)}
                                        disabled={isRecording || !!jobMediaFiles[job.id]?.audio}
                                      >
                                        <Mic className="h-2.5 w-2.5 mr-1" />
                                        Audio
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 bg-purple-900/20 hover:bg-purple-800/30 text-purple-300 border-purple-500/30 text-xs"
                                        onClick={() => {
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.accept = 'image/*';
                                          input.onchange = (e) => handleFileUpload(e as any, 'image', job.id);
                                          input.click();
                                        }}
                                      >
                                        <Camera className="h-2.5 w-2.5 mr-1" />
                                        Photo
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 bg-blue-900/20 hover:bg-blue-800/30 text-blue-300 border-blue-500/30 text-xs"
                                        onClick={() => {
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.accept = 'video/*';
                                          input.onchange = (e) => handleFileUpload(e as any, 'video', job.id);
                                          input.click();
                                        }}
                                      >
                                        <Video className="h-2.5 w-2.5 mr-1" />
                                        Video
                                      </Button>
                                    </div>
                                    
                                    {/* Display uploaded media */}
                                    {jobMediaFiles[job.id] && (
                                      <div className="space-y-1 mt-2">
                                        {/* Audio */}
                                        {jobMediaFiles[job.id].audio && (
                                          <div className="flex items-center gap-2 p-2 bg-slate-900/30 border border-slate-600/30 rounded text-xs">
                                            <Volume2 className="h-3 w-3" />
                                            <audio controls className="flex-1 h-6">
                                              <source src={jobMediaFiles[job.id].audio} type="audio/webm" />
                                            </audio>
                                          </div>
                                        )}
                                        {/* Images */}
                                        {jobMediaFiles[job.id].images && jobMediaFiles[job.id].images.length > 0 && (
                                          <div className="grid grid-cols-2 gap-1">
                                            {jobMediaFiles[job.id].images.slice(0, 2).map((img: string, idx: number) => (
                                              <img key={idx} src={img} className="w-full h-16 object-cover rounded border border-slate-600/30" />
                                            ))}
                                          </div>
                                        )}
                                        {/* Videos */}
                                        {jobMediaFiles[job.id].videos && jobMediaFiles[job.id].videos.length > 0 && (
                                          <div className="space-y-1">
                                            {jobMediaFiles[job.id].videos.slice(0, 1).map((vid: string, idx: number) => (
                                              <video key={idx} controls className="w-full h-20 rounded border border-slate-600/30">
                                                <source src={vid} />
                                              </video>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>

                              {/* Header with Title */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-xl text-white cursor-pointer hover:text-blue-300 transition-colors" onClick={() => {
                                    setSelectedJobPosting(job);
                                    // Switch to bids tab when job is clicked
                                    setActiveTab("bids");
                                  }}>
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-blue-300 font-medium mt-1">
                                    {job.serviceCategory} • {job.district}, Tamil Nadu
                                  </p>
                                  {/* Requirements badges moved here */}
                                  {job.requirements && job.requirements.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {job.requirements.slice(0, 2).map((req: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-xs bg-slate-600/50 text-slate-200 border-slate-500">
                                          {req}
                                        </Badge>
                                      ))}
                                      {job.requirements.length > 2 && (
                                        <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-200 border-slate-500">
                                          +{job.requirements.length - 2} more
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Description */}
                              <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
                                <p className="text-slate-200 leading-relaxed">
                                  {job.description}
                                </p>
                              </div>
                              



                              
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {/* Hidden file input for media uploads */}

                </CardContent>
            </Card>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg font-bold">₹</span>
                  {selectedJobPosting ? `Bids for "${selectedJobPosting.title}"` : 'Select a Job to View Bids'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedJobPosting ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-muted-foreground">
                      ₹
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Select a Job Posting</h3>
                    <p className="text-muted-foreground">
                      Click on any job posting from the "My Jobs" tab to view worker bids.
                    </p>
                  </div>
                ) : bidsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : !jobBids || jobBids.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      ₹
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                    <p className="text-muted-foreground">
                      Workers will submit bids for this job soon. Check back later!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {jobBids.map((bid: any) => (
                      <div key={bid.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {bid.worker?.firstName} {bid.worker?.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {bid.worker?.workerProfile?.primaryService}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ₹{bid.bidAmount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(bid.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {bid.message && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm">{bid.message}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>★ {bid.worker?.workerProfile?.rating || 'N/A'}</span>
                            <span>Experience: {bid.worker?.workerProfile?.experienceYears || 0} years</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // View worker profile logic
                                console.log('View worker profile:', bid.worker);
                              }}
                            >
                              View Profile
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                // Accept bid logic
                                console.log('Accept bid:', bid.id);
                              }}
                            >
                              Accept Bid
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Quick Actions Widget */}
              <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Quick Actions</span>
                      </div>
{/* Removed customization controls */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center gap-2"
                        onClick={() => setIsJobFormOpen(true)}
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-sm">Post Job</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center gap-2"
                        onClick={() => {
                          const searchTab = document.querySelector('[value="search"]') as HTMLElement;
                          if (searchTab) searchTab.click();
                        }}
                      >
                        <Search className="h-6 w-6" />
                        <span className="text-sm">Find Workers</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              
              {/* Dashboard Statistics Widget */}
              {bookings && (
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart className="h-5 w-5" />
                        <span>Dashboard Stats</span>
                      </div>
{/* Removed customization controls */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {bookings.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Bookings</div>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {bookings.filter((b: any) => b.status === 'completed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {bookings.filter((b: any) => ['pending', 'accepted', 'in_progress'].includes(b.status)).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Active</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Job Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <DialogHeader className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Edit Job Posting
            </DialogTitle>
            {editingJob && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="font-mono bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-400">
                  ID: {editingJob.id}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Posted {new Date(editingJob.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </DialogHeader>
          
          {editingJob && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Title */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="edit-title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Job Title</Label>
                  </div>
                  <Input
                    id="edit-title"
                    value={editingJobData.title || ''}
                    onChange={(e) => setEditingJobData(prev => ({...prev, title: e.target.value}))}
                    placeholder="Enter a clear, descriptive job title"
                    className="text-lg font-medium border-2 focus:border-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>

                {/* Job Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="edit-description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                  </div>
                  <Textarea
                    id="edit-description"
                    value={editingJobData.description || ''}
                    onChange={(e) => setEditingJobData(prev => ({...prev, description: e.target.value}))}
                    placeholder="Provide detailed requirements, expectations, and any specific instructions..."
                    rows={6}
                    className="resize-none border-2 focus:border-blue-500 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Be specific about your requirements to attract the right workers
                  </p>
                </div>

                {/* Budget Section */}
                <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">₹</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Budget Range</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Set your preferred budget range</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-budget-min" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Minimum Budget (₹)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-semibold">₹</span>
                        <Input
                          id="edit-budget-min"
                          type="number"
                          value={editingJobData.budgetMin || ''}
                          onChange={(e) => setEditingJobData(prev => ({...prev, budgetMin: e.target.value}))}
                          placeholder="1000"
                          className="pl-8 border-2 focus:border-emerald-500 bg-white dark:bg-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-budget-max" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Maximum Budget (₹)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-semibold">₹</span>
                        <Input
                          id="edit-budget-max"
                          type="number"
                          value={editingJobData.budgetMax || ''}
                          onChange={(e) => setEditingJobData(prev => ({...prev, budgetMax: e.target.value}))}
                          placeholder="5000"
                          className="pl-8 border-2 focus:border-emerald-500 bg-white dark:bg-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {editingJobData.budgetMin && editingJobData.budgetMax && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Budget Range:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{editingJobData.budgetMin} - ₹{editingJobData.budgetMax}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar - Right Side */}
              <div className="space-y-6">
                {/* Job Info Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Job Information
                  </h3>
                  
                  {/* Service Category */}
                  <div className="space-y-3 mb-4">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Category</Label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <span className="font-medium text-blue-800 dark:text-blue-300 capitalize">
                        {editingJob.serviceCategory?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Current Service Address */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Service Address
                    </Label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {editingJob.serviceAddress || 'Service address not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <div className="space-y-3">
                    <Button 
                      onClick={handleSaveJob}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      className="w-full border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 py-3 rounded-lg font-medium transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
          </DialogHeader>
          
          {selectedWorker && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateBooking({
                description: formData.get('description'),
                scheduledDate: formData.get('scheduledDate'),
              });
            }} className="space-y-4">
              <div>
                <Label>Worker</Label>
                <p className="font-medium">
                  {selectedWorker.firstName} {selectedWorker.lastName}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedWorker.workerProfile.primaryService.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <Label htmlFor="scheduledDate">Preferred Date & Time</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Service Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what you need help with..."
                  required
                  rows={3}
                />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <span>Estimated Rate:</span>
                <span className="font-semibold text-green-600">
                  ₹{selectedWorker.workerProfile.hourlyRate}/hour
                </span>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsBookingModalOpen(false);
                    setSelectedWorker(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? "Booking..." : "Book Service"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
