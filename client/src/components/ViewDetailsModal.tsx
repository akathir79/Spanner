import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  Mail, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  AlertCircle,
  MapPin,
  CreditCard,
  User,
  Building2,
  Search,
  Loader
} from "lucide-react";
import statesDistrictsData from "@/../../shared/states-districts.json";

interface BankInfo {
  BANK: string;
  BRANCH: string;
  ADDRESS: string;
  CITY: string;
  STATE: string;
  DISTRICT: string;
  CENTRE: string;
  CONTACT: string | null;
  IMPS: boolean;
  UPI: boolean;
  MICR: string | null;
  RTGS: boolean;
  NEFT: boolean;
  SWIFT: string;
  ISO3166: string;
  BANKCODE: string;
  IFSC: string;
}

interface ViewDetailsField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'display' | 'badge' | 'avatar' | 'ifsc';
  value?: any;
  options?: { value: string; label: string }[];
  editable?: boolean;
  required?: boolean;
  placeholder?: string;
  section?: string; // Group fields into sections
}

interface ViewDetailsAction {
  label: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: Record<string, any>;
  fields: ViewDetailsField[];
  actions?: ViewDetailsAction[];
  onUpdate?: (updatedData: Record<string, any>) => Promise<void>;
  updateApiEndpoint?: string;
  queryKeyToInvalidate?: string[];
  avatar?: {
    src?: string;
    fallback: string;
  };
}

export default function ViewDetailsModal({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  fields,
  actions = [],
  onUpdate,
  updateApiEndpoint,
  queryKeyToInvalidate,
  avatar
}: ViewDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // IFSC functionality state
  const [isSearchingIFSC, setIsSearchingIFSC] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [ifscErrors, setIfscErrors] = useState<Record<string, string>>({});

  // Group fields by section
  const groupedFields = fields.reduce((acc, field) => {
    const section = field.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, ViewDetailsField[]>);

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
          bankAddress: addressParts.join(', '),
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: Record<string, any>) => {
      if (onUpdate) {
        await onUpdate(updatedData);
      } else if (updateApiEndpoint) {
        const response = await apiRequest("PUT", updateApiEndpoint, updatedData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Updated Successfully",
        description: "Details have been updated successfully.",
      });
      setIsEditing(false);
      if (queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update details",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const renderField = (field: ViewDetailsField) => {
    const value = isEditing ? editData[field.key] : data[field.key];

    switch (field.type) {
      case 'avatar':
        return avatar ? (
          <div className="flex justify-center">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatar.src} alt={avatar.fallback} />
              <AvatarFallback className="text-lg">{avatar.fallback}</AvatarFallback>
            </Avatar>
          </div>
        ) : null;

      case 'badge':
        if (field.key === 'isVerified') {
          return (
            <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-500" : ""}>
              {value ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending Verification
                </>
              )}
            </Badge>
          );
        }
        return <Badge variant="outline">{value}</Badge>;

      case 'display':
        return <p className="font-medium">{value || 'Not provided'}</p>;

      case 'textarea':
        return isEditing && field.editable ? (
          <Textarea
            value={value || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        ) : (
          <p className="font-medium">{value || 'Not provided'}</p>
        );

      case 'select':
        return isEditing && field.editable ? (
          <Select 
            value={value || ''} 
            onValueChange={(val) => setEditData(prev => ({ ...prev, [field.key]: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="font-medium">
            {field.options?.find(opt => opt.value === value)?.label || value || 'Not provided'}
          </p>
        );

      case 'ifsc':
        return isEditing && field.editable ? (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  const ifscValue = e.target.value.toUpperCase();
                  setEditData(prev => ({ ...prev, [field.key]: ifscValue }));
                  // Clear previous bank info when IFSC changes
                  if (ifscValue !== editData.bankIFSC) {
                    setBankInfo(null);
                  }
                }}
                placeholder="Enter 11-character IFSC code"
                maxLength={11}
                className={`flex-1 ${ifscErrors[field.key] ? 'border-red-500' : ''}`}
                required={field.required}
              />
              <Button
                type="button"
                onClick={handleIFSCLookup}
                disabled={isSearchingIFSC || !value || value.length !== 11}
                className="px-6"
              >
                {isSearchingIFSC ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {ifscErrors[field.key] && (
              <p className="text-sm text-red-500">{ifscErrors[field.key]}</p>
            )}
            {bankInfo && (
              <Alert className="border-green-200 bg-green-50">
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">{bankInfo.BANK}</p>
                      <p className="text-sm">{bankInfo.BRANCH}</p>
                      <p className="text-xs text-muted-foreground">{bankInfo.ADDRESS}</p>
                      <p className="text-xs text-muted-foreground">{bankInfo.CITY}, {bankInfo.STATE}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bankInfo.UPI && <Badge variant="secondary" className="text-xs">UPI</Badge>}
                      {bankInfo.RTGS && <Badge variant="secondary" className="text-xs">RTGS</Badge>}
                      {bankInfo.NEFT && <Badge variant="secondary" className="text-xs">NEFT</Badge>}
                      {bankInfo.IMPS && <Badge variant="secondary" className="text-xs">IMPS</Badge>}
                      {bankInfo.MICR && <Badge variant="outline" className="text-xs">MICR: {bankInfo.MICR}</Badge>}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <p className="font-medium">{value || 'Not provided'}</p>
        );

      default: // text, email, tel
        return isEditing && field.editable ? (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            required={field.required}
          />
        ) : (
          <p className="font-medium">{value || 'Not provided'}</p>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </DialogHeader>

          <div className="space-y-6">
            {/* Action buttons at the top */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {fields.some(f => f.editable) && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Details
                    </Button>
                  )}
                  
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      onClick={action.onClick}
                      disabled={action.disabled || action.loading}
                      className="flex items-center gap-2"
                    >
                      {action.icon && <action.icon className="w-4 h-4" />}
                      {action.loading ? 'Loading...' : action.label}
                    </Button>
                  ))}
                </>
              )}
            </div>

            {/* Avatar Section */}
            {avatar && (
              <div className="text-center">
                {renderField({ key: 'avatar', label: 'Avatar', type: 'avatar' })}
              </div>
            )}

            {/* Render grouped sections */}
            {Object.entries(groupedFields).map(([sectionName, sectionFields]) => (
              <div key={sectionName}>
                {sectionName !== 'main' && (
                  <h3 className="text-lg font-medium mb-3 capitalize border-b pb-2">
                    {sectionName.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionFields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </Label>
                      <div className="mt-1">
                        {renderField(field)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete this item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper function to create district options from states-districts data
export const getDistrictOptions = () => {
  const allDistricts: { value: string; label: string }[] = [];
  
  if ('states' in statesDistrictsData) {
    statesDistrictsData.states.forEach(({ state, districts }) => {
      districts.forEach(district => {
        allDistricts.push({
          value: district,
          label: `${district}, ${state}`
        });
      });
    });
  } else {
    // Fallback for old format
    Object.entries(statesDistrictsData as Record<string, string[]>).forEach(([state, districts]) => {
      districts.forEach(district => {
        allDistricts.push({
          value: district,
          label: `${district}, ${state}`
        });
      });
    });
  }
  
  return allDistricts.sort((a, b) => a.label.localeCompare(b.label));
};

// Helper function to create role options
export const getRoleOptions = () => [
  { value: 'client', label: 'Client' },
  { value: 'worker', label: 'Worker' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' }
];