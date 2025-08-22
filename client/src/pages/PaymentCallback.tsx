import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const razorpay_payment_id = urlParams.get('razorpay_payment_id');
    const razorpay_order_id = urlParams.get('razorpay_order_id');
    const razorpay_signature = urlParams.get('razorpay_signature');

    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      // Verify payment
      verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    } else {
      // Check if payment was successful but params are in hash
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      
      const hashPaymentId = hashParams.get('razorpay_payment_id');
      const hashOrderId = hashParams.get('razorpay_order_id');
      const hashSignature = hashParams.get('razorpay_signature');

      if (hashPaymentId && hashOrderId && hashSignature) {
        verifyPayment(hashOrderId, hashPaymentId, hashSignature);
      } else {
        setStatus('failed');
        setMessage('Payment information not found. Please try again.');
      }
    }
  }, []);

  const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      console.log('Verifying payment from callback:', { orderId, paymentId, signature });
      
      const response = await apiRequest('POST', '/api/wallet/verify-payment', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      const data = await response.json();
      console.log('Payment verification response:', data);

      if (data.success) {
        setStatus('success');
        setMessage(`Payment successful! ₹${data.transaction?.amount || '0'} added to your wallet.`);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          setLocation('/dashboard');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('Failed to verify payment. Please contact support.');
    }
  };

  const goToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Processing Payment</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your payment...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to dashboard in a few seconds...
            </p>
            <Button onClick={goToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {message}
            </p>
            <Button onClick={goToDashboard} variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}