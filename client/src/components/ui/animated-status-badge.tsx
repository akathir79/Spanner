import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle, Shield, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStatusBadgeProps {
  status: "pending" | "verified" | "approved" | "rejected" | "suspended" | "unknown";
  previousStatus?: "pending" | "verified" | "approved" | "rejected" | "suspended" | "unknown";
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AnimatedStatusBadge({ 
  status, 
  previousStatus, 
  className, 
  showIcon = true, 
  size = "md" 
}: AnimatedStatusBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayStatus, setDisplayStatus] = useState(status);

  // Trigger animation when status changes (exclude approved and suspended status)
  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      // Don't animate when transitioning to approved or suspended status
      if (status === "approved" || status === "suspended") {
        setDisplayStatus(status);
        setIsAnimating(false);
        return;
      }
      
      setIsAnimating(true);
      
      // Start transition after brief delay
      const timer = setTimeout(() => {
        setDisplayStatus(status);
      }, 150);

      // End animation
      const endTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(endTimer);
      };
    } else {
      setDisplayStatus(status);
    }
  }, [status, previousStatus]);

  const getStatusConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return {
          variant: "secondary" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700",
          icon: <Clock className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5")} />,
          label: "Pending",
          pulseColor: "bg-yellow-400"
        };
      case "verified":
        return {
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700",
          icon: <Shield className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5")} />,
          label: "Verified",
          pulseColor: "bg-blue-400"
        };
      case "approved":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-700",
          icon: <CheckCircle className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5")} />,
          label: "Approved",
          pulseColor: "bg-green-400"
        };
      case "rejected":
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200 dark:border-red-700",
          icon: <XCircle className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5")} />,
          label: "Rejected",
          pulseColor: "bg-red-400"
        };
      case "suspended":
        return {
          variant: "destructive" as const,
          className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-700",
          icon: <Ban className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5")} />,
          label: "Suspended",
          pulseColor: "bg-orange-400"
        };
      default:
        return {
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-600",
          icon: <AlertCircle className={cn("flex-shrink-0", size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5")} />,
          label: "Unknown",
          pulseColor: "bg-gray-400"
        };
    }
  };

  const config = getStatusConfig(displayStatus);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm"
  };

  return (
    <div className="relative inline-flex">
      <Badge
        variant={config.variant}
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-in-out",
          sizeClasses[size],
          config.className,
          isAnimating && "scale-105 shadow-lg",
          className
        )}
      >
        {/* Animated background pulse during status change */}
        {isAnimating && (
          <div className={cn(
            "absolute inset-0 opacity-30 animate-pulse",
            config.pulseColor
          )} />
        )}
        
        {/* Content */}
        <div className={cn(
          "relative flex items-center gap-1.5 transition-all duration-200",
          isAnimating && "animate-pulse"
        )}>
          {showIcon && config.icon}
          <span className="font-medium">{config.label}</span>
        </div>


      </Badge>

      {/* Status change indicator dot */}
      {isAnimating && (
        <div className={cn(
          "absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping",
          config.pulseColor
        )} />
      )}
    </div>
  );
}



// Hook to track status changes
export function useStatusTransition(currentStatus: string) {
  const [previousStatus, setPreviousStatus] = useState<string>(currentStatus);

  useEffect(() => {
    if (currentStatus !== previousStatus) {
      setPreviousStatus(currentStatus);
    }
  }, [currentStatus, previousStatus]);

  return previousStatus;
}