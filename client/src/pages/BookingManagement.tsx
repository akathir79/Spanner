import React from "react";
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MessageSquare, CheckCircle, XCircle, Trash2, Edit, Calendar, MapPin, DollarSign, Clock, Star, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to get booking status styling
function getBookingStatusStyle(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        icon: <Clock className="w-3 h-3" />
      };
    case "accepted":
      return {
        label: "Accepted",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        icon: <CheckCircle className="w-3 h-3" />
      };
    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
        icon: <Clock className="w-3 h-3" />
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        icon: <CheckCircle className="w-3 h-3" />
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        icon: <XCircle className="w-3 h-3" />
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
        icon: <AlertTriangle className="w-3 h-3" />
      };
  }
}

// Helper function to get payment status styling
function getPaymentStatusStyle(paymentStatus: string) {
  switch (paymentStatus) {
    case "paid":
      return {
        label: "Paid",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      };
    case "failed":
      return {
        label: "Failed",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      };
    default:
      return {
        label: paymentStatus,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
      };
  }
}

export default function BookingManagement() {
  const { toast } = useToast();

  // Action handlers
  const handleViewDetails = (booking: any) => {
    console.log("View booking details:", booking);
    // Implement view details logic
  };

  const handleContactClient = (booking: any) => {
    console.log("Contact client:", booking);
    // Implement contact client logic
  };

  const handleContactWorker = (booking: any) => {
    console.log("Contact worker:", booking);
    // Implement contact worker logic
  };

  const handleApproveBooking = (booking: any) => {
    console.log("Approve booking:", booking);
    toast({
      title: "Booking Approved",
      description: `Booking ${booking.id} has been approved.`,
    });
  };

  const handleCancelBooking = (booking: any) => {
    console.log("Cancel booking:", booking);
    toast({
      title: "Booking Cancelled",
      description: `Booking ${booking.id} has been cancelled.`,
    });
  };

  const handleRefundPayment = (booking: any) => {
    console.log("Refund payment:", booking);
    toast({
      title: "Payment Refunded",
      description: `Payment for booking ${booking.id} has been refunded.`,
    });
  };

  const handleEditBooking = (booking: any) => {
    console.log("Edit booking:", booking);
    // Implement edit booking logic
  };

  const handleDeleteBooking = (booking: any) => {
    console.log("Delete booking:", booking);
    toast({
      title: "Booking Deleted",
      description: `Booking ${booking.id} has been deleted.`,
    });
  };

  const config = {
    // Page Configuration
    title: "Booking Management",
    backUrl: "/admin",
    totalListLabel: "Total Booking List",
    totalListBadgeColor: "bg-indigo-500 hover:bg-indigo-600",
    
    // API Configuration
    fetchUrl: "/api/admin/bookings",
    itemRole: undefined, // No role filter for bookings
    
    // Display Configuration
    itemDisplayName: (booking: any) => `Booking #${booking.id.slice(0, 8)}`,
    itemDescription: (booking: any) => booking.description || "No description",
    getItemCountForState: (state: string, bookings: any[]) => 
      bookings.filter(b => b.state === state).length,
    getItemCountForDistrict: (district: string, bookings: any[]) => 
      bookings.filter(b => b.district === district).length,
    
    // Search Configuration
    searchPlaceholder: "Search bookings...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "id", label: "Booking ID" },
      { value: "client", label: "Client" },
      { value: "worker", label: "Worker" },
      { value: "service", label: "Service" },
      { value: "location", label: "Location" }
    ],
    statusFilters: [
      { value: "all", label: "All Status" },
      { value: "pending", label: "Pending" },
      { value: "accepted", label: "Accepted" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" }
    ],
    
    // Table Configuration
    tableColumns: [
      {
        key: "booking",
        label: "Booking Details",
        render: (booking: any) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              #{booking.id.slice(0, 8)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {booking.serviceCategory}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(booking.createdAt).toLocaleDateString()}
            </div>
          </div>
        )
      },
      {
        key: "client",
        label: "Client",
        render: (booking: any) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {booking.client?.firstName?.[0]}{booking.client?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {booking.client?.firstName} {booking.client?.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {booking.client?.mobile}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "worker",
        label: "Worker",
        render: (booking: any) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                {booking.worker?.firstName?.[0]}{booking.worker?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {booking.worker?.firstName} {booking.worker?.lastName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {booking.worker?.mobile}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "location",
        label: "Location",
        render: (booking: any) => (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <div>
              <div className="text-sm text-gray-900 dark:text-white">
                {booking.district}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {booking.state}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "schedule",
        label: "Scheduled",
        render: (booking: any) => (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <div>
              <div className="text-sm text-gray-900 dark:text-white">
                {new Date(booking.scheduledDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(booking.scheduledDate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )
      },
      {
        key: "amount",
        label: "Amount",
        render: (booking: any) => (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                ₹{booking.totalAmount || "0"}
              </div>
              {booking.paymentStatus && (
                <Badge
                  variant="secondary"
                  className={`${getPaymentStatusStyle(booking.paymentStatus).className} text-xs`}
                >
                  {getPaymentStatusStyle(booking.paymentStatus).label}
                </Badge>
              )}
            </div>
          </div>
        )
      },
      {
        key: "status",
        label: "Status",
        render: (booking: any) => {
          const statusStyle = getBookingStatusStyle(booking.status);
          return (
            <div className="space-y-1">
              <Badge
                variant="secondary"
                className={`${statusStyle.className} text-xs`}
              >
                {statusStyle.icon}
                <span className="ml-1">{statusStyle.label}</span>
              </Badge>
              {(booking.clientRating || booking.workerRating) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <span>
                    {booking.clientRating && `C:${booking.clientRating}`}
                    {booking.clientRating && booking.workerRating && " / "}
                    {booking.workerRating && `W:${booking.workerRating}`}
                  </span>
                </div>
              )}
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
        tooltip: "View booking details"
      },
      {
        label: "Contact Client",
        icon: <MessageSquare className="w-4 h-4" />,
        onClick: handleContactClient,
        color: "blue",
        tooltip: "Contact client"
      },
      {
        label: "Contact Worker",
        icon: <MessageSquare className="w-4 h-4" />,
        onClick: handleContactWorker,
        color: "green",
        tooltip: "Contact worker"
      },
      {
        label: "Edit",
        icon: <Edit className="w-4 h-4" />,
        onClick: handleEditBooking,
        color: "blue",
        tooltip: "Edit booking"
      },
      {
        label: "Approve",
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: handleApproveBooking,
        color: "green",
        tooltip: "Approve booking"
      },
      {
        label: "Cancel",
        icon: <XCircle className="w-4 h-4" />,
        onClick: handleCancelBooking,
        color: "orange",
        tooltip: "Cancel booking"
      },
      {
        label: "Refund",
        icon: <DollarSign className="w-4 h-4" />,
        onClick: handleRefundPayment,
        color: "purple",
        tooltip: "Refund payment"
      },
      {
        label: "Delete",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: handleDeleteBooking,
        color: "red",
        tooltip: "Delete booking"
      }
    ],
    
    // Permissions
    requiredRoles: ["admin", "super_admin"],
    
    // Styling
    stateItemBadgeColor: "bg-indigo-500",
    loadingText: "Loading booking data...",
    emptyStateText: "No bookings found",
    emptyStateIcon: <Calendar className="w-8 h-8 text-gray-400" />
  };

  return <StateBasedManagementTemplate config={config} />;
}