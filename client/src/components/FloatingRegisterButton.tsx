import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Zap, User, Wrench } from "lucide-react";
import { SuperFastRegisterForm } from "./SuperFastRegisterForm";
import { RegistrationMascot, useRegistrationMascot } from "./RegistrationMascot";

interface FloatingRegisterButtonProps {
  onRegister?: () => void;
}

export function FloatingRegisterButton({ onRegister }: FloatingRegisterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"client" | "worker" | null>(null);
  const { mascotStep, mascotVisible, hasErrors, updateStep, showError, hideMascot } = useRegistrationMascot();

  const handleRoleSelect = (role: "client" | "worker") => {
    setSelectedRole(role);
    updateStep("personal-info");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedRole(null);
    updateStep("role-selection");
  };

  const handleRegisterComplete = () => {
    updateStep("completion");
    setTimeout(() => {
      onRegister?.();
      handleClose();
    }, 2000);
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

      {/* Registration Mascot */}
      {isOpen && (
        <RegistrationMascot
          currentStep={mascotStep}
          userRole={selectedRole || undefined}
          hasErrors={hasErrors}
          onClose={hideMascot}
          isVisible={mascotVisible}
        />
      )}
    </>
  );
}