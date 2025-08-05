import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function AuthGuard({ children, allowedRoles, redirectTo = "/" }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasRedirected.current) {
      if (!user) {
        hasRedirected.current = true;
        setLocation(redirectTo);
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        hasRedirected.current = true;
        // Redirect based on user role
        if (user.role === "admin" || user.role === "super_admin") {
          setLocation("/admin-dashboard");
        } else if (user.role === "worker") {
          setLocation("/worker-dashboard");
        } else if (user.role === "client") {
          setLocation("/dashboard");
        } else {
          setLocation(redirectTo);
        }
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, setLocation]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have correct role
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}