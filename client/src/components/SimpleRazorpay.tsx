import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SimpleRazorpay() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create order
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      const { order, key } = await response.json();

      // Configure Razorpay options
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: 'SPANNER',
        description: 'Test Payment',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.status === 'success') {
              toast({
                title: "Payment Successful",
                description: "Your payment has been processed successfully!",
              });
              setAmount('');
            } else {
              toast({
                title: "Payment Failed",
                description: "Payment verification failed",
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Verification Error",
              description: "Error verifying payment",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#2563eb'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Simple Razorpay Payment</CardTitle>
        <CardDescription>Test payment integration following GitHub pattern</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-2">
            Amount (₹)
          </label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-testid="input-amount"
          />
        </div>
        <Button 
          onClick={handlePayment} 
          disabled={loading || !amount}
          className="w-full"
          data-testid="button-pay"
        >
          {loading ? 'Processing...' : `Pay ₹${amount || '0'}`}
        </Button>
      </CardContent>
    </Card>
  );
}