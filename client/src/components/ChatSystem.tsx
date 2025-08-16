import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Archive,
  Star,
  MoreHorizontal,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import ChatNotificationPreferences from '@/components/ChatNotificationPreferences';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: string;
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  senderName: string;
}

interface ChatConversation {
  id: string;
  clientId: string;
  adminId?: string;
  subject?: string;
  status: string;
  priority: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
  adminName?: string;
}

interface ChatSystemProps {
  userId: string;
  userRole: 'client' | 'worker' | 'admin' | 'super_admin';
  userName: string;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ userId, userRole, userName }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatPriority, setNewChatPriority] = useState('normal');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations based on user role
  const { data: conversations = [] } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations', userRole, userId],
    queryFn: async () => {
      const endpoint = userRole === 'client' 
        ? `/api/chat/conversations/client/${userId}`
        : userRole === 'worker'
        ? `/api/chat/conversations/client/${userId}` // Workers can chat with admins like clients
        : userRole === 'admin' || userRole === 'super_admin'
        ? `/api/chat/conversations/admin/${userId}`
        : `/api/chat/conversations`;
      
      const response = await fetch(endpoint);
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/chat/messages/${selectedConversation}`);
      return response.json();
    },
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch unread message count
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/chat/unread', userId],
    refetchInterval: 10000,
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { subject: string; priority: string }) => {
      return await apiRequest('POST', '/api/chat/conversations', {
        clientId: userRole === 'client' || userRole === 'worker' ? userId : '',
        adminId: userRole === 'admin' || userRole === 'super_admin' ? userId : undefined,
        subject: data.subject,
        priority: data.priority,
        status: 'active',
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Chat Started",
        description: "Your conversation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(data.id);
      setIsNewChatOpen(false);
      setNewChatSubject('');
      setNewChatPriority('normal');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { conversationId: string; message: string; recipientId: string }) => {
      return await apiRequest('POST', '/api/chat/messages', {
        conversationId: messageData.conversationId,
        senderId: userId,
        recipientId: messageData.recipientId,
        message: messageData.message,
        messageType: 'text',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest('PUT', `/api/chat/messages/read/${conversationId}/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/unread', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', selectedConversation] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const unreadMessages = messages.filter(msg => !msg.isRead && msg.recipientId === userId);
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate(selectedConversation);
      }
    }
  }, [selectedConversation, messages, userId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const currentConversation = conversations.find(c => c.id === selectedConversation);
    if (!currentConversation) return;

    const recipientId = userRole === 'client' || userRole === 'worker'
      ? currentConversation.adminId || '' 
      : currentConversation.clientId;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      message: newMessage.trim(),
      recipientId,
    });
  };

  const handleCreateConversation = () => {
    if (!newChatSubject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your message",
        variant: "destructive",
      });
      return;
    }

    createConversationMutation.mutate({
      subject: newChatSubject,
      priority: newChatPriority,
    });
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      closed: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300',
      archived: 'bg-slate-100 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400',
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  return (
    <div className="flex h-[600px] bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {userRole === 'client' || userRole === 'worker' ? 'Support Chat' : 'Client Messages'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <ChatNotificationPreferences 
                userId={userId}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
            {unreadCount?.count > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount.count}
              </Badge>
            )}
          </div>
          
          {(userRole === 'client' || userRole === 'worker') && (
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Start New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newChatSubject}
                      onChange={(e) => setNewChatSubject(e.target.value)}
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newChatPriority} onValueChange={setNewChatPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateConversation}
                    disabled={createConversationMutation.isPending}
                    className="w-full"
                  >
                    {createConversationMutation.isPending ? 'Creating...' : 'Start Chat'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userRole === 'client' || userRole === 'worker' ? 'No conversations yet' : 'No client messages'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {conversations.map((conversation) => {
                const hasUnreadMessages = messages.some(
                  msg => msg.conversationId === conversation.id && !msg.isRead && msg.recipientId === userId
                );
                
                return (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedConversation === conversation.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {userRole === 'client' 
                                ? conversation.adminName?.charAt(0) || 'A'
                                : conversation.clientName?.charAt(0) || 'C'
                              }
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                              {userRole === 'client' || userRole === 'worker'
                                ? conversation.adminName || 'Admin'
                                : conversation.clientName || 'Client'
                              }
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {conversation.subject || 'No subject'}
                            </p>
                          </div>
                        </div>
                        {hasUnreadMessages && (
                          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Badge variant="outline" className={`text-xs ${getPriorityBadge(conversation.priority)}`}>
                            {conversation.priority}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getStatusBadge(conversation.status)}`}>
                            {conversation.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400">
                          {conversation.lastMessageAt ? formatTime(conversation.lastMessageAt) : formatTime(conversation.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              {(() => {
                const conversation = conversations.find(c => c.id === selectedConversation);
                return conversation ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {userRole === 'client' 
                            ? conversation.adminName?.charAt(0) || 'A'
                            : conversation.clientName?.charAt(0) || 'C'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {userRole === 'client' 
                            ? conversation.adminName || 'Admin Support'
                            : conversation.clientName || 'Client'
                          }
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {conversation.subject || 'No subject'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityBadge(conversation.priority)}>
                        {conversation.priority}
                      </Badge>
                      <Badge className={getStatusBadge(conversation.status)}>
                        {conversation.status}
                      </Badge>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isFromCurrentUser = message.senderId === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isFromCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          <span className={`text-xs ${isFromCurrentUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        {isFromCurrentUser && (
                          <div className="flex justify-end mt-1">
                            <CheckCircle className={`h-3 w-3 ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[40px] max-h-32 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                {userRole === 'client' ? 'Welcome to Support Chat' : 'Client Messages'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {userRole === 'client' 
                  ? 'Select a conversation or start a new chat to get help from our support team'
                  : 'Select a conversation to view and respond to client messages'
                }
              </p>
              {userRole === 'client' && conversations.length === 0 && (
                <Button onClick={() => setIsNewChatOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your First Chat
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};