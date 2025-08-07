import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Smartphone, MessageCircle, Users, Filter, Send, CheckCircle, XCircle } from "lucide-react";

interface BulkMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  initialChannel?: 'whatsapp' | 'sms' | 'email' | 'in_app';
}

interface UserFilters {
  role?: string;
  district?: string;
  state?: string;
  isVerified?: boolean;
  isActive?: boolean;
  lastLoginDays?: number;
  registrationDays?: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  messageType: string;
  subject?: string;
  content: string;
}

const channelIcons = {
  whatsapp: MessageCircle,
  sms: Smartphone,
  email: Mail,
  in_app: MessageSquare
};

const channelNames = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  in_app: "In-App Message"
};

export function BulkMessageModal({ isOpen, onClose, adminId, initialChannel }: BulkMessageModalProps) {
  const [activeTab, setActiveTab] = useState("compose");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(initialChannel ? [initialChannel] : []);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [userFilters, setUserFilters] = useState<UserFilters>({});
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendingResults, setSendingResults] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch message templates
  const { data: templates = [] } = useQuery({
    queryKey: [`/api/admin/message-templates/${adminId}`],
    enabled: isOpen
  });

  // Preview users mutation
  const previewUsersMutation = useMutation({
    mutationFn: (filters: UserFilters) => apiRequest(`/api/admin/users/filter`, {
      method: "POST",
      body: JSON.stringify(filters)
    }),
    onSuccess: (data) => {
      setPreviewUsers(data);
    }
  });

  // Create campaign and send messages mutation
  const sendBulkMessagesMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create campaign
      const campaign = await apiRequest(`/api/admin/bulk-campaigns`, {
        method: "POST",
        body: JSON.stringify({
          adminId,
          campaignName,
          messageType: selectedChannels.join(","),
          messageSubject,
          messageContent,
          targetFilters: userFilters,
          scheduledFor: new Date(),
          status: 'active'
        })
      });

      // Then send bulk messages
      return await apiRequest(`/api/admin/send-bulk-messages`, {
        method: "POST",
        body: JSON.stringify({
          campaignId: campaign.id,
          messageChannels: selectedChannels,
          userFilters
        })
      });
    },
    onSuccess: (data) => {
      setSendingResults(data);
      setActiveTab("results");
      toast({
        title: "Bulk Messages Sent",
        description: `Successfully sent ${data.successfulDeliveries} messages, ${data.failedDeliveries} failed.`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/bulk-campaigns/${adminId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk messages",
        variant: "destructive"
      });
    }
  });

  const handleChannelToggle = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageSubject(template.subject || "");
    setMessageContent(template.content);
  };

  const handlePreviewUsers = () => {
    previewUsersMutation.mutate(userFilters);
    setActiveTab("preview");
  };

  const handleSendMessages = async () => {
    if (!campaignName.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive"
      });
      return;
    }

    if (selectedChannels.length === 0) {
      toast({
        title: "Error", 
        description: "Select at least one message channel",
        variant: "destructive"
      });
      return;
    }

    if (!messageContent.trim()) {
      toast({
        title: "Error",
        description: "Message content is required",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setSendingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 1000);

    try {
      await sendBulkMessagesMutation.mutateAsync({});
      setSendingProgress(100);
      setTimeout(() => {
        setIsSending(false);
        clearInterval(progressInterval);
      }, 1000);
    } catch (error) {
      setIsSending(false);
      clearInterval(progressInterval);
      setSendingProgress(0);
    }
  };

  const handleClose = () => {
    setActiveTab("compose");
    setSelectedChannels(initialChannel ? [initialChannel] : []);
    setMessageSubject("");
    setMessageContent("");
    setCampaignName("");
    setUserFilters({});
    setPreviewUsers([]);
    setSendingResults(null);
    setSendingProgress(0);
    setIsSending(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Professional Bulk Messaging
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    placeholder="Enter campaign name..."
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message Channels</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(channelNames).map(([key, name]) => {
                      const Icon = channelIcons[key as keyof typeof channelIcons];
                      return (
                        <div
                          key={key}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedChannels.includes(key)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleChannelToggle(key)}
                        >
                          <Checkbox 
                            checked={selectedChannels.includes(key)}
                            onChange={() => handleChannelToggle(key)}
                          />
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Use Template (Optional)</Label>
                  <Select onValueChange={(value) => {
                    const template = templates.find((t: any) => t.id === value);
                    if (template) handleTemplateSelect(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a message template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.messageType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedChannels.includes('email')) && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject..."
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="content">Message Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your message content..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-gray-500">
                    Tip: Use {`{firstName}`}, {`{lastName}`}, or {`{fullName}`} for personalization
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Audience Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User Role</Label>
                    <Select onValueChange={(value) => setUserFilters(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Clients</SelectItem>
                        <SelectItem value="worker">Workers</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <Select onValueChange={(value) => setUserFilters(prev => ({ 
                      ...prev, 
                      isVerified: value === "verified" ? true : value === "unverified" ? false : undefined 
                    }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Activity Status</Label>
                    <Select onValueChange={(value) => setUserFilters(prev => ({ 
                      ...prev, 
                      isActive: value === "active" ? true : value === "inactive" ? false : undefined 
                    }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Login (Days)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 30"
                      onChange={(e) => setUserFilters(prev => ({ 
                        ...prev, 
                        lastLoginDays: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handlePreviewUsers} 
                  className="w-full"
                  disabled={previewUsersMutation.isPending}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {previewUsersMutation.isPending ? "Loading..." : "Preview Audience"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Audience Preview
                  </span>
                  <Badge variant="secondary">
                    {previewUsers.length} users
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewUsers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {previewUsers.slice(0, 10).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email || user.mobile} • {user.role}</p>
                          </div>
                          <Badge variant={user.isVerified ? "default" : "secondary"}>
                            {user.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {previewUsers.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        And {previewUsers.length - 10} more users...
                      </p>
                    )}
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Message Preview:</h4>
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                        {messageSubject && (
                          <p className="font-medium mb-1">Subject: {messageSubject}</p>
                        )}
                        <p className="text-gray-700">{messageContent}</p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSendMessages} 
                      className="w-full"
                      disabled={isSending || sendBulkMessagesMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? "Sending Messages..." : `Send to ${previewUsers.length} Users`}
                    </Button>

                    {isSending && (
                      <div className="space-y-2">
                        <Progress value={sendingProgress} className="w-full" />
                        <p className="text-sm text-center text-gray-600">
                          Sending messages... {Math.round(sendingProgress)}%
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found matching the selected filters.</p>
                    <p className="text-sm">Try adjusting your audience criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {sendingResults ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Campaign Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{sendingResults.totalRecipients}</p>
                      <p className="text-sm text-gray-600">Total Recipients</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{sendingResults.successfulDeliveries}</p>
                      <p className="text-sm text-gray-600">Successful</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{sendingResults.failedDeliveries}</p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Success Rate</h4>
                    <Progress 
                      value={(sendingResults.successfulDeliveries / sendingResults.totalRecipients) * 100} 
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round((sendingResults.successfulDeliveries / sendingResults.totalRecipients) * 100)}% success rate
                    </p>
                  </div>

                  <Button onClick={handleClose} className="w-full">
                    Close
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No campaign results available.</p>
                <p className="text-sm">Send a campaign to see results here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}