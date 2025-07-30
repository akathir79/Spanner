import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  Briefcase,
  Star,
  Phone,
  AlertTriangle
} from "lucide-react";

export default function WorkerApprovalSection() {
  const { toast } = useToast();
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  // Fetch pending workers and districts
  const { data: pendingWorkers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-workers"],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ["/api/districts"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Approve worker mutation
  const approveWorkerMutation = useMutation({
    mutationFn: (workerId: string) => 
      fetch(`/api/admin/approve-worker/${workerId}`, {
        method: "POST",
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Worker Approved",
        description: "Worker has been approved and can now use the platform.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-workers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve worker. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject worker (delete from database)
  const rejectWorkerMutation = useMutation({
    mutationFn: (workerId: string) => 
      fetch(`/api/admin/reject-worker/${workerId}`, {
        method: "DELETE",
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Worker Rejected",
        description: "Worker application has been rejected and removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-workers"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject worker. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (workerId: string) => {
    approveWorkerMutation.mutate(workerId);
  };

  const handleReject = (workerId: string) => {
    if (confirm("Are you sure you want to reject this worker? This will permanently delete their account.")) {
      rejectWorkerMutation.mutate(workerId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Worker Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading pending workers...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Worker Approvals ({pendingWorkers.length} pending)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingWorkers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No pending worker applications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingWorkers.map((worker: any) => (
              <div key={worker.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={worker.profilePicture} />
                      <AvatarFallback>
                        {worker.firstName[0]}{worker.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold">
                          {worker.firstName} {worker.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {worker.mobile}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {worker.district?.name}
                          </span>
                        </div>
                      </div>
                      
                      {worker.workerProfile && (
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {worker.workerProfile.primaryService}
                          </Badge>
                          <span className="text-muted-foreground">
                            {worker.workerProfile.experienceYears} years experience
                          </span>
                          <span className="text-muted-foreground">
                            ₹{worker.workerProfile.hourlyRate}/hour
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorker(worker)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Worker Application Details</DialogTitle>
                          <DialogDescription>
                            Review the worker's profile and credentials
                          </DialogDescription>
                        </DialogHeader>
                        {selectedWorker && (
                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={selectedWorker.profilePicture} />
                                <AvatarFallback className="text-lg">
                                  {selectedWorker.firstName[0]}{selectedWorker.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-semibold">
                                  {selectedWorker.firstName} {selectedWorker.lastName}
                                </h3>
                                <p className="text-muted-foreground">{selectedWorker.mobile}</p>
                                <p className="text-muted-foreground">{selectedWorker.district?.name}</p>
                              </div>
                            </div>
                            
                            {selectedWorker.workerProfile && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Primary Service</label>
                                  <p className="font-medium">{selectedWorker.workerProfile.primaryService}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Experience</label>
                                  <p className="font-medium">{selectedWorker.workerProfile.experienceYears} years</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                                  <p className="font-medium">₹{selectedWorker.workerProfile.hourlyRate}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Aadhaar Number</label>
                                  <p className="font-medium">{selectedWorker.workerProfile.aadhaarNumber}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  <p className="font-medium">{selectedWorker.address || "Not provided"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                                  <p className="font-medium">{selectedWorker.pincode || "Not provided"}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                                  <p className="font-medium">{selectedWorker.workerProfile.bio || "No bio provided"}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-muted-foreground">Service Districts</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedWorker.workerProfile.serviceDistricts?.length > 0 ? 
                                      selectedWorker.workerProfile.serviceDistricts.map((districtId: string, index: number) => {
                                        const district = districts.find((d: any) => d.id === districtId);
                                        return (
                                          <Badge key={index} variant="secondary">
                                            {district ? district.name : districtId}
                                          </Badge>
                                        );
                                      }) : 
                                      <span className="text-muted-foreground">No districts specified</span>
                                    }
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-muted-foreground">Skills</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedWorker.workerProfile.skills?.map((skill: string, index: number) => (
                                      <Badge key={index} variant="outline">{skill}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      onClick={() => handleApprove(worker.id)}
                      disabled={approveWorkerMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(worker.id)}
                      disabled={rejectWorkerMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}