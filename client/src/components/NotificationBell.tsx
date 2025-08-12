import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Bell, User, Mail, CreditCard, Camera, FileText, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileUpdate {
  field: string;
  label: string;
  icon: any;
  required: boolean;
  completed: boolean;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Calculate required profile updates
  const getProfileUpdates = (): ProfileUpdate[] => {
    if (!user) return [];

    const updates: ProfileUpdate[] = [];

    // Common updates for all users
    if (!user.lastName || user.lastName === "UPDATE_REQUIRED") {
      updates.push({
        field: "lastName",
        label: "Last Name",
        icon: User,
        required: true,
        completed: false,
      });
    }

    if (!user.email) {
      updates.push({
        field: "email",
        label: "Email Address",
        icon: Mail,
        required: true,
        completed: false,
      });
    }

    if (!user.profilePicture) {
      updates.push({
        field: "profilePicture",
        label: "Profile Picture",
        icon: Camera,
        required: user.role === "worker", // Mandatory for workers
        completed: false,
      });
    }

    // Bank details for both clients and workers
    if (!user.bankAccountNumber || !user.bankIFSC || !user.bankAccountHolderName) {
      updates.push({
        field: "bankDetails",
        label: "Bank Details",
        icon: CreditCard,
        required: true,
        completed: false,
      });
    }

    return updates;
  };

  const profileUpdates = getProfileUpdates();
  const pendingUpdates = profileUpdates.filter(update => !update.completed);
  const requiredUpdates = pendingUpdates.filter(update => update.required);

  if (!user || pendingUpdates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2 hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          {pendingUpdates.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {pendingUpdates.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Profile Updates Required
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {requiredUpdates.length > 0 && (
          <>
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-red-600 mb-2">Required Updates</p>
              {requiredUpdates.map((update) => (
                <DropdownMenuItem key={update.field} className="flex items-center gap-3 py-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                    <update.icon className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{update.label}</p>
                    <p className="text-xs text-gray-500">Required to complete your profile</p>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {pendingUpdates.filter(update => !update.required).length > 0 && (
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-orange-600 mb-2">Optional Updates</p>
            {pendingUpdates
              .filter(update => !update.required)
              .map((update) => (
                <DropdownMenuItem key={update.field} className="flex items-center gap-3 py-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                    <update.icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{update.label}</p>
                    <p className="text-xs text-gray-500">Complete for better experience</p>
                  </div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </DropdownMenuItem>
              ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center text-sm text-blue-600 font-medium">
          <FileText className="w-4 h-4 mr-2" />
          Go to Dashboard to Update
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}