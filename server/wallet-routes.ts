import type { Express, Request, Response } from 'express';
import { RazorpayService } from './razorpay-service';
import { storage } from './storage';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  };
}

export function registerWalletRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Get user wallet balance and details
  app.get('/api/wallet', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      let wallet = await storage.getUserWallet(userId);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await storage.createUserWallet({ userId });
      }

      const recentTransactions = await storage.getWalletTransactionsByUser(userId, 10);
      
      res.json({
        wallet,
        recentTransactions,
        paymentMethods: await RazorpayService.getPaymentMethods(),
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ error: 'Failed to fetch wallet details' });
    }
  });

  // Get wallet transaction history
  app.get('/api/wallet/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const transactions = await storage.getWalletTransactionsByUser(userId, limit);
      
      res.json({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  });

  // Create payment order for wallet topup
  app.post('/api/wallet/topup', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount. Amount must be greater than 0' });
      }

      if (amount < 10) {
        return res.status(400).json({ error: 'Minimum topup amount is ₹10' });
      }

      if (amount > 50000) {
        return res.status(400).json({ error: 'Maximum topup amount is ₹50,000' });
      }

      const orderData = await RazorpayService.createOrder(userId, {
        amount: parseFloat(amount),
        receipt: `topup_${userId}_${Date.now()}`,
        notes: {
          user_id: userId,
          purpose: 'wallet_topup',
          amount: amount.toString(),
        },
      });

      res.json({
        success: true,
        order: orderData,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error('Error creating topup order:', error);
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  });

  // Verify payment and add to wallet
  app.post('/api/wallet/verify-payment', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification details' });
      }

      // Verify payment signature
      const verification = await RazorpayService.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!verification.isValid) {
        return res.status(400).json({ 
          error: 'Payment verification failed',
          details: verification.error 
        });
      }

      // Process successful payment
      const result = await RazorpayService.processSuccessfulPayment(
        razorpay_order_id,
        razorpay_payment_id,
        verification.payment?.method || 'unknown'
      );

      res.json({
        success: true,
        message: 'Payment verified and wallet topped up successfully',
        newBalance: result.newBalance,
        transaction: result.walletTransaction,
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  });

  // Handle payment failure
  app.post('/api/wallet/payment-failed', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { razorpay_order_id, error_description } = req.body;

      if (!razorpay_order_id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      await RazorpayService.handleFailedPayment(
        razorpay_order_id,
        error_description || 'Payment failed'
      );

      res.json({ success: true, message: 'Payment failure recorded' });
    } catch (error) {
      console.error('Error handling payment failure:', error);
      res.status(500).json({ error: 'Failed to handle payment failure' });
    }
  });

  // Get payment order status
  app.get('/api/wallet/order/:orderId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id;

      const paymentOrder = await storage.getPaymentOrderByRazorpayId(orderId);
      
      if (!paymentOrder) {
        return res.status(404).json({ error: 'Payment order not found' });
      }

      if (paymentOrder.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access to payment order' });
      }

      res.json({ order: paymentOrder });
    } catch (error) {
      console.error('Error fetching payment order:', error);
      res.status(500).json({ error: 'Failed to fetch payment order' });
    }
  });
}