import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, UserCheck, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PendingVerificationsManagement() {
  const { toast } = useToast();
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch pending workers for verification
  const { data: pendingWorkers = [] } = useQuery({
    queryKey: ["/api/admin/pending-workers"],
  });

  // Verify worker mutation
  const verifyWorkerMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const response = await apiRequest("POST", `/api/admin/verify-user/${userId}`, {
        isVerified,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isVerified ? "Worker Verified" : "Worker Rejected",
        description: variables.isVerified 
          ? "Worker has been successfully verified and can now accept bookings." 
          : "Worker verification has been rejected.",
        variant: variables.isVerified ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to update worker verification status",
        variant: "destructive",
      });
    },
  });

  // Handle worker verification
  const handleVerifyWorker = (workerId: string, isVerified: boolean) => {
    verifyWorkerMutation.mutate({ userId: workerId, isVerified });
  };

  // View worker details
  const handleViewWorkerDetails = (worker: any) => {
    setSelectedWorker(worker);
    setShowDetailsModal(true);
  };

  const config = {
    title: "Pending Verifications Management",
    backUrl: "/admin",
    totalListLabel: "Total Pending Verifications",
    totalListBadgeColor: "bg-yellow-500 hover:bg-yellow-600",
    
    fetchUrl: "/api/admin/pending-workers",
    
    itemDisplayName: (worker: any) => `${worker.firstName} ${worker.lastName}`,
    itemDescription: (worker: any) => worker.email || "No email provided",
    getItemCountForState: (state: string, workers: any[]) => 
      workers.filter((w: any) => w.state === state && !w.isVerified).length,
    getItemCountForDistrict: (district: string, workers: any[]) => 
      workers.filter((w: any) => w.district === district && !w.isVerified).length,
    
    searchPlaceholder: "Search pending workers...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "name", label: "Name" },
      { value: "email", label: "Email" },
      { value: "mobile", label: "Mobile" },
      { value: "skills", label: "Skills" },
    ],
    statusFilters: [
      { value: "all", label: "All Status" },
      { value: "pending", label: "Pending" },
      { value: "submitted", label: "Submitted" },
      { value: "under_review", label: "Under Review" },
    ],
    
    tableColumns: [
      {
        key: "worker",
        label: "Worker Details",
        render: (worker: any) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {worker.profilePicture ? (
                <AvatarImage src={worker.profilePicture} alt={`${worker.firstName} ${worker.lastName}`} />
              ) : (
                <AvatarFallback className="bg-yellow-100 text-yellow-700">
                  {worker.firstName?.[0]}{worker.lastName?.[0]}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-medium">{worker.firstName} {worker.lastName}</div>
              <div className="text-sm text-gray-500">ID: {worker.id?.slice(0, 12)}...</div>
              <div className="text-sm text-gray-500">{worker.mobile}</div>
            </div>
          </div>
        )
      },
      {
        key: "location",
        label: "Location",
        render: (worker: any) => (
          <div>
            <div className="font-medium">{worker.district}</div>
            <div className="text-sm text-gray-500">{worker.state}</div>
          </div>
        )
      },
      {
        key: "skills",
        label: "Skills",
        render: (worker: any) => (
          <div className="flex flex-wrap gap-1">
            {worker.skills?.slice(0, 2).map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {worker.skills?.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{worker.skills.length - 2}
              </Badge>
            )}
          </div>
        )
      },
      {
        key: "status",
        label: "Status",
        render: (worker: any) => (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          </div>
        )
      },
      {
        key: "submitted",
        label: "Submitted",
        render: (worker: any) => (
          <div>
            <div className="text-sm font-medium">
              {new Date(worker.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(worker.createdAt).toLocaleTimeString()}
            </div>
          </div>
        )
      },
      {
        key: "actions",
        label: "Quick Actions",
        render: (worker: any) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyWorker(worker.id, true)}
              className="text-green-600 border-green-600 hover:bg-green-50"
              disabled={verifyWorkerMutation.isPending}
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVerifyWorker(worker.id, false)}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={verifyWorkerMutation.isPending}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        )
      }
    ],
    
    actions: [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        onClick: (worker: any) => handleViewWorkerDetails(worker),
        tooltip: "View complete worker profile"
      },
      {
        label: "Approve",
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: (worker: any) => handleVerifyWorker(worker.id, true),
        color: "green",
        tooltip: "Approve worker verification"
      },
      {
        label: "Reject",
        icon: <XCircle className="w-4 h-4" />,
        onClick: (worker: any) => handleVerifyWorker(worker.id, false),
        color: "red",
        tooltip: "Reject worker verification"
      }
    ],
    
    requiredRoles: ["admin", "super_admin"],
    stateItemBadgeColor: "bg-yellow-500",
    loadingText: "Loading pending verifications...",
    emptyStateText: "No pending verifications found",
    emptyStateIcon: <UserCheck className="w-8 h-8 text-gray-400" />
  };

  return (
    <>
      <StateBasedManagementTemplate config={config} />

      {/* Worker Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker Verification Details</DialogTitle>
            <DialogDescription>
              Review all worker information before making a verification decision
            </DialogDescription>
          </DialogHeader>

          {selectedWorker && (
            <div className="space-y-6">
              {/* Profile Section */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      {selectedWorker.profilePicture ? (
                        <AvatarImage src={selectedWorker.profilePicture} alt={`${selectedWorker.firstName} ${selectedWorker.lastName}`} />
                      ) : (
                        <AvatarFallback className="bg-yellow-100 text-yellow-700 text-xl">
                          {selectedWorker.firstName?.[0]}{selectedWorker.lastName?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">
                        {selectedWorker.firstName} {selectedWorker.lastName}
                      </h3>
                      <p className="text-gray-600">ID: {selectedWorker.id}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Verification
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mobile</label>
                      <p className="font-medium">{selectedWorker.mobile}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="font-medium">{selectedWorker.email || "Not provided"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3">Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">State</label>
                      <p className="font-medium">{selectedWorker.state}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">District</label>
                      <p className="font-medium">{selectedWorker.district}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills & Services */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3">Skills & Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.skills?.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  {selectedWorker.baseRate && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-500">Base Rate</label>
                      <p className="font-medium">₹{selectedWorker.baseRate}/hour</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verification Actions */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3">Verification Decision</h4>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        handleVerifyWorker(selectedWorker.id, true);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={verifyWorkerMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Worker
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleVerifyWorker(selectedWorker.id, false);
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      disabled={verifyWorkerMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Worker
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Details */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3">Submission Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="font-medium">
                        {new Date(selectedWorker.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Time</label>
                      <p className="font-medium">
                        {new Date(selectedWorker.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}