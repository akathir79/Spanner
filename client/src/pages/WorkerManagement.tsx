import React from "react";
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, Smartphone, Mail, Calendar, Users } from "lucide-react";
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
          label: "Just Registered",
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

export default function WorkerManagement() {
  const { toast } = useToast();

  // Action handlers
  const handleViewDetails = (worker: any) => {
    console.log("View worker details:", worker);
    // Implement view details logic
  };

  const handleSendMessage = (worker: any) => {
    console.log("Send message to worker:", worker);
    // Implement send message logic
  };

  const handleSendWhatsApp = (worker: any) => {
    const phoneNumber = worker.mobile?.replace(/\D/g, '');
    if (phoneNumber) {
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleVerifyWorker = (worker: any) => {
    console.log("Verify worker:", worker);
    toast({
      title: "Worker Verified",
      description: `${worker.firstName} ${worker.lastName} has been verified.`,
    });
  };

  const handleSuspendWorker = (worker: any) => {
    console.log("Suspend worker:", worker);
    toast({
      title: "Worker Suspended",
      description: `${worker.firstName} ${worker.lastName} has been suspended.`,
    });
  };

  const handleDeleteWorker = (worker: any) => {
    console.log("Delete worker:", worker);
    toast({
      title: "Worker Deleted",
      description: `${worker.firstName} ${worker.lastName} has been deleted.`,
    });
  };

  const handleEditWorker = (worker: any) => {
    console.log("Edit worker:", worker);
    // Implement edit worker logic
  };

  const config = {
    // Page Configuration
    title: "Worker Management",
    backUrl: "/admin",
    totalListLabel: "Total Worker List",
    totalListBadgeColor: "bg-green-500 hover:bg-green-600",
    
    // API Configuration
    fetchUrl: "/api/admin/users",
    itemRole: "worker",
    
    // Display Configuration
    itemDisplayName: (worker: any) => `${worker.firstName} ${worker.lastName}`,
    itemDescription: (worker: any) => worker.email || "No email provided",
    getItemCountForState: (state: string, workers: any[]) => 
      workers.filter(w => w.state === state && w.role === "worker").length,
    getItemCountForDistrict: (district: string, workers: any[]) => 
      workers.filter(w => w.district === district && w.role === "worker").length,
    
    // Search Configuration
    searchPlaceholder: "Search workers...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "id", label: "Worker ID" },
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
      { value: "just_registered", label: "Just Registered" },
      { value: "verified", label: "Verified" },
      { value: "unverified", label: "Unverified" }
    ],
    
    // Table Configuration
    tableColumns: [
      {
        key: "worker",
        label: "Worker",
        render: (worker: any) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={worker.profilePicture} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {worker.firstName?.[0]}{worker.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {worker.firstName} {worker.lastName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ID: {worker.id}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "contact",
        label: "Contact",
        render: (worker: any) => (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Smartphone className="w-3 h-3 text-gray-400" />
              <span>{worker.mobile}</span>
            </div>
            {worker.email && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[150px]">{worker.email}</span>
              </div>
            )}
          </div>
        )
      },
      {
        key: "location",
        label: "Location",
        render: (worker: any) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {worker.district || "Not specified"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {worker.state || "Not specified"}
            </div>
          </div>
        )
      },
      {
        key: "status",
        label: "Status",
        render: (worker: any) => {
          const activityStatus = getActivityStatus(worker.lastLoginAt, worker.createdAt);
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
                  variant={worker.isVerified ? "default" : "secondary"}
                  className={worker.isVerified 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs" 
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs"
                  }
                >
                  {worker.isVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>
          );
        }
      },
      {
        key: "registration",
        label: "Registered",
        render: (worker: any) => {
          const registrationDate = new Date(worker.createdAt);
          return (
            <div className="text-sm">
              <div className="text-gray-900 dark:text-white">
                {registrationDate.toLocaleDateString()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {registrationDate.toLocaleTimeString()}
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
        tooltip: "View worker details"
      },
      {
        label: "Send Message",
        icon: <MessageSquare className="w-4 h-4" />,
        onClick: handleSendMessage,
        color: "blue",
        tooltip: "Send message to worker"
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
        onClick: handleEditWorker,
        color: "blue",
        tooltip: "Edit worker details"
      },
      {
        label: "Verify",
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: handleVerifyWorker,
        color: "green",
        tooltip: "Verify worker"
      },
      {
        label: "Suspend",
        icon: <XCircle className="w-4 h-4" />,
        onClick: handleSuspendWorker,
        color: "orange",
        tooltip: "Suspend worker"
      },
      {
        label: "Delete",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleDeleteWorker,
        color: "red",
        tooltip: "Delete worker"
      }
    ],
    
    // Permissions
    requiredRoles: ["admin", "super_admin"],
    
    // Styling
    stateItemBadgeColor: "bg-green-500",
    loadingText: "Loading worker data...",
    emptyStateText: "No workers found",
    emptyStateIcon: <Users className="w-8 h-8 text-gray-400" />
  };

  return <StateBasedManagementTemplate config={config} />;
}