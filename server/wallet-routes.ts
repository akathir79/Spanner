import type { Express, Request, Response } from 'express';
import { RazorpayService } from './razorpay-service';
import { storage } from './storage';
import { NotificationService } from './notification-service';
import { WalletAnalyticsService } from './wallet-analytics';

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
    // For demo purposes, use mock user or try to get from session
    let userId = req.headers['x-user-id'] as string;
    
    // Try to get user from session if available
    if (!userId && req.session && (req.session as any).user) {
      userId = (req.session as any).user.id;
    }
    
    // Use existing worker user for development
    if (!userId) {
      userId = 'TAN-SAL-0001-W';
    }
    
    req.user = { 
      id: userId,
      role: 'worker',
      firstName: 'Test',
      lastName: 'Worker',
      mobile: '9976587001'
    };
    next();
  };

  // Get user wallet balance and details with real-time calculations
  app.get('/api/wallet', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      let wallet = await storage.getUserWallet(userId);
      
      if (!wallet) {
        // Create wallet with zero balance for new workers
        wallet = await storage.createUserWallet({ 
          userId,
          balance: '0.00',
          totalEarned: '0.00',
          totalSpent: '0.00',
          totalToppedUp: '0.00'
        });
      }

      // Calculate real-time earnings from completed jobs
      const realTimeEarnings = await storage.calculateWorkerEarnings(userId);
      const recentTransactions = await storage.getWalletTransactionsByUser(userId, 10);
      
      // Update wallet with real-time data
      const updatedWallet = {
        ...wallet,
        balance: realTimeEarnings.currentBalance,
        totalEarned: realTimeEarnings.totalEarned,
        totalSpent: realTimeEarnings.totalSpent,
        totalToppedUp: realTimeEarnings.totalToppedUp
      };
      
      res.json({
        wallet: updatedWallet,
        recentTransactions,
        earnings: {
          thisMonth: realTimeEarnings.thisMonthEarnings,
          pending: realTimeEarnings.pendingEarnings,
          yearToDate: realTimeEarnings.yearToDateEarnings
        },
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

      console.log('Created Razorpay order:', orderData);
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

      console.log('Payment verification successful, processing payment...');
      
      // Process successful payment
      const result = await RazorpayService.processSuccessfulPayment(
        razorpay_order_id,
        razorpay_payment_id,
        verification.payment?.method || 'unknown'
      );

      console.log('Payment processed successfully:', result);

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

  // Webhook endpoint for Razorpay payment notifications
  app.post('/api/wallet/webhook', async (req: Request, res: Response) => {
    try {
      console.log('Webhook received:', req.body);
      
      const { event, payload } = req.body;
      
      if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        console.log('Payment captured webhook:', payment);
        
        // Process the captured payment
        if (payment.order_id && payment.id) {
          await RazorpayService.processSuccessfulPayment(
            payment.order_id,
            payment.id,
            payment.method || 'unknown'
          );
        }
      }
      
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
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

  // Get wallet analytics
  app.get('/api/wallet/analytics', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const months = parseInt(req.query.months as string) || 6;
      
      const analytics = await WalletAnalyticsService.generateSpendingAnalytics(userId, months);
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching wallet analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Get transaction insights
  app.get('/api/wallet/insights', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      const insights = await WalletAnalyticsService.getTransactionInsights(userId);
      
      res.json(insights);
    } catch (error) {
      console.error('Error fetching transaction insights:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  });

  // Get user notifications
  app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const notifications = await NotificationService.getUserNotifications(userId, limit);
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notificationId = req.params.id;
      
      await NotificationService.markNotificationAsRead(notificationId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Generate weekly summary (can be called manually or scheduled)
  app.post('/api/wallet/weekly-summary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      await NotificationService.sendWeeklySummary(userId);
      
      res.json({ success: true, message: 'Weekly summary generated' });
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      res.status(500).json({ error: 'Failed to generate weekly summary' });
    }
  });

  // Withdraw funds route
  app.post('/api/wallet/withdraw', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { amount, bankDetails } = req.body;

      // Validate withdrawal amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount' });
      }

      if (amount < 100) {
        return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
      }

      // Check wallet balance
      const wallet = await storage.getUserWallet(userId);
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const currentBalance = parseFloat(wallet.balance);
      if (amount > currentBalance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct amount from wallet
      const updatedWallet = await storage.updateWalletBalance(userId, amount, 'debit');
      
      // Create withdrawal transaction record
      await storage.createWalletTransaction({
        userId,
        walletId: wallet.id,
        type: 'debit',
        category: 'withdrawal',
        amount: amount.toString(),
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet?.balance || wallet.balance,
        description: `Withdrawal to bank account ${bankDetails.accountNumber || 'XXXX1234'}`,
        netAmount: amount.toString(),
        status: 'pending', // Withdrawal would be pending until bank transfer completes
        metadata: JSON.stringify({
          bankDetails,
          withdrawalMethod: 'bank_transfer'
        }),
      });

      // Send withdrawal notification
      await NotificationService.sendLargeTransactionAlert(
        userId, 
        amount.toString(), 
        'debit'
      );

      res.json({ 
        success: true, 
        message: 'Withdrawal request submitted successfully',
        wallet: updatedWallet,
        estimatedProcessingTime: '1-3 business days'
      });
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      res.status(500).json({ error: 'Failed to process withdrawal' });
    }
  });
}