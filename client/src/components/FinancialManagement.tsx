import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Settings,
  DollarSign,
  Users,
  Activity,
  Plus,
  Edit,
  Eye,
  Trash2,
  IndianRupee
} from "lucide-react";

interface FinancialModel {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'advance_payment' | 'standard_commission' | 'completion_payment' | 'referral_earning';
  isActive: boolean;
  gstEnabled: boolean;
  gstRate: string;
  adminCommissionRate: string;
  advancePaymentPercentage: string;
  completionPercentage: string;
  referralRewardAmount: string;
  minimumTransactionAmount: string;
  maximumTransactionAmount: string;
  processingFeeRate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface UserWallet {
  id: string;
  userId: string;
  balance: string;
  pendingBalance: string;
  totalEarned: string;
  totalSpent: string;
  isActive: boolean;
  lastTransactionAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletTransaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'credit' | 'debit';
  category: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  gstAmount?: string;
  netAmount: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

export default function FinancialManagement() {
  const [financialModels, setFinancialModels] = useState<FinancialModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<FinancialModel | null>(null);
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false);
  const [isEditModelOpen, setIsEditModelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletSearchUserId, setWalletSearchUserId] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [creditAmount, setCreditAmount] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const { toast } = useToast();

  // Form state for creating/editing financial models
  type FinancialModelType = 'free' | 'advance_payment' | 'standard_commission' | 'completion_payment' | 'referral_earning';
  
  const [modelForm, setModelForm] = useState<{
    name: string;
    description: string;
    type: FinancialModelType;
    gstEnabled: boolean;
    gstRate: string;
    adminCommissionRate: string;
    advancePaymentPercentage: string;
    completionPercentage: string;
    referralRewardAmount: string;
    minimumTransactionAmount: string;
    maximumTransactionAmount: string;
    processingFeeRate: string;
  }>({
    name: "",
    description: "",
    type: "free",
    gstEnabled: false,
    gstRate: "18",
    adminCommissionRate: "10",
    advancePaymentPercentage: "30",
    completionPercentage: "70",
    referralRewardAmount: "100",
    minimumTransactionAmount: "50",
    maximumTransactionAmount: "100000",
    processingFeeRate: "2.5"
  });

  const { toast: showToast } = useToast();

  // Load financial models
  const loadFinancialModels = async () => {
    try {
      const response = await fetch("/api/financial-models");
      if (response.ok) {
        const models = await response.json();
        setFinancialModels(models);
      }
    } catch (error) {
      console.error("Error loading financial models:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load wallet data
  const loadWallet = async (userId: string) => {
    try {
      const response = await fetch(`/api/wallet/${userId}`);
      if (response.ok) {
        const wallet = await response.json();
        setSelectedWallet(wallet);
        
        // Load transactions
        const txResponse = await fetch(`/api/wallet/${userId}/transactions`);
        if (txResponse.ok) {
          const transactions = await txResponse.json();
          setWalletTransactions(transactions);
        }
      } else {
        showToast({
          title: "Wallet Not Found",
          description: "No wallet found for this user ID",
          variant: "destructive"
        });
        setSelectedWallet(null);
        setWalletTransactions([]);
      }
    } catch (error) {
      console.error("Error loading wallet:", error);
      showToast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      });
    }
  };

  // Create financial model
  const createFinancialModel = async () => {
    try {
      const response = await fetch("/api/financial-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelForm)
      });

      if (response.ok) {
        showToast({
          title: "Success",
          description: "Financial model created successfully"
        });
        setIsCreateModelOpen(false);
        resetModelForm();
        loadFinancialModels();
      }
    } catch (error) {
      console.error("Error creating financial model:", error);
      showToast({
        title: "Error",
        description: "Failed to create financial model",
        variant: "destructive"
      });
    }
  };

  // Update financial model
  const updateFinancialModel = async () => {
    if (!selectedModel) return;
    
    try {
      const response = await fetch(`/api/financial-models/${selectedModel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelForm)
      });

      if (response.ok) {
        showToast({
          title: "Success",
          description: "Financial model updated successfully"
        });
        setIsEditModelOpen(false);
        setSelectedModel(null);
        resetModelForm();
        loadFinancialModels();
      }
    } catch (error) {
      console.error("Error updating financial model:", error);
      showToast({
        title: "Error",
        description: "Failed to update financial model",
        variant: "destructive"
      });
    }
  };

  // Toggle model active status
  const toggleModelStatus = async (modelId: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? "activate" : "deactivate";
      const response = await fetch(`/api/financial-models/${modelId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "system" })
      });

      if (response.ok) {
        showToast({
          title: "Success",
          description: `Financial model ${isActive ? 'activated' : 'deactivated'} successfully`
        });
        loadFinancialModels();
      }
    } catch (error) {
      console.error("Error toggling model status:", error);
    }
  };

  // Credit wallet
  const creditWallet = async () => {
    if (!selectedWallet || !creditAmount) return;
    
    try {
      const response = await fetch(`/api/wallet/${selectedWallet.userId}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(creditAmount),
          description: transactionDescription || `Admin credit of ₹${creditAmount}`,
          category: "admin_credit"
        })
      });

      if (response.ok) {
        showToast({
          title: "Success",
          description: `₹${creditAmount} credited to wallet successfully`
        });
        setCreditAmount("");
        setTransactionDescription("");
        loadWallet(selectedWallet.userId);
      }
    } catch (error) {
      console.error("Error crediting wallet:", error);
      showToast({
        title: "Error",
        description: "Failed to credit wallet",
        variant: "destructive"
      });
    }
  };

  // Debit wallet
  const debitWallet = async () => {
    if (!selectedWallet || !debitAmount) return;
    
    try {
      const response = await fetch(`/api/wallet/${selectedWallet.userId}/debit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(debitAmount),
          description: transactionDescription || `Admin debit of ₹${debitAmount}`,
          category: "admin_debit"
        })
      });

      if (response.ok) {
        showToast({
          title: "Success",
          description: `₹${debitAmount} debited from wallet successfully`
        });
        setDebitAmount("");
        setTransactionDescription("");
        loadWallet(selectedWallet.userId);
      } else {
        const error = await response.json();
        showToast({
          title: "Error",
          description: error.message || "Failed to debit wallet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error debiting wallet:", error);
      showToast({
        title: "Error",
        description: "Failed to debit wallet",
        variant: "destructive"
      });
    }
  };

  const resetModelForm = () => {
    setModelForm({
      name: "",
      description: "",
      type: "free" as FinancialModelType,
      gstEnabled: false,
      gstRate: "18",
      adminCommissionRate: "10",
      advancePaymentPercentage: "30",
      completionPercentage: "70",
      referralRewardAmount: "100",
      minimumTransactionAmount: "50",
      maximumTransactionAmount: "100000",
      processingFeeRate: "2.5"
    });
  };

  const openEditModel = (model: FinancialModel) => {
    setSelectedModel(model);
    setModelForm({
      name: model.name,
      description: model.description,
      type: model.type,
      gstEnabled: model.gstEnabled,
      gstRate: model.gstRate,
      adminCommissionRate: model.adminCommissionRate,
      advancePaymentPercentage: model.advancePaymentPercentage,
      completionPercentage: model.completionPercentage,
      referralRewardAmount: model.referralRewardAmount,
      minimumTransactionAmount: model.minimumTransactionAmount,
      maximumTransactionAmount: model.maximumTransactionAmount,
      processingFeeRate: model.processingFeeRate
    });
    setIsEditModelOpen(true);
  };

  useEffect(() => {
    loadFinancialModels();
  }, []);

  const getModelTypeLabel = (type: string) => {
    const types = {
      free: "Free Posting/Receiving",
      advance_payment: "Client Advance Payment",
      standard_commission: "Standard Commission",
      completion_payment: "Full Payment After Completion",
      referral_earning: "Referral Earning System"
    };
    return types[type as keyof typeof types] || type;
  };

  const getModelTypeColor = (type: string) => {
    const colors = {
      free: "bg-green-100 text-green-800",
      advance_payment: "bg-blue-100 text-blue-800",
      standard_commission: "bg-purple-100 text-purple-800",
      completion_payment: "bg-orange-100 text-orange-800",
      referral_earning: "bg-pink-100 text-pink-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="financial-management">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Financial Management System</h2>
        <Dialog open={isCreateModelOpen} onOpenChange={setIsCreateModelOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-financial-model">
              <Plus className="w-4 h-4 mr-2" />
              Create Financial Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Financial Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    value={modelForm.name}
                    onChange={(e) => setModelForm({...modelForm, name: e.target.value})}
                    placeholder="e.g., Standard Service Model"
                    data-testid="input-model-name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Model Type</Label>
                  <Select
                    value={modelForm.type}
                    onValueChange={(value) => setModelForm({...modelForm, type: value as any})}
                  >
                    <SelectTrigger data-testid="select-model-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Posting/Receiving</SelectItem>
                      <SelectItem value="advance_payment">Client Advance Payment</SelectItem>
                      <SelectItem value="standard_commission">Standard Commission</SelectItem>
                      <SelectItem value="completion_payment">Full Payment After Completion</SelectItem>
                      <SelectItem value="referral_earning">Referral Earning System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={modelForm.description}
                  onChange={(e) => setModelForm({...modelForm, description: e.target.value})}
                  placeholder="Describe how this financial model works..."
                  rows={3}
                  data-testid="textarea-model-description"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="gst-enabled"
                  checked={modelForm.gstEnabled}
                  onCheckedChange={(checked) => setModelForm({...modelForm, gstEnabled: checked})}
                  data-testid="switch-gst-enabled"
                />
                <Label htmlFor="gst-enabled">Enable GST</Label>
              </div>

              {modelForm.gstEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gst-rate">GST Rate (%)</Label>
                    <Input
                      id="gst-rate"
                      type="number"
                      value={modelForm.gstRate}
                      onChange={(e) => setModelForm({...modelForm, gstRate: e.target.value})}
                      placeholder="18"
                      data-testid="input-gst-rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-commission">Admin Commission (%)</Label>
                    <Input
                      id="admin-commission"
                      type="number"
                      value={modelForm.adminCommissionRate}
                      onChange={(e) => setModelForm({...modelForm, adminCommissionRate: e.target.value})}
                      placeholder="10"
                      data-testid="input-admin-commission"
                    />
                  </div>
                </div>
              )}

              {modelForm.type === 'advance_payment' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="advance-percentage">Advance Payment (%)</Label>
                    <Input
                      id="advance-percentage"
                      type="number"
                      value={modelForm.advancePaymentPercentage}
                      onChange={(e) => setModelForm({...modelForm, advancePaymentPercentage: e.target.value})}
                      placeholder="30"
                      data-testid="input-advance-percentage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="completion-percentage">Completion Payment (%)</Label>
                    <Input
                      id="completion-percentage"
                      type="number"
                      value={modelForm.completionPercentage}
                      onChange={(e) => setModelForm({...modelForm, completionPercentage: e.target.value})}
                      placeholder="70"
                      data-testid="input-completion-percentage"
                    />
                  </div>
                </div>
              )}

              {modelForm.type === 'referral_earning' && (
                <div>
                  <Label htmlFor="referral-reward">Referral Reward Amount (₹)</Label>
                  <Input
                    id="referral-reward"
                    type="number"
                    value={modelForm.referralRewardAmount}
                    onChange={(e) => setModelForm({...modelForm, referralRewardAmount: e.target.value})}
                    placeholder="100"
                    data-testid="input-referral-reward"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="min-amount">Min Transaction (₹)</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    value={modelForm.minimumTransactionAmount}
                    onChange={(e) => setModelForm({...modelForm, minimumTransactionAmount: e.target.value})}
                    placeholder="50"
                    data-testid="input-min-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="max-amount">Max Transaction (₹)</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    value={modelForm.maximumTransactionAmount}
                    onChange={(e) => setModelForm({...modelForm, maximumTransactionAmount: e.target.value})}
                    placeholder="100000"
                    data-testid="input-max-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="processing-fee">Processing Fee (%)</Label>
                  <Input
                    id="processing-fee"
                    type="number"
                    step="0.1"
                    value={modelForm.processingFeeRate}
                    onChange={(e) => setModelForm({...modelForm, processingFeeRate: e.target.value})}
                    placeholder="2.5"
                    data-testid="input-processing-fee"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModelOpen(false);
                    resetModelForm();
                  }}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button onClick={createFinancialModel} data-testid="button-confirm-create">
                  Create Model
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" data-testid="tab-financial-models">Financial Models</TabsTrigger>
          <TabsTrigger value="wallets" data-testid="tab-wallet-management">Wallet Management</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-financial-analytics">Financial Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialModels.map((model) => (
              <Card key={model.id} className="relative" data-testid={`card-financial-model-${model.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={model.isActive}
                        onCheckedChange={(checked) => toggleModelStatus(model.id, checked)}
                        data-testid={`switch-model-status-${model.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModel(model)}
                        data-testid={`button-edit-model-${model.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={getModelTypeColor(model.type)} data-testid={`badge-model-type-${model.id}`}>
                    {getModelTypeLabel(model.type)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">{model.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {model.gstEnabled && (
                      <div className="flex items-center">
                        <span className="font-medium">GST:</span>
                        <span className="ml-1">{model.gstRate}%</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="font-medium">Commission:</span>
                      <span className="ml-1">{model.adminCommissionRate}%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Min:</span>
                      <span className="ml-1">₹{model.minimumTransactionAmount}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Max:</span>
                      <span className="ml-1">₹{model.maximumTransactionAmount}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant={model.isActive ? "default" : "secondary"}>
                      {model.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(model.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {financialModels.length === 0 && (
            <Card className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No financial models configured yet</p>
              <Button
                onClick={() => setIsCreateModelOpen(true)}
                data-testid="button-create-first-model"
              >
                Create Your First Financial Model
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Wallet Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="user-id-search">Search User by ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="user-id-search"
                      placeholder="Enter user ID (e.g., TAN-CHE-0001-C)"
                      value={walletSearchUserId}
                      onChange={(e) => setWalletSearchUserId(e.target.value)}
                      data-testid="input-wallet-search"
                    />
                    <Button
                      onClick={() => loadWallet(walletSearchUserId)}
                      disabled={!walletSearchUserId}
                      data-testid="button-search-wallet"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {selectedWallet && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Current Balance</p>
                          <p className="text-xl font-bold text-green-600" data-testid="text-wallet-balance">
                            ₹{parseFloat(selectedWallet.balance).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm text-gray-600">Pending Balance</p>
                          <p className="text-xl font-bold text-yellow-600" data-testid="text-pending-balance">
                            ₹{parseFloat(selectedWallet.pendingBalance).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Total Earned</p>
                          <p className="text-xl font-bold text-blue-600" data-testid="text-total-earned">
                            ₹{parseFloat(selectedWallet.totalEarned).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-600">Total Spent</p>
                          <p className="text-xl font-bold text-red-600" data-testid="text-total-spent">
                            ₹{parseFloat(selectedWallet.totalSpent).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <CardTitle className="text-lg mb-4 text-green-700">Credit Wallet</CardTitle>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="credit-amount">Amount (₹)</Label>
                          <Input
                            id="credit-amount"
                            type="number"
                            placeholder="Enter amount to credit"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            data-testid="input-credit-amount"
                          />
                        </div>
                        <div>
                          <Label htmlFor="credit-description">Description</Label>
                          <Input
                            id="credit-description"
                            placeholder="Reason for credit (optional)"
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                            data-testid="input-credit-description"
                          />
                        </div>
                        <Button
                          onClick={creditWallet}
                          disabled={!creditAmount}
                          className="w-full bg-green-600 hover:bg-green-700"
                          data-testid="button-credit-wallet"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Credit Wallet
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <CardTitle className="text-lg mb-4 text-red-700">Debit Wallet</CardTitle>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="debit-amount">Amount (₹)</Label>
                          <Input
                            id="debit-amount"
                            type="number"
                            placeholder="Enter amount to debit"
                            value={debitAmount}
                            onChange={(e) => setDebitAmount(e.target.value)}
                            data-testid="input-debit-amount"
                          />
                        </div>
                        <div>
                          <Label htmlFor="debit-description">Description</Label>
                          <Input
                            id="debit-description"
                            placeholder="Reason for debit (optional)"
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                            data-testid="input-debit-description"
                          />
                        </div>
                        <Button
                          onClick={debitWallet}
                          disabled={!debitAmount}
                          className="w-full bg-red-600 hover:bg-red-700"
                          data-testid="button-debit-wallet"
                        >
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Debit Wallet
                        </Button>
                      </div>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {walletTransactions.length > 0 ? (
                        walletTransactions.map((transaction) => (
                          <Card key={transaction.id} className="p-3" data-testid={`transaction-${transaction.id}`}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                {transaction.type === 'credit' ? (
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                )}
                                <div>
                                  <p className="font-medium">{transaction.description}</p>
                                  <p className="text-sm text-gray-600">
                                    {transaction.category} • {new Date(transaction.createdAt).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                  {transaction.type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Balance: ₹{parseFloat(transaction.balanceAfter).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <p className="text-gray-600 text-center py-4">No transactions found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-total-revenue">₹0</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-total-transactions">0</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Wallets</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-active-wallets">0</p>
                  <p className="text-xs text-gray-500">With balance &gt; ₹0</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Models</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-active-models">
                    {financialModels.filter(m => m.isActive).length}
                  </p>
                  <p className="text-xs text-gray-500">Currently enabled</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <CardTitle className="mb-4">Financial Analytics Dashboard</CardTitle>
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Financial analytics will be available once the system has transaction data.</p>
              <p className="text-sm">Charts and detailed reports will appear here as users start making transactions.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Model Dialog */}
      <Dialog open={isEditModelOpen} onOpenChange={setIsEditModelOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Financial Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form content as create modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Model Name</Label>
                <Input
                  id="edit-name"
                  value={modelForm.name}
                  onChange={(e) => setModelForm({...modelForm, name: e.target.value})}
                  placeholder="e.g., Standard Service Model"
                  data-testid="input-edit-model-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Model Type</Label>
                <Select
                  value={modelForm.type}
                  onValueChange={(value) => setModelForm({...modelForm, type: value as any})}
                >
                  <SelectTrigger data-testid="select-edit-model-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Posting/Receiving</SelectItem>
                    <SelectItem value="advance_payment">Client Advance Payment</SelectItem>
                    <SelectItem value="standard_commission">Standard Commission</SelectItem>
                    <SelectItem value="completion_payment">Full Payment After Completion</SelectItem>
                    <SelectItem value="referral_earning">Referral Earning System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={modelForm.description}
                onChange={(e) => setModelForm({...modelForm, description: e.target.value})}
                placeholder="Describe how this financial model works..."
                rows={3}
                data-testid="textarea-edit-model-description"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModelOpen(false);
                  setSelectedModel(null);
                  resetModelForm();
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button onClick={updateFinancialModel} data-testid="button-confirm-edit">
                Update Model
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}