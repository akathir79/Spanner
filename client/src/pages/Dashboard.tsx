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
  FileText
} from "lucide-react";
import { useLocation } from "wouter";
import LocationViewer from "@/components/LocationViewer";
import ClientBankDetailsForm from "@/components/ClientBankDetailsForm";
import statesDistrictsData from "@shared/states-districts.json";
// Services and districts are now fetched dynamically from database

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Job Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Fix kitchen plumbing leak"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Service Type *</Label>
          <div className="relative">
            <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={serviceOpen}
                  className="w-full justify-between pr-8"
                >
                  {formData.serviceCategory
                    ? (services as any)?.find((service: any) => service.name === formData.serviceCategory)?.name
                    : "Select service"}
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
                            setFormData(prev => ({ ...prev, serviceCategory: service.name }));
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
            {formData.serviceCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                onClick={() => setFormData(prev => ({ ...prev, serviceCategory: "" }))}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Service Address *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
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
                className="h-6 px-2 text-xs"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  serviceAddress: user?.address ? `${user.address}\n${user.district}, ${user.state || 'Tamil Nadu'}\nPIN: ${user.pincode || ''}`.trim() : '',
                  state: user?.state || 'Tamil Nadu',
                  districtId: user?.district || ''
                }))}
              >
                <Home className="h-3 w-3 mr-1" />
                Use Profile Address
              </Button>
            </div>
          </div>
          <div className="relative">
            <Textarea
              placeholder="Enter complete service address..."
              value={formData.serviceAddress || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceAddress: e.target.value }))}
              className="min-h-[100px] resize-none"
            />
            {formData.serviceAddress && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-muted"
                onClick={() => setFormData(prev => ({ ...prev, serviceAddress: "" }))}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Example: House No/Building, Street, Area, City, State, PIN Code
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the work needed..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetMin">Min Budget (₹)</Label>
          <Input
            id="budgetMin"
            type="number"
            value={formData.budgetMin}
            onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
            placeholder="500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetMax">Max Budget (₹)</Label>
          <Input
            id="budgetMax"
            type="number"
            value={formData.budgetMax}
            onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
            placeholder="2000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline (Optional)</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Requirements (Optional)</Label>
        <div className="flex gap-2">
          <Input
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            placeholder="Add a requirement..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
          />
          <Button type="button" onClick={addRequirement} size="sm">
            Add
          </Button>
        </div>
        {formData.requirements.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.requirements.map((req, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => removeRequirement(index)}
              >
                {req} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={createJobMutation.isPending}>
        {createJobMutation.isPending ? "Posting..." : "Post Job"}
      </Button>
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
      await apiRequest("PUT", `/api/job-postings/${editingJob.id}`, editingJobData);
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

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}! <span className="text-lg font-medium text-primary">({user.id})</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your bookings and find trusted workers for your service needs.
          </p>
        </div>

        {/* Post a New Job Button */}
        <div className="mb-6">
          <Dialog open={isJobFormOpen} onOpenChange={setIsJobFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Post a New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a New Job</DialogTitle>
                <p className="text-muted-foreground">
                  Get competitive bids from qualified workers across Tamil Nadu
                </p>
              </DialogHeader>
              <JobPostingForm onClose={() => setIsJobFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
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
              My Jobs/Bids
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>My Service Bookings</span>
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

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Details Section */}
              <ProfileDetailsCard
                user={user}
                onUpdate={() => {
                  // Invalidate all user-related queries to force refresh
                  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                  // Force re-render by updating the user data from auth context
                  refreshUser();
                }}
              />

              {/* User Activity & Membership Section */}
              <UserActivityCard user={user} />

              {/* Bank Details Section */}
              <BankDetailsCard
                user={user}
                onUpdate={() => {
                  // Invalidate all user-related queries to force refresh
                  queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                  // Force re-render by updating the user data from auth context
                  refreshUser();
                }}
              />
            </div>
          </TabsContent>

          {/* My Jobs/Bids Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Side - My Job Postings */}
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
                            className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200 ${
                              selectedJobPosting?.id === job.id ? 'border-blue-500 ring-2 ring-blue-100' : ''
                            }`}
                          >
                            <CardContent className="p-6 space-y-4">
                              {/* Job ID at top */}
                              <div className="mb-3">
                                <div className="text-sm font-mono font-medium text-green-700 bg-green-50 px-3 py-1 rounded-md inline-block border border-green-200">
                                  ID: {job.id}
                                </div>
                              </div>

                              {/* Header with Title and Actions */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setSelectedJobPosting(job)}>
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-indigo-600 font-medium mt-1">
                                    {job.serviceCategory} • {job.district}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={`px-3 py-1.5 text-sm font-medium ${
                                      job.status === "open" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : 
                                      job.status === "closed" ? "bg-gray-100 text-gray-700 border border-gray-200" : 
                                      job.status === "in_progress" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                      job.status === "completed" ? "bg-green-100 text-green-700 border border-green-200" :
                                      "bg-gray-100 text-gray-700 border border-gray-200"
                                    }`}
                                  >
                                    {job.status === "open" ? "Open" :
                                     job.status === "in_progress" ? "In Progress" :
                                     job.status === "completed" ? "Completed" : job.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                    onClick={() => handleEditJob(job)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                              
                              {/* Description */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed">
                                  {job.description}
                                </p>
                              </div>
                              
                              {/* Budget Section */}
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    job.budgetMin && job.budgetMax ? 'text-emerald-700 bg-emerald-50' : 'text-gray-600 bg-gray-100'
                                  }`}>
                                    <span className={`text-base font-semibold ${
                                      job.budgetMin && job.budgetMax ? 'text-emerald-600' : 'text-gray-500'
                                    }`}>₹</span>
                                    <span className="text-sm font-medium">
                                      {job.budgetMin && job.budgetMax ? `₹${job.budgetMin} - ₹${job.budgetMax}` : 'Negotiable'}
                                    </span>
                                  </div>
                                  {noBids && job.status === "open" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                      onClick={() => handleEditJob(job)}
                                    >
                                      Increase Budget
                                    </Button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Expandable Service Address Section */}
                              <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpanded(job.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <span className="text-sm font-medium">Service Address</span>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-2">
                                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded whitespace-pre-line">
                                    {job.serviceAddress || 'Service address not specified'}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Media Attachments Section */}
                              <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-900">Media Attachments</span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 px-3 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 border-red-200 hover:border-red-300 transition-all duration-200"
                                      onClick={isRecording ? stopRecording : () => startRecording(job.id)}
                                      disabled={isRecording || !!jobMediaFiles[job.id]?.audio}
                                    >
                                      <div className="bg-red-500 rounded-full p-1 mr-2">
                                        {isRecording ? <MicOff className="h-3 w-3 text-white" /> : <Mic className="h-3 w-3 text-white" />}
                                      </div>
                                      <span className="text-xs font-medium">Audio</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 px-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-600 border-purple-200 hover:border-purple-300 transition-all duration-200"
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => handleFileUpload(e as any, 'image', job.id);
                                        input.click();
                                      }}
                                    >
                                      <div className="bg-purple-500 rounded-full p-1 mr-2">
                                        <Camera className="h-3 w-3 text-white" />
                                      </div>
                                      <span className="text-xs font-medium">Photo</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 px-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border-blue-200 hover:border-blue-300 transition-all duration-200"
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'video/*';
                                        input.onchange = (e) => handleFileUpload(e as any, 'video', job.id);
                                        input.click();
                                      }}
                                    >
                                      <div className="bg-blue-500 rounded-full p-1 mr-2">
                                        <Video className="h-3 w-3 text-white" />
                                      </div>
                                      <span className="text-xs font-medium">Video</span>
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Display uploaded media */}
                                {jobMediaFiles[job.id] && (
                                  <div className="space-y-2">
                                    {/* Audio */}
                                    {jobMediaFiles[job.id].audio && (
                                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                                        <Volume2 className="h-4 w-4" />
                                        <audio controls className="flex-1 h-8">
                                          <source src={jobMediaFiles[job.id].audio} type="audio/webm" />
                                        </audio>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-destructive"
                                          onClick={() => deleteMedia(job.id, 'audio')}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {/* Images */}
                                    {jobMediaFiles[job.id].images?.map((image, index) => (
                                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                                        <Camera className="h-4 w-4" />
                                        <img src={image} alt={`Image ${index + 1}`} className="h-12 w-12 object-cover rounded" />
                                        <span className="flex-1 text-sm">Image {index + 1}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-destructive"
                                          onClick={() => deleteMedia(job.id, 'image', index)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    
                                    {/* Videos */}
                                    {jobMediaFiles[job.id].videos?.map((video, index) => (
                                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                                        <Video className="h-4 w-4" />
                                        <video controls className="h-12 w-20 object-cover rounded">
                                          <source src={video} type="video/mp4" />
                                        </video>
                                        <span className="flex-1 text-sm">Video {index + 1}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-destructive"
                                          onClick={() => deleteMedia(job.id, 'video', index)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Size constraints info */}
                                <div className="text-xs text-muted-foreground mt-2">
                                  Max file sizes: Audio 10MB • Images 5MB • Videos 50MB
                                </div>
                              </div>
                              
                              {/* Requirements */}
                              {job.requirements && job.requirements.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {job.requirements.slice(0, 2).map((req: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {req}
                                    </Badge>
                                  ))}
                                  {job.requirements.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{job.requirements.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {/* Hidden file input for media uploads */}

                </CardContent>
              </Card>

              {/* Right Side - Job Bids */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {selectedJobPosting ? `Bids for "${selectedJobPosting.title}"` : 'Select a Job to View Bids'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedJobPosting ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a Job Posting</h3>
                      <p className="text-muted-foreground">
                        Click on any job posting from the left to view worker bids.
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
                              <p className="font-semibold text-green-600">₹{bid.proposedAmount}</p>
                              <p className="text-xs text-muted-foreground">
                                {bid.estimatedDuration}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {bid.proposal}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Submitted {new Date(bid.createdAt).toLocaleDateString()}
                            </span>
                            <Badge 
                              className={bid.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                        bid.status === "accepted" ? "bg-green-100 text-green-800" :
                                        "bg-gray-100 text-gray-800"}
                            >
                              {bid.status}
                            </Badge>
                          </div>
                          
                          {bid.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => acceptBidMutation.mutate(bid.id)}
                                disabled={acceptBidMutation.isPending}
                              >
                                {acceptBidMutation.isPending ? "Accepting..." : "Accept Bid"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex-1"
                                onClick={() => rejectBidMutation.mutate(bid.id)}
                                disabled={rejectBidMutation.isPending}
                              >
                                {rejectBidMutation.isPending ? "Rejecting..." : "Reject Bid"}
                              </Button>
                            </div>
                          )}
                          
                          {bid.status === "accepted" && (
                            <div className="mt-3">
                              <Button size="sm" variant="outline" className="w-full">
                                <Phone className="h-4 w-4 mr-2" />
                                Contact Worker: {bid.worker?.mobile}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>



        </Tabs>
      </div>

      {/* Job Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <div className="space-y-6">
              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Job Title</Label>
                <Input
                  id="edit-title"
                  value={editingJobData.title || ''}
                  onChange={(e) => setEditingJobData(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter job title"
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingJobData.description || ''}
                  onChange={(e) => setEditingJobData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe the job requirements"
                  rows={4}
                />
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-budget-min">Minimum Budget (₹)</Label>
                  <Input
                    id="edit-budget-min"
                    type="number"
                    value={editingJobData.budgetMin || ''}
                    onChange={(e) => setEditingJobData(prev => ({...prev, budgetMin: e.target.value}))}
                    placeholder="Enter minimum budget"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-budget-max">Maximum Budget (₹)</Label>
                  <Input
                    id="edit-budget-max"
                    type="number"
                    value={editingJobData.budgetMax || ''}
                    onChange={(e) => setEditingJobData(prev => ({...prev, budgetMax: e.target.value}))}
                    placeholder="Enter maximum budget"
                  />
                </div>
              </div>

              {/* Service Category (Read-only for editing) */}
              <div className="space-y-2">
                <Label>Service Category</Label>
                <div className="p-3 bg-muted/50 rounded border">
                  {editingJob.serviceCategory}
                </div>
              </div>

              {/* Current Service Address (Read-only) */}
              <div className="space-y-2">
                <Label>Service Address</Label>
                <div className="p-3 bg-muted/50 rounded border whitespace-pre-line">
                  {editingJob.serviceAddress || 'Service address not specified'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveJob}>
                  Save Changes
                </Button>
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
