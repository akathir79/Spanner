import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import WalletAnalytics from './WalletAnalytics';
import WalletNotifications from './WalletNotifications';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Smartphone, 
  Building, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Bell,
  ArrowLeft
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface WalletData {
  wallet: {
    id: string;
    balance: string;
    totalTopupAmount: string;
    totalEarned: string;
    totalSpent: string;
    lastTopupAt?: string;
    lastTransactionAt?: string;
  };
  recentTransactions: Array<{
    id: string;
    type: 'credit' | 'debit';
    category: string;
    amount: string;
    description: string;
    status: string;
    createdAt: string;
    razorpayPaymentId?: string;
  }>;
  paymentMethods: Record<string, {
    name: string;
    description: string;
    icon: string;
    popular: boolean;
  }>;
}

export default function Wallet() {
  const [topupAmount, setTopupAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch wallet data
  const { data: walletData, isLoading, error } = useQuery<WalletData>({
    queryKey: ['/api/wallet'],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Create topup order mutation
  const createTopupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/wallet/topup', { amount });
      return response.json();
    },
    onSuccess: (data) => {
      handleRazorpayPayment(data);
    },
    onError: (error: any) => {
      toast({
        title: "Topup Failed",
        description: error.message || "Failed to create payment order",
        variant: "destructive",
      });
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/wallet/verify-payment', paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: `₹${topupAmount} added to your wallet successfully!`,
      });
      setTopupAmount('');
      setIsProcessingPayment(false);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    },
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleRazorpayPayment = (orderData: any) => {
    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Payment gateway not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.order.amount * 100,
      currency: 'INR',
      name: 'SPANNER',
      description: 'Wallet Top-up',
      order_id: orderData.order.orderId,
      prefill: {
        name: 'User', // You can get this from user context
        email: 'user@example.com', // You can get this from user context
      },
      theme: {
        color: '#2563eb',
      },
      handler: (response: any) => {
        verifyPaymentMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          setIsProcessingPayment(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setIsProcessingPayment(true);
  };

  const handleTopup = () => {
    console.log('Topup button clicked', { topupAmount });
    const amount = parseFloat(topupAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (amount < 10) {
      toast({
        title: "Minimum Amount",
        description: "Minimum topup amount is ₹10",
        variant: "destructive",
      });
      return;
    }

    if (amount > 50000) {
      toast({
        title: "Maximum Amount",
        description: "Maximum topup amount is ₹50,000",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating topup mutation with amount:', amount);
    createTopupMutation.mutate(amount);
  };

  // Add withdraw functionality
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; bankDetails: any }) => {
      const response = await apiRequest('POST', '/api/wallet/withdraw', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawal Initiated",
        description: `₹${withdrawAmount} withdrawal request submitted successfully!`,
      });
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    console.log('Withdraw button clicked', { withdrawAmount });
    const amount = parseFloat(withdrawAmount);
    const balance = parseFloat(walletData?.wallet.balance || '0');
    
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (amount < 100) {
      toast({
        title: "Minimum Amount",
        description: "Minimum withdrawal amount is ₹100",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount cannot exceed your wallet balance",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating withdraw mutation with amount:', amount);
    // For demo, use placeholder bank details
    withdrawMutation.mutate({
      amount,
      bankDetails: {
        accountNumber: "XXXX1234",
        ifscCode: "HDFC0001234",
        accountHolderName: "Test User"
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone className="h-5 w-5" />;
      case 'building':
        return <Building className="h-5 w-5" />;
      case 'credit-card':
        return <CreditCard className="h-5 w-5" />;
      case 'wallet':
        return <WalletIcon className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            Failed to load wallet. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="wallet-container">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setLocation('/dashboard')}
          className="flex items-center gap-2"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        <div className="w-32"></div> {/* Spacer for centering */}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-6 w-6" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-4xl font-bold" data-testid="wallet-balance">
                ₹{parseFloat(walletData?.wallet.balance || '0').toLocaleString('en-IN', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="opacity-80">Total Earned</div>
                  <div className="font-semibold">
                    ₹{parseFloat(walletData?.wallet.totalEarned || '0').toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="opacity-80">Total Spent</div>
                  <div className="font-semibold">
                    ₹{parseFloat(walletData?.wallet.totalSpent || '0').toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="opacity-80">Total Topped Up</div>
                  <div className="font-semibold">
                    ₹{parseFloat(walletData?.wallet.totalTopupAmount || '0').toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Topup Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Top Up Wallet
            </CardTitle>
            <CardDescription>
              Add money to your wallet using UPI, Net Banking, or Cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topup-amount">Amount (₹)</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  placeholder="Enter amount (min ₹10, max ₹50,000)"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  min="10"
                  max="50000"
                  data-testid="input-topup-amount"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTopupAmount(amount.toString())}
                    data-testid={`button-quick-amount-${amount}`}
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleTopup}
                disabled={createTopupMutation.isPending || isProcessingPayment}
                className="w-full"
                data-testid="button-topup"
              >
                {createTopupMutation.isPending || isProcessingPayment ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Top Up ₹{topupAmount || '0'}
                  </>
                )}
              </Button>

              {/* Payment Methods */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Available Payment Methods</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(walletData?.paymentMethods || {}).map(([key, method]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 border rounded-lg text-sm"
                    >
                      {getPaymentMethodIcon(method.icon)}
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.description}</div>
                      </div>
                      {method.popular && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Withdraw Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5" />
              Withdraw Funds
            </CardTitle>
            <CardDescription>
              Transfer money from your wallet to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount (₹)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount (min ₹100)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="100"
                  max={parseFloat(walletData?.wallet.balance || '0')}
                  data-testid="input-withdraw-amount"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].filter(amount => amount <= parseFloat(walletData?.wallet.balance || '0')).map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    data-testid={`button-quick-withdraw-${amount}`}
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || parseFloat(walletData?.wallet.balance || '0') < 100}
                className="w-full"
                variant="outline"
                data-testid="button-withdraw"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Withdraw ₹{withdrawAmount || '0'}
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Minimum withdrawal: ₹100</div>
                <div>• Processing time: 1-3 business days</div>
                <div>• Available balance: ₹{parseFloat(walletData?.wallet.balance || '0').toLocaleString('en-IN')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your recent wallet activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {walletData?.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet. Top up your wallet to get started!
                </div>
              ) : (
                walletData?.recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <div className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>

        <TabsContent value="analytics">
          <WalletAnalytics />
        </TabsContent>

        <TabsContent value="notifications">
          <WalletNotifications />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>
                Manage your wallet preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Low Balance Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your balance falls below ₹100
                    </p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Large Transaction Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified for transactions over ₹5,000
                    </p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly spending analysis
                    </p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Auto Top-up (Coming Soon)</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically top up your wallet when balance is low
                  </p>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}