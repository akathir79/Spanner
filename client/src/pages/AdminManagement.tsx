import React from "react";
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, Smartphone, Mail, Calendar, Shield, Crown, Phone, MessageCircle, Send, MessageSquareText } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

// Helper function to get activity status
function getActivityStatus(lastLoginAt?: string, createdAt?: string) {
  if (!lastLoginAt) {
    if (createdAt) {
      const created = new Date(createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation < 24) {
        return {
          label: "Just Created",
          variant: "outline" as const,
          icon: <Calendar className="w-3 h-3" />,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        };
      }
    }
    return {
      label: "Never Logged In",
      variant: "secondary" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
    };
  }

  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLogin > 15) {
    return {
      label: "Inactive",
      variant: "destructive" as const,
      icon: <XCircle className="w-3 h-3" />,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
  }

  return {
    label: "Active",
    variant: "default" as const,
    icon: <CheckCircle className="w-3 h-3" />,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  };
}

export default function AdminManagement() {
  const { toast } = useToast();

  // Action handlers
  const handleViewDetails = (admin: any) => {
    console.log("View admin details:", admin);
    // Implement view details logic
  };

  const handleSendMessage = (admin: any) => {
    console.log("Send message to admin:", admin);
    // Implement send message logic
  };

  const handleSendWhatsApp = (admin: any) => {
    const phoneNumber = admin.mobile?.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleSendSMS = (admin: any) => {
    const phoneNumber = admin.mobile?.replace(/\D/g, '');
    if (phoneNumber) {
      window.location.href = `sms:+91${phoneNumber}`;
    }
  };

  const handleSendEmail = (admin: any) => {
    if (admin.email) {
      window.location.href = `mailto:${admin.email}`;
    }
  };

  // Helper function to format Indian date/time
  const formatIndianDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get member since text
  const getMemberSince = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "today";
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  };

  const handlePromoteToSuperAdmin = (admin: any) => {
    console.log("Promote to super admin:", admin);
    toast({
      title: "Admin Promoted",
      description: `${admin.firstName} ${admin.lastName} has been promoted to Super Admin.`,
    });
  };

  const handleDemoteAdmin = (admin: any) => {
    console.log("Demote admin:", admin);
    toast({
      title: "Admin Demoted",
      description: `${admin.firstName} ${admin.lastName} has been demoted.`,
    });
  };

  const handleSuspendAdmin = (admin: any) => {
    console.log("Suspend admin:", admin);
    toast({
      title: "Admin Suspended",
      description: `${admin.firstName} ${admin.lastName} has been suspended.`,
    });
  };

  const handleDeleteAdmin = (admin: any) => {
    console.log("Delete admin:", admin);
    toast({
      title: "Admin Deleted",
      description: `${admin.firstName} ${admin.lastName} has been deleted.`,
    });
  };

  const handleEditAdmin = (admin: any) => {
    console.log("Edit admin:", admin);
    // Implement edit admin logic
  };

  const config = {
    // Page Configuration
    title: "Admin Management",
    backUrl: "/admin",
    totalListLabel: "Total Admin List",
    totalListBadgeColor: "bg-purple-500 hover:bg-purple-600",
    
    // API Configuration
    fetchUrl: "/api/admin/admins",
    itemRole: undefined, // Show both admin and super_admin
    
    // Display Configuration
    itemDisplayName: (admin: any) => `${admin.firstName} ${admin.lastName}`,
    itemDescription: (admin: any) => admin.email || "No email provided",
    getItemCountForState: (state: string, admins: any[]) => 
      admins.filter(a => a.state === state && (a.role === "admin" || a.role === "super_admin")).length,
    getItemCountForDistrict: (district: string, admins: any[]) => 
      admins.filter(a => a.district === district && (a.role === "admin" || a.role === "super_admin")).length,
    
    // Search Configuration
    searchPlaceholder: "Search admins...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "id", label: "Admin ID" },
      { value: "name", label: "Name" },
      { value: "email", label: "Email" },
      { value: "mobile", label: "Mobile" },
      { value: "location", label: "Location" }
    ],
    statusFilters: [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "no_login", label: "Never Logged In" },
      { value: "just_registered", label: "Just Created" },
      { value: "verified", label: "Verified" },
      { value: "unverified", label: "Unverified" }
    ],
    
    // Table Configuration
    tableColumns: [
      {
        key: "admin",
        label: "User",
        render: (admin: any) => {
          const activityStatus = getActivityStatus(admin.lastLoginAt, admin.createdAt);
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-start gap-3 cursor-pointer">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage 
                      src={admin.profilePicture} 
                      alt={`${admin.firstName} ${admin.lastName}`} 
                    />
                    <AvatarFallback className="bg-purple-100 text-purple-600 font-semibold">
                      {admin.firstName?.charAt(0).toUpperCase()}{admin.lastName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {admin.firstName} {admin.lastName}
                      </div>
                      {admin.role === "super_admin" && (
                        <Crown className="w-4 h-4 text-yellow-500" title="Super Admin" />
                      )}
                      {admin.role === "admin" && (
                        <Shield className="w-4 h-4 text-blue-500" title="Admin" />
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-green-800 dark:text-green-400 font-mono font-bold truncate">
                          ID: {admin.id}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono">{admin.id}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="mt-1 space-y-1">
                      <Badge 
                        variant={activityStatus.variant}
                        className={activityStatus.className}
                      >
                        {activityStatus.icon}
                        <span className="ml-1">{activityStatus.label}</span>
                      </Badge>
                      {admin.lastLoginAt ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Last: {formatIndianDateTime(admin.lastLoginAt)}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                          Never logged in
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Reg: {formatIndianDateTime(admin.createdAt)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Member since {getMemberSince(admin.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-2">
                  <p className="font-medium">Complete Administrator Information:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{admin.mobile}</span>
                    </div>
                    {admin.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span>{admin.email}</span>
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="font-medium text-xs">Role & Permissions:</p>
                      <p className="text-xs mt-1">
                        {admin.role === "super_admin" ? "Super Administrator - Full platform access" : "Administrator - Regional management"}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsApp(admin);
                          }}
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSMS(admin);
                          }}
                          title="SMS"
                        >
                          <MessageSquareText className="w-3 h-3" />
                        </Button>
                        {admin.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendEmail(admin);
                            }}
                            title="Email"
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMessage(admin);
                          }}
                          title="Send Message"
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:+91${admin.mobile}`;
                          }}
                          title="Call Phone"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
      },
      {
        key: "role",
        label: "Role",
        render: (admin: any) => (
          <Badge
            variant={admin.role === "super_admin" ? "default" : "secondary"}
            className={admin.role === "super_admin" 
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" 
              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
            }
          >
            {admin.role === "super_admin" ? "Super Admin" : "Admin"}
          </Badge>
        )
      },
      {
        key: "contact",
        label: "Contact",
        render: (admin: any) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-sm space-y-1 cursor-pointer">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Phone className="w-3 h-3" />
                  <span>{admin.mobile}</span>
                  {admin.mobile && (
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWhatsApp(admin);
                        }}
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendSMS(admin);
                        }}
                        title="SMS"
                      >
                        <MessageSquareText className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:+91${admin.mobile}`;
                        }}
                        title="Call Phone"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {admin.email && (
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{admin.email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendEmail(admin);
                      }}
                      title="Email"
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p className="font-medium">Complete Contact Information:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>{admin.mobile}</span>
                  </div>
                  {admin.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span>{admin.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendWhatsApp(admin);
                      }}
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendSMS(admin);
                      }}
                      title="SMS"
                    >
                      <MessageSquareText className="w-3 h-3" />
                    </Button>
                    {admin.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendEmail(admin);
                        }}
                        title="Email"
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendMessage(admin);
                      }}
                      title="Send Message"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:+91${admin.mobile}`;
                      }}
                      title="Call Phone"
                    >
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      },
      {
        key: "location",
        label: "Location",
        render: (admin: any) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {admin.district || "Not specified"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {admin.state || "Not specified"}
            </div>
          </div>
        )
      },
      {
        key: "status",
        label: "Status",
        render: (admin: any) => {
          const activityStatus = getActivityStatus(admin.lastLoginAt, admin.createdAt);
          return (
            <div className="space-y-1">
              <Badge
                variant={activityStatus.variant}
                className={`${activityStatus.className} text-xs`}
              >
                {activityStatus.icon}
                <span className="ml-1">{activityStatus.label}</span>
              </Badge>
              <div>
                <Badge
                  variant={admin.isVerified ? "default" : "secondary"}
                  className={admin.isVerified 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs" 
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs"
                  }
                >
                  {admin.isVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>
          );
        }
      },
      {
        key: "created",
        label: "Created",
        render: (admin: any) => {
          const creationDate = new Date(admin.createdAt);
          return (
            <div className="text-sm">
              <div className="text-gray-900 dark:text-white">
                {creationDate.toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {creationDate.toLocaleTimeString()}
              </div>
            </div>
          );
        }
      }
    ],
    
    // Actions Configuration
    actions: [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        onClick: handleViewDetails,
        tooltip: "View admin details"
      },
      {
        label: "Send Message",
        icon: <MessageSquare className="w-4 h-4" />,
        onClick: handleSendMessage,
        color: "blue",
        tooltip: "Send direct message",
        subActions: [
          {
            label: "Message",
            icon: <MessageCircle className="w-4 h-4" />,
            onClick: handleSendMessage,
            tooltip: "Send direct message"
          },
          {
            label: "SMS", 
            icon: <MessageSquareText className="w-4 h-4" />,
            onClick: handleSendSMS,
            tooltip: "Send SMS"
          },
          {
            label: "WhatsApp",
            icon: <FaWhatsapp className="w-4 h-4 text-green-600" />,
            onClick: handleSendWhatsApp,
            tooltip: "Send WhatsApp message"
          },
          {
            label: "Email",
            icon: <Mail className="w-4 h-4" />,
            onClick: handleSendEmail,
            tooltip: "Send email"
          }
        ]
      },
      {
        label: "Edit",
        icon: <Edit className="w-4 h-4" />,
        onClick: handleEditAdmin,
        color: "blue",
        tooltip: "Edit admin details"
      },
      {
        label: "Promote to Super Admin",
        icon: <Crown className="w-4 h-4" />,
        onClick: handlePromoteToSuperAdmin,
        color: "yellow",
        tooltip: "Promote to Super Admin"
      },
      {
        label: "Demote",
        icon: <Shield className="w-4 h-4" />,
        onClick: handleDemoteAdmin,
        color: "orange",
        tooltip: "Demote admin"
      },
      {
        label: "Suspend",
        icon: <XCircle className="w-4 h-4" />,
        onClick: handleSuspendAdmin,
        color: "orange",
        tooltip: "Suspend admin"
      },
      {
        label: "Delete",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleDeleteAdmin,
        color: "red",
        tooltip: "Delete admin"
      }
    ],
    
    // Permissions
    requiredRoles: ["super_admin"], // Only super admins can manage other admins
    
    // Styling
    stateItemBadgeColor: "bg-purple-500",
    loadingText: "Loading admin data...",
    emptyStateText: "No administrators found",
    emptyStateIcon: <Shield className="w-8 h-8 text-gray-400" />
  };

  return <StateBasedManagementTemplate config={config} />;
}