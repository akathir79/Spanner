import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Calendar, MapPin, DollarSign, Clock, User, Briefcase } from "lucide-react";
import type { JobPosting, Bid } from "@shared/schema";

const WorkerJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [bidFormData, setBidFormData] = useState({
    proposedAmount: "",
    estimatedDuration: "",
    proposal: "",
  });
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  // Fetch available job postings
  const { data: jobPostings = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings"],
    select: (data: any) => data.filter((job: any) => job.status === "open"),
  });

  // Fetch worker's bids
  const { data: myBids = [] } = useQuery<Bid[]>({
    queryKey: ["/api/bids/worker", user?.id],
    enabled: !!user?.id,
  });

  // Create bid mutation
  const createBidMutation = useMutation({
    mutationFn: (data: any) => 
      fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your bid has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids/worker", user?.id] });
      setIsBidModalOpen(false);
      setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
      setSelectedJob(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !selectedJob || !bidFormData.proposedAmount || !bidFormData.proposal) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const bidData = {
      jobPostingId: selectedJob.id,
      workerId: user.id,
      proposedAmount: parseFloat(bidFormData.proposedAmount),
      estimatedDuration: bidFormData.estimatedDuration,
      proposal: bidFormData.proposal,
    };

    createBidMutation.mutate(bidData);
  };

  const hasAlreadyBid = (jobId: string) => {
    return myBids.some((bid: any) => bid.jobPostingId === jobId);
  };

  const getBudgetRange = (job: any) => {
    if (job.budgetMin && job.budgetMax) {
      return `₹${job.budgetMin} - ₹${job.budgetMax}`;
    } else if (job.budgetMin) {
      return `₹${job.budgetMin}+`;
    } else if (job.budgetMax) {
      return `Up to ₹${job.budgetMax}`;
    }
    return "Budget TBD";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Jobs</h1>
          <p className="text-muted-foreground">
            Browse and bid on jobs that match your skills
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Jobs */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Opportunities
              </CardTitle>
              <CardDescription>
                {jobPostings.length} open job{jobPostings.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : jobPostings.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs available</h3>
                  <p className="text-muted-foreground">
                    Check back later for new job opportunities!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {jobPostings.map((job: any) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {job.serviceCategory}
                          </p>
                        </div>
                        <Badge variant="outline">{job.status}</Badge>
                      </div>
                      
                      <p className="text-sm line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.district?.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {getBudgetRange(job)}
                        </div>
                        {job.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {job.requirements && job.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.requirements.map((req: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {job.client?.firstName} {job.client?.lastName}
                        </div>
                        
                        {hasAlreadyBid(job.id) ? (
                          <Badge variant="secondary">Bid Submitted</Badge>
                        ) : (
                          <Dialog 
                            open={isBidModalOpen && selectedJob?.id === job.id} 
                            onOpenChange={(open) => {
                              setIsBidModalOpen(open);
                              if (!open) {
                                setSelectedJob(null);
                                setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => setSelectedJob(job)}
                              >
                                Place Bid
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Submit Your Bid</DialogTitle>
                                <DialogDescription>
                                  {job.title}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitBid} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="proposedAmount">Your Bid Amount (₹) *</Label>
                                  <Input
                                    id="proposedAmount"
                                    type="number"
                                    value={bidFormData.proposedAmount}
                                    onChange={(e) => setBidFormData({ ...bidFormData, proposedAmount: e.target.value })}
                                    placeholder="Enter your bid amount"
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                                  <Input
                                    id="estimatedDuration"
                                    value={bidFormData.estimatedDuration}
                                    onChange={(e) => setBidFormData({ ...bidFormData, estimatedDuration: e.target.value })}
                                    placeholder="e.g., 2-3 days, 1 week"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="proposal">Your Proposal *</Label>
                                  <Textarea
                                    id="proposal"
                                    value={bidFormData.proposal}
                                    onChange={(e) => setBidFormData({ ...bidFormData, proposal: e.target.value })}
                                    placeholder="Explain your approach, experience, and why you're the best fit..."
                                    rows={4}
                                    required
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                      setIsBidModalOpen(false);
                                      setSelectedJob(null);
                                      setBidFormData({ proposedAmount: "", estimatedDuration: "", proposal: "" });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    className="flex-1"
                                    disabled={createBidMutation.isPending}
                                  >
                                    {createBidMutation.isPending ? "Submitting..." : "Submit Bid"}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Bids */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Bids
              </CardTitle>
              <CardDescription>
                Track your submitted bids and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myBids.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                  <p className="text-muted-foreground">
                    Start bidding on jobs to see them here!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {myBids.map((bid: any) => (
                    <div key={bid.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{bid.jobPosting?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Client: {bid.jobPosting?.client?.firstName} {bid.jobPosting?.client?.lastName}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            bid.status === "pending" ? "default" :
                            bid.status === "accepted" ? "secondary" :
                            "destructive"
                          }
                        >
                          {bid.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ₹{bid.proposedAmount}
                        </div>
                        {bid.estimatedDuration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {bid.estimatedDuration}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm p-2 bg-muted/50 rounded">
                        {bid.proposal}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkerJobs;