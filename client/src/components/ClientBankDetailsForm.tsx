import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Building2, Check, AlertCircle } from "lucide-react";

interface BankDetails {
  bankAccountNumber: string;
  bankIFSC: string;
  bankAccountHolderName: string;
  bankName: string;
  bankBranch: string;
  bankAccountType: string;
}

interface ClientBankDetailsFormProps {
  userId: string;
  existingDetails?: Partial<BankDetails>;
  onSuccess?: () => void;
}

export default function ClientBankDetailsForm({ userId, existingDetails, onSuccess }: ClientBankDetailsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BankDetails>({
    bankAccountNumber: existingDetails?.bankAccountNumber || "",
    bankIFSC: existingDetails?.bankIFSC || "",
    bankAccountHolderName: existingDetails?.bankAccountHolderName || "",
    bankName: existingDetails?.bankName || "",
    bankBranch: existingDetails?.bankBranch || "",
    bankAccountType: existingDetails?.bankAccountType || "savings",
  });

  const [isIFSCLoading, setIsIFSCLoading] = useState(false);
  const [ifscValidated, setIfscValidated] = useState(false);
  const [errors, setErrors] = useState<Partial<BankDetails>>({});

  // Validate IFSC and get bank details
  const validateIFSC = async (ifsc: string) => {
    if (!ifsc || ifsc.length !== 11) return;
    
    setIsIFSCLoading(true);
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (response.ok) {
        const bankData = await response.json();
        setFormData(prev => ({
          ...prev,
          bankName: bankData.BANK || "",
          bankBranch: bankData.BRANCH || "",
        }));
        setIfscValidated(true);
        setErrors(prev => ({ ...prev, bankIFSC: "" }));
      } else {
        setErrors(prev => ({ ...prev, bankIFSC: "Invalid IFSC code" }));
        setIfscValidated(false);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, bankIFSC: "Error validating IFSC code" }));
      setIfscValidated(false);
    } finally {
      setIsIFSCLoading(false);
    }
  };

  // Save bank details mutation
  const saveBankDetailsMutation = useMutation({
    mutationFn: async (data: BankDetails) => {
      const response = await apiRequest("PUT", `/api/users/${userId}/bank-details`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Details Saved",
        description: "Your bank details have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save bank details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Partial<BankDetails> = {};
    
    if (!formData.bankAccountNumber) newErrors.bankAccountNumber = "Account number is required";
    if (!formData.bankIFSC) newErrors.bankIFSC = "IFSC code is required";
    if (!formData.bankAccountHolderName) newErrors.bankAccountHolderName = "Account holder name is required";
    if (!formData.bankAccountType) newErrors.bankAccountType = "Account type is required";
    
    if (formData.bankIFSC && formData.bankIFSC.length !== 11) {
      newErrors.bankIFSC = "IFSC code must be 11 characters";
    }
    
    if (formData.bankAccountNumber && formData.bankAccountNumber.length < 9) {
      newErrors.bankAccountNumber = "Account number must be at least 9 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveBankDetailsMutation.mutate(formData);
    }
  };

  const handleIFSCChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, bankIFSC: upperValue }));
    setIfscValidated(false);
    
    if (upperValue.length === 11) {
      validateIFSC(upperValue);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Bank Account Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Holder Name */}
          <div>
            <Label htmlFor="bankAccountHolderName">Account Holder Name *</Label>
            <Input
              id="bankAccountHolderName"
              value={formData.bankAccountHolderName}
              onChange={(e) => setFormData(prev => ({ ...prev, bankAccountHolderName: e.target.value }))}
              placeholder="Enter account holder name"
              className={errors.bankAccountHolderName ? "border-red-500" : ""}
            />
            {errors.bankAccountHolderName && (
              <p className="text-sm text-red-500 mt-1">{errors.bankAccountHolderName}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="bankAccountNumber">Account Number *</Label>
            <Input
              id="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
              placeholder="Enter account number"
              type="password"
              className={errors.bankAccountNumber ? "border-red-500" : ""}
            />
            {errors.bankAccountNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.bankAccountNumber}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <Label htmlFor="bankAccountType">Account Type *</Label>
            <Select value={formData.bankAccountType} onValueChange={(value) => setFormData(prev => ({ ...prev, bankAccountType: value }))}>
              <SelectTrigger className={errors.bankAccountType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Savings Account</SelectItem>
                <SelectItem value="current">Current Account</SelectItem>
              </SelectContent>
            </Select>
            {errors.bankAccountType && (
              <p className="text-sm text-red-500 mt-1">{errors.bankAccountType}</p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <Label htmlFor="bankIFSC">IFSC Code *</Label>
            <div className="relative">
              <Input
                id="bankIFSC"
                value={formData.bankIFSC}
                onChange={(e) => handleIFSCChange(e.target.value)}
                placeholder="Enter IFSC code (e.g., SBIN0001234)"
                maxLength={11}
                className={errors.bankIFSC ? "border-red-500" : ifscValidated ? "border-green-500" : ""}
              />
              {isIFSCLoading && (
                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
              )}
              {ifscValidated && !isIFSCLoading && (
                <Check className="absolute right-3 top-3 w-4 h-4 text-green-500" />
              )}
            </div>
            {errors.bankIFSC && (
              <p className="text-sm text-red-500 mt-1">{errors.bankIFSC}</p>
            )}
            {ifscValidated && (
              <p className="text-sm text-green-600 mt-1">IFSC code validated successfully</p>
            )}
          </div>

          {/* Bank Name (Auto-filled) */}
          {formData.bankName && (
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{formData.bankName}</span>
              </div>
            </div>
          )}

          {/* Branch Name (Auto-filled) */}
          {formData.bankBranch && (
            <div>
              <Label htmlFor="bankBranch">Branch</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <span className="text-sm font-medium">{formData.bankBranch}</span>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your bank details are securely encrypted and will only be used for payment processing.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={saveBankDetailsMutation.isPending}
          >
            {saveBankDetailsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Details...
              </>
            ) : (
              "Save Bank Details"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}