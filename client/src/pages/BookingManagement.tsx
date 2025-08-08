import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  Eye,
  MessageSquare
} from "lucide-react";

export default function BookingManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch all bookings
  const { data: allBookings = [] } = useQuery({
    queryKey: ["/api/admin/bookings"],
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Failed to update booking status");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Updated",
        description: "Booking status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-3 h-3" /> },
      accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
      in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800", icon: <Clock className="w-3 h-3" /> },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
      default: { label: status, color: "bg-gray-100 text-gray-800", icon: <AlertCircle className="w-3 h-3" /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.default;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string | Date): string => {
    if (!dateString) return "Not available";
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return "Invalid date";
      
      const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return istFormatter.format(date) + " IST";
    } catch (error) {
      return "Invalid date";
    }
  };

  const config = {
    // Page Configuration
    title: "Booking Management",
    backUrl: "/admin",
    totalListLabel: "Total Bookings",
    totalListBadgeColor: "bg-blue-500 hover:bg-blue-600",
    
    fetchUrl: "/api/admin/bookings",
    
    itemDisplayName: (booking: any) => `${booking.serviceCategory?.replace('_', ' ')} - ${booking.client?.firstName || 'Unknown'} ${booking.client?.lastName || 'Client'}`,
    itemDescription: (booking: any) => `Booking ID: ${booking.id.substring(0, 8)}...`,
    getItemCountForState: (state: string, bookings: any[]) => 
      bookings.filter((b: any) => b.client?.state === state || b.worker?.state === state).length,
    getItemCountForDistrict: (district: string, bookings: any[]) => 
      bookings.filter((b: any) => b.client?.district === district || b.worker?.district === district).length,
    
    // Search Configuration
    searchPlaceholder: "Search bookings by ID, service, or client name...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "id", label: "Booking ID" },
      { value: "service", label: "Service Category" },
      { value: "client", label: "Client Name" },
      { value: "worker", label: "Worker Name" },
      { value: "location", label: "Location" }
    ],
    statusFilters: [
      { value: "all", label: "All Statuses" },
      { value: "pending", label: "Pending" },
      { value: "accepted", label: "Accepted" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" }
    ],
    
    // Table Configuration
    tableColumns: [
      {
        key: "id",
        label: "Booking ID",
        render: (booking: any) => (
          <div className="font-mono text-sm">
            {booking.id.substring(0, 8)}...
          </div>
        )
      },
      {
        key: "service",
        label: "Service",
        render: (booking: any) => (
          <div className="capitalize font-medium">
            {booking.serviceCategory?.replace('_', ' ') || 'Unknown Service'}
          </div>
        )
      },
      {
        key: "client",
        label: "Client",
        render: (booking: any) => (
          <div>
            <div className="font-medium">
              {booking.client?.firstName || 'Unknown'} {booking.client?.lastName || 'Client'}
            </div>
            <div className="text-sm text-muted-foreground">
              {booking.client?.mobile || 'No phone'}
            </div>
          </div>
        )
      },
      {
        key: "worker",
        label: "Worker",
        render: (booking: any) => (
          <div>
            {booking.worker ? (
              <>
                <div className="font-medium">
                  {booking.worker.firstName} {booking.worker.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.worker.mobile}
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </div>
        )
      },
      {
        key: "status",
        label: "Status",
        render: (booking: any) => getStatusBadge(booking.status)
      },
      {
        key: "amount",
        label: "Amount",
        render: (booking: any) => (
          <div className="font-medium text-green-600">
            ₹{parseFloat(booking.totalAmount || 0).toLocaleString()}
          </div>
        )
      },
      {
        key: "date",
        label: "Created",
        render: (booking: any) => (
          <div className="text-sm">
            {formatDateTime(booking.createdAt)}
          </div>
        )
      }
    ],
    
    // Actions Configuration
    actions: [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        onClick: (booking: any) => {
          setSelectedBooking(booking);
          setShowDetailsModal(true);
        },
        variant: "ghost" as const,
        tooltip: "View booking details"
      },
      {
        label: "Update Status",
        icon: <Calendar className="w-4 h-4" />,
        onClick: (booking: any) => {
          // This could open a status update modal
          console.log("Update status for:", booking.id);
        },
        variant: "default" as const,
        tooltip: "Update booking status"
      },
      {
        label: "Contact Client",
        icon: <MessageSquare className="w-4 h-4" />,
        onClick: (booking: any) => {
          // This could open a messaging modal
          console.log("Contact client for:", booking.id);
        },
        variant: "ghost" as const,
        tooltip: "Contact client"
      }
    ],
    
    // Permissions
    requiredRoles: ["admin", "super_admin"],
    
    // Styling
    stateItemBadgeColor: "bg-blue-100 hover:bg-blue-200 text-blue-800",
    loadingText: "Loading bookings...",
    emptyStateText: "No bookings found",
    emptyStateIcon: <Calendar className="w-12 h-12 text-muted-foreground" />
  };

  return (
    <>
      <StateBasedManagementTemplate config={config} />
      
      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for booking {selectedBooking?.id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Category</label>
                    <p className="capitalize font-medium">
                      {selectedBooking.serviceCategory?.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                    <p className="font-medium text-green-600">
                      ₹{parseFloat(selectedBooking.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Booking Date</label>
                    <p>{formatDateTime(selectedBooking.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Scheduled Date</label>
                    <p>{formatDateTime(selectedBooking.scheduledDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {selectedBooking.address}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Client Information */}
              {selectedBooking.client && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p>{selectedBooking.client.firstName} {selectedBooking.client.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {selectedBooking.client.mobile}
                      </p>
                    </div>
                    {selectedBooking.client.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {selectedBooking.client.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p>{selectedBooking.client.district}, {selectedBooking.client.state}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Worker Information */}
              {selectedBooking.worker && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Worker Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p>{selectedBooking.worker.firstName} {selectedBooking.worker.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="flex items-center gap-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {selectedBooking.worker.mobile}
                      </p>
                    </div>
                    {selectedBooking.worker.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {selectedBooking.worker.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p>{selectedBooking.worker.district}, {selectedBooking.worker.state}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Service Description */}
              {selectedBooking.serviceDescription && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Service Description</h4>
                  <p className="text-sm">{selectedBooking.serviceDescription}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}