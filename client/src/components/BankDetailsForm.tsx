import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  CreditCard, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Building2,
  MapPin,
  Plus,
  Edit,
  Loader
} from 'lucide-react';

interface BankDetailsFormProps {
  workerId: string;
  existingDetails?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  isDialog?: boolean;
  showTitle?: boolean;
}

interface BankInfo {
  bankName: string;
  branchName: string;
  bankAddress: string;
  city: string;
  state: string;
  district: string;
}

export default function BankDetailsForm({ 
  workerId, 
  existingDetails, 
  onSuccess, 
  onCancel, 
  isDialog = true,
  showTitle = true 
}: BankDetailsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [isSearching, setIsSearching] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [formData, setFormData] = useState({
    accountHolderName: existingDetails?.accountHolderName || '',
    accountNumber: existingDetails?.accountNumber || '',
    ifscCode: existingDetails?.ifscCode || '',
    bankName: existingDetails?.bankName || '',
    branchName: existingDetails?.branchName || '',
    bankAddress: existingDetails?.bankAddress || '',
    accountType: existingDetails?.accountType || 'savings',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Optimized input handlers to prevent focus loss
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Mock IFSC lookup function (in production, this would call a real IFSC API)
  const lookupIFSC = async (ifscCode: string): Promise<BankInfo | null> => {
    setIsSearching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock bank data for demonstration
    const mockBankData: Record<string, BankInfo> = {
      'HDFC0000001': {
        bankName: 'HDFC Bank',
        branchName: 'Anna Nagar Branch',
        bankAddress: '1st Floor, Spencer Plaza, Anna Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        district: 'Chennai'
      },
      'SBIN0000123': {
        bankName: 'State Bank of India',
        branchName: 'T Nagar Branch',
        bankAddress: 'No 45, Pondy Bazaar, T Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        district: 'Chennai'
      },
      'ICIC0000456': {
        bankName: 'ICICI Bank',
        branchName: 'Coimbatore Main Branch',
        bankAddress: 'Cross Cut Road, Gandhipuram',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        district: 'Coimbatore'
      },
      'AXIS0000789': {
        bankName: 'Axis Bank',
        branchName: 'Madurai Junction Branch',
        bankAddress: 'North Veli Street, Near Railway Station',
        city: 'Madurai',
        state: 'Tamil Nadu',
        district: 'Madurai'
      }
    };
    
    setIsSearching(false);
    return mockBankData[ifscCode.toUpperCase()] || null;
  };

  const handleIFSCLookup = async () => {
    if (!formData.ifscCode || formData.ifscCode.length !== 11) {
      setErrors({ ifscCode: 'Please enter a valid 11-character IFSC code' });
      return;
    }

    try {
      const result = await lookupIFSC(formData.ifscCode);
      if (result) {
        setBankInfo(result);
        setFormData(prev => ({
          ...prev,
          bankName: result.bankName,
          branchName: result.branchName,
          bankAddress: `${result.bankAddress}, ${result.city}, ${result.state}`
        }));
        setErrors({});
        toast({
          title: "Bank Details Found",
          description: `Found ${result.bankName} - ${result.branchName}`,
        });
      } else {
        setErrors({ ifscCode: 'Bank details not found for this IFSC code' });
        toast({
          title: "Not Found",
          description: "No bank details found for this IFSC code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('IFSC lookup error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bank details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 9 || formData.accountNumber.length > 18) {
      newErrors.accountNumber = 'Account number must be between 9-18 digits';
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (formData.ifscCode.length !== 11) {
      newErrors.ifscCode = 'IFSC code must be 11 characters';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    }

    if (!formData.bankAddress.trim()) {
      newErrors.bankAddress = 'Bank address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const saveBankDetailsMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = existingDetails 
        ? `/api/worker-bank-details/${existingDetails.id}` 
        : '/api/worker-bank-details';
      
      return apiRequest(existingDetails ? 'PUT' : 'POST', url, { ...data, workerId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: existingDetails 
          ? "Bank details updated successfully" 
          : "Bank details added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/worker-bank-details', workerId] });
      setShowConfirmation(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error saving bank details:', error);
      toast({
        title: "Error",
        description: "Failed to save bank details. Please try again.",
        variant: "destructive",
      });
    }
  });

  const confirmAndSave = () => {
    saveBankDetailsMutation.mutate(formData);
  };

  const resetForm = () => {
    setMode('auto');
    setBankInfo(null);
    setShowConfirmation(false);
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      bankAddress: '',
      accountType: 'savings',
    });
    setErrors({});
  };

  const FormContent = () => (
    <div className="space-y-6">
      {!showConfirmation ? (
        <>
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Fill Mode</Label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={mode === 'auto' ? 'default' : 'outline'}
                onClick={() => setMode('auto')}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Auto (IFSC Lookup)
              </Button>
              <Button
                type="button"
                variant={mode === 'manual' ? 'default' : 'outline'}
                onClick={() => setMode('manual')}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                placeholder="Enter full name as per bank records"
                className={errors.accountHolderName ? 'border-red-500' : ''}
              />
              {errors.accountHolderName && (
                <p className="text-sm text-red-500 mt-1">{errors.accountHolderName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                placeholder="Enter bank account number"
                className={errors.accountNumber ? 'border-red-500' : ''}
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
              )}
            </div>

            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => handleInputChange('accountType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Bank Details */}
          <div className="space-y-4">
            {mode === 'auto' ? (
              <>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                      placeholder="Enter 11-character IFSC code"
                      maxLength={11}
                      className={errors.ifscCode ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      onClick={handleIFSCLookup}
                      disabled={isSearching || formData.ifscCode.length !== 11}
                      className="px-6"
                    >
                      {isSearching ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.ifscCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.ifscCode}</p>
                  )}
                </div>

                {bankInfo && (
                  <Alert className="border-green-200 bg-green-50">
                    <Building2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">{bankInfo.bankName}</p>
                        <p className="text-sm">{bankInfo.branchName}</p>
                        <p className="text-xs text-muted-foreground">{bankInfo.bankAddress}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Auto-filled fields (read-only) */}
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAddress">Bank Address</Label>
                  <Textarea
                    id="bankAddress"
                    value={formData.bankAddress}
                    onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                    placeholder="You can edit the address if needed"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              /* Manual Mode */
              <>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                    placeholder="Enter 11-character IFSC code"
                    maxLength={11}
                    className={errors.ifscCode ? 'border-red-500' : ''}
                  />
                  {errors.ifscCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.ifscCode}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Enter bank name"
                    className={errors.bankName ? 'border-red-500' : ''}
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    placeholder="Enter branch name"
                    className={errors.branchName ? 'border-red-500' : ''}
                  />
                  {errors.branchName && (
                    <p className="text-sm text-red-500 mt-1">{errors.branchName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bankAddress">Bank Address</Label>
                  <Textarea
                    id="bankAddress"
                    value={formData.bankAddress}
                    onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                    placeholder="Enter complete bank address"
                    rows={3}
                    className={errors.bankAddress ? 'border-red-500' : ''}
                  />
                  {errors.bankAddress && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankAddress}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || resetForm}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
            >
              {existingDetails ? 'Update Details' : 'Add Details'}
            </Button>
          </div>
        </>
      ) : (
        /* Confirmation View */
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Confirm Bank Details</h3>
            <p className="text-sm text-muted-foreground">
              Please review your bank details before saving
            </p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Holder:</span>
                <span className="text-sm">{formData.accountHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Number:</span>
                <span className="text-sm font-mono">{'●'.repeat(formData.accountNumber.length - 4)}{formData.accountNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">IFSC Code:</span>
                <span className="text-sm font-mono">{formData.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bank:</span>
                <span className="text-sm">{formData.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Branch:</span>
                <span className="text-sm">{formData.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Type:</span>
                <span className="text-sm capitalize">{formData.accountType}</span>
              </div>
              <Separator />
              <div>
                <span className="text-sm font-medium">Address:</span>
                <p className="text-sm text-muted-foreground mt-1">{formData.bankAddress}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              onClick={confirmAndSave}
              disabled={saveBankDetailsMutation.isPending}
              className="flex-1"
            >
              {saveBankDetailsMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Confirm & Save'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (!isDialog) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>{existingDetails ? 'Update Bank Details' : 'Add Bank Details'}</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <FormContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={existingDetails ? "outline" : "default"} className="w-full">
          <CreditCard className="h-4 w-4 mr-2" />
          {existingDetails ? 'Edit Bank Details' : 'Add Bank Details'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>{existingDetails ? 'Update Bank Details' : 'Add Bank Details'}</span>
          </DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
}