import React, { useState, useCallback, memo } from 'react';
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

// Individual input components to prevent re-renders
const StableInput = memo(({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  readOnly = false,
  maxLength,
  className
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  readOnly?: boolean;
  maxLength?: number;
  className?: string;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${error ? 'border-red-500' : ''} ${className || ''}`}
      readOnly={readOnly}
      maxLength={maxLength}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
));

const StableTextarea = memo(({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  rows = 3
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  rows?: number;
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={error ? 'border-red-500' : ''}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
));

export default function BankDetailsFormFinal({ 
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

  // Form state
  const [accountHolderName, setAccountHolderName] = useState(existingDetails?.accountHolderName || '');
  const [accountNumber, setAccountNumber] = useState(existingDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(existingDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(existingDetails?.bankName || '');
  const [branchName, setBranchName] = useState(existingDetails?.branchName || '');
  const [bankAddress, setBankAddress] = useState(existingDetails?.bankAddress || '');
  const [accountType, setAccountType] = useState(existingDetails?.accountType || 'savings');

  // Stable update functions
  const updateAccountHolderName = useCallback((value: string) => {
    setAccountHolderName(value);
    if (errors.accountHolderName) {
      setErrors(prev => ({ ...prev, accountHolderName: '' }));
    }
  }, [errors.accountHolderName]);

  const updateAccountNumber = useCallback((value: string) => {
    setAccountNumber(value);
    if (errors.accountNumber) {
      setErrors(prev => ({ ...prev, accountNumber: '' }));
    }
  }, [errors.accountNumber]);

  const updateIfscCode = useCallback((value: string) => {
    setIfscCode(value.toUpperCase());
    if (errors.ifscCode) {
      setErrors(prev => ({ ...prev, ifscCode: '' }));
    }
  }, [errors.ifscCode]);

  const updateBankName = useCallback((value: string) => {
    setBankName(value);
    if (errors.bankName) {
      setErrors(prev => ({ ...prev, bankName: '' }));
    }
  }, [errors.bankName]);

  const updateBranchName = useCallback((value: string) => {
    setBranchName(value);
    if (errors.branchName) {
      setErrors(prev => ({ ...prev, branchName: '' }));
    }
  }, [errors.branchName]);

  const updateBankAddress = useCallback((value: string) => {
    setBankAddress(value);
    if (errors.bankAddress) {
      setErrors(prev => ({ ...prev, bankAddress: '' }));
    }
  }, [errors.bankAddress]);

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
    if (!ifscCode || ifscCode.length !== 11) {
      setErrors(prev => ({ ...prev, ifscCode: 'Please enter a valid 11-character IFSC code' }));
      return;
    }

    try {
      const result = await lookupIFSC(ifscCode);
      setBankInfo(result);
      
      // Format the address properly from the API response
      const addressParts = [result.ADDRESS];
      if (result.CITY && result.CITY !== result.CENTRE) {
        addressParts.push(result.CITY);
      }
      if (result.STATE) {
        addressParts.push(result.STATE);
      }
      
      setBankName(result.BANK);
      setBranchName(result.BRANCH);
      setBankAddress(addressParts.join(', '));
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
  }, [ifscCode, lookupIFSC, toast]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (accountNumber.length < 9) {
      newErrors.accountNumber = 'Account number must be at least 9 digits';
    }

    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (ifscCode.length !== 11) {
      newErrors.ifscCode = 'IFSC code must be 11 characters';
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    }

    if (!bankAddress.trim()) {
      newErrors.bankAddress = 'Bank address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [accountHolderName, accountNumber, ifscCode, bankName, branchName, bankAddress]);

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
    const formData = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      bankAddress,
      accountType
    };
    saveBankDetailsMutation.mutate(formData);
  }, [accountHolderName, accountNumber, ifscCode, bankName, branchName, bankAddress, accountType, saveBankDetailsMutation]);

  const FormContent = () => (
    <div className="space-y-6">
      {!showConfirmation ? (
        <>
          {/* Account Details */}
          <div className="space-y-4">
            <StableInput
              id="accountHolderName"
              label="Account Holder Name"
              value={accountHolderName}
              onChange={updateAccountHolderName}
              placeholder="Enter full name as per bank records"
              error={errors.accountHolderName}
            />

            <StableInput
              id="accountNumber"
              label="Account Number"
              value={accountNumber}
              onChange={updateAccountNumber}
              placeholder="Enter bank account number"
              error={errors.accountNumber}
            />

            <div>
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={accountType}
                onValueChange={setAccountType}
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
                <StableInput
                  id="ifscCode"
                  label=""
                  value={ifscCode}
                  onChange={updateIfscCode}
                  placeholder="Enter 11-character IFSC code"
                  error={errors.ifscCode}
                  maxLength={11}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleIFSCLookup}
                  disabled={isSearching || ifscCode.length !== 11}
                  className="px-6"
                >
                  {isSearching ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
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

            <StableInput
              id="bankName"
              label="Bank Name"
              value={bankName}
              onChange={updateBankName}
              placeholder="Enter bank name or use IFSC lookup"
              error={errors.bankName}
              readOnly={!!bankInfo}
              className={bankInfo ? "bg-muted" : ""}
            />

            <StableInput
              id="branchName"
              label="Branch Name"
              value={branchName}
              onChange={updateBranchName}
              placeholder="Enter branch name or use IFSC lookup"
              error={errors.branchName}
              readOnly={!!bankInfo}
              className={bankInfo ? "bg-muted" : ""}
            />

            <StableTextarea
              id="bankAddress"
              label="Bank Address"
              value={bankAddress}
              onChange={updateBankAddress}
              placeholder="Enter complete bank address or use IFSC lookup"
              error={errors.bankAddress}
            />
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
                <span className="text-sm">{accountHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Number:</span>
                <span className="text-sm font-mono">{'●'.repeat(accountNumber.length - 4)}{accountNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">IFSC Code:</span>
                <span className="text-sm font-mono">{ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bank:</span>
                <span className="text-sm">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Branch:</span>
                <span className="text-sm">{branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Type:</span>
                <span className="text-sm capitalize">{accountType}</span>
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