import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  CreditCard, 
  Search, 
  CheckCircle, 
  Building2,
  Loader,
  X
} from 'lucide-react';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  onSuccess?: () => void;
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

export default function BankDetailsModal({ isOpen, onClose, workerId, onSuccess }: BankDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    bankAddress: '',
    accountType: 'savings' as 'savings' | 'current',
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const lookupIFSC = useCallback(async (ifscCode: string) => {
    setIsSearching(true);
    
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'IFSC code not found' : `API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setBankInfo(data);
      
      const addressParts = [data.ADDRESS];
      if (data.CITY && data.CITY !== data.CENTRE) addressParts.push(data.CITY);
      if (data.STATE) addressParts.push(data.STATE);
      
      setFormData(prev => ({
        ...prev,
        bankName: data.BANK,
        branchName: data.BRANCH,
        bankAddress: addressParts.join(', ')
      }));
      
      toast({
        title: "Bank Details Found",
        description: `${data.BANK} - ${data.BRANCH}, ${data.CITY}`,
      });
      
      setIsSearching(false);
    } catch (error: any) {
      setIsSearching(false);
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
          description: "Unable to fetch bank details. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleIFSCLookup = useCallback(() => {
    if (!formData.ifscCode || formData.ifscCode.length !== 11) {
      setErrors(prev => ({ ...prev, ifscCode: 'Please enter a valid 11-character IFSC code' }));
      return;
    }
    lookupIFSC(formData.ifscCode);
  }, [formData.ifscCode, lookupIFSC]);

  const validateForm = useCallback(() => {
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
  }, [formData]);

  const saveBankDetailsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/worker-bank-details', { ...formData, workerId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank details added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/worker-bank-details', workerId] });
      onSuccess?.();
      onClose();
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

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      saveBankDetailsMutation.mutate();
    }
  }, [validateForm, saveBankDetailsMutation]);

  const handleClose = useCallback(() => {
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      bankAddress: '',
      accountType: 'savings',
    });
    setBankInfo(null);
    setErrors({});
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Bank Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Account Information</h4>
            
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => updateField('accountHolderName', e.target.value)}
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
                onChange={(e) => updateField('accountNumber', e.target.value)}
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
                onValueChange={(value: 'savings' | 'current') => updateField('accountType', value)}
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

          {/* Bank Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Bank Information</h4>
            
            <div>
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <div className="flex space-x-2">
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                  placeholder="Enter 11-character IFSC code"
                  maxLength={11}
                  className={`flex-1 ${errors.ifscCode ? 'border-red-500' : ''}`}
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

            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
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
                value={formData.branchName}
                onChange={(e) => updateField('branchName', e.target.value)}
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
                value={formData.bankAddress}
                onChange={(e) => updateField('bankAddress', e.target.value)}
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
            <Button 
              onClick={handleSubmit} 
              disabled={saveBankDetailsMutation.isPending}
              className="flex-1"
            >
              {saveBankDetailsMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Save Bank Details
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={saveBankDetailsMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}