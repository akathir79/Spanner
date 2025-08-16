// Test notification creation functions for development
import { NotificationService } from './notifications';

export const createTestNotifications = async (userId: string) => {
  console.log('Creating test notifications for user:', userId);
  
  try {
    // Budget update notification
    await NotificationService.notifyBudgetUpdate({
      recipientId: userId,
      senderId: 'test-sender',
      jobId: 'test-job-1',
      oldBudget: 5000,
      newBudget: 7500
    });

    // Job status change notification
    await NotificationService.notifyJobStatusChange({
      recipientId: userId,
      senderId: 'test-sender',
      jobId: 'test-job-2',
      status: 'In Progress',
      jobTitle: 'Plumbing repair at home'
    });

    // New bid notification
    await NotificationService.notifyNewBid({
      recipientId: userId,
      senderId: 'worker-123',
      jobId: 'test-job-3',
      bidAmount: 3500,
      workerName: 'Ramesh Kumar',
      jobTitle: 'Electrical wiring work'
    });

    // OTP completion notification
    await NotificationService.notifyOTPCompletion({
      recipientId: userId,
      senderId: 'worker-456',
      bookingId: 'booking-123',
      jobTitle: 'Painting bedroom',
      workerName: 'Suresh Verma'
    });

    console.log('Test notifications created successfully');
  } catch (error) {
    console.error('Failed to create test notifications:', error);
  }
};