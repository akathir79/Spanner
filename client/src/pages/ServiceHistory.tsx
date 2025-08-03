import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Star, User, DollarSign, Phone, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Booking {
  id: string;
  clientId: string;
  workerId: string;
  serviceCategory: string;
  description: string;
  district: string;
  scheduledDate: string;
  status: string;
  totalAmount: string | null;
  paymentStatus: string;
  clientRating: number | null;
  clientReview: string | null;
  workerRating: number | null;
  workerReview: string | null;
  createdAt: string;
  updatedAt: string;
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    profilePicture: string | null;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    profilePicture: string | null;
  };
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function ServiceHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings/history"],
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No service history</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't booked any services yet. Start by finding a service on the home page.
          </p>
        </div>
      </div>
    );
  }

  const handleRateService = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
    setRating(booking.clientRating || 0);
    setReviewText(booking.clientReview || "");
  };

  const submitReview = async () => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review: reviewText,
        }),
      });

      if (response.ok) {
        setReviewDialogOpen(false);
        setSelectedBooking(null);
        // Refresh bookings
        window.location.reload();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service History</h1>
        <p className="mt-2 text-gray-600">
          Track all your past and current service bookings
        </p>
      </div>

      <div className="space-y-6">
        {bookings.map((booking: Booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{booking.serviceCategory}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(booking.scheduledDate), "MMM dd, yyyy 'at' h:mm a")}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {booking.district}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                    {booking.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  {booking.paymentStatus && (
                    <Badge className={paymentStatusColors[booking.paymentStatus as keyof typeof paymentStatusColors]}>
                      {booking.paymentStatus.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-700">{booking.description}</p>

              {booking.worker && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={booking.worker.profilePicture || undefined} />
                      <AvatarFallback>
                        {booking.worker.firstName[0]}{booking.worker.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {booking.worker.firstName} {booking.worker.lastName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        {booking.worker.mobile}
                      </div>
                    </div>
                  </div>
                  
                  {booking.totalAmount && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-semibold text-lg">
                        <DollarSign className="h-4 w-4" />
                        ₹{booking.totalAmount}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {booking.status === "completed" && (
                <div className="border-t pt-4">
                  {booking.clientRating ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Your Rating:</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (booking.clientRating || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {booking.clientReview && (
                        <p className="text-sm text-gray-600 italic">"{booking.clientReview}"</p>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateService(booking)}
                      className="flex items-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Rate This Service
                    </Button>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400">
                Booked on {format(new Date(booking.createdAt), "MMM dd, yyyy")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Service Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review">Review (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitReview} disabled={rating === 0}>
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}