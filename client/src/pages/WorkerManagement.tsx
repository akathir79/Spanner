import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Star, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Search,
  ArrowLeft,
  Users,
  Briefcase,
  Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Import states and districts data
import statesDistricts from "@shared/states-districts.json";

interface WorkerProfile {
  id: string;
  userId: string;
  primaryService: string;
  serviceTypes: string[];
  experience: number;
  hourlyRate: number;
  description: string;
  serviceDistricts: string[];
  isAvailable: boolean;
  rating: number;
  completedJobs: number;
  skills: string[];
  portfolio: string[];
  certifications: string[];
  languages: string[];
  preferredPaymentMethods: string[];
  workingHours: any;
  profilePicture: string | null;
  isVerified: boolean;
  businessName: string | null;
  businessLicense: string | null;
  taxId: string | null;
  bankDetails: any;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkerData {
  id: string;
  mobile: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  district: string | null;
  isActive: boolean;
  isVerified: boolean;
  profilePicture: string | null;
  registrationDate: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  workerProfile?: WorkerProfile;
}

export default function WorkerManagement() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerData | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusAction, setStatusAction] = useState<'verify' | 'unverify'>('verify');
  const [statusReason, setStatusReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const totalStates = Object.keys(statesDistricts).length;

  // Get all available service types from the JSON
  const getAllServiceTypes = () => {
    const serviceTypes = new Set<string>();
    Object.values(statesDistricts).forEach((state: any) => {
      if (state.serviceTypes) {
        state.serviceTypes.forEach((service: string) => serviceTypes.add(service));
      }
    });
    return Array.from(serviceTypes).sort();
  };

  const allServiceTypes = getAllServiceTypes();

  // Load workers when filters change
  useEffect(() => {
    if (selectedState && selectedDistrict && selectedServiceType) {
      loadWorkers();
    }
  }, [selectedState, selectedDistrict, selectedServiceType]);

  // Filter workers based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter(worker => 
        worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.mobile.includes(searchTerm) ||
        (worker.email && worker.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        worker.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredWorkers(filtered);
    }
  }, [searchTerm, workers]);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/workers');
      const allWorkers = response as WorkerData[];
      
      // Filter workers by the selected criteria
      const filtered = allWorkers.filter(worker => {
        const matchesDistrict = worker.district === selectedDistrict;
        const matchesService = worker.workerProfile?.primaryService === selectedServiceType || 
                              worker.workerProfile?.serviceTypes?.includes(selectedServiceType);
        return matchesDistrict && matchesService;
      });
      
      setWorkers(filtered);
      setFilteredWorkers(filtered);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast({
        title: "Error",
        description: "Failed to load workers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedWorker || !messageText.trim()) return;

    try {
      await apiRequest(`/api/admin/workers/${selectedWorker.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText })
      });
      
      toast({
        title: "Success",
        description: "Message sent to worker",
      });
      
      setShowMessageDialog(false);
      setMessageText("");
      setSelectedWorker(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async () => {
    if (!selectedWorker) return;

    try {
      await apiRequest(`/api/admin/workers/${selectedWorker.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: statusAction === 'verify' ? 'verified' : 'unverified',
          reason: statusReason 
        })
      });
      
      toast({
        title: "Success",
        description: `Worker ${statusAction === 'verify' ? 'verified' : 'unverified'} successfully`,
      });
      
      // Refresh the workers list
      loadWorkers();
      
      setShowStatusDialog(false);
      setStatusReason("");
      setSelectedWorker(null);
    } catch (error) {
      console.error('Error updating worker status:', error);
      toast({
        title: "Error",
        description: "Failed to update worker status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;

    try {
      await apiRequest(`/api/admin/workers/${selectedWorker.id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Success",
        description: "Worker deleted successfully",
      });
      
      // Refresh the workers list
      loadWorkers();
      
      setShowDeleteDialog(false);
      setSelectedWorker(null);
    } catch (error) {
      console.error('Error deleting worker:', error);
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      });
    }
  };

  const getStateDistricts = (stateName: string) => {
    const state = statesDistricts[stateName as keyof typeof statesDistricts];
    return state?.districts || [];
  };

  const getStateServiceTypes = (stateName: string) => {
    const state = statesDistricts[stateName as keyof typeof statesDistricts];
    return state?.serviceTypes || [];
  };

  const resetFilters = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedServiceType("");
    setWorkers([]);
    setFilteredWorkers([]);
    setSearchTerm("");
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (worker: WorkerData) => {
    if (!worker.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (worker.isVerified) {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    }
    return <Badge variant="outline">Unverified</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Worker Management</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Manage workers across India's {totalStates} states and union territories
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredWorkers.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Workers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Panel - Navigation */}
          <div className="lg:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Navigation
                </CardTitle>
                <CardDescription>
                  Select location and service type to view workers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Reset Button */}
                {(selectedState || selectedDistrict || selectedServiceType) && (
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                )}

                {/* State Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select State ({Object.keys(statesDistricts).length} Available)
                  </h3>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {Object.keys(statesDistricts).map((state) => (
                      <Button
                        key={state}
                        variant={selectedState === state ? "default" : "outline"}
                        onClick={() => {
                          setSelectedState(state);
                          setSelectedDistrict("");
                          setSelectedServiceType("");
                        }}
                        className="justify-between text-left h-auto py-2 px-3"
                      >
                        <span className="truncate">{state}</span>
                        <Badge variant="secondary" className="ml-2">
                          {getStateDistricts(state).length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* District Selection */}
                {selectedState && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select District ({getStateDistricts(selectedState).length} Available)
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {getStateDistricts(selectedState).map((district) => (
                        <Button
                          key={district}
                          variant={selectedDistrict === district ? "default" : "outline"}
                          onClick={() => {
                            setSelectedDistrict(district);
                            setSelectedServiceType("");
                          }}
                          className="justify-start text-left h-auto py-2 px-3"
                        >
                          <span className="truncate">{district}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Type Selection */}
                {selectedState && selectedDistrict && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Service Type ({getStateServiceTypes(selectedState).length} Available)
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {getStateServiceTypes(selectedState).map((serviceType) => (
                        <Button
                          key={serviceType}
                          variant={selectedServiceType === serviceType ? "default" : "outline"}
                          onClick={() => setSelectedServiceType(serviceType)}
                          className="justify-start text-left h-auto py-2 px-3"
                        >
                          <span className="truncate">{serviceType}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Worker List */}
          <div className="lg:w-2/3">
            
            {/* Show selection status */}
            {!selectedState && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a State to Start
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Choose a state from the left panel to view available districts and workers.
                  </p>
                </CardContent>
              </Card>
            )}

            {selectedState && !selectedDistrict && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a District
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Choose a district in {selectedState} to view available service types.
                  </p>
                </CardContent>
              </Card>
            )}

            {selectedState && selectedDistrict && !selectedServiceType && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Service Type
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Choose a service type to view workers in {selectedDistrict}, {selectedState}.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Worker List */}
            {selectedState && selectedDistrict && selectedServiceType && (
              <div className="space-y-6">
                
                {/* Search and Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedServiceType} Workers in {selectedDistrict}, {selectedState}
                    </CardTitle>
                    <CardDescription>
                      {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search workers by name, phone, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Workers Grid */}
                {loading ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading workers...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredWorkers.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <User className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Workers Found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        No {selectedServiceType} workers found in {selectedDistrict}, {selectedState}.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6">
                    {filteredWorkers.map((worker) => (
                      <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                                {worker.firstName[0]}{worker.lastName[0]}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {worker.firstName} {worker.lastName}
                                  </h3>
                                  {getStatusBadge(worker)}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    ID: {worker.id}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {worker.mobile}
                                  </div>
                                  {worker.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      {worker.email}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {worker.district}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Registered: {formatDate(worker.registrationDate)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Last Login: {formatDate(worker.lastLoginAt)}
                                  </div>
                                </div>

                                {worker.workerProfile && (
                                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-blue-500" />
                                        {worker.workerProfile.primaryService}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        {worker.workerProfile.rating}/5 ({worker.workerProfile.completedJobs} jobs)
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-green-600 font-medium">
                                          ₹{worker.workerProfile.hourlyRate}/hr
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedWorker(worker);
                                  setShowMessageDialog(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant={worker.isVerified ? "outline" : "default"}
                                onClick={() => {
                                  setSelectedWorker(worker);
                                  setStatusAction(worker.isVerified ? 'unverify' : 'verify');
                                  setShowStatusDialog(true);
                                }}
                              >
                                {worker.isVerified ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedWorker(worker);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Worker</DialogTitle>
            <DialogDescription>
              Send a message to {selectedWorker?.firstName} {selectedWorker?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusAction === 'verify' ? 'Verify' : 'Unverify'} Worker
            </DialogTitle>
            <DialogDescription>
              {statusAction === 'verify' 
                ? `Verify ${selectedWorker?.firstName} ${selectedWorker?.lastName} as a trusted worker`
                : `Remove verification from ${selectedWorker?.firstName} ${selectedWorker?.lastName}`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for this action (optional)..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              variant={statusAction === 'verify' ? 'default' : 'destructive'}
            >
              {statusAction === 'verify' ? 'Verify Worker' : 'Unverify Worker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Worker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedWorker?.firstName} {selectedWorker?.lastName}? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorker}>
              Delete Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}