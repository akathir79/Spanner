import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function usePaymentStatus(orderId: string | null, onSuccess: (data: any) => void, onError: (error: string) => void) {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxAttemptsRef = useRef(0);

  const checkPaymentStatus = async (razorpayOrderId: string) => {
    try {
      const response = await apiRequest('GET', `/api/wallet/payment-status/${razorpayOrderId}`);
      const data = await response.json();
      
      console.log('Payment status check:', data);
      
      if (data.success) {
        if (data.status === 'paid') {
          // Payment successful
          setIsPolling(false);
          onSuccess(data);
          return true;
        } else if (data.status === 'failed') {
          // Payment failed
          setIsPolling(false);
          onError('Payment failed');
          return true;
        }
        // Payment still pending, continue polling
        return false;
      } else {
        console.error('Payment status check failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      return false;
    }
  };

  const startPolling = (razorpayOrderId: string) => {
    if (isPolling || !razorpayOrderId) return;
    
    console.log('Starting payment status polling for order:', razorpayOrderId);
    setIsPolling(true);
    maxAttemptsRef.current = 0;

    // Check immediately
    checkPaymentStatus(razorpayOrderId);

    // Then poll every 3 seconds for up to 5 minutes
    intervalRef.current = setInterval(async () => {
      maxAttemptsRef.current += 1;
      
      if (maxAttemptsRef.current >= 100) { // 5 minutes max
        setIsPolling(false);
        onError('Payment verification timeout. Please check your payment status.');
        return;
      }

      const completed = await checkPaymentStatus(razorpayOrderId);
      if (completed && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  useEffect(() => {
    if (orderId) {
      startPolling(orderId);
    }

    return () => {
      stopPolling();
    };
  }, [orderId]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    isPolling,
    startPolling,
    stopPolling
  };
}