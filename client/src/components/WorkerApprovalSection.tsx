import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  AlertTriangle,
  Edit,
  Save,
  X
} from "lucide-react";

export default function WorkerApprovalSection() {
  const { toast } = useToast();
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Fetch pending workers and districts
  const { data: pendingWorkers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-workers"],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ["/api/districts"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: areas = [] } = useQuery<any[]>({
    queryKey: ["/api/areas"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject worker. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update worker data mutation
  const updateWorkerMutation = useMutation({
    mutationFn: async ({ workerId, updates }: { workerId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/update-worker/${workerId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Worker Updated",
        description: "Worker information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update worker information",
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

  const handleEdit = (worker: any) => {
    setIsEditing(true);
    setEditData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      mobile: worker.mobile,
      email: worker.email,
      address: worker.address,
      pincode: worker.pincode,
      workerProfile: {
        primaryService: worker.workerProfile?.primaryService || '',
        experienceYears: worker.workerProfile?.experienceYears || 0,
        hourlyRate: worker.workerProfile?.hourlyRate || 0,
        bio: worker.workerProfile?.bio || '',
        skills: worker.workerProfile?.skills || [],
        aadhaarNumber: worker.workerProfile?.aadhaarNumber || '',
        aadhaarVerified: worker.workerProfile?.aadhaarVerified || false,
        isBackgroundVerified: worker.workerProfile?.isBackgroundVerified || false,
      }
    });
  };

  const handleSave = () => {
    if (selectedWorker) {
      updateWorkerMutation.mutate({
        workerId: selectedWorker.id,
        updates: editData
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
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
                          onClick={() => {
                            setSelectedWorker(worker);
                            setIsEditing(false);
                          }}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <DialogTitle>Worker Application Details</DialogTitle>
                              <DialogDescription>
                                {isEditing ? "Edit worker's profile and credentials" : "Review the worker's profile and credentials"}
                              </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(selectedWorker)}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="flex items-center gap-2"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={updateWorkerMutation.isPending}
                                    className="flex items-center gap-2"
                                  >
                                    <Save className="h-4 w-4" />
                                    {updateWorkerMutation.isPending ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
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
                                  {isEditing ? (
                                    <Input
                                      value={editData.workerProfile?.primaryService || ''}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        workerProfile: {
                                          ...editData.workerProfile,
                                          primaryService: e.target.value
                                        }
                                      })}
                                      className="mt-1"
                                    />
                                  ) : (
                                    <p className="font-medium">{selectedWorker.workerProfile.primaryService}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Experience (Years)</label>
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      value={editData.workerProfile?.experienceYears || 0}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        workerProfile: {
                                          ...editData.workerProfile,
                                          experienceYears: parseInt(e.target.value) || 0
                                        }
                                      })}
                                      className="mt-1"
                                    />
                                  ) : (
                                    <p className="font-medium">{selectedWorker.workerProfile.experienceYears} years</p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Hourly Rate (₹)</label>
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      value={editData.workerProfile?.hourlyRate || 0}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        workerProfile: {
                                          ...editData.workerProfile,
                                          hourlyRate: parseFloat(e.target.value) || 0
                                        }
                                      })}
                                      className="mt-1"
                                    />
                                  ) : (
                                    <p className="font-medium">₹{selectedWorker.workerProfile.hourlyRate}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Aadhaar Number</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    {isEditing ? (
                                      <Input
                                        value={editData.workerProfile?.aadhaarNumber || ''}
                                        onChange={(e) => setEditData({
                                          ...editData,
                                          workerProfile: {
                                            ...editData.workerProfile,
                                            aadhaarNumber: e.target.value
                                          }
                                        })}
                                        className="flex-1"
                                      />
                                    ) : (
                                      <p className="font-medium flex-1">{selectedWorker.workerProfile.aadhaarNumber}</p>
                                    )}
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <label className="text-sm">Verified:</label>
                                        <Switch
                                          checked={editData.workerProfile?.aadhaarVerified || false}
                                          onCheckedChange={(checked) => setEditData({
                                            ...editData,
                                            workerProfile: {
                                              ...editData.workerProfile,
                                              aadhaarVerified: checked
                                            }
                                          })}
                                        />
                                      </div>
                                    ) : (
                                      selectedWorker.workerProfile.aadhaarVerified ? (
                                        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verified
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Not Verified
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                                  {isEditing ? (
                                    <Input
                                      value={editData.address || ''}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        address: e.target.value
                                      })}
                                      className="mt-1"
                                    />
                                  ) : (
                                    <p className="font-medium">{selectedWorker.address || "Not provided"}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Pincode</label>
                                  {isEditing ? (
                                    <Input
                                      value={editData.pincode || ''}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        pincode: e.target.value
                                      })}
                                      className="mt-1"
                                    />
                                  ) : (
                                    <p className="font-medium">{selectedWorker.pincode || "Not provided"}</p>
                                  )}
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-muted-foreground">Bio</label>
                                  {isEditing ? (
                                    <Textarea
                                      value={editData.workerProfile?.bio || ''}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        workerProfile: {
                                          ...editData.workerProfile,
                                          bio: e.target.value
                                        }
                                      })}
                                      className="mt-1"
                                      rows={3}
                                    />
                                  ) : (
                                    <p className="font-medium">{selectedWorker.workerProfile?.bio || "No bio provided"}</p>
                                  )}
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
                                
                                {/* Service Areas */}
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-muted-foreground">Service Areas</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedWorker.workerProfile?.serviceAllAreas ? (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        All Areas
                                      </Badge>
                                    ) : selectedWorker.workerProfile?.serviceAreas?.length > 0 ? (
                                      selectedWorker.workerProfile.serviceAreas.map((areaId: string, index: number) => {
                                        const area = areas.find((a: any) => a.id === areaId);
                                        return (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {area ? area.name : areaId}
                                          </Badge>
                                        );
                                      })
                                    ) : (
                                      <span className="text-muted-foreground text-sm">No specific areas selected</span>
                                    )}
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <label className="text-sm font-medium text-muted-foreground">Skills</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedWorker.workerProfile?.skills?.map((skill: string, index: number) => (
                                      <Badge key={index} variant="outline">{skill}</Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                {selectedWorker.workerProfile?.bioDataDocument && (
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Bio Data Document</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Create a temporary link to download/view the document
                                          const link = document.createElement('a');
                                          link.href = selectedWorker.workerProfile.bioDataDocument;
                                          link.download = `biodata_${selectedWorker.firstName}_${selectedWorker.lastName}`;
                                          link.click();
                                        }}
                                      >
                                        <User className="h-4 w-4 mr-1" />
                                        View Document
                                      </Button>
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                        Document Attached
                                      </Badge>
                                    </div>
                                  </div>
                                )}
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