import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
// Removed useLanguage import as it's not being used
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BarChart3, 
  MapPin, 
  Star, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Users,
  Settings,
  Briefcase,
  CreditCard,
  Phone,
  Mail,
  MapPin as LocationIcon,
  Eye,
  EyeOff,
  Plus,
  FileText,
  Filter,
  Ban,
  Edit3,
  Save,
  X,
  User,
  Wallet,
  IndianRupee,
  Gift,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Volume2,
  Camera,
  Video,
  AlertTriangle,
  MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LocationTracker from "@/components/LocationTracker";
import BankDetailsModal from "@/components/BankDetailsModal";
import AdvertisementCarousel from "@/components/AdvertisementCarousel";
import JobCompletionModal from "@/components/JobCompletionModal";
import { ChatSystem } from "@/components/ChatSystem";
import { format } from "date-fns";

// Worker Profile Card Component with Edit functionality
const WorkerProfileCard = ({ user, refreshUser }: { user: any, refreshUser: () => void }) => {
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
    aadhaarNumber: user?.aadhaarNumber || '',
    panNumber: user?.panNumber || '',
    experience: user?.experience || '',
    hourlyRate: user?.hourlyRate || '',
    profilePicture: user?.profilePicture || ''
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
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
          description: "Your professional profile has been updated successfully!"
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

  // Mask Aadhaar for privacy
  const maskAadhaar = (aadhaar: string) => {
    if (!aadhaar) return "Not provided";
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Professional Profile</span>
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
                <AvatarFallback className="text-xl bg-green-100 text-green-600">
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
              <p className="text-sm text-muted-foreground">Service Professional</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
              {user.isVerified && (
                <Badge className="mt-2 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
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

          {/* Professional Information */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Professional Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Aadhaar Number</Label>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      type={showAadhaar ? "text" : "password"}
                      placeholder="12-digit Aadhaar"
                      maxLength={12}
                      value={editData.aadhaarNumber}
                      onChange={(e) => setEditData(prev => ({ ...prev, aadhaarNumber: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium p-2 bg-muted rounded border flex-1">
                      {showAadhaar ? (user.aadhaarNumber || "Not provided") : maskAadhaar(user.aadhaarNumber)}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAadhaar(!showAadhaar)}
                  >
                    {showAadhaar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">PAN Card</Label>
                {isEditing ? (
                  <Input
                    placeholder="PAN Number"
                    maxLength={10}
                    value={editData.panNumber}
                    onChange={(e) => setEditData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium p-2 bg-muted rounded border flex-1">
                      {user.panNumber || "Not provided"}
                    </p>
                    {!user.panNumber && (
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add PAN
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Experience (Years)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="0"
                    value={editData.experience}
                    onChange={(e) => setEditData(prev => ({ ...prev, experience: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.experience ? `${user.experience} years` : "Not specified"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="0"
                    placeholder="₹ per hour"
                    value={editData.hourlyRate}
                    onChange={(e) => setEditData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  />
                ) : (
                  <p className="font-medium p-2 bg-muted rounded border">
                    {user.hourlyRate ? `₹${user.hourlyRate}/hr` : "Not specified"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service Location
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
                <Label className="text-sm text-muted-foreground">House/Shop Number</Label>
                {isEditing ? (
                  <Input
                    placeholder="House/Shop/Building No."
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Types
type WorkerBankDetails = {
  id: string;
  workerId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
};

// Bank Details Component - MOVED OUTSIDE MAIN COMPONENT
const BankDetailsCard = ({ user }: { user: any }) => {
  const { toast } = useToast();
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Fetch bank details
  const { data: bankDetails, isLoading: isBankDetailsLoading } = useQuery<WorkerBankDetails>({
    queryKey: ['/api/worker-bank-details', user?.id],
    enabled: !!user?.id,
  });

  if (isBankDetailsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Bank Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading bank details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Bank Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankDetails ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Bank details verified
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Bank Name</Label>
                    <p className="font-medium">{bankDetails.bankName}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Holder</Label>
                    <p className="font-medium">{bankDetails.accountHolderName}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Number</Label>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium font-mono">
                        {showAccountNumber 
                          ? bankDetails.accountNumber 
                          : `${bankDetails.accountNumber.slice(0, 4)}****${bankDetails.accountNumber.slice(-4)}`
                        }
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                      >
                        {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">IFSC Code</Label>
                    <p className="font-medium font-mono">{bankDetails.ifscCode}</p>
                  </div>
                  
                  {bankDetails.upiId && (
                    <div className="md:col-span-2">
                      <Label className="text-sm text-muted-foreground">UPI ID</Label>
                      <p className="font-medium">{bankDetails.upiId}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBankModal(true)}
                    className="w-full"
                  >
                    Update Bank Details
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Bank Details Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your bank details to receive payments for completed jobs.
              </p>
              <Button
                onClick={() => setShowBankModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Bank Details</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details Modal */}
      <BankDetailsModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        workerId={user?.id || ""}
        existingDetails={bankDetails}
        onSuccess={() => {
          setShowBankModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/worker-bank-details', user?.id] });
        }}
      />
    </>
  );
};

// Available Jobs Component 
const AvailableJobsTab = ({ user }: { user: any }) => {
  const { toast } = useToast();
  
  const [bidFormData, setBidFormData] = useState({
    proposedAmount: "",
    estimatedDuration: "",
    proposal: "",
  });
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  // Fetch available job postings filtered by worker's location and service
  const { data: jobPostings = [], isLoading } = useQuery({
    queryKey: ["/api/job-postings", user?.id],
    queryFn: () => fetch(`/api/job-postings?workerId=${user?.id}`).then(res => res.json()),
    select: (data: any) => data.filter((job: any) => job.status === "open"),
    enabled: !!user?.id,
  });

  // Fetch worker's bids to check for existing bids - MOVED TO TOP LEVEL
  const { data: myBids = [] } = useQuery<any[]>({
    queryKey: ["/api/bids/worker", user?.id],
    enabled: !!user?.id,
  });

  // Create bid mutation
  const createBidMutation = useMutation({
    mutationFn: (data: any) => 
      fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your bid has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/worker", user?.id] });
      setIsBidModalOpen(false);
      setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
      setSelectedJob(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !selectedJob || !bidFormData.proposedAmount || !bidFormData.proposal) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createBidMutation.mutate({
      jobPostingId: selectedJob.id,
      workerId: user.id,
      proposedAmount: parseFloat(bidFormData.proposedAmount),
      estimatedDuration: bidFormData.estimatedDuration,
      proposal: bidFormData.proposal,
    });
  };

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Available Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Available Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobPostings.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {jobPostings.map((job: any) => {
                return (
                  <Card 
                    key={job.id} 
                    className="bg-gradient-to-br from-slate-800/90 via-slate-700/80 to-slate-800/90 border border-slate-600/50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-blue-400/60 backdrop-blur-sm"
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Top Header with ID, Posted Date, Budget, Status Badge */}
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
                        </div>
                      </div>

                      {/* Service Address & Media Attachments */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        {/* Service Address */}
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-2 h-auto text-slate-300 hover:text-blue-300 bg-slate-800/50 border border-slate-600/30 rounded-md">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs font-medium">Service Address</span>
                              </div>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-1">
                            <div className="text-xs text-slate-300 bg-slate-900/50 border border-slate-600/30 p-2 rounded">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">Area:</span>
                                  <span className="text-amber-300">{job.serviceAddress?.split(',')[0] || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">District:</span>
                                  <span className="text-blue-300">{job.district || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">State:</span>
                                  <span className="text-green-300">{job.state || 'Not specified'}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 italic bg-amber-900/20 p-1.5 rounded border border-amber-500/20">
                                  🔒 Full address with house number & street shared after bid acceptance
                                </div>
                              </div>
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
                            <div className="text-xs text-slate-300 bg-slate-900/50 border border-slate-600/30 p-2 rounded">
                              {/* Display job attachments if any */}
                              {job.attachments && job.attachments.length > 0 ? (
                                <div className="space-y-2">
                                  {job.attachments.map((attachment: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/30 border border-slate-600/30 rounded">
                                      {attachment.type === 'audio' && (
                                        <>
                                          <Volume2 className="h-3 w-3" />
                                          <audio controls className="flex-1 h-6">
                                            <source src={attachment.url} type="audio/webm" />
                                          </audio>
                                        </>
                                      )}
                                      {attachment.type === 'image' && (
                                        <>
                                          <Camera className="h-3 w-3" />
                                          <img src={attachment.url} className="w-16 h-16 object-cover rounded border border-slate-600/30" alt="Job attachment" />
                                        </>
                                      )}
                                      {attachment.type === 'video' && (
                                        <>
                                          <Video className="h-3 w-3" />
                                          <video controls className="w-full h-20 rounded border border-slate-600/30">
                                            <source src={attachment.url} />
                                          </video>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400">No media attachments</span>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      {/* Header with Title */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl text-white">
                            {job.title}
                          </h3>
                          <p className="text-sm text-blue-300 font-medium mt-1">
                            {job.serviceCategory} • {job.district}, Tamil Nadu
                          </p>
                          {/* Requirements badges */}
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
                      
                      {/* Submit Bid Button */}
                      <div className="flex justify-end pt-2">
                        {/* Check if worker already has a bid for this job */}
                        {(() => {
                          const existingBid = myBids.find((bid: any) => bid.jobPosting?.id === job.id);
                          
                          if (existingBid) {
                            return (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs bg-yellow-900/20 text-yellow-400 border-yellow-500/30">
                                  Bid Submitted
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
                                  onClick={() => {
                                    // Switch to My Bids tab to edit
                                    const tabsElement = document.querySelector('[value="my-bids"]') as HTMLElement;
                                    if (tabsElement) tabsElement.click();
                                  }}
                                >
                                  Edit in My Bids
                                </Button>
                              </div>
                            );
                          }
                          
                          // Check if worker has 2 or more active jobs
                          const activeJobs = myBids.filter((bid: any) => bid.status === 'accepted').length;
                          const isAtJobLimit = activeJobs >= 2;
                          
                          return (
                            <div className="flex items-center gap-2">
                              {isAtJobLimit && (
                                <div className="text-xs text-orange-400 bg-orange-900/20 border border-orange-500/30 rounded px-2 py-1">
                                  Job Limit Reached (2/2)
                                </div>
                              )}
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isAtJobLimit}
                                onClick={() => {
                                  setSelectedJob(job);
                                  setIsBidModalOpen(true);
                                }}
                                title={isAtJobLimit ? "Complete an existing job to bid on new ones" : "Place your bid for this job"}
                              >
                                Place Bid
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No available jobs at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid Submission Modal */}
      <Dialog open={isBidModalOpen} onOpenChange={setIsBidModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Bid for "{selectedJob?.title}"</DialogTitle>
            <DialogDescription>
              Submit your proposal for this job. Make sure to include a competitive rate and clear timeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitBid} className="space-y-4">
            <div>
              <Label htmlFor="proposedAmount">Proposed Amount (₹)</Label>
              <Input
                id="proposedAmount"
                type="number"
                placeholder="Enter your quoted amount"
                value={bidFormData.proposedAmount}
                onChange={(e) => setBidFormData(prev => ({ ...prev, proposedAmount: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration</Label>
              <Input
                id="estimatedDuration"
                placeholder="e.g., 2-3 days, 1 week"
                value={bidFormData.estimatedDuration}
                onChange={(e) => setBidFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="proposal">Your Proposal</Label>
              <Textarea
                id="proposal"
                placeholder="Describe your approach, experience, and why you're the best fit for this job..."
                value={bidFormData.proposal}
                onChange={(e) => setBidFormData(prev => ({ ...prev, proposal: e.target.value }))}
                rows={4}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBidModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBidMutation.isPending}>
                {createBidMutation.isPending ? "Submitting..." : "Submit Bid"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// My Bids Component 
const MyBidsTab = ({ user }: { user: any }) => {
  const { toast } = useToast();
  const [editingBid, setEditingBid] = useState<any>(null);
  const [editBidData, setEditBidData] = useState({
    proposedAmount: "",
    estimatedDuration: "",
    proposal: "",
  });
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [completingBid, setCompletingBid] = useState<any>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string>("");

  // Fetch worker's bids
  const { data: myBids = [] } = useQuery<any[]>({
    queryKey: ["/api/bids/worker", user?.id],
    enabled: !!user?.id,
  });

  // Update bid mutation
  const updateBidMutation = useMutation({
    mutationFn: (data: any) => 
      fetch(`/api/bids/${editingBid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your bid has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/worker", user?.id] });
      setEditingBid(null);
      setEditBidData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete bid mutation
  const deleteBidMutation = useMutation({
    mutationFn: (bidId: string) => 
      fetch(`/api/bids/${bidId}`, {
        method: "DELETE",
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your bid has been deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/worker", user?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditBid = (bid: any) => {
    setEditingBid(bid);
    setEditBidData({
      proposedAmount: bid.proposedAmount.toString(),
      estimatedDuration: bid.estimatedDuration || "",
      proposal: bid.proposal,
    });
  };

  const handleUpdateBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editBidData.proposedAmount || !editBidData.proposal) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    updateBidMutation.mutate({
      proposedAmount: parseFloat(editBidData.proposedAmount),
      estimatedDuration: editBidData.estimatedDuration,
      proposal: editBidData.proposal,
    });
  };

  // Mark job as complete mutation
  const markCompleteOTPMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}/worker-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark job as complete");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedOTP(data.otp);
      setShowOTPModal(true);
      toast({
        title: "Job Marked Complete",
        description: `OTP ${data.otp} generated. Share this with the client for verification.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/worker", user?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark job as complete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMarkJobComplete = async (bid: any) => {
    if (!bid.jobPosting?.id) {
      toast({
        title: "Error",
        description: "Job information not found",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the booking for this job and worker
      const bookingsResponse = await fetch(`/api/bookings/user/${user?.id}`);
      const bookings = await bookingsResponse.json();
      
      const booking = bookings.find((b: any) => 
        b.jobPostingId === bid.jobPosting.id && b.workerId === user?.id
      );
      
      if (!booking) {
        toast({
          title: "Error",
          description: "Booking not found for this job",
          variant: "destructive",
        });
        return;
      }

      setCompletingBid(bid);
      markCompleteOTPMutation.mutate(booking.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find booking information",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* My Bids */}
      <Card>
        <CardHeader>
          <CardTitle>My Bids</CardTitle>
        </CardHeader>
        <CardContent>
          {myBids.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {myBids.map((bid: any) => {
                const job = bid.jobPosting;
                return (
                  <Card 
                    key={bid.id} 
                    className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border border-slate-600 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                  >
                    <CardContent className="p-6 space-y-4">
                      {/* Top Header with Job ID, Bid Date, and Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-mono font-medium text-green-400 bg-green-900/30 px-3 py-1 rounded-md inline-block border border-green-500/30">
                            Job ID: {job?.id || "N/A"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/30">
                            <Clock className="h-3 w-3" />
                            <span>Bid Submitted {new Date(bid.createdAt).toLocaleDateString()}</span>
                          </div>
                          {job?.budgetMin && job?.budgetMax && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs text-emerald-400 bg-emerald-900/20 border-emerald-500/30">
                              <span className="font-bold text-white">
                                Client Budget: ₹{job.budgetMin} - ₹{job.budgetMax}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`px-3 py-1.5 text-sm font-medium border ${
                                bid.status === "accepted" ? "bg-green-500 text-white border-green-400" :
                                bid.status === "rejected" ? "bg-red-500 text-white border-red-400" : 
                                "bg-yellow-500 text-white border-yellow-400"
                              }`}
                            >
                              {bid.status === "accepted" ? "✓ Accepted" :
                               bid.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                            </Badge>
                            {bid.status === "accepted" && (
                              <div className="animate-pulse bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-300">
                                🎉 Congratulations!
                              </div>
                            )}
                          </div>
                          {/* Mark as Complete button for accepted jobs */}
                          {bid.status === "accepted" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleMarkJobComplete(bid)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark as Complete
                            </Button>
                          )}
                          {/* Only allow editing and deleting if bid is pending */}
                          {bid.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
                                onClick={() => handleEditBid(bid)}
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-400 border-red-500/30 hover:bg-red-900/20"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete your bid for "${bid.jobPosting?.title}"? This action cannot be undone.`)) {
                                    deleteBidMutation.mutate(bid.id);
                                  }
                                }}
                                disabled={deleteBidMutation.isPending}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Your Bid Details */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-3">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">Your Bid Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <span className="text-slate-300">Your Proposal: </span>
                            <span className="font-bold text-green-400">₹{bid.proposedAmount}</span>
                          </div>
                          {bid.estimatedDuration && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-amber-400" />
                              <span className="text-slate-300">Duration: </span>
                              <span className="text-amber-400">{bid.estimatedDuration}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-slate-400 mb-1">Your Proposal:</p>
                          <p className="text-sm text-slate-200 bg-slate-800/50 p-2 rounded border border-slate-600/30">
                            {bid.proposal}
                          </p>
                        </div>
                      </div>

                      {/* Job Details from Client */}
                      {job && (
                        <>
                          {/* Client Contact Info for Accepted Bids */}
                          {bid.status === "accepted" && (
                            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-3">
                              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Client Contact Information
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-green-400" />
                                  <span className="text-slate-300">Phone: </span>
                                  <span className="font-bold text-green-400">{job.clientMobile || bid.jobPosting?.clientMobile || 'Contact via platform'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-blue-400" />
                                  <span className="text-slate-300">Client: </span>
                                  <span className="text-blue-400">{bid.jobPosting?.clientFirstName ? `${bid.jobPosting.clientFirstName} ${bid.jobPosting.clientLastName || ''}`.trim() : 'Client'}</span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-green-300 bg-green-900/30 p-2 rounded border border-green-500/20">
                                💡 Contact the client directly to coordinate the service. Financial model activated - commission and payments will be processed automatically.
                              </div>
                            </div>
                          )}
                          
                          {/* Service Address & Media */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            {/* Service Address */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-2 h-auto text-slate-300 hover:text-blue-300 bg-slate-800/50 border border-slate-600/30 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-xs font-medium">Service Address</span>
                                  </div>
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-1">
                                <div className="text-xs text-slate-300 bg-slate-900/50 border border-slate-600/30 p-2 rounded">
                                  {bid.status === "accepted" ? (
                                    // Show full address for accepted bids
                                    <div className="space-y-2">
                                      <div className="text-green-400 font-medium flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3" />
                                        Full Service Address (Bid Accepted)
                                      </div>
                                      <div className="whitespace-pre-line text-slate-200 bg-green-900/20 p-2 rounded border border-green-500/30">
                                        {job.serviceAddress || 'Service address not specified'}
                                      </div>
                                    </div>
                                  ) : (
                                    // Show limited address for pending/rejected bids
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400">Area:</span>
                                        <span>{job.serviceAddress?.split(',')[0] || 'Not specified'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400">District:</span>
                                        <span>{job.district || 'Not specified'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400">State:</span>
                                        <span>{job.state || 'Not specified'}</span>
                                      </div>
                                      <div className="text-xs text-slate-500 mt-2 italic">
                                        Full address shared after bid acceptance
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Media Attachments */}
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-2 h-auto text-slate-300 hover:text-blue-300 bg-slate-800/50 border border-slate-600/30 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="h-3 w-3" />
                                    <span className="text-xs font-medium">Client Media</span>
                                  </div>
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-1">
                                <div className="text-xs text-slate-300 bg-slate-900/50 border border-slate-600/30 p-2 rounded">
                                  {job.attachments && job.attachments.length > 0 ? (
                                    <div className="space-y-2">
                                      {job.attachments.map((attachment: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/30 border border-slate-600/30 rounded">
                                          {attachment.type === 'audio' && (
                                            <>
                                              <Volume2 className="h-3 w-3" />
                                              <audio controls className="flex-1 h-6">
                                                <source src={attachment.url} type="audio/webm" />
                                              </audio>
                                            </>
                                          )}
                                          {attachment.type === 'image' && (
                                            <>
                                              <Camera className="h-3 w-3" />
                                              <img src={attachment.url} className="w-16 h-16 object-cover rounded border border-slate-600/30" alt="Job attachment" />
                                            </>
                                          )}
                                          {attachment.type === 'video' && (
                                            <>
                                              <Video className="h-3 w-3" />
                                              <video controls className="w-full h-20 rounded border border-slate-600/30">
                                                <source src={attachment.url} />
                                              </video>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">No media attachments</span>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>

                          {/* Job Title and Details */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-xl text-white">
                                {job.title}
                              </h3>
                              <p className="text-sm text-blue-300 font-medium mt-1">
                                {job.serviceCategory} • {job.district}, Tamil Nadu
                              </p>
                              {/* Requirements badges */}
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
                          
                          {/* Job Description */}
                          <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
                            <p className="text-slate-200 leading-relaxed">
                              {job.description}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bids submitted yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Bid Modal */}
      <Dialog open={!!editingBid} onOpenChange={() => setEditingBid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bid for "{editingBid?.jobPosting?.title}"</DialogTitle>
            <DialogDescription>
              Update your proposal for this job. The client will be notified of the changes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBid} className="space-y-4">
            <div>
              <Label htmlFor="editProposedAmount">Proposed Amount (₹)</Label>
              <Input
                id="editProposedAmount"
                type="number"
                placeholder="Enter your quoted amount"
                value={editBidData.proposedAmount}
                onChange={(e) => setEditBidData(prev => ({ ...prev, proposedAmount: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="editEstimatedDuration">Estimated Duration</Label>
              <Input
                id="editEstimatedDuration"
                placeholder="e.g., 2-3 days, 1 week"
                value={editBidData.estimatedDuration}
                onChange={(e) => setEditBidData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="editProposal">Your Proposal</Label>
              <Textarea
                id="editProposal"
                placeholder="Describe your approach, experience, and why you're the best fit for this job..."
                value={editBidData.proposal}
                onChange={(e) => setEditBidData(prev => ({ ...prev, proposal: e.target.value }))}
                rows={4}
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingBid(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBidMutation.isPending}>
                {updateBidMutation.isPending ? "Updating..." : "Update Bid"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* OTP Generated Modal */}
      <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">Job Marked as Complete!</DialogTitle>
            <DialogDescription>
              Share this OTP with the client to verify job completion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Completion OTP</p>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 tracking-wider">
                {generatedOTP}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Client needs this OTP to confirm job completion
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Important:</p>
                  <p>Only share this OTP with the client after completing all work. The client will use this to verify and finalize the job.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowOTPModal(false)} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function WorkerDashboard() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC OR RETURNS
  const { user, isLoading: authLoading } = useAuth();
  // Removed useLanguage as it's not needed for this component
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinReason, setRejoinReason] = useState("");
  const [isWalletCollapsed, setIsWalletCollapsed] = useState(true);
  const [jobCompletionModalOpen, setJobCompletionModalOpen] = useState(false);
  const [completionBooking, setCompletionBooking] = useState<any>(null);

  // Fetch available jobs count for badge
  const { data: availableJobs = [] } = useQuery({
    queryKey: ["/api/job-postings", "available", user?.id],
    queryFn: () => fetch(`/api/job-postings?workerId=${user?.id}`).then(res => res.json()),
    select: (data: any) => data.filter((job: any) => job.status === "open"),
    enabled: !!user?.id,
  });

  // Fetch worker bids count for badge
  const { data: workerBids = [] } = useQuery({
    queryKey: ["/api/bids/worker", user?.id],
    enabled: !!user?.id,
  });

  // Calculate UPDATE_REQUIRED fields count
  const getUpdateRequiredCount = () => {
    if (!user) return 0;
    
    let count = 0;
    const fieldsToCheck = [
      user.lastName,
      user.email,
      user.houseNumber,
      user.streetName,
      user.areaName,
      user.district,
      user.state,
      user.pincode,
      user.fullAddress,
      user.aadhaarNumber,
      user.panNumber
    ];
    
    fieldsToCheck.forEach(field => {
      if (field === "UPDATE_REQUIRED" || field === "" || field === null || field === undefined) {
        count++;
      }
    });
    
    return count;
  };

  const updateRequiredCount = getUpdateRequiredCount();
  
  // Force re-render when showRejoinModal changes
  useEffect(() => {
    console.log("useEffect - showRejoinModal changed to:", showRejoinModal);
  }, [showRejoinModal]);

  // Fetch worker's bookings (always call hooks)
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings/user", user?.id, "worker"],
    queryFn: () => fetch(`/api/bookings/user/${user?.id}?role=worker`).then(res => res.json()),
    enabled: !!user?.id && user.role === "worker"
  });

  // Fetch worker profile (always call hooks)
  const { data: workerProfile = {}, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/worker/profile", user?.id],
    queryFn: () => fetch(`/api/worker/profile/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id && user.role === "worker"
  });

  // Update booking status mutation (MUST BE CALLED BEFORE ANY RETURNS)
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          console.warn('Response is not JSON, status:', response.status);
          return { success: true, status: response.status };
        }
      } catch (error) {
        console.error('Update booking status error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Rejoin request mutation
  const rejoinRequestMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiRequest("POST", `/api/worker/rejoin-request/${user?.id}`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Rejoin Request Submitted",
        description: "Your request to rejoin has been submitted to admin for review.",
      });
      setShowRejoinModal(false);
      setRejoinReason("");
      // Refresh user data to show updated status
      queryClient.invalidateQueries({ queryKey: ["/api/user/refresh"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit rejoin request",
        variant: "destructive",
      });
    },
  });

  // Authentication redirect logic in useEffect (MUST BE CALLED BEFORE ANY RETURNS)
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation("/");
      } else if (user.role !== "worker") {
        if (user.role === "client") {
          setLocation("/dashboard");
        } else if (user.role === "admin" || user.role === "super_admin") {
          setLocation("/admin-dashboard");
        }
      }
    }
  }, [user, authLoading, setLocation]);

  // Helper function to refresh user data
  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/user/refresh"] });
  };

  // Helper functions
  const handleRejoinRequest = () => {
    console.log("handleRejoinRequest called with reason:", rejoinReason);
    if (!rejoinReason.trim()) {
      console.log("No reason provided, showing error toast");
      toast({
        title: "Reason Required",
        description: "Please provide a reason for your rejoin request.",
        variant: "destructive",
      });
      return;
    }
    console.log("Submitting rejoin request with reason:", rejoinReason.trim());
    rejoinRequestMutation.mutate(rejoinReason.trim());
  };

  const handleStatusUpdate = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
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

  // Now that all hooks are called, we can do conditional checks
  const isWorkerApproved = user?.status === "approved";
  const isWorkerPending = user?.status === "pending";
  const isWorkerRejected = user?.status === "rejected";
  const isWorkerSuspended = user?.status === "suspended";

  // Show loading state while auth is loading
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

  // Redirect if user is null or wrong role
  if (!user || user.role !== "worker") {
    return null;
  }

  // Show suspension notice for suspended workers
  if (isWorkerSuspended) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Your account has been suspended by admin
            </p>
          </div>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                <Ban className="h-5 w-5" />
                <span>Account Suspended</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-orange-700 dark:text-orange-300">
                  Your worker account has been temporarily suspended by an administrator. 
                  You have read-only access to view your profile and previous bookings, 
                  but cannot accept new jobs or update your availability.
                </p>
                <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>What you can do:</strong>
                  </p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                    <li>• View your profile information</li>
                    <li>• Check your booking history</li>
                    <li>• Contact support if you believe this is an error</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    For questions about your suspension, please contact our support team.
                  </p>
                  
                  {user?.hasRejoinRequest ? (
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        Rejoin Request Submitted
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your request to rejoin has been submitted and is under admin review.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        console.log("Rejoin button clicked, current state:", showRejoinModal);
                        setShowRejoinModal(true);
                        console.log("After setting state to true");
                      }}
                      className="w-fit bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Request to Rejoin
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show approval pending state for unapproved workers
  if (isWorkerPending || isWorkerRejected) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Your worker profile is under review
            </p>
          </div>

          {/* Approval Status Card */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              {isWorkerPending && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Clock className="h-6 w-6 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200 text-lg">
                        Admin Will Approve
                      </span>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Your worker application is under review. Please wait for admin approval to access your full dashboard and start receiving service requests.
                    </p>
                  </div>
                </div>
              )}
              
              {isWorkerRejected && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200 text-lg">
                        Application Rejected
                      </span>
                    </div>
                    <p className="text-red-700 dark:text-red-300">
                      Your worker application has been rejected. Please contact admin for more details or to resubmit your application.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uneditable Profile Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Your Profile</span>
                <Badge variant="secondary" className="ml-2">Read Only</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.firstName}{" "}
                        {user.lastName === "UPDATE_REQUIRED" ? (
                          <span className="text-red-500 text-xs">UPDATE_REQUIRED</span>
                        ) : (
                          user.lastName
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Mobile</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.mobile}
                      </p>
                    </div>
                    {user.email && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-medium p-2 bg-muted rounded border">
                          {user.email}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">District</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.district || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">State</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user.state || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Registration Date</Label>
                      <p className="font-medium p-2 bg-muted rounded border">
                        {user?.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "Not available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Worker Profile Information */}
                {workerProfile && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-4">Service Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Primary Service</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            {workerProfile.workerProfile?.primaryService || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Experience Years</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            {workerProfile.workerProfile?.experienceYears || "0"} years
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            ₹{workerProfile.workerProfile?.hourlyRate || "0"}/hour
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Service Districts</Label>
                          <p className="font-medium p-2 bg-muted rounded border">
                            {Array.isArray(workerProfile.workerProfile?.serviceDistricts) 
                              ? workerProfile.workerProfile.serviceDistricts.join(", ") 
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalBookings: bookings?.length || 0,
    pendingBookings: bookings?.filter((b: any) => b.status === "pending").length || 0,
    completedBookings: bookings?.filter((b: any) => b.status === "completed").length || 0,
    totalEarnings: bookings?.filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount) || 0), 0) || 0,
    rating: parseFloat(workerProfile?.workerProfile?.rating) || 0,
    totalJobs: workerProfile?.workerProfile?.totalJobs || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Wallet and Advertisement Section - Top Welcome Area */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Wallet Section - Left Side */}
            <div className="lg:col-span-1">
              <Card className={`bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 ${isWalletCollapsed ? 'h-[80px]' : ''}`}>
                <CardHeader className={isWalletCollapsed ? "px-4 py-0 h-[80px] flex items-center justify-center" : "pb-2"}>
                  <div className={`w-full ${isWalletCollapsed ? '' : 'space-y-3'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <div className={`bg-amber-100 dark:bg-amber-900/40 rounded-lg ${isWalletCollapsed ? 'p-0.5' : 'p-1.5'}`}>
                            <Wallet className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className={`font-semibold text-amber-800 dark:text-amber-200 ${isWalletCollapsed ? 'text-xs' : 'text-lg'}`}>Earnings Wallet</span>
                        </div>
                        {isWalletCollapsed && (
                          <>
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600 text-xs px-1 py-0 h-4">
                              Pro
                            </Badge>
                            <div className="flex items-center gap-0.5">
                              <IndianRupee className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-bold text-amber-800 dark:text-amber-200">{stats.totalEarnings.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsWalletCollapsed(!isWalletCollapsed)}
                        className="h-5 w-5 p-0 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-full"
                      >
                        {isWalletCollapsed ? (
                          <ChevronDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <ChevronUp className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {!isWalletCollapsed && (
                  <CardContent className="space-y-4 px-4 pb-4">
                    {/* Main Balance Display */}
                    <div className="bg-gradient-to-r from-white to-amber-50 dark:from-gray-900/40 dark:to-amber-900/20 rounded-lg p-4 text-center border border-amber-200/50 dark:border-amber-600/30">
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-1 font-medium">Total Earnings Balance</p>
                      <div className="flex items-center justify-center gap-1">
                        <IndianRupee className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                        <span className="text-4xl font-bold text-amber-800 dark:text-amber-200">{stats.totalEarnings.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Professional Worker Account
                      </p>
                    </div>

                    {/* Detailed Earnings Breakdown */}
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-white/80 to-amber-50/80 dark:from-gray-900/40 dark:to-amber-900/20 rounded-lg p-4 border border-amber-200/30 dark:border-amber-600/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">This Month</p>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-lg font-bold text-amber-800 dark:text-amber-200">+₹{(stats.totalEarnings * 0.3).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Pending</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              <span className="text-lg font-bold text-orange-700 dark:text-orange-300">₹1,200</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Professional Action Buttons */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white border-0 font-medium">
                          <Plus className="h-4 w-4 mr-2" />
                          Top Up
                        </Button>
                        <Button size="sm" variant="outline" className="border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      </div>
                      <Button size="sm" variant="outline" className="w-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 font-medium">
                        <Gift className="h-4 w-4 mr-2" />
                        Redeem Reward Points
                      </Button>
                    </div>

                    {/* Last Updated Info */}
                    <div className="text-center pt-2 border-t border-amber-200/50 dark:border-amber-600/30">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
            
            {/* Advertisement Section - Right Side */}
            <div className="lg:col-span-2">
              <AdvertisementCarousel targetAudience="worker" />
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings" className="relative">
              Bookings
              {bookings.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-purple-500 text-white text-xs px-1 py-0 h-5 min-w-[20px] rounded-full flex items-center justify-center">
                  {bookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available-jobs" className="relative">
              Available Jobs
              {availableJobs.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-500 text-white text-xs px-1 py-0 h-5 min-w-[20px] rounded-full flex items-center justify-center">
                  {availableJobs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-bids" className="relative">
              My Bids
              {workerBids.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-green-500 text-white text-xs px-1 py-0 h-5 min-w-[20px] rounded-full flex items-center justify-center">
                  {workerBids.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="relative">
              Profile
              {updateRequiredCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-red-500 text-white text-xs px-1 py-0 h-5 min-w-[20px] rounded-full flex items-center justify-center">
                  {updateRequiredCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="chat">
              Support Chat
              <MessageCircle className="h-3 w-3 ml-1" />
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.slice(0, 3).length > 0 ? (
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{booking.serviceName || "Service"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(booking.status)} mb-1`}>
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium">₹{booking.totalAmount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No bookings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{stats.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Jobs</span>
                      <span className="font-medium">{stats.totalJobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <span className="font-medium">
                        {stats.totalBookings > 0 
                          ? `${Math.round((stats.completedBookings / stats.totalBookings) * 100)}%`
                          : "0%"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{booking.serviceName || "Service"}</h3>
                            <p className="text-sm text-muted-foreground">{booking.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{booking.status}</span>
                            </Badge>
                            <p className="text-lg font-bold mt-1">₹{booking.totalAmount}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {booking.address}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.scheduledDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, "accepted")}
                              disabled={updateBookingMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                              disabled={updateBookingMutation.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        {booking.status === "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, "in_progress")}
                            disabled={updateBookingMutation.isPending}
                          >
                            Start Work
                          </Button>
                        )}
                        
                        {booking.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCompletionBooking(booking);
                              setJobCompletionModalOpen(true);
                            }}
                            disabled={updateBookingMutation.isPending}
                            data-testid={`button-complete-job-${booking.id}`}
                          >
                            Mark Complete
                          </Button>
                        )}

                        {booking.status === "completed" && booking.completionOTP && !booking.otpVerifiedAt && (
                          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Waiting for client OTP verification
                          </div>
                        )}

                        {booking.status === "completed" && booking.otpVerifiedAt && !booking.clientRating && (
                          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <Star className="h-4 w-4 inline mr-1" />
                            Completed - Waiting for client review
                          </div>
                        )}

                        {booking.status === "completed" && booking.clientRating && (
                          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Job completed with {booking.clientRating}★ rating
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Jobs Tab */}
          <TabsContent value="available-jobs" className="space-y-6">
            <AvailableJobsTab user={user} />
          </TabsContent>

          {/* My Bids Tab */}
          <TabsContent value="my-bids" className="space-y-6">
            <MyBidsTab user={user} />
          </TabsContent>

          {/* Profile Tab - Worker Specific with Professional Details */}
          <TabsContent value="profile" className="space-y-6">
            {/* Update Required Summary */}
            {updateRequiredCount > 0 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Profile Updates Required</span>
                    <Badge variant="secondary" className="bg-red-500 text-white">
                      {updateRequiredCount} field{updateRequiredCount > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Please update all required fields in your profile to improve your visibility to potential clients and ensure smooth service delivery.
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Worker Professional Profile with Edit Functionality */}
              <WorkerProfileCard user={user} refreshUser={refreshUser} />

              {/* Worker Identity & Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Identity & Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Verification Status */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Verification Status</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {isWorkerApproved ? (
                          <Badge className="justify-center py-2 bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="justify-center py-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {workerProfile?.workerProfile?.aadhaarVerified ? (
                          <Badge className="justify-center py-2 bg-purple-100 text-purple-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aadhaar Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="justify-center py-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Aadhaar Pending
                          </Badge>
                        )}
                        {workerProfile?.workerProfile?.isBackgroundVerified ? (
                          <Badge className="justify-center py-2 bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Background Clear
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="justify-center py-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Background Pending
                          </Badge>
                        )}
                        <Badge variant="outline" className="justify-center py-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          PAN Pending
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Identity Documents */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Identity Documents
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Aadhaar Number</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-medium p-2 bg-muted rounded border flex-1">
                              {workerProfile?.workerProfile?.aadhaarNumber ? 
                                `XXXX-XXXX-${workerProfile.workerProfile.aadhaarNumber.slice(-4)}` : 
                                "Not provided"}
                            </p>
                            {workerProfile?.workerProfile?.aadhaarVerified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">PAN Card Number</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-medium p-2 bg-muted rounded border flex-1">
                              Not provided
                            </p>
                            <Button size="sm" variant="outline">
                              Add PAN
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm text-muted-foreground">Mobile Number</Label>
                          <p className="font-medium p-2 bg-muted rounded border">{user.mobile}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Email Address</Label>
                          <p className="font-medium p-2 bg-muted rounded border">{user.email || "Not provided"}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Work Address</Label>
                          <p className="font-medium p-3 bg-muted rounded border whitespace-pre-line">
                            {user.fullAddress || `${user.areaName || ""}\n${user.district || ""}, ${user.state || ""}\n${user.pincode || ""}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Work History */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Work History
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Earnings</Label>
                          <p className="font-semibold text-green-600">₹{stats.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Jobs Completed</Label>
                          <p className="font-semibold">{stats.completedBookings}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Member Since</Label>
                          <p className="font-medium">{user.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "N/A"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Last Active</Label>
                          <p className="font-medium">Today</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details Section - Important for Workers */}
              <BankDetailsCard user={user} />

              {/* Worker Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Briefcase className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{stats.totalBookings}</p>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">Average Rating</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{stats.completedBookings}</p>
                        <p className="text-sm text-muted-foreground">Completed Jobs</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Worker Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Availability Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle your availability to receive new bookings
                      </p>
                    </div>
                    <Switch
                      checked={workerProfile?.workerProfile?.isAvailable || false}
                      onCheckedChange={(checked) => {
                        // TODO: Implement availability toggle
                        toast({
                          title: "Feature Coming Soon",
                          description: "Availability toggle will be implemented soon.",
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base">Service Areas</Label>
                    <p className="text-sm text-muted-foreground">
                      Districts where you provide services
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {workerProfile?.serviceDistricts?.map((districtId: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          District {districtId}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No service areas configured</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base">Skills & Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {workerProfile?.skills?.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      )) || (
                        <p className="text-sm text-muted-foreground">No skills added</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab Content */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Support Chat
                </CardTitle>
                <p className="text-muted-foreground">
                  Get help from our support team or resolve any issues you're facing
                </p>
              </CardHeader>
              <CardContent>
                <ChatSystem 
                  userId={user?.id || ''} 
                  userRole="worker"
                  userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Worker'}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rejoin Request Modal - Using fixed overlay approach */}
      {(() => {
        console.log("Modal render check - showRejoinModal:", showRejoinModal);
        return showRejoinModal;
      })() && (
        <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg font-semibold leading-none tracking-tight">Request to Rejoin</h3>
              <p className="text-sm text-muted-foreground">
                Please provide a reason for your rejoin request. This will be reviewed by our admin team.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejoinReason" className="text-sm font-medium">
                  Reason for rejoin request *
                </Label>
                <Textarea
                  id="rejoinReason"
                  value={rejoinReason}
                  onChange={(e) => setRejoinReason(e.target.value)}
                  placeholder="Please explain why you believe your account should be reactivated..."
                  rows={4}
                  disabled={rejoinRequestMutation.isPending}
                  className="resize-none"
                />
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Cancel button clicked");
                  setShowRejoinModal(false);
                  setRejoinReason("");
                }}
                disabled={rejoinRequestMutation.isPending}
                className="mt-2 sm:mt-0"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("Submit button clicked with reason:", rejoinReason);
                  handleRejoinRequest();
                }}
                disabled={rejoinRequestMutation.isPending || !rejoinReason.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {rejoinRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Job Completion Modal */}
      <JobCompletionModal
        booking={completionBooking}
        isOpen={jobCompletionModalOpen}
        onClose={() => {
          setJobCompletionModalOpen(false);
          setCompletionBooking(null);
        }}
        userRole="worker"
      />
    </div>
  );
}