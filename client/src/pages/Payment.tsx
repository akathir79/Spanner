import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Shield, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaymentPageProps {
  bookingId: string;
}

interface BookingDetails {
  id: string;
  clientId: string;
  workerId: string;
  totalAmount: number;
  serviceName: string;
  workerName: string;
  status: string;
}

interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export default function Payment() {
  const [match, params] = useRoute('/payment/:bookingId');
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: ''
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bookingId = params?.bookingId;

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading } = useQuery<BookingDetails>({
    queryKey: ['/api/bookings', bookingId],
    enabled: !!bookingId,
  });

  // Create payment intent when component loads
  useEffect(() => {
    if (booking && !paymentIntent) {
      createPaymentIntent();
    }
  }, [booking, paymentIntent]);

  const createPaymentIntent = async () => {
    if (!booking) return;
    
    try {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: booking.totalAmount,
        currency: 'INR',
        bookingId: booking.id,
        paymentMethod
      });
      const data = await response.json();
      setPaymentIntent(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/confirm-payment', paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Payment Successful",
          description: `Payment of ₹${data.amount} completed successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
        navigate('/dashboard');
      } else {
        throw new Error(data.failureReason || 'Payment failed');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handlePayment = async () => {
    if (!paymentIntent || !booking || !user) return;

    setIsProcessing(true);

    // Validate payment method specific fields
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.expiryMonth || !cardDetails.expiryYear || !cardDetails.cvv) {
        toast({
          title: "Incomplete Details",
          description: "Please fill all card details",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        toast({
          title: "UPI ID Required",
          description: "Please enter your UPI ID",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!selectedBank) {
        toast({
          title: "Bank Selection Required",
          description: "Please select your bank",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
    }

    // Prepare payment confirmation data
    const paymentData = {
      paymentIntentId: paymentIntent.paymentIntentId,
      paymentMethodType: paymentMethod,
      bookingId: booking.id,
      clientId: booking.clientId,
      workerId: booking.workerId,
      amount: booking.totalAmount
    };

    confirmPaymentMutation.mutate(paymentData);
  };

  const platformFee = booking ? (booking.totalAmount * 0.05).toFixed(2) : '0.00';
  const workerAmount = booking ? (booking.totalAmount - parseFloat(platformFee)).toFixed(2) : '0.00';

  if (!match) {
    navigate('/dashboard');
    return null;
  }

  if (bookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading payment details...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Booking Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The booking you're trying to pay for could not be found.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Complete Payment</h1>
          <p className="text-muted-foreground">Secure payment powered by mock Stripe</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <Label className="text-base font-medium">Choose Payment Method</Label>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <CreditCard className="h-6 w-6 mb-1" />
                      <span className="text-sm">Card</span>
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('upi')}
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <Smartphone className="h-6 w-6 mb-1" />
                      <span className="text-sm">UPI</span>
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'netbanking' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('netbanking')}
                      className="h-16 flex flex-col items-center justify-center"
                    >
                      <Building2 className="h-6 w-6 mb-1" />
                      <span className="text-sm">Net Banking</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                        maxLength={19}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use 4242424242424242 for testing
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expiryMonth">Month</Label>
                        <Select value={cardDetails.expiryMonth} onValueChange={(value) => setCardDetails(prev => ({ ...prev, expiryMonth: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="expiryYear">Year</Label>
                        <Select value={cardDetails.expiryYear} onValueChange={(value) => setCardDetails(prev => ({ ...prev, expiryYear: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="YYYY" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="holderName">Cardholder Name</Label>
                      <Input
                        id="holderName"
                        placeholder="John Doe"
                        value={cardDetails.holderName}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, holderName: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === 'upi' && (
                  <div>
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use test@mockupi for testing
                    </p>
                  </div>
                )}

                {/* Net Banking Form */}
                {paymentMethod === 'netbanking' && (
                  <div>
                    <Label htmlFor="bank">Select Your Bank</Label>
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sbi">State Bank of India</SelectItem>
                        <SelectItem value="hdfc">HDFC Bank</SelectItem>
                        <SelectItem value="icici">ICICI Bank</SelectItem>
                        <SelectItem value="axis">Axis Bank</SelectItem>
                        <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                        <SelectItem value="pnb">Punjab National Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <Button 
                  onClick={handlePayment} 
                  className="w-full h-12 text-lg"
                  disabled={isProcessing || !paymentIntent}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Pay ₹{booking.totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>🔒 Your payment information is secure and encrypted</p>
                  <p className="mt-1">This is a mock payment for development purposes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{booking.serviceName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Worker: {booking.workerName}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {booking.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service Amount</span>
                    <span>₹{booking.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee (5%)</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Worker Receives</span>
                    <span>₹{workerAmount}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{booking.totalAmount.toFixed(2)}</span>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-sm mb-1">Payment Protection</h5>
                  <p className="text-xs text-muted-foreground">
                    Your payment is protected. Money will only be released to the worker after service completion.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}