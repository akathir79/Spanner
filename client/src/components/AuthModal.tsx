import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { TAMIL_NADU_DISTRICTS, SERVICE_CATEGORIES } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, LogIn, Smartphone, Info } from "lucide-react";

const loginSchema = z.object({
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  userType: z.enum(["client", "worker", "admin", "super_admin"]),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const clientSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional(),
  districtId: z.string().min(1, "District is required"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

const workerSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional(),
  aadhaarNumber: z.string().length(12, "Aadhaar number must be 12 digits"),
  primaryService: z.string().min(1, "Primary service is required"),
  experienceYears: z.number().min(0).max(50),
  hourlyRate: z.number().min(0, "Hourly rate must be positive"),
  serviceDistricts: z.array(z.string()).min(1, "Select at least one district"),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [step, setStep] = useState(1);
  const [pendingLogin, setPendingLogin] = useState<{ mobile: string; userType: string } | null>(null);
  const [developmentOtp, setDevelopmentOtp] = useState<string>("");
  const [signupType, setSignupType] = useState<"client" | "worker">("client");
  const { login, verifyOtp, signupClient, signupWorker, isLoading } = useAuth();
  const { t } = useLanguage();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: "",
      userType: "client" as const,
    },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const clientForm = useForm({
    resolver: zodResolver(clientSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      districtId: "",
      termsAccepted: false,
    },
  });

  const workerForm = useForm({
    resolver: zodResolver(workerSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      aadhaarNumber: "",
      primaryService: "",
      experienceYears: 1,
      hourlyRate: 300,
      serviceDistricts: [],
      skills: [],
      termsAccepted: false,
    },
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    const result = await login(data.mobile, data.userType);
    if (result.success) {
      setPendingLogin({ mobile: data.mobile, userType: data.userType });
      setDevelopmentOtp(result.otp || "");
      setStep(2);
    }
  };

  const handleOtpVerify = async (data: z.infer<typeof otpSchema>) => {
    if (!pendingLogin) return;
    
    const result = await verifyOtp(pendingLogin.mobile, data.otp, "login");
    if (result) {
      onClose();
      setStep(1);
      setPendingLogin(null);
    }
  };

  const handleClientSignup = async (data: z.infer<typeof clientSignupSchema>) => {
    const { termsAccepted, ...signupData } = data;
    const result = await signupClient({
      ...signupData,
      role: "client",
    });
    if (result) {
      onClose();
    }
  };

  const handleWorkerSignup = async (data: z.infer<typeof workerSignupSchema>) => {
    const { termsAccepted, ...signupData } = data;
    const result = await signupWorker({
      ...signupData,
      role: "worker",
    });
    if (result) {
      onClose();
    }
  };

  const resetModal = () => {
    setStep(1);
    setPendingLogin(null);
    setDevelopmentOtp("");
    loginForm.reset();
    otpForm.reset();
    clientForm.reset();
    workerForm.reset();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === "login" ? (
              <>
                <LogIn className="h-5 w-5" />
                <span>Login to SPANNER</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Join SPANNER</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === "login" ? (
          <>
            {step === 1 && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="mobile">Mobile Number / Email</Label>
                  <Input
                    id="mobile"
                    placeholder="Enter mobile number or email"
                    {...loginForm.register("mobile")}
                  />
                  {loginForm.formState.errors.mobile && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="userType">User Type</Label>
                  <Select 
                    value={loginForm.watch("userType")} 
                    onValueChange={(value) => loginForm.setValue("userType", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select User Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {loginForm.formState.errors.userType && (
                    <p className="text-sm text-destructive mt-1">
                      {loginForm.formState.errors.userType.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={otpForm.handleSubmit(handleOtpVerify)} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    {...otpForm.register("otp")}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-sm text-destructive mt-1">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                {developmentOtp && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Development OTP: <strong>{developmentOtp}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              </form>
            )}
          </>
        ) : (
          <Tabs value={signupType} onValueChange={(value) => setSignupType(value as "client" | "worker")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="worker">Worker</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <form onSubmit={clientForm.handleSubmit(handleClientSignup)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...clientForm.register("firstName")}
                    />
                    {clientForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {clientForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...clientForm.register("lastName")}
                    />
                    {clientForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {clientForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    placeholder="+91 XXXXX XXXXX"
                    {...clientForm.register("mobile")}
                  />
                  {clientForm.formState.errors.mobile && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.mobile.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    {...clientForm.register("email")}
                  />
                  {clientForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="district">District</Label>
                  <Select 
                    value={clientForm.watch("districtId")} 
                    onValueChange={(value) => clientForm.setValue("districtId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your district" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAMIL_NADU_DISTRICTS.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientForm.formState.errors.districtId && (
                    <p className="text-sm text-destructive mt-1">
                      {clientForm.formState.errors.districtId.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={clientForm.watch("termsAccepted")}
                    onCheckedChange={(checked) => clientForm.setValue("termsAccepted", !!checked)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
                {clientForm.formState.errors.termsAccepted && (
                  <p className="text-sm text-destructive">
                    {clientForm.formState.errors.termsAccepted.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="worker">
              <form onSubmit={workerForm.handleSubmit(handleWorkerSignup)} className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workerFirstName">First Name</Label>
                    <Input
                      id="workerFirstName"
                      {...workerForm.register("firstName")}
                    />
                    {workerForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workerLastName">Last Name</Label>
                    <Input
                      id="workerLastName"
                      {...workerForm.register("lastName")}
                    />
                    {workerForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workerMobile">Mobile Number</Label>
                    <Input
                      id="workerMobile"
                      placeholder="+91 XXXXX XXXXX"
                      {...workerForm.register("mobile")}
                    />
                    {workerForm.formState.errors.mobile && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.mobile.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="workerEmail">Email Address (Optional)</Label>
                    <Input
                      id="workerEmail"
                      type="email"
                      {...workerForm.register("email")}
                    />
                    {workerForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <Input
                    id="aadhaar"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                    {...workerForm.register("aadhaarNumber")}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Required for identity verification</p>
                  {workerForm.formState.errors.aadhaarNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.aadhaarNumber.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryService">Primary Service</Label>
                    <Select 
                      value={workerForm.watch("primaryService")} 
                      onValueChange={(value) => workerForm.setValue("primaryService", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary service" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {workerForm.formState.errors.primaryService && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.primaryService.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      max="50"
                      {...workerForm.register("experienceYears", { valueAsNumber: true })}
                    />
                    {workerForm.formState.errors.experienceYears && (
                      <p className="text-sm text-destructive mt-1">
                        {workerForm.formState.errors.experienceYears.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    placeholder="300"
                    {...workerForm.register("hourlyRate", { valueAsNumber: true })}
                  />
                  {workerForm.formState.errors.hourlyRate && (
                    <p className="text-sm text-destructive mt-1">
                      {workerForm.formState.errors.hourlyRate.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workerTerms"
                    checked={workerForm.watch("termsAccepted")}
                    onCheckedChange={(checked) => workerForm.setValue("termsAccepted", !!checked)}
                  />
                  <Label htmlFor="workerTerms" className="text-sm">
                    I agree to background verification and platform terms
                  </Label>
                </div>
                {workerForm.formState.errors.termsAccepted && (
                  <p className="text-sm text-destructive">
                    {workerForm.formState.errors.termsAccepted.message}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
