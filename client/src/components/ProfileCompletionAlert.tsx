import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, User, Mail, CreditCard, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileField {
  field: string;
  label: string;
  icon: any;
  completed: boolean;
  required: boolean;
}

export function ProfileCompletionAlert() {
  const { user } = useAuth();

  if (!user) return null;

  // Calculate profile completion
  const getProfileFields = (): ProfileField[] => {
    const fields: ProfileField[] = [];

    // Last Name
    fields.push({
      field: "lastName",
      label: "Last Name",
      icon: User,
      completed: !!(user.lastName && user.lastName !== "UPDATE_REQUIRED"),
      required: true,
    });

    // Email
    fields.push({
      field: "email",
      label: "Email Address",
      icon: Mail,
      completed: !!user.email,
      required: true,
    });

    // Profile Picture (mandatory for workers)
    fields.push({
      field: "profilePicture",
      label: "Profile Picture",
      icon: Camera,
      completed: !!user.profilePicture,
      required: user.role === "worker",
    });

    // Bank Details
    fields.push({
      field: "bankDetails",
      label: "Bank Details",
      icon: CreditCard,
      completed: !!(user.bankAccountNumber && user.bankIFSC && user.bankAccountHolderName),
      required: true,
    });

    return fields;
  };

  const profileFields = getProfileFields();
  const completedFields = profileFields.filter(field => field.completed);
  const requiredFields = profileFields.filter(field => field.required);
  const completedRequired = requiredFields.filter(field => field.completed);
  
  const progressPercent = Math.round((completedFields.length / profileFields.length) * 100);
  const isCompleteProfile = completedRequired.length === requiredFields.length;

  if (isCompleteProfile) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Profile Complete!</AlertTitle>
        <AlertDescription className="text-green-700">
          Your profile is fully updated and ready to use all platform features.
        </AlertDescription>
      </Alert>
    );
  }

  const missingRequired = requiredFields.filter(field => !field.completed);

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-6">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 flex items-center gap-2">
        Complete Your Profile
        <Badge variant="secondary" className="bg-orange-200 text-orange-800">
          {progressPercent}% Complete
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-orange-700 space-y-4">
        <p>Please complete the missing information to unlock all features.</p>
        
        <Progress value={progressPercent} className="w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {missingRequired.map((field) => (
            <div key={field.field} className="flex items-center gap-2 text-sm">
              <field.icon className="w-4 h-4 text-orange-600" />
              <span>{field.label}</span>
              <Badge variant="outline" size="sm" className="text-xs border-red-300 text-red-600">
                Required
              </Badge>
            </div>
          ))}
        </div>
        
        <Button 
          size="sm" 
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => {
            // Scroll to the first missing required field or show profile update modal
            const firstMissing = missingRequired[0];
            if (firstMissing) {
              // You can expand this to scroll to specific form sections
              const element = document.getElementById(`field-${firstMissing.field}`);
              element?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Update Profile Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}