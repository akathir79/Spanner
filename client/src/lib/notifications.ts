import { apiRequest } from '@/lib/queryClient';

export type NotificationType = 
  | 'budget_update'
  | 'job_status_change' 
  | 'bid_response'
  | 'bid_request'
  | 'otp_completion'
  | 'job_completion'
  | 'booking_created'
  | 'payment_processed';

export interface CreateNotificationParams {
  recipientId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  data?: any;
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      await apiRequest('POST', '/api/notifications', params);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  // Convenience methods for common notification types
  static async notifyBudgetUpdate(params: {
    recipientId: string;
    senderId: string;
    jobId: string;
    oldBudget: number;
    newBudget: number;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'budget_update',
      title: 'Job Budget Updated',
      message: `Budget changed from ₹${params.oldBudget.toLocaleString('en-IN')} to ₹${params.newBudget.toLocaleString('en-IN')}`,
      relatedId: params.jobId,
      relatedType: 'job_posting',
      data: {
        oldBudget: params.oldBudget,
        newBudget: params.newBudget
      }
    });
  }

  static async notifyJobStatusChange(params: {
    recipientId: string;
    senderId?: string;
    jobId: string;
    status: string;
    jobTitle: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'job_status_change',
      title: 'Job Status Update',
      message: `"${params.jobTitle}" status changed to ${params.status}`,
      relatedId: params.jobId,
      relatedType: 'job_posting',
      data: {
        status: params.status
      }
    });
  }

  static async notifyNewBid(params: {
    recipientId: string;
    senderId: string;
    jobId: string;
    bidAmount: number;
    workerName: string;
    jobTitle: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'bid_request',
      title: 'New Bid Received',
      message: `${params.workerName} bid ₹${params.bidAmount.toLocaleString('en-IN')} for "${params.jobTitle}"`,
      relatedId: params.jobId,
      relatedType: 'job_posting',
      data: {
        bidAmount: params.bidAmount,
        workerName: params.workerName
      }
    });
  }

  static async notifyBidResponse(params: {
    recipientId: string;
    senderId: string;
    jobId: string;
    status: 'accepted' | 'rejected';
    jobTitle: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'bid_response',
      title: `Bid ${params.status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: `Your bid for "${params.jobTitle}" was ${params.status}`,
      relatedId: params.jobId,
      relatedType: 'job_posting',
      data: {
        status: params.status
      }
    });
  }

  static async notifyOTPCompletion(params: {
    recipientId: string;
    senderId: string;
    bookingId: string;
    jobTitle: string;
    workerName: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'otp_completion',
      title: 'Job Completion Confirmed',
      message: `${params.workerName} completed "${params.jobTitle}". Please verify with OTP.`,
      relatedId: params.bookingId,
      relatedType: 'booking',
      data: {
        workerName: params.workerName
      }
    });
  }

  static async notifyJobCompletion(params: {
    recipientId: string;
    senderId: string;
    bookingId: string;
    jobTitle: string;
    clientName: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'job_completion',
      title: 'Job Successfully Completed',
      message: `"${params.jobTitle}" was completed and verified by ${params.clientName}`,
      relatedId: params.bookingId,
      relatedType: 'booking',
      data: {
        clientName: params.clientName
      }
    });
  }

  static async notifyBookingCreated(params: {
    recipientId: string;
    senderId: string;
    bookingId: string;
    jobTitle: string;
    clientName: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'booking_created',
      title: 'New Booking Created',
      message: `${params.clientName} booked you for "${params.jobTitle}"`,
      relatedId: params.bookingId,
      relatedType: 'booking',
      data: {
        clientName: params.clientName
      }
    });
  }

  static async notifyPaymentProcessed(params: {
    recipientId: string;
    senderId?: string;
    bookingId: string;
    amount: number;
    jobTitle: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId: params.recipientId,
      senderId: params.senderId,
      type: 'payment_processed',
      title: 'Payment Processed',
      message: `Payment of ₹${params.amount.toLocaleString('en-IN')} received for "${params.jobTitle}"`,
      relatedId: params.bookingId,
      relatedType: 'booking',
      data: {
        amount: params.amount
      }
    });
  }
}