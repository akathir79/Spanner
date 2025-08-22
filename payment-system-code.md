# SPANNER Payment System Code Overview

## Key Files for Payment Detection & Processing

### 1. Payment Status Hook (client/src/hooks/usePaymentStatus.ts)
```typescript
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
  // ... rest of hook implementation
}
```

### 2. Payment Status Check API (server/wallet-routes.ts)
```typescript
// Check payment status endpoint for polling
app.get('/api/wallet/payment-status/:orderId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    console.log('Checking payment status for order:', orderId);

    // Get payment order from database
    const paymentOrder = await storage.getPaymentOrderByRazorpayId(orderId);
    if (!paymentOrder) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment order not found' 
      });
    }

    // If already processed, return success
    if (paymentOrder.status === 'paid') {
      return res.json({
        success: true,
        status: 'paid',
        message: 'Payment already processed',
        paymentOrder
      });
    }

    // Check with Razorpay API
    try {
      const razorpayOrder = await RazorpayService.getOrderStatus(orderId);
      console.log('Razorpay order status:', razorpayOrder);

      if (razorpayOrder.status === 'paid') {
        // Find the payment details
        const payments = await RazorpayService.getPaymentsForOrder(orderId);
        console.log('Payments for order:', payments);

        if (payments && payments.items && payments.items.length > 0) {
          const successfulPayment = payments.items.find(p => p.status === 'captured');
          if (successfulPayment) {
            // Process the payment
            const result = await RazorpayService.processSuccessfulPayment(
              orderId,
              successfulPayment.id,
              successfulPayment.method || 'unknown'
            );

            return res.json({
              success: true,
              status: 'paid',
              message: 'Payment processed successfully',
              transaction: result.walletTransaction,
              newBalance: result.newBalance
            });
          }
        }
      }

      // Payment still pending
      res.json({
        success: true,
        status: razorpayOrder.status || 'created',
        message: 'Payment pending'
      });
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      res.json({
        success: true,
        status: 'pending',
        message: 'Checking payment status...'
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check payment status' 
    });
  }
});
```

### 3. Razorpay Service Methods (server/razorpay-service.ts)
```typescript
static async getOrderStatus(orderId: string) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    console.log('Fetched order status:', order);
    return order;
  } catch (error) {
    console.error('Error fetching order status:', error);
    throw error;
  }
}

static async getPaymentsForOrder(orderId: string) {
  try {
    const payments = await razorpay.orders.fetchPayments(orderId);
    console.log('Fetched payments for order:', payments);
    return payments;
  } catch (error) {
    console.error('Error fetching payments for order:', error);
    throw error;
  }
}

static async processSuccessfulPayment(
  orderId: string, 
  paymentId: string, 
  paymentMethod: string
) {
  try {
    console.log('Processing successful payment for order:', orderId);
    
    // Update payment order status
    const paymentOrder = await storage.updatePaymentOrderStatus(orderId, {
      status: 'paid',
      paymentId,
      paymentMethod,
      paidAt: new Date(),
    });

    if (!paymentOrder) {
      throw new Error('Payment order not found');
    }

    console.log('Found payment order:', paymentOrder);

    // Add amount to user wallet using existing method
    const walletTransaction = await storage.addToWallet(
      paymentOrder.userId,
      parseFloat(paymentOrder.amount),
      'wallet_topup',
      'Wallet top-up via ' + paymentMethod,
      {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        payment_method: paymentMethod,
      }
    );

    console.log('Wallet transaction created:', walletTransaction);

    return {
      newBalance: walletTransaction.balanceAfter,
      walletTransaction,
      paymentOrder
    };
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw new Error('Failed to process payment');
  }
}
```

## Current Payment Flow Status:

**✅ Working:** 
- Order creation (`order_R8L4N3YYlgFTPM` created successfully)
- Status polling (every 3 seconds)
- Status tracking (created → attempted)

**🔄 Currently:** 
- Order status: `attempted` (means payment was initiated)
- System waiting for payment completion

**📍 Next Step:**
The system will automatically detect when the payment status changes to `paid` and will:
1. Fetch payment details from Razorpay
2. Process successful payment
3. Credit wallet with real money
4. Show success notification

## Test Status:
Your current order `order_R8L4N3YYlgFTPM` for ₹10 is being actively monitored. Complete the payment and the system will detect it automatically!