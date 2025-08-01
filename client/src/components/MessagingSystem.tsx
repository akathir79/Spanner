import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Search, MessageSquare, Users, Clock, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { User, Message } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface MessageWithUser extends Message {
  sender?: User;
  receiver?: User;
}

interface ConversationUser {
  id: string;
  name: string;
  mobile: string;
  role: string;
  profilePicture?: string;
  lastMessage?: Message;
  unreadCount?: number;
}

interface MessagingSystemProps {
  initialUserId?: string;
  onUserSelect?: (user: ConversationUser) => void;
}

export function MessagingSystem({ initialUserId, onUserSelect }: MessagingSystemProps = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<ConversationUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");

  // Get all users for messaging
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.id,
  });

  // Get messages for current user
  const { data: userMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/${user?.id}`, { type: activeTab === 'sent' ? 'sent' : 'received' }],
    enabled: !!user?.id,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Get conversation between selected users
  const { data: conversation = [] } = useQuery<Message[]>({
    queryKey: [`/api/messages/conversation/${user?.id}/${selectedUser?.id}`],
    enabled: !!user?.id && !!selectedUser?.id,
    refetchInterval: 3000, // Poll every 3 seconds for conversation updates
  });

  // Get unread message count
  const { data: unreadData } = useQuery<{count: number}>({
    queryKey: [`/api/messages/${user?.id}/unread-count`],
    enabled: !!user?.id,
    refetchInterval: 10000, // Poll every 10 seconds for unread count
  });

  const unreadCount = unreadData?.count || 0;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: {
      senderId: string;
      receiverId: string;
      subject: string;
      content: string;
      messageType?: string;
    }) => apiRequest('/api/messages', 'POST', messageData),
    onSuccess: () => {
      setMessageText("");
      // Invalidate all message-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/conversation/${user?.id}/${selectedUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}/unread-count`] });
    },
  });

  // Effect to handle initial user selection
  useEffect(() => {
    if (initialUserId && allUsers.length > 0) {
      const targetUser = allUsers.find((u: User) => u.id === initialUserId);
      if (targetUser && (targetUser.role === 'client' || targetUser.role === 'worker')) {
        const fullName = `${targetUser.firstName} ${targetUser.lastName}`.trim() || targetUser.mobile;
        const conversationUser: ConversationUser = {
          id: targetUser.id,
          name: fullName,
          mobile: targetUser.mobile,
          role: targetUser.role,
          profilePicture: targetUser.profilePicture || undefined,
        };
        setSelectedUser(conversationUser);
        if (onUserSelect) {
          onUserSelect(conversationUser);
        }
      }
    }
  }, [initialUserId, allUsers, onUserSelect]);

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => apiRequest(`/api/messages/${messageId}/read`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}/unread-count`] });
    },
  });

  // Process conversation users from messages and all users
  const conversationUsers: ConversationUser[] = allUsers
    .filter((u: User) => u.id !== user?.id && (u.role === 'client' || u.role === 'worker'))
    .map((u: User) => {
      const fullName = `${u.firstName} ${u.lastName}`.trim() || u.mobile;
      const lastMessage = userMessages.find((m: Message) => 
        m.senderId === u.id || m.receiverId === u.id
      );
      const userUnreadCount = userMessages.filter((m: Message) => 
        m.senderId === u.id && !m.isRead
      ).length;

      return {
        id: u.id,
        name: fullName,
        mobile: u.mobile,
        role: u.role,
        profilePicture: u.profilePicture || undefined,
        lastMessage,
        unreadCount: userUnreadCount,
      };
    })
    .filter((u: ConversationUser) => 
      searchQuery === "" || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobile.includes(searchQuery)
    )
    .sort((a: ConversationUser, b: ConversationUser) => {
      // Sort by last message time, then by unread count
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUser || !user) return;

    sendMessageMutation.mutate({
      senderId: user.id,
      receiverId: selectedUser.id,
      subject: `Message to ${selectedUser.name}`,
      content: messageText.trim(),
      messageType: 'text',
    });
  };

  const handleSelectUser = (conversationUser: ConversationUser) => {
    setSelectedUser(conversationUser);
    
    // Mark messages from this user as read
    const unreadMessages = userMessages.filter((m: Message) => 
      m.senderId === conversationUser.id && !m.isRead
    );
    
    unreadMessages.forEach((message: Message) => {
      markAsReadMutation.mutate(message.id);
    });
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Access denied. Admin privileges required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{userMessages.length}</p>
                <p className="text-sm text-gray-600">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{conversationUsers.length}</p>
                <p className="text-sm text-gray-600">Active Conversations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-gray-600">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main messaging interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Conversations
            </CardTitle>
            <CardDescription>
              Message clients and workers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* User list */}
            <ScrollArea className="h-96">
              <div className="p-2 space-y-1">
                {conversationUsers.map((conversationUser) => (
                  <div
                    key={conversationUser.id}
                    onClick={() => handleSelectUser(conversationUser)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === conversationUser.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversationUser.profilePicture} />
                        <AvatarFallback>
                          {conversationUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversationUser.name}
                          </p>
                          {(conversationUser.unreadCount || 0) > 0 && (
                            <Badge variant="destructive" className="h-5 text-xs">
                              {conversationUser.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {conversationUser.role}
                          </Badge>
                          {conversationUser.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(conversationUser.lastMessage.createdAt), 'MMM d')}
                            </span>
                          )}
                        </div>
                        
                        {conversationUser.lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conversationUser.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {conversationUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations found</p>
                    {searchQuery && (
                      <p className="text-sm">Try adjusting your search</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2">
          {selectedUser ? (
            <>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.profilePicture} />
                    <AvatarFallback>
                      {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline">{selectedUser.role}</Badge>
                      <span>{selectedUser.mobile}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-4">
                    {conversation.map((message: Message) => {
                      const isFromUser = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isFromUser
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-between mt-2 text-xs ${
                              isFromUser ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>
                                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                              </span>
                              {isFromUser && (
                                <CheckCheck className={`h-3 w-3 ${
                                  message.isRead ? 'text-blue-200' : 'text-blue-300'
                                }`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {conversation.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Message input */}
                <div className="p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-6">
              <div className="text-center text-gray-500 py-12">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a user from the left to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}