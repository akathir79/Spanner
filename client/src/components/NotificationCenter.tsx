import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, Trash2, Circle, CheckCircle, Clock, DollarSign, User, Briefcase, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  senderId?: string;
}

interface NotificationCenterProps {
  userId: string;
  userRole: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'budget_update':
      return DollarSign;
    case 'bid_response':
    case 'bid_request':
      return Briefcase;
    case 'job_status_change':
      return Clock;
    case 'otp_completion':
      return CheckCircle;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'budget_update':
      return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20';
    case 'bid_response':
    case 'bid_request':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    case 'job_status_change':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    case 'otp_completion':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    default:
      return 'text-slate-600 bg-slate-100 dark:bg-slate-900/20';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', userId],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread', userId],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const unreadCount = unreadCountData?.count || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread', userId] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread', userId] });
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          data-testid="notification-bell"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500 text-white border-white dark:border-slate-900"
              data-testid="notification-badge"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 p-0 shadow-lg border-slate-200 dark:border-slate-700"
        align="end"
        sideOffset={8}
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  No notifications yet
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You'll see updates about your jobs and bids here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClasses = getNotificationColor(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${colorClasses}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                  title="Mark as read"
                                >
                                  <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                title="Delete notification"
                              >
                                <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => setIsOpen(false)}
              >
                Close notifications
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Helper function to create notifications (to be used in other components)
export const createNotification = async (notification: {
  recipientId: string;
  senderId?: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  data?: any;
}) => {
  try {
    await apiRequest('POST', '/api/notifications', notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};