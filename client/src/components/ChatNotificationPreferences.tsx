import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Volume2,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  Moon,
  Sun,
  Settings,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface NotificationPreferences {
  id: string;
  userId: string;
  newMessageNotifications: boolean;
  priorityMessageNotifications: boolean;
  conversationStartedNotifications: boolean;
  adminResponseNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatNotificationPreferencesProps {
  userId: string;
  trigger?: React.ReactNode;
}

export const ChatNotificationPreferences: React.FC<ChatNotificationPreferencesProps> = ({
  userId,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current preferences
  const { data: preferences, isLoading, error } = useQuery<NotificationPreferences>({
    queryKey: ['/api/chat/notification-preferences', userId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/notification-preferences/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: isOpen,
  });

  const [formData, setFormData] = useState<Partial<NotificationPreferences>>({});

  // Initialize form data when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setFormData({
        newMessageNotifications: preferences.newMessageNotifications,
        priorityMessageNotifications: preferences.priorityMessageNotifications,
        conversationStartedNotifications: preferences.conversationStartedNotifications,
        adminResponseNotifications: preferences.adminResponseNotifications,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        soundNotifications: preferences.soundNotifications,
        desktopNotifications: preferences.desktopNotifications,
        notificationFrequency: preferences.notificationFrequency,
        quietHoursEnabled: preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
      });
    }
  }, [preferences]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      return await apiRequest('PUT', `/api/chat/notification-preferences/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/notification-preferences', userId] });
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved successfully.",
      });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  // Reset preferences mutation
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/chat/notification-preferences/${userId}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/notification-preferences', userId] });
      toast({
        title: "Preferences Reset",
        description: "Your notification preferences have been reset to defaults.",
      });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset preferences",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSelectChange = (key: keyof NotificationPreferences, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(formData);
  };

  const handleReset = () => {
    resetPreferencesMutation.mutate();
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      immediate: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      hourly: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      daily: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    };
    return colors[frequency as keyof typeof colors] || colors.immediate;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-1" />
      Notification Settings
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Chat Notification Preferences
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading preferences...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Failed to load preferences</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Message Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Message Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">New Messages</Label>
                    <p className="text-xs text-muted-foreground">Get notified when you receive new messages</p>
                  </div>
                  <Switch
                    checked={formData.newMessageNotifications || false}
                    onCheckedChange={(checked) => handleToggle('newMessageNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Priority Messages</Label>
                    <p className="text-xs text-muted-foreground">Get notified for high-priority conversations</p>
                  </div>
                  <Switch
                    checked={formData.priorityMessageNotifications || false}
                    onCheckedChange={(checked) => handleToggle('priorityMessageNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Conversation Started</Label>
                    <p className="text-xs text-muted-foreground">Get notified when new conversations begin</p>
                  </div>
                  <Switch
                    checked={formData.conversationStartedNotifications || false}
                    onCheckedChange={(checked) => handleToggle('conversationStartedNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Admin Responses</Label>
                    <p className="text-xs text-muted-foreground">Get notified when admins respond to your messages</p>
                  </div>
                  <Switch
                    checked={formData.adminResponseNotifications || false}
                    onCheckedChange={(checked) => handleToggle('adminResponseNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Delivery Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <div>
                      <Label className="text-sm font-medium">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Browser push notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.pushNotifications || false}
                    onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <div>
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.emailNotifications || false}
                    onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-orange-600" />
                    <div>
                      <Label className="text-sm font-medium">Sound Notifications</Label>
                      <p className="text-xs text-muted-foreground">Play sound when notifications arrive</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.soundNotifications || false}
                    onCheckedChange={(checked) => handleToggle('soundNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-600" />
                    <div>
                      <Label className="text-sm font-medium">Desktop Notifications</Label>
                      <p className="text-xs text-muted-foreground">Show desktop notification popups</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.desktopNotifications || false}
                    onCheckedChange={(checked) => handleToggle('desktopNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timing & Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timing & Frequency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Notification Frequency</Label>
                  <Select 
                    value={formData.notificationFrequency || 'immediate'} 
                    onValueChange={(value) => handleSelectChange('notificationFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Summary</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: <Badge className={getFrequencyBadge(formData.notificationFrequency || 'immediate')}>
                      {formData.notificationFrequency || 'immediate'}
                    </Badge>
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-600" />
                      <div>
                        <Label className="text-sm font-medium">Quiet Hours</Label>
                        <p className="text-xs text-muted-foreground">Pause notifications during specified hours</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.quietHoursEnabled || false}
                      onCheckedChange={(checked) => handleToggle('quietHoursEnabled', checked)}
                    />
                  </div>

                  {formData.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Time</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Sun className="h-3 w-3 text-yellow-500" />
                          <Input
                            type="time"
                            value={formData.quietHoursStart || '22:00'}
                            onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(formData.quietHoursStart || '22:00')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End Time</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Moon className="h-3 w-3 text-blue-500" />
                          <Input
                            type="time"
                            value={formData.quietHoursEnd || '08:00'}
                            onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                            className="text-xs"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(formData.quietHoursEnd || '08:00')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={resetPreferencesMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${resetPreferencesMutation.isPending ? 'animate-spin' : ''}`} />
                Reset to Defaults
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updatePreferencesMutation.isPending}
                  className="min-w-[100px]"
                >
                  {updatePreferencesMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Status Indicator */}
            {hasChanges && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-3 w-3" />
                You have unsaved changes
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatNotificationPreferences;