import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, User, Phone, MapPin, Briefcase, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface WorkerApplication {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  districtId: string;
  profilePicture?: string;
  workerProfile: {
    id: string;
    aadhaarNumber: string;
    primaryService: string;
    experienceYears: number;
    hourlyRate: string;
    workAddress: string;
    pincode: string;
    approvalStatus: string;
    createdAt: string;
  };
}

export function WorkerApprovalSection() {
  const [selectedWorker, setSelectedWorker] = useState<WorkerApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingApplications = [], isLoading } = useQuery<WorkerApplication[]>({
    queryKey: ["/api/admin/pending-applications"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/approve-worker/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user?.id }),
      });
      if (!response.ok) throw new Error("Failed to approve worker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-applications"] });
      toast({
        title: "Worker Approved",
        description: "Worker application has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve worker application.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await fetch(`/api/admin/reject-worker/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user?.id, reason }),
      });
      if (!response.ok) throw new Error("Failed to reject worker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-applications"] });
      setShowRejectDialog(false);
      setRejectionReason("");
      toast({
        title: "Worker Rejected",
        description: "Worker application has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject worker application.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    approveMutation.mutate(userId);
  };

  const handleRejectClick = (worker: WorkerApplication) => {
    setSelectedWorker(worker);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedWorker || !rejectionReason.trim()) return;
    rejectMutation.mutate({ 
      userId: selectedWorker.id, 
      reason: rejectionReason.trim() 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Worker Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pending Worker Applications
            <Badge variant="secondary">{pendingApplications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending applications
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((worker: WorkerApplication) => (
                <div
                  key={worker.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={worker.profilePicture} />
                        <AvatarFallback>
                          {worker.firstName[0]}{worker.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {worker.firstName} {worker.lastName}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {worker.mobile}
                        </div>
                        {worker.email && (
                          <div className="text-sm text-muted-foreground">
                            {worker.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">
                      Applied {new Date(worker.workerProfile.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Service
                      </div>
                      <div className="text-muted-foreground">
                        {worker.workerProfile.primaryService}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Experience
                      </div>
                      <div className="text-muted-foreground">
                        {worker.workerProfile.experienceYears} years
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Rate</div>
                      <div className="text-muted-foreground">
                        ₹{worker.workerProfile.hourlyRate}/hour
                      </div>
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </div>
                      <div className="text-muted-foreground">
                        {worker.workerProfile.pincode}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-sm">Work Address</div>
                    <div className="text-sm text-muted-foreground">
                      {worker.workerProfile.workAddress}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-sm">Aadhaar Number</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {worker.workerProfile.aadhaarNumber}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(worker.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectClick(worker)}
                      disabled={rejectMutation.isPending}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Worker Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please provide a reason for rejecting this application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}