import React, { useState, useCallback } from 'react';
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
  Building2,
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

export default function BankDetailsFormFixed({ 
  workerId, 
  existingDetails, 
  onSuccess, 
  onCancel, 
  isDialog = true,
  showTitle = true 
}: BankDetailsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSearching, setIsSearching] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Single form state object - this prevents individual field re-renders
  const [form, setForm] = useState({
    accountHolderName: existingDetails?.accountHolderName || '',
    accountNumber: existingDetails?.accountNumber || '',
    ifscCode: existingDetails?.ifscCode || '',
    bankName: existingDetails?.bankName || '',
    branchName: existingDetails?.branchName || '',
    bankAddress: existingDetails?.bankAddress || '',
    accountType: existingDetails?.accountType || 'savings',
  });

  // Single update function for all fields
  const updateForm = useCallback((field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Razorpay IFSC lookup function
  const lookupIFSC = useCallback(async (ifscCodeValue: string): Promise<BankInfo | null> => {
    setIsSearching(true);
    
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCodeValue.toUpperCase()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('IFSC code not found');
        }
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setIsSearching(false);
      return data;
    } catch (error) {
      setIsSearching(false);
      console.error('IFSC lookup error:', error);
      throw error;
    }
  }, []);

  const handleIFSCLookup = useCallback(async () => {
    if (!form.ifscCode || form.ifscCode.length !== 11) {
      setErrors(prev => ({ ...prev, ifscCode: 'Please enter a valid 11-character IFSC code' }));
      return;
    }

    try {
      const result = await lookupIFSC(form.ifscCode);
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
      setForm(prev => ({
        ...prev,
        bankName: result.BANK,
        branchName: result.BRANCH,
        bankAddress: addressParts.join(', ')
      }));
      
      setErrors(prev => ({ ...prev, ifscCode: '' }));
      
      toast({
        title: "Bank Details Found",
        description: `${result.BANK} - ${result.BRANCH}, ${result.CITY}`,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (errorMessage.includes('IFSC code not found')) {
        setErrors(prev => ({ ...prev, ifscCode: 'Invalid IFSC code. Please check and try again.' }));
        toast({
          title: "IFSC Not Found",
          description: "The IFSC code you entered is not valid. Please verify and try again.",
          variant: "destructive",
        });
      } else {
        setErrors(prev => ({ ...prev, ifscCode: 'Failed to fetch bank details. Please try again.' }));
        toast({
          title: "Connection Error",
          description: "Unable to fetch bank details at the moment. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    }
  }, [form.ifscCode, lookupIFSC, toast]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!form.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (form.accountNumber.length < 9) {
      newErrors.accountNumber = 'Account number must be at least 9 digits';
    }

    if (!form.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (form.ifscCode.length !== 11) {
      newErrors.ifscCode = 'IFSC code must be 11 characters';
    }

    if (!form.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!form.branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    }

    if (!form.bankAddress.trim()) {
      newErrors.bankAddress = 'Bank address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  }, [validateForm]);

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

  const confirmAndSave = useCallback(() => {
    saveBankDetailsMutation.mutate(form);
  }, [saveBankDetailsMutation, form]);

  const FormContent = () => (
    <div className="space-y-6">
      {!showConfirmation ? (
        <>
          {/* Account Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={form.accountHolderName}
                onChange={(e) => updateForm('accountHolderName', e.target.value)}
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
                value={form.accountNumber}
                onChange={(e) => updateForm('accountNumber', e.target.value)}
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
                value={form.accountType}
                onValueChange={(value) => updateForm('accountType', value)}
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

          {/* Bank Details with IFSC Lookup */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="ifscCode"
                  value={form.ifscCode}
                  onChange={(e) => updateForm('ifscCode', e.target.value.toUpperCase())}
                  placeholder="Enter 11-character IFSC code"
                  maxLength={11}
                  className={`flex-1 ${errors.ifscCode ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  onClick={handleIFSCLookup}
                  disabled={isSearching || form.ifscCode.length !== 11}
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

            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={form.bankName}
                onChange={(e) => updateForm('bankName', e.target.value)}
                placeholder="Enter bank name or use IFSC lookup"
                className={`${errors.bankName ? 'border-red-500' : ''} ${bankInfo ? 'bg-muted' : ''}`}
                readOnly={!!bankInfo}
              />
              {errors.bankName && (
                <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                value={form.branchName}
                onChange={(e) => updateForm('branchName', e.target.value)}
                placeholder="Enter branch name or use IFSC lookup"
                className={`${errors.branchName ? 'border-red-500' : ''} ${bankInfo ? 'bg-muted' : ''}`}
                readOnly={!!bankInfo}
              />
              {errors.branchName && (
                <p className="text-sm text-red-500 mt-1">{errors.branchName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Textarea
                id="bankAddress"
                value={form.bankAddress}
                onChange={(e) => updateForm('bankAddress', e.target.value)}
                placeholder="Enter complete bank address or use IFSC lookup"
                rows={3}
                className={errors.bankAddress ? 'border-red-500' : ''}
              />
              {errors.bankAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.bankAddress}</p>
              )}
            </div>
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
                <span className="text-sm">{form.accountHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Number:</span>
                <span className="text-sm font-mono">{'●'.repeat(form.accountNumber.length - 4)}{form.accountNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">IFSC Code:</span>
                <span className="text-sm font-mono">{form.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bank:</span>
                <span className="text-sm">{form.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Branch:</span>
                <span className="text-sm">{form.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Type:</span>
                <span className="text-sm capitalize">{form.accountType}</span>
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