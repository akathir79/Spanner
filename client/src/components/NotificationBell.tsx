import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, User, Mail, CreditCard, Camera, FileText, CheckCircle, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BankDetailsModal from "@/components/BankDetailsModal";

interface ProfileUpdate {
  field: string;
  label: string;
  icon: any;
  required: boolean;
  completed: boolean;
}

export function NotificationBell() {
  const { user, refreshUser, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<string>("");
  const [editingValue, setEditingValue] = useState<string>("");
  const [isProfilePicturePreview, setIsProfilePicturePreview] = useState<string>("");
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Calculate required profile updates - matches WorkerDashboard logic
  const getProfileUpdates = (): ProfileUpdate[] => {
    if (!user) return [];

    const updates: ProfileUpdate[] = [];

    // Use the same field checking logic as WorkerDashboard
    const fieldsToCheck = [
      { field: 'lastName', label: 'Last Name', icon: User, value: user.lastName },
      { field: 'email', label: 'Email Address', icon: Mail, value: user.email },
      { field: 'houseNumber', label: 'House Number', icon: FileText, value: user.houseNumber },
      { field: 'streetName', label: 'Street Name', icon: FileText, value: user.streetName },
      { field: 'areaName', label: 'Area Name', icon: FileText, value: user.areaName },
      { field: 'district', label: 'District', icon: FileText, value: user.district },
      { field: 'state', label: 'State', icon: FileText, value: user.state },
      { field: 'pincode', label: 'Pincode', icon: FileText, value: user.pincode },
      { field: 'fullAddress', label: 'Full Address', icon: FileText, value: user.fullAddress },
      { field: 'aadhaarNumber', label: 'Aadhaar Number', icon: FileText, value: user.aadhaarNumber },
      { field: 'panNumber', label: 'PAN Number', icon: FileText, value: user.panNumber }
    ];

    // Add fields that need updates (matches WorkerDashboard calculation)
    fieldsToCheck.forEach(({ field, label, icon, value }) => {
      if (value === "UPDATE_REQUIRED" || value === "" || value === null || value === undefined) {
        updates.push({
          field,
          label,
          icon,
          required: true,
          completed: false,
        });
      }
    });

    // Profile picture check (special case)
    if (!user.profilePicture) {
      updates.push({
        field: "profilePicture",
        label: "Profile Picture",
        icon: Camera,
        required: user.role === "worker", // Mandatory for workers
        completed: false,
      });
    }

    // Bank details check (special case)
    if (!user.bankAccountNumber || !user.bankIFSC || !user.bankAccountHolderName) {
      updates.push({
        field: "bankDetails",
        label: "Bank Details",
        icon: CreditCard,
        required: true,
        completed: false,
      });
    }

    return updates;
  };

  const profileUpdates = getProfileUpdates();
  const pendingUpdates = profileUpdates.filter(update => !update.completed);
  const requiredUpdates = pendingUpdates.filter(update => update.required);



  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { field: string; value: string }) => {
      const updateData = { [data.field]: data.value };
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, updateData);
      return response;
    },
    onSuccess: async (response, variables) => {
      console.log("Profile update successful for field:", variables.field, "with value:", variables.value?.substring(0, 50));
      console.log("Response from server:", response);
      
      // Update local auth context immediately
      updateUser({ [variables.field]: variables.value });
      
      // Wait a moment for the server to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh complete user data from server to ensure consistency
      await refreshUser();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/worker/profile"] });
      
      toast({
        title: "Profile Updated",
        description: `${getFieldLabel(variables.field)} has been updated successfully.`,
      });
      
      setIsEditDialogOpen(false);
      setEditingField("");
      setEditingValue("");
      setIsProfilePicturePreview("");
      setIsOpen(false); // Close notification dropdown to see updated count
      
      console.log("Profile update completed, user context should be refreshed");
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to get field labels
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      lastName: "Last Name",
      email: "Email Address",
      profilePicture: "Profile Picture",
      bankDetails: "Bank Details"
    };
    return labels[field] || field;
  };

  // Handle notification click - open relevant field for editing
  const handleNotificationClick = (update: ProfileUpdate) => {
    if (update.field === "bankDetails") {
      setIsBankModalOpen(true);
      setIsOpen(false);
      return;
    }

    setEditingField(update.field);
    setEditingValue(user?.[update.field as keyof typeof user] || "");
    setIsEditDialogOpen(true);
    setIsOpen(false);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setIsProfilePicturePreview(base64String);
      setEditingValue(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Handle save updates
  const handleSaveUpdate = () => {
    if (!editingField || !editingValue.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid value.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      field: editingField,
      value: editingValue.trim()
    });
  };

  if (!user || pendingUpdates.length === 0) {
    return null;
  }

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2 hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          {pendingUpdates.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {pendingUpdates.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Profile Updates Required
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {requiredUpdates.length > 0 && (
          <>
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-red-600 mb-2">Required Updates</p>
              {requiredUpdates.map((update) => (
                <DropdownMenuItem 
                  key={update.field} 
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-red-50"
                  onClick={() => handleNotificationClick(update)}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                    <update.icon className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{update.label}</p>
                    <p className="text-xs text-gray-500">Click to update this field</p>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {pendingUpdates.filter(update => !update.required).length > 0 && (
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-orange-600 mb-2">Optional Updates</p>
            {pendingUpdates
              .filter(update => !update.required)
              .map((update) => (
                <DropdownMenuItem 
                  key={update.field} 
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-orange-50"
                  onClick={() => handleNotificationClick(update)}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                    <update.icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{update.label}</p>
                    <p className="text-xs text-gray-500">Click to update this field</p>
                  </div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </DropdownMenuItem>
              ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center text-sm text-blue-600 font-medium">
          <FileText className="w-4 h-4 mr-2" />
          Go to Dashboard to Update
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Edit Dialog for field-specific updates */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update {getFieldLabel(editingField)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {editingField === "profilePicture" ? (
            <div className="space-y-4">
              <Label htmlFor="picture">Upload Profile Picture</Label>
              <div className="flex flex-col items-center gap-4">
                {isProfilePicturePreview && (
                  <div className="relative">
                    <img 
                      src={isProfilePicturePreview} 
                      alt="Profile preview" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => {
                        setIsProfilePicturePreview("");
                        setEditingValue("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProfilePictureUpload(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("picture")?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Upload a clear photo for better recognition. Max 5MB.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={editingField}>{getFieldLabel(editingField)}</Label>
              {editingField === "email" ? (
                <Input
                  id={editingField}
                  type="email"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  placeholder="Enter your email address"
                />
              ) : (
                <Input
                  id={editingField}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  placeholder={`Enter your ${getFieldLabel(editingField).toLowerCase()}`}
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUpdate}
            disabled={updateProfileMutation.isPending || !editingValue.trim()}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Bank Details Modal */}
    <BankDetailsModal
      isOpen={isBankModalOpen}
      onClose={() => setIsBankModalOpen(false)}
      userId={user?.id}
      onSuccess={async () => {
        console.log("Bank details updated, refreshing user data...");
        
        // Refresh user data after bank details update
        await refreshUser();
        
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/worker/profile"] });
        
        setIsBankModalOpen(false);
        setIsOpen(false); // Close notification dropdown to see updated count
        
        console.log("Bank details update completed, notification count should be updated");
      }}
    />
    </>
  );
}