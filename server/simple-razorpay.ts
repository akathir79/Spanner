import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
  throw new Error('Razorpay credentials not found');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export const createSimpleOrder = async (amount: number, receipt: string) => {
  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY!)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
};

export { razorpay };