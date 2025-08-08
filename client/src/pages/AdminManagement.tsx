import React from "react";
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, Smartphone, Mail, Calendar, Shield, Crown } from "lucide-react";
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
    fetchUrl: "/api/admin/users",
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
        label: "Administrator",
        render: (admin: any) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={admin.profilePicture} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                {admin.firstName?.[0]}{admin.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {admin.firstName} {admin.lastName}
                </span>
                {admin.role === "super_admin" && (
                  <Crown className="w-4 h-4 text-yellow-500" title="Super Admin" />
                )}
                {admin.role === "admin" && (
                  <Shield className="w-4 h-4 text-blue-500" title="Admin" />
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {admin.id}
              </div>
            </div>
          </div>
        )
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
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Smartphone className="w-3 h-3 text-gray-400" />
              <span>{admin.mobile}</span>
            </div>
            {admin.email && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[150px]">{admin.email}</span>
              </div>
            )}
          </div>
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
        tooltip: "Send message to admin"
      },
      {
        label: "WhatsApp",
        icon: <FaWhatsapp className="w-4 h-4" />,
        onClick: handleSendWhatsApp,
        color: "green",
        tooltip: "Contact via WhatsApp"
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