import Razorpay from 'razorpay';
import { storage } from './storage';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
  throw new Error('Razorpay credentials not found. Please set RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY');
}

console.log('🔒 Razorpay Live Integration Active - Ready for real payments');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Secret Key (masked):', process.env.RAZORPAY_SECRET_KEY?.substring(0, 4) + '****');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export interface CreateOrderParams {
  amount: number; // Amount in INR (will be converted to paise)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  static async createOrder(userId: string, params: CreateOrderParams) {
    try {
      const orderParams = {
        amount: Math.round(params.amount * 100), // Convert INR to paise
        currency: params.currency || 'INR',
        receipt: params.receipt || `wallet_topup_${Date.now()}`,
        notes: {
          user_id: userId,
          purpose: 'wallet_topup',
          ...params.notes,
        },
      };

      console.log('Creating Razorpay order with params:', orderParams);
      const order = await razorpay.orders.create(orderParams);
      console.log('Razorpay order created successfully:', order);
      
      // Store order in database
      const paymentOrder = await storage.createPaymentOrder({
        userId,
        razorpayOrderId: order.id,
        amount: params.amount.toString(),
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
        metadata: { order_details: JSON.stringify(order) },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
        paymentOrderId: paymentOrder.id,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error.statusCode === 400) {
        throw new Error(`Razorpay Error: ${error.error?.description || 'Invalid request'}`);
      }
      throw new Error(`Payment order creation failed: ${error.message}`);
    }
  }

  static async verifyPayment(verification: PaymentVerification) {
    try {
      const body = verification.razorpay_order_id + '|' + verification.razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
        .update(body.toString())
        .digest('hex');

      const isSignatureValid = expectedSignature === verification.razorpay_signature;
      
      if (!isSignatureValid) {
        throw new Error('Invalid payment signature');
      }

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(verification.razorpay_payment_id);
      
      return {
        isValid: true,
        payment,
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Payment verification failed',
      };
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

  static async handleFailedPayment(orderId: string, reason: string) {
    try {
      await storage.updatePaymentOrderStatus(orderId, {
        status: 'failed',
        failureReason: reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw new Error('Failed to update payment status');
    }
  }

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

  static async createCustomer(userDetails: {
    name: string;
    email?: string;
    contact: string;
  }) {
    try {
      const customer = await razorpay.customers.create({
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.contact,
        notes: {
          created_via: 'spanner_app',
        },
      });

      return customer;
    } catch (error) {
      console.error('Error creating Razorpay customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  static async getPaymentMethods() {
    return {
      upi: {
        name: 'UPI',
        description: 'Pay using GPay, PhonePe, Paytm, or any UPI app',
        icon: 'smartphone',
        popular: true,
      },
      netbanking: {
        name: 'Net Banking',
        description: 'Pay using your bank account',
        icon: 'building',
        popular: true,
      },
      card: {
        name: 'Debit/Credit Card',
        description: 'Visa, Mastercard, RuPay cards',
        icon: 'credit-card',
        popular: false,
      },
      wallet: {
        name: 'Wallets',
        description: 'Paytm, Mobikwik, FreeCharge, etc.',
        icon: 'wallet',
        popular: false,
      },
    };
  }
}