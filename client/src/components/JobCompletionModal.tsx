import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface JobCompletionModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  userRole: "client" | "worker";
}

export const JobCompletionModal = ({ booking, isOpen, onClose, userRole }: JobCompletionModalProps) => {
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Worker marks job as complete
  const workerCompleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/bookings/${booking.id}/worker-complete`, "POST", {
        workerId: booking.workerId,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Job Marked Complete",
        description: "OTP has been sent to the client for verification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark job as complete",
        variant: "destructive",
      });
    },
  });

  // Client verifies completion OTP
  const verifyCompletionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/bookings/${booking.id}/verify-completion`, "POST", {
        clientId: booking.clientId,
        otp: otp.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Completed Successfully!",
        description: "The job has been marked as completed. You can now rate the worker.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: error.message || "Please check the OTP and try again",
        variant: "destructive",
      });
    },
  });

  const handleWorkerComplete = () => {
    workerCompleteMutation.mutate();
  };

  const handleClientVerify = () => {
    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    verifyCompletionMutation.mutate();
  };

  const renderWorkerView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Mark Job as Complete</h3>
        <p className="text-sm text-muted-foreground">
          Once you mark this job as complete, an OTP will be sent to the client for verification.
        </p>
      </div>
      
      {booking && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="font-medium">Job Details</span>
          </div>
          <p className="text-sm"><strong>Service:</strong> {booking.serviceCategory}</p>
          <p className="text-sm"><strong>Description:</strong> {booking.description}</p>
          <p className="text-sm"><strong>Date:</strong> {new Date(booking.scheduledDate).toLocaleDateString()}</p>
        </div>
      )}

      <div className="flex space-x-2 justify-end">
        <Button variant="outline" onClick={onClose} disabled={workerCompleteMutation.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleWorkerComplete} 
          disabled={workerCompleteMutation.isPending}
          data-testid="button-complete-job"
        >
          {workerCompleteMutation.isPending ? "Marking Complete..." : "Mark as Complete"}
        </Button>
      </div>
    </div>
  );

  const renderClientView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Verify Job Completion</h3>
        <p className="text-sm text-muted-foreground">
          Enter the OTP sent to your phone to confirm the job is completed.
        </p>
      </div>
      
      {booking && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium">Worker has marked job as complete</span>
          </div>
          <p className="text-sm"><strong>Service:</strong> {booking.serviceCategory}</p>
          <p className="text-sm"><strong>Worker:</strong> {booking.worker?.firstName} {booking.worker?.lastName}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="completion-otp">Completion OTP</Label>
        <Input
          id="completion-otp"
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          data-testid="input-completion-otp"
        />
        <p className="text-xs text-muted-foreground">
          OTP is valid for 15 minutes. Check your SMS for the verification code.
        </p>
      </div>

      <div className="flex space-x-2 justify-end">
        <Button variant="outline" onClick={onClose} disabled={verifyCompletionMutation.isPending}>
          Cancel
        </Button>
        <Button 
          onClick={handleClientVerify} 
          disabled={verifyCompletionMutation.isPending}
          data-testid="button-verify-completion"
        >
          {verifyCompletionMutation.isPending ? "Verifying..." : "Verify Completion"}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {userRole === "worker" ? "Complete Job" : "Verify Job Completion"}
          </DialogTitle>
          <DialogDescription>
            {userRole === "worker" 
              ? "Mark this job as completed and notify the client."
              : "Verify the job completion with the OTP sent to your phone."
            }
          </DialogDescription>
        </DialogHeader>
        
        {userRole === "worker" ? renderWorkerView() : renderClientView()}
      </DialogContent>
    </Dialog>
  );
};

export default JobCompletionModal;