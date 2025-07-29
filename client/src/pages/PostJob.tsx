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
import { Calendar, MapPin, DollarSign, Clock, Users, Plus } from "lucide-react";
import type { District, ServiceCategory, JobPosting, Bid } from "@shared/schema";

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

  // Fetch districts and service categories
  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ["/api/districts"],
  });

  const { data: services = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/services"],
  });

  // Fetch client's job postings
  const { data: jobPostings = [] } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings/client", user?.id],
    enabled: !!user?.id,
  });

  // Create job posting mutation
  const createJobMutation = useMutation({
    mutationFn: (data: any) => 
      fetch("/api/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
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
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
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
                <p className="text-muted-foreground text-center py-8">
                  No job postings yet. Create your first job posting to get started!
                </p>
              ) : (
                jobPostings.map((job: any) => (
                  <div key={job.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{job.title}</h3>
                      <Badge 
                        variant={
                          job.status === "open" ? "default" :
                          job.status === "in_progress" ? "secondary" :
                          job.status === "completed" ? "outline" : "destructive"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {districts.find(d => d.id === job.districtId)?.name}
                      </div>
                      {job.budgetMin && job.budgetMax && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ₹{job.budgetMin} - ₹{job.budgetMax}
                        </div>
                      )}
                      {job.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(job.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm">
                        View Bids
                      </Button>
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