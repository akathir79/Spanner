import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Zap, User, Wrench } from "lucide-react";
import { SuperFastRegisterForm } from "./SuperFastRegisterForm";
import { RegistrationMascot, useRegistrationMascot } from "./RegistrationMascot";
import { FlyingLoginButton } from "./FlyingLoginButton";

interface FloatingRegisterButtonProps {
  onRegister?: () => void;
}

export function FloatingRegisterButton({ onRegister }: FloatingRegisterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"client" | "worker" | null>(null);
  const [showFlyingLogin, setShowFlyingLogin] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<{mobile: string, role: string} | null>(null);
  const { mascotStep, mascotVisible, hasErrors, updateStep, showError, hideMascot } = useRegistrationMascot();
  
  // Debug logging for mascot
  console.log("Mascot Debug:", { isOpen, mascotStep, mascotVisible, hasErrors, selectedRole });

  const handleRoleSelect = (role: "client" | "worker") => {
    setSelectedRole(role);
    updateStep("personal-info");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedRole(null);
    updateStep("role-selection");
  };

  // Initialize mascot when dialog opens
  useEffect(() => {
    if (isOpen && !selectedRole) {
      updateStep("role-selection");
    }
  }, [isOpen, selectedRole, updateStep]);

  const handleRegisterComplete = (userData?: {mobile: string, role: string}) => {
    updateStep("completion");
    if (userData) {
      setRegisteredUserData(userData);
    }
    setTimeout(() => {
      onRegister?.();
      handleClose();
      // Show flying login button after registration completes
      setShowFlyingLogin(true);
    }, 2000);
  };

  const handleFlyingLoginClick = () => {
    setShowFlyingLogin(false);
    // Open login modal with pre-filled data
    if (registeredUserData) {
      // Dispatch a custom event with the user data to pre-populate the login form
      const event = new CustomEvent('openLoginModal', { 
        detail: { 
          mobile: registeredUserData.mobile, 
          role: registeredUserData.role 
        } 
      });
      window.dispatchEvent(event);
    } else {
      // Fallback: Open regular login modal
      const loginButton = document.querySelector('[data-login-trigger]');
      if (loginButton instanceof HTMLElement) {
        loginButton.click();
      }
    }
  };

  return (
    <>
      {/* Compact Navbar Register Button */}
      <div className="relative">        
        {/* Main Compact Button */}
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg rounded-full px-3 py-2 transform transition-all duration-300 hover:scale-105 animate-pulse"
        >
          <Zap className="w-4 h-4 mr-1.5 animate-bounce" />
          <span className="font-semibold text-sm">Quick Join</span>
          
          {/* Thunder Flash Effect */}
          <div className="absolute inset-0 bg-white opacity-0 rounded-full animate-flash pointer-events-none"></div>
        </Button>
        
        {/* Compact Badge */}
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white animate-bounce text-xs px-1.5 py-0.5">
          Fast!
        </Badge>
      </div>
      {/* Registration Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Registration</DialogTitle>
            <DialogDescription className="sr-only">
              Choose your registration type
            </DialogDescription>
          </DialogHeader>

          {!selectedRole ? (
            <div className="space-y-4 p-4">
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 bg-[#ffeff7]"
                  onClick={() => handleRoleSelect("client")}
                >
                  <User className="w-8 h-8 text-blue-600" />
                  <span className="font-semibold">I Need Services</span>
                  <span className="text-xs text-[#b40bbf]">Register as Client</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200 bg-[#e3e1bf]"
                  onClick={() => handleRoleSelect("worker")}
                >
                  <Wrench className="w-8 h-8 text-green-600" />
                  <span className="font-semibold">I Provide Services</span>
                  <span className="text-xs text-[#e6025b]">Register as Worker</span>
                </Button>
              </div>
            </div>
          ) : (
            <SuperFastRegisterForm
              role={selectedRole}
              onComplete={handleRegisterComplete}
              onBack={() => {
                setSelectedRole(null);
                updateStep("role-selection");
              }}
              onStepChange={updateStep}
              onError={showError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Mascot - Always show when dialog is open */}
      {isOpen && (
        <RegistrationMascot
          currentStep={mascotStep}
          userRole={selectedRole || undefined}
          hasErrors={hasErrors}
          onClose={hideMascot}
          isVisible={true}
        />
      )}

      {/* Flying Login Button - Shows after registration */}
      <FlyingLoginButton
        show={showFlyingLogin}
        onComplete={() => setShowFlyingLogin(false)}
        onLoginClick={handleFlyingLoginClick}
      />
    </>
  );
}