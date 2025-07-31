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
import BankDetailsFormFixed from "@/components/BankDetailsFormFixed";
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

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
                      <DialogContent className={`${isMaximized ? 'max-w-full max-h-full w-screen h-screen' : 'max-w-4xl max-h-[90vh]'} overflow-y-auto transition-all duration-300 ${isMinimized ? 'opacity-30 pointer-events-none' : ''}`}>
                        {/* Custom Window Controls */}
                        <div className="absolute top-4 right-12 flex items-center gap-1 z-10">
                          <button
                            className="w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-xs text-white font-bold transition-colors"
                            title="Minimize"
                            onClick={() => setIsMinimized(!isMinimized)}
                          >
                            −
                          </button>
                          <button
                            className="w-4 h-4 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-xs text-white font-bold transition-colors"
                            title={isMaximized ? "Restore" : "Maximize"}
                            onClick={() => setIsMaximized(!isMaximized)}
                          >
                            {isMaximized ? '❐' : '□'}
                          </button>
                        </div>
                        
                        <DialogHeader className="pb-6 border-b">
                          <div className="space-y-4 pr-16">
                            <div>
                              <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                Worker Application Details
                              </DialogTitle>
                              <DialogDescription className="text-sm text-muted-foreground">
                                {isEditing ? "Edit worker's profile and credentials" : "Review the worker's profile and credentials"}
                              </DialogDescription>
                            </div>
                            
                            {/* Action Buttons - Top Center */}
                            {selectedWorker && (
                              <div className="flex justify-center items-center gap-4 pt-4">
                                {!isEditing ? (
                                  <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => handleEdit(selectedWorker)}
                                    className="flex items-center gap-2 px-8 py-3 text-base font-medium hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                  >
                                    <Edit className="h-5 w-5" />
                                    Edit Worker Details
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      onClick={handleCancel}
                                      className="flex items-center gap-2 px-8 py-3 text-base font-medium hover:bg-red-50 hover:border-red-200 transition-colors"
                                    >
                                      <X className="h-5 w-5" />
                                      Cancel Changes
                                    </Button>
                                    <Button
                                      size="lg"
                                      onClick={handleSave}
                                      disabled={updateWorkerMutation.isPending}
                                      className="flex items-center gap-2 px-8 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
                                    >
                                      <Save className="h-5 w-5" />
                                      {updateWorkerMutation.isPending ? "Saving Changes..." : "Save Changes"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogHeader>
                        {selectedWorker && (
                          <div className="space-y-8 pt-6 min-h-full flex flex-col">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                              <div className="flex items-start gap-6">
                                <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                                  <AvatarImage src={selectedWorker.profilePicture} />
                                  <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {selectedWorker.firstName[0]}{selectedWorker.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <div className="flex gap-2">
                                        <Input
                                          value={editData.firstName || ''}
                                          onChange={(e) => setEditData({
                                            ...editData,
                                            firstName: e.target.value
                                          })}
                                          className="text-xl font-bold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                          placeholder="First Name"
                                        />
                                        <Input
                                          value={editData.lastName || ''}
                                          onChange={(e) => setEditData({
                                            ...editData,
                                            lastName: e.target.value
                                          })}
                                          className="text-xl font-bold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                          placeholder="Last Name"
                                        />
                                      </div>
                                      <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                          <Input
                                            value={editData.mobile || ''}
                                            onChange={(e) => setEditData({
                                              ...editData,
                                              mobile: e.target.value
                                            })}
                                            className="font-medium border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-32"
                                            placeholder="Mobile Number"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                          <span className="font-medium text-gray-600 dark:text-gray-400">{selectedWorker.district?.name}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {selectedWorker.firstName} {selectedWorker.lastName}
                                      </h3>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          <span className="font-medium">{selectedWorker.mobile}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4" />
                                          <span className="font-medium">{selectedWorker.district?.name}</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  {selectedWorker.workerProfile && (
                                    <div className="flex items-center gap-3 pt-2">
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                        <Briefcase className="h-3 w-3 mr-1" />
                                        {selectedWorker.workerProfile.primaryService}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        {selectedWorker.workerProfile.experienceYears} years experience
                                      </span>
                                      <span className="text-sm font-semibold text-green-600">
                                        ₹{selectedWorker.workerProfile.hourlyRate}/hour
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {selectedWorker.workerProfile && (
                              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                  <Briefcase className="h-5 w-5 text-blue-600" />
                                  Professional Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      Primary Service
                                      <span className="text-red-500">*</span>
                                    </label>
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
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., Home car wash"
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                                        {selectedWorker.workerProfile.primaryService}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      Experience (Years)
                                      <span className="text-red-500">*</span>
                                    </label>
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={editData.workerProfile?.experienceYears || 0}
                                        onChange={(e) => setEditData({
                                          ...editData,
                                          workerProfile: {
                                            ...editData.workerProfile,
                                            experienceYears: parseInt(e.target.value) || 0
                                          }
                                        })}
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 5"
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                                        {selectedWorker.workerProfile.experienceYears} years
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      Hourly Rate (₹)
                                      <span className="text-red-500">*</span>
                                    </label>
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editData.workerProfile?.hourlyRate || 0}
                                        onChange={(e) => setEditData({
                                          ...editData,
                                          workerProfile: {
                                            ...editData.workerProfile,
                                            hourlyRate: parseFloat(e.target.value) || 0
                                          }
                                        })}
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 300.00"
                                      />
                                    ) : (
                                      <p className="font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md">
                                        ₹{selectedWorker.workerProfile.hourlyRate}
                                      </p>
                                    )}
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      Aadhaar Number
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-4">
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
                                          className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                          placeholder="e.g., 123456789000"
                                          maxLength={12}
                                        />
                                      ) : (
                                        <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md flex-1">
                                          {selectedWorker.workerProfile.aadhaarNumber}
                                        </p>
                                      )}
                                      {isEditing ? (
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Verified:</label>
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
                                          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Verified
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                            Not Verified
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      Background Verification
                                      <span className="text-blue-500 text-xs">(Optional)</span>
                                    </label>
                                    <div className="flex items-center gap-4">
                                      {isEditing ? (
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Verified:</label>
                                          <Switch
                                            checked={editData.workerProfile?.isBackgroundVerified || false}
                                            onCheckedChange={(checked) => setEditData({
                                              ...editData,
                                              workerProfile: {
                                                ...editData.workerProfile,
                                                isBackgroundVerified: checked
                                              }
                                            })}
                                          />
                                        </div>
                                      ) : (
                                        selectedWorker.workerProfile?.isBackgroundVerified ? (
                                          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Verified
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 px-3 py-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            Pending
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
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
                                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                                        rows={3}
                                        placeholder="Brief description of work experience and skills..."
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md min-h-[80px] flex items-start">
                                        {selectedWorker.workerProfile?.bio || "No bio provided"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Address/Location Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-orange-600" />
                                Address/Location Information
                              </h4>
                              {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <Input
                                      value={editData.address || ''}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        address: e.target.value
                                      })}
                                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      placeholder="Enter full address"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">District</label>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md min-h-[40px] flex items-center">
                                      {selectedWorker.district?.name || "Not specified"}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pincode</label>
                                    <Input
                                      value={editData.pincode || ''}
                                      onChange={(e) => setEditData({
                                        ...editData,
                                        pincode: e.target.value
                                      })}
                                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      placeholder="e.g., 636004"
                                      maxLength={6}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
                                    <div className="space-y-1">
                                      <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                                        {selectedWorker.address || "Address not provided"}
                                      </div>
                                      <div className="text-base font-medium text-blue-700 dark:text-blue-300">
                                        {selectedWorker.district?.name || "District not specified"}
                                      </div>
                                      <div className="text-base font-medium text-gray-700 dark:text-gray-300">
                                        {selectedWorker.pincode || "Pincode not provided"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Service Coverage */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                                Service Coverage
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Districts</label>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedWorker.workerProfile.serviceDistricts?.length > 0 ? 
                                      selectedWorker.workerProfile.serviceDistricts.map((districtId: string, index: number) => {
                                        const district = districts.find((d: any) => d.id === districtId);
                                        return (
                                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                                            {district ? district.name : districtId}
                                          </Badge>
                                        );
                                      }) : 
                                      <span className="text-gray-500 italic bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">No districts specified</span>
                                    }
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Areas</label>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedWorker.workerProfile?.serviceAllAreas ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                                        All Areas
                                      </Badge>
                                    ) : selectedWorker.workerProfile?.serviceAreas?.length > 0 ? (
                                      selectedWorker.workerProfile.serviceAreas.map((areaId: string, index: number) => {
                                        const area = areas.find((a: any) => a.id === areaId);
                                        return (
                                          <Badge key={index} variant="outline" className="px-3 py-1">
                                            {area ? area.name : areaId}
                                          </Badge>
                                        );
                                      })
                                    ) : (
                                      <span className="text-gray-500 italic bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">No specific areas selected</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Skills & Documents */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-600" />
                                Skills & Documents
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Skills</label>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedWorker.workerProfile?.skills?.length > 0 ? (
                                      selectedWorker.workerProfile.skills.map((skill: string, index: number) => (
                                        <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1">
                                          {skill}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-gray-500 italic bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">No skills listed</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio Data Document</label>
                                  {selectedWorker.workerProfile?.bioDataDocument ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                          <User className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            Bio Data Document
                                          </p>
                                          <p className="text-xs text-blue-700 dark:text-blue-300">
                                            Click to view worker's resume/bio data
                                          </p>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = selectedWorker.workerProfile.bioDataDocument;
                                            link.download = `biodata_${selectedWorker.firstName}_${selectedWorker.lastName}`;
                                            link.click();
                                          }}
                                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                        >
                                          <User className="h-4 w-4 mr-1" />
                                          View Document
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                      <div className="text-center text-gray-500 dark:text-gray-400">
                                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No document uploaded</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bank Details Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                <div className="h-5 w-5 text-green-600">💳</div>
                                Bank Details
                              </h4>
                              <BankDetailsFormFixed
                                workerId={selectedWorker.id}
                                isDialog={false}
                                showTitle={false}
                              />
                            </div>

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