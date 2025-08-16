import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, ThumbsUp, Clock, MessageSquare, User, CheckCircle } from "lucide-react";

interface ReviewModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

const REVIEW_TAGS = [
  "Punctual", "Skilled", "Polite", "Professional", "Efficient", 
  "Clean Work", "Good Communication", "Fair Pricing", "Reliable", "Experienced"
];

export const ReviewModal = ({ booking, isOpen, onClose }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [workQualityRating, setWorkQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add null check for booking
  if (!booking) {
    return null;
  }

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const reviewData = {
        workerId: booking.workerId,
        clientId: booking.clientId,
        overallRating: rating,
        workQualityRating,
        timelinessRating,
        communicationRating,
        professionalismRating,
        reviewText: review.trim() || undefined,
      };
      
      return apiRequest(`/api/bookings/${booking.id}/review`, "POST", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback! Your review helps other clients make informed decisions.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleStarClick = (starRating: number, setter: (rating: number) => void) => {
    setter(starRating);
  };

  const renderStarRating = (currentRating: number, setter: (rating: number) => void, label: string) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star, setter)}
            className="focus:outline-none"
            data-testid={`star-${label.toLowerCase().replace(/\s+/g, '-')}-${star}`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= currentRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              } hover:fill-yellow-400 hover:text-yellow-400 transition-colors`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating for the worker",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            Help other clients by sharing your experience with this service
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Job Details */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-sm">Job Completed</span>
            </div>
            <p className="text-sm"><strong>Service:</strong> {booking.serviceCategory}</p>
            <p className="text-sm"><strong>Date:</strong> {new Date(booking.scheduledDate).toLocaleDateString()}</p>
          </div>

          {/* Overall Rating */}
          <div className="space-y-3">
            {renderStarRating(rating, setRating, "Overall Rating *")}
          </div>

          <Separator />

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Rate Different Aspects (Optional)</h4>
            <div className="grid grid-cols-1 gap-4">
              {renderStarRating(workQualityRating, setWorkQualityRating, "Work Quality")}
              {renderStarRating(timelinessRating, setTimelinessRating, "Timeliness")}
              {renderStarRating(communicationRating, setCommunicationRating, "Communication")}
              {renderStarRating(professionalismRating, setProfessionalismRating, "Professionalism")}
            </div>
          </div>

          <Separator />

          {/* Review Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What stood out? (Select all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleTagToggle(tag)}
                  data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor="review-text" className="text-sm font-medium">
              Share Your Experience (Optional)
            </Label>
            <Textarea
              id="review-text"
              placeholder="Tell other clients about your experience with this worker..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              maxLength={500}
              data-testid="textarea-review"
            />
            <div className="text-xs text-muted-foreground text-right">
              {review.length}/500 characters
            </div>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Would you recommend this worker?</Label>
              <p className="text-xs text-muted-foreground">This helps other clients make decisions</p>
            </div>
            <Switch
              checked={wouldRecommend}
              onCheckedChange={setWouldRecommend}
              data-testid="switch-recommend"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={submitReviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitReviewMutation.isPending}
              data-testid="button-submit-review"
            >
              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;