import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function BankDetailsFormNew({ 
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use refs to maintain stable form data without causing re-renders
  const formDataRef = useRef({
    accountHolderName: existingDetails?.accountHolderName || '',
    accountNumber: existingDetails?.accountNumber || '',
    ifscCode: existingDetails?.ifscCode || '',
    bankName: existingDetails?.bankName || '',
    branchName: existingDetails?.branchName || '',
    bankAddress: existingDetails?.bankAddress || '',
    accountType: existingDetails?.accountType || 'savings',
  });

  // State for form data to trigger re-renders only when needed
  const [formData, setFormData] = useState(formDataRef.current);

  // Update form data function that doesn't cause unnecessary re-renders
  const updateFormData = (field: string, value: string) => {
    formDataRef.current = { ...formDataRef.current, [field]: value };
    setFormData({ ...formDataRef.current });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Razorpay IFSC lookup function using real API
  const lookupIFSC = async (ifscCode: string): Promise<BankInfo | null> => {
    setIsSearching(true);
    
    try {
      // Use Razorpay IFSC API - https://ifsc.razorpay.com/:ifsc
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode.toUpperCase()}`);
      
      if (!response.ok) {
        // API returns 404 for invalid IFSC codes
        if (response.status === 404) {
          throw new Error('IFSC code not found');
        }
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setIsSearching(false);
      
      // Return the complete bank data from Razorpay API
      return data;
    } catch (error) {
      setIsSearching(false);
      console.error('IFSC lookup error:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const handleIFSCLookup = async () => {
    if (!formData.ifscCode || formData.ifscCode.length !== 11) {
      setErrors({ ifscCode: 'Please enter a valid 11-character IFSC code' });
      return;
    }

    try {
      const result = await lookupIFSC(formData.ifscCode);
      setBankInfo(result);
      
      // Format the address properly from the API response
      const addressParts = [result.ADDRESS];
      if (result.CITY && result.CITY !== result.CENTRE) {
        addressParts.push(result.CITY);
      }
      if (result.STATE) {
        addressParts.push(result.STATE);
      }
      
      const newFormData = {
        ...formDataRef.current,
        bankName: result.BANK,
        branchName: result.BRANCH,
        bankAddress: addressParts.join(', ')
      };
      formDataRef.current = newFormData;
      setFormData(newFormData);
      setErrors({});
      
      // Enhanced success message with more details
      toast({
        title: "Bank Details Found",
        description: `${result.BANK} - ${result.BRANCH}, ${result.CITY}`,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (errorMessage.includes('IFSC code not found')) {
        setErrors({ ifscCode: 'Invalid IFSC code. Please check and try again.' });
        toast({
          title: "IFSC Not Found",
          description: "The IFSC code you entered is not valid. Please verify and try again.",
          variant: "destructive",
        });
      } else {
        setErrors({ ifscCode: 'Failed to fetch bank details. Please try again.' });
        toast({
          title: "Connection Error",
          description: "Unable to fetch bank details at the moment. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 9) {
      newErrors.accountNumber = 'Account number must be at least 9 digits';
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
    const emptyForm = {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      bankAddress: '',
      accountType: 'savings',
    };
    formDataRef.current = emptyForm;
    setFormData(emptyForm);
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
                key="accountHolderName"
                defaultValue={formData.accountHolderName}
                onChange={(e) => updateFormData('accountHolderName', e.target.value)}
                placeholder="Enter full name as per bank records"
                className={errors.accountHolderName ? 'border-red-500' : ''}
                autoComplete="off"
              />
              {errors.accountHolderName && (
                <p className="text-sm text-red-500 mt-1">{errors.accountHolderName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                key="accountNumber"
                defaultValue={formData.accountNumber}
                onChange={(e) => updateFormData('accountNumber', e.target.value)}
                placeholder="Enter bank account number"
                className={errors.accountNumber ? 'border-red-500' : ''}
                autoComplete="off"
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
              )}
            </div>

            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => updateFormData('accountType', value)}
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
                      key="ifscCode"
                      defaultValue={formData.ifscCode}
                      onChange={(e) => updateFormData('ifscCode', e.target.value.toUpperCase())}
                      placeholder="Enter 11-character IFSC code"
                      maxLength={11}
                      className={errors.ifscCode ? 'border-red-500' : ''}
                      autoComplete="off"
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
                    key="bankAddress"
                    defaultValue={formData.bankAddress}
                    onChange={(e) => updateFormData('bankAddress', e.target.value)}
                    placeholder="You can edit the address if needed"
                    rows={3}
                    autoComplete="off"
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
                    key="ifscCodeManual"
                    defaultValue={formData.ifscCode}
                    onChange={(e) => updateFormData('ifscCode', e.target.value.toUpperCase())}
                    placeholder="Enter 11-character IFSC code"
                    maxLength={11}
                    className={errors.ifscCode ? 'border-red-500' : ''}
                    autoComplete="off"
                  />
                  {errors.ifscCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.ifscCode}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    key="bankNameManual"
                    defaultValue={formData.bankName}
                    onChange={(e) => updateFormData('bankName', e.target.value)}
                    placeholder="Enter bank name"
                    className={errors.bankName ? 'border-red-500' : ''}
                    autoComplete="off"
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    key="branchNameManual"
                    defaultValue={formData.branchName}
                    onChange={(e) => updateFormData('branchName', e.target.value)}
                    placeholder="Enter branch name"
                    className={errors.branchName ? 'border-red-500' : ''}
                    autoComplete="off"
                  />
                  {errors.branchName && (
                    <p className="text-sm text-red-500 mt-1">{errors.branchName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bankAddress">Bank Address</Label>
                  <Textarea
                    id="bankAddress"
                    key="bankAddressManual"
                    defaultValue={formData.bankAddress}
                    onChange={(e) => updateFormData('bankAddress', e.target.value)}
                    placeholder="Enter complete bank address"
                    rows={3}
                    className={errors.bankAddress ? 'border-red-500' : ''}
                    autoComplete="off"
                  />
                  {errors.bankAddress && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankAddress}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Review Details
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </>
      ) : (
        /* Confirmation View */
        <div className="space-y-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Confirm Bank Details</h3>
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
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button 
              onClick={confirmAndSave} 
              disabled={saveBankDetailsMutation.isPending}
              className="flex-1"
            >
              {saveBankDetailsMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Save Bank Details
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={saveBankDetailsMutation.isPending}
            >
              Edit Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isDialog) {
    return (
      <div className="w-full">
        {showTitle && (
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Add Bank Details (Required)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Bank details are required to receive payments for completed jobs. This information is mandatory for worker registration.
            </p>
          </CardHeader>
        )}
        <CardContent>
          <FormContent />
        </CardContent>
      </div>
    );
  }

  return <FormContent />;
}