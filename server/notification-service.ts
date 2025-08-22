import { storage } from './storage';

export interface NotificationData {
  userId: string;
  type: 'payment_success' | 'payment_failed' | 'low_balance' | 'large_transaction' | 'weekly_summary';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  // In production, you would integrate with:
  // - Firebase Cloud Messaging for mobile push notifications
  // - Email service like SendGrid or AWS SES
  // - SMS service like Twilio
  // - WhatsApp Business API

  static async sendPaymentSuccessNotification(userId: string, amount: string, paymentId: string) {
    const notification: NotificationData = {
      userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `₹${amount} has been added to your wallet successfully`,
      data: { 
        amount, 
        paymentId,
        timestamp: new Date().toISOString()
      }
    };

    await this.storeNotification(notification);
    
    // Here you would send actual notifications:
    // await this.sendPushNotification(notification);
    // await this.sendEmail(notification);
    // await this.sendSMS(notification);
    
    console.log(`💰 Payment Success: User ${userId} topped up ₹${amount}`);
  }

  static async sendPaymentFailedNotification(userId: string, amount: string, reason: string) {
    const notification: NotificationData = {
      userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment of ₹${amount} could not be processed. ${reason}`,
      data: { 
        amount, 
        reason,
        timestamp: new Date().toISOString()
      }
    };

    await this.storeNotification(notification);
    console.log(`❌ Payment Failed: User ${userId} payment of ₹${amount} failed - ${reason}`);
  }

  static async sendLowBalanceAlert(userId: string, currentBalance: string) {
    const balanceAmount = parseFloat(currentBalance);
    
    // Only send if balance is below ₹100
    if (balanceAmount < 100) {
      const notification: NotificationData = {
        userId,
        type: 'low_balance',
        title: 'Low Wallet Balance',
        message: `Your wallet balance is ₹${currentBalance}. Consider topping up to avoid service interruptions.`,
        data: { 
          currentBalance,
          timestamp: new Date().toISOString()
        }
      };

      await this.storeNotification(notification);
      console.log(`⚠️ Low Balance Alert: User ${userId} has ₹${currentBalance}`);
    }
  }

  static async sendLargeTransactionAlert(userId: string, amount: string, type: 'credit' | 'debit') {
    const transactionAmount = parseFloat(amount);
    
    // Alert for transactions over ₹5000
    if (transactionAmount > 5000) {
      const notification: NotificationData = {
        userId,
        type: 'large_transaction',
        title: 'Large Transaction Alert',
        message: `${type === 'credit' ? 'Received' : 'Spent'} ₹${amount} in your wallet`,
        data: { 
          amount,
          type,
          timestamp: new Date().toISOString()
        }
      };

      await this.storeNotification(notification);
      console.log(`🚨 Large Transaction: User ${userId} ${type} ₹${amount}`);
    }
  }

  static async sendWeeklySummary(userId: string) {
    try {
      // Get last week's transactions
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const transactions = await storage.getWalletTransactionsByDateRange(
        userId, 
        startDate.toISOString(), 
        endDate.toISOString()
      );

      let totalSpent = 0;
      let totalEarned = 0;
      let transactionCount = transactions.length;

      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'credit') {
          totalEarned += amount;
        } else {
          totalSpent += amount;
        }
      });

      if (transactionCount > 0) {
        const notification: NotificationData = {
          userId,
          type: 'weekly_summary',
          title: 'Weekly Wallet Summary',
          message: `This week: ${transactionCount} transactions, ₹${totalEarned.toFixed(2)} earned, ₹${totalSpent.toFixed(2)} spent`,
          data: {
            transactionCount,
            totalEarned: totalEarned.toFixed(2),
            totalSpent: totalSpent.toFixed(2),
            weekStart: startDate.toISOString(),
            weekEnd: endDate.toISOString()
          }
        };

        await this.storeNotification(notification);
        console.log(`📊 Weekly Summary: User ${userId} - ${transactionCount} transactions`);
      }
    } catch (error) {
      console.error('Error generating weekly summary:', error);
    }
  }

  private static async storeNotification(notification: NotificationData) {
    try {
      // Store notification in database for user to view later
      await storage.createNotification({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: JSON.stringify(notification.data || {}),
        read: false
      });
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limit: number = 20) {
    try {
      return await storage.getUserNotifications(userId, limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string) {
    try {
      await storage.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}