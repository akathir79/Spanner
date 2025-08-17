import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, StarIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WorkerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  workerId: string;
  clientId: string;
}

export default function WorkerRatingModal({
  isOpen,
  onClose,
  booking,
  workerId,
  clientId,
}: WorkerRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [workQuality, setWorkQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [review, setReview] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: (reviewData: any) => 
      apiRequest("POST", "/api/reviews", reviewData),
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for rating the worker!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
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

  const handleSubmit = () => {
    const reviewData = {
      bookingId: booking.id,
      workerId,
      clientId,
      rating,
      review: review.trim() || undefined,
      workQualityRating: workQuality,
      timelinessRating: timeliness,
      communicationRating: communication,
      professionalismRating: professionalism,
      wouldRecommend,
    };

    submitReviewMutation.mutate(reviewData);
  };

  const StarRating = ({ 
    value, 
    onChange, 
    category = "" 
  }: { 
    value: number; 
    onChange: (rating: number) => void;
    category?: string;
  }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0 focus:outline-none"
          onMouseEnter={() => {
            setHoveredRating(star);
            setHoveredCategory(category);
          }}
          onMouseLeave={() => {
            setHoveredRating(0);
            setHoveredCategory("");
          }}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hoveredCategory === category ? hoveredRating : value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-sm font-medium">Overall Rating</Label>
            <div className="flex items-center space-x-2 mt-2">
              <StarRating 
                value={rating} 
                onChange={setRating}
                category="overall"
              />
              <span className="text-sm text-muted-foreground">
                ({rating} star{rating !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Work Quality</Label>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating 
                  value={workQuality} 
                  onChange={setWorkQuality}
                  category="quality"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Timeliness</Label>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating 
                  value={timeliness} 
                  onChange={setTimeliness}
                  category="timeliness"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Communication</Label>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating 
                  value={communication} 
                  onChange={setCommunication}
                  category="communication"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Professionalism</Label>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating 
                  value={professionalism} 
                  onChange={setProfessionalism}
                  category="professionalism"
                />
              </div>
            </div>
          </div>

          {/* Written Review */}
          <div>
            <Label htmlFor="review" className="text-sm font-medium">
              Review (Optional)
            </Label>
            <Textarea
              id="review"
              placeholder="Share your experience with this worker..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Recommendation */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="recommend" className="text-sm">
              I would recommend this worker to others
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitReviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={submitReviewMutation.isPending}
            >
              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}