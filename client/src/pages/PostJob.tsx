import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";
import { Calendar, MapPin, DollarSign, Clock, Users, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { ServiceCategory, JobPosting, Bid } from "@shared/schema";
import { normalizeServiceName } from "@shared/serviceUtils";

const PostJob = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    serviceCategory: "",
    districtId: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    requirements: [] as string[],
  });

  const [newRequirement, setNewRequirement] = useState("");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Fetch districts and service categories  
  const { data: districtsData } = useQuery({
    queryKey: ["/api/districts"],
  });

  // Transform districts data into array format
  const districts = districtsData ? 
    Object.entries(districtsData).flatMap(([state, stateData]: [string, any]) => 
      stateData.districts.map((districtName: string, index: number) => ({
        id: `${state}-${index}`,
        name: districtName,
        state: state
      }))
    ) : [];

  const { data: rawServices = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/services"],
  });

  // Remove duplicate services by name (fallback protection)
  const services = rawServices && rawServices.length > 0 ? 
    rawServices.filter((service, index, arr) => 
      arr.findIndex(s => s.name === service.name) === index
    ) : [];

  // Fetch client's job postings
  const { data: jobPostings = [] } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings/client", user?.id],
    enabled: !!user?.id,
  });

  // Create job posting mutation
  const createJobMutation = useMutation({
    mutationFn: (data: any) => {
      // Normalize service category before sending
      const normalizedData = {
        ...data,
        serviceCategory: normalizeServiceName(data.serviceCategory)
      };
      return fetch("/api/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posted successfully! Workers can now bid on your job.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
      // Reset form
      setFormData({
        title: "",
        description: "",
        serviceCategory: "",
        districtId: "",
        budgetMin: "",
        budgetMax: "",
        deadline: "",
        requirements: [],
      });
      setNewRequirement("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete job posting mutation
  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => {
      return fetch(`/api/job-postings/${jobId}`, {
        method: "DELETE",
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posting deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings/client", user?.id] });
      setDeletingJobId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete job posting. Please try again.",
        variant: "destructive",
      });
      setDeletingJobId(null);
    },
  });

  const handleDeleteJob = (jobId: string) => {
    setDeletingJobId(jobId);
    deleteJobMutation.mutate(jobId);
    setJobToDelete(null);
  };

  const confirmDelete = (jobId: string) => {
    setJobToDelete(jobId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !formData.title || !formData.description || !formData.serviceCategory || !formData.districtId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const jobData = {
      clientId: user.id,
      title: formData.title,
      description: formData.description,
      serviceCategory: formData.serviceCategory,
      districtId: formData.districtId,
      budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
      budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
      deadline: formData.deadline ? new Date(formData.deadline) : null,
      requirements: formData.requirements,
    };

    createJobMutation.mutate(jobData);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post a Job</h1>
          <p className="text-muted-foreground">
            Get competitive bids from skilled workers across Tamil Nadu
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Posting Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Job Posting
            </CardTitle>
            <CardDescription>
              Describe your project and get bids from qualified workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Fix kitchen plumbing leak"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Service Category *</Label>
                <Select
                  value={formData.serviceCategory}
                  onValueChange={(value) => setFormData({ ...formData, serviceCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service, index) => (
                      <SelectItem key={`${service.name}-${index}`} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Select
                  value={formData.districtId}
                  onValueChange={(value) => setFormData({ ...formData, districtId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the work in detail, including any specific requirements..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Min Budget (₹)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Max Budget (₹)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="2000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Requirements (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add a requirement..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} size="sm">
                    Add
                  </Button>
                </div>
                {formData.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.requirements.map((req, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => removeRequirement(index)}
                      >
                        {req} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Job Postings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Job Postings
            </CardTitle>
            <CardDescription>
              Track your posted jobs and received bids
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobPostings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
                    <Users className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">No job postings yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Create your first job posting to connect with skilled workers in your area.
                  </p>
                </div>
              ) : (
                jobPostings.map((job: any) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                          <p className="text-sm text-indigo-600 font-medium capitalize mt-1">
                            {job.serviceCategory}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={`px-3 py-1.5 text-sm font-medium ${
                          job.status === "open" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                          job.status === "in_progress" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                          job.status === "completed" ? "bg-gray-100 text-gray-700 border border-gray-200" : 
                          "bg-red-100 text-red-700 border border-red-200"
                        }`}
                        variant="outline"
                      >
                        {job.status === "open" ? "Open" :
                         job.status === "in_progress" ? "In Progress" :
                         job.status === "completed" ? "Completed" : job.status}
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                    
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          Requirements:
                        </h4>
                        <ul className="space-y-1">
                          {job.requirements.map((req: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start bg-blue-50 rounded-lg p-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{job.district || districts.find(d => d.id === job.districtId)?.name}</span>
                      </div>
                      {job.budgetMin && job.budgetMax && (
                        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium">₹{job.budgetMin} - ₹{job.budgetMax}</span>
                        </div>
                      )}
                      {job.deadline && (
                        <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">{new Date(job.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 transition-colors">
                          <Users className="h-4 w-4 mr-1" />
                          View Bids
                        </Button>
                        <AlertDialog open={jobToDelete === job.id} onOpenChange={() => setJobToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors"
                              disabled={deletingJobId === job.id}
                              onClick={() => confirmDelete(job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this job posting? This action cannot be undone and will remove all associated bids.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setJobToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteJob(job.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostJob;