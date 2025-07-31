import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Redirect if already logged in, unless completing bank details
  if (user && !localStorage.getItem("pendingBankDetails")) {
    if (user.role === "super_admin" || user.role === "admin") {
      setLocation("/admin-dashboard");
    } else if (user.role === "worker") {
      setLocation("/worker-dashboard");
    } else {
      setLocation("/dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 pt-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to SPANNER</h1>
          <p className="text-muted-foreground mt-2">
            Tamil Nadu's trusted blue-collar service marketplace
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300" 
                onClick={() => setShowLoginModal(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <LogIn className="h-5 w-5 text-primary" />
                <span>Login to Your Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access your dashboard and manage your services
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => setShowSignupModal(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Create New Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Join as a client or worker to get started
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        mode="login"
      />
      
      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        mode="signup"
      />
    </div>
  );
}
