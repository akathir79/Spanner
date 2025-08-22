import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, X, Smartphone, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export default function AuthenticationModal({
  isOpen,
  onClose,
  defaultMode = "login"
}: AuthenticationModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(defaultMode);
  const [userType, setUserType] = useState<"client" | "worker">("client");
  const [authMethod, setAuthMethod] = useState<"mobile" | "email" | "password">("mobile");
  
  // Form fields
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Additional signup fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const { toast } = useToast();
  const { login, loginWithOtp, verifyOtp, signupClient, signupWorker } = useAuth();
  const [, setLocation] = useLocation();

  const resetForm = () => {
    setMobile("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setFirstName("");
    setLastName("");
    setOtpSent(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    setMode(defaultMode);
    setUserType("client");
    setAuthMethod("mobile");
    onClose();
  };

  const validateMobile = (mobile: string) => {
    return /^[6-9]\d{9}$/.test(mobile);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOTP = async () => {
    if (authMethod === "mobile" && !validateMobile(mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (authMethod === "email" && !validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const identifier = authMethod === "mobile" ? mobile : email;
      const result = await loginWithOtp(identifier, userType);
      
      if (result.success) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: `Verification code sent to your ${authMethod}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const identifier = authMethod === "mobile" ? mobile : email;
      const user = await verifyOtp(identifier, otp, mode);
      
      if (user) {
        login(user);
        toast({
          title: "Success",
          description: `${mode === "login" ? "Logged in" : "Account created"} successfully!`,
        });
        handleClose();
        setLocation('/dashboard');
      } else {
        toast({
          title: "Invalid OTP",
          description: "Please check your OTP and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Verification failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (authMethod === "mobile" && !validateMobile(mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (authMethod === "email" && !validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const identifier = authMethod === "mobile" ? mobile : email;
      const user = await verifyOtp(identifier, password, "password");
      
      if (user) {
        login(user);
        toast({
          title: "Login Successful",
          description: "Welcome back to SPANNER!",
        });
        handleClose();
        setLocation('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!firstName || !lastName) {
      toast({
        title: "Missing Information",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }

    if (authMethod === "mobile" && !validateMobile(mobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    if (authMethod === "email" && !validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (authMethod === "password" && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (authMethod === "password" && password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const signupData = {
        firstName,
        lastName,
        mobile: authMethod === "mobile" ? mobile : "",
        email: authMethod === "email" ? email : "",
        password: authMethod === "password" ? password : "",
        userType,
      };

      const result = userType === "client" 
        ? await signupClient(signupData)
        : await signupWorker(signupData);

      if (result && result.user) {
        login(result.user);
        toast({
          title: "Account Created",
          description: "Welcome to SPANNER!",
        });
        handleClose();
        setLocation('/dashboard');
      } else {
        toast({
          title: "Signup Failed",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Signup failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    toast({
      title: "Coming Soon",
      description: "Google authentication will be available soon",
    });
  };

  const renderAuthMethodContent = () => {
    if (mode === "forgot") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="reset-identifier">
              {authMethod === "mobile" ? "Mobile Number" : "Email Address"}
            </Label>
            <div className="flex mt-1">
              {authMethod === "mobile" ? (
                <>
                  <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg">
                    <span className="text-sm font-medium text-gray-600">+91</span>
                  </div>
                  <Input
                    id="reset-identifier"
                    type="tel"
                    placeholder="Mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="rounded-l-none border-gray-300"
                  />
                </>
              ) : (
                <Input
                  id="reset-identifier"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300"
                />
              )}
            </div>
          </div>

          {otpSent && (
            <div>
              <Label htmlFor="reset-otp">Verification Code</Label>
              <Input
                id="reset-otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="border-gray-300 text-center tracking-widest font-mono mt-1"
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Name fields for signup */}
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border-gray-300 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border-gray-300 mt-1"
              />
            </div>
          </div>
        )}

        {/* Mobile/Email input */}
        <div>
          <Label htmlFor="identifier">
            {authMethod === "mobile" ? "Mobile Number" : "Email Address"}
          </Label>
          <div className="flex mt-1">
            {authMethod === "mobile" ? (
              <>
                <div className="flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 rounded-l-lg">
                  <span className="text-sm font-medium text-gray-600">+91</span>
                </div>
                <Input
                  id="identifier"
                  type="tel"
                  placeholder="Mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="rounded-l-none border-gray-300"
                />
              </>
            ) : (
              <Input
                id="identifier"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-300"
              />
            )}
          </div>
        </div>

        {/* Password field */}
        {authMethod === "password" && (
          <div className="relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-gray-300 pr-10 mt-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-7 h-auto p-1 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Confirm Password for signup */}
        {mode === "signup" && authMethod === "password" && (
          <div className="relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-gray-300 pr-10 mt-1"
            />
          </div>
        )}

        {/* OTP field */}
        {(authMethod !== "password" && otpSent) && (
          <div>
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="border-gray-300 text-center tracking-widest font-mono mt-1"
            />
          </div>
        )}
      </div>
    );
  };

  const getActionButton = () => {
    if (mode === "forgot") {
      if (otpSent) {
        return (
          <Button
            onClick={handleVerifyOTP}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
          >
            {isLoading ? "Verifying..." : "Reset Password"}
          </Button>
        );
      } else {
        return (
          <Button
            onClick={handleSendOTP}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
          >
            {isLoading ? "Sending..." : "Send Reset Code"}
          </Button>
        );
      }
    }

    if (mode === "signup") {
      if (authMethod === "password") {
        return (
          <Button
            onClick={handleSignup}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        );
      } else {
        if (otpSent) {
          return (
            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
            >
              {isLoading ? "Verifying..." : "Create Account"}
            </Button>
          );
        } else {
          return (
            <Button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          );
        }
      }
    }

    // Login mode
    if (authMethod === "password") {
      return (
        <Button
          onClick={handlePasswordAuth}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      );
    } else {
      if (otpSent) {
        return (
          <Button
            onClick={handleVerifyOTP}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        );
      } else {
        return (
          <Button
            onClick={handleSendOTP}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>
        );
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl" aria-describedby="auth-modal-description">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900" id="auth-modal-title">
              {mode === "login" ? "Login to SPANNER" : 
               mode === "signup" ? "Join SPANNER" : 
               "Reset Password"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <p id="auth-modal-description" className="sr-only">
          Authentication modal for {mode === "login" ? "logging into" : mode === "signup" ? "signing up for" : "resetting password for"} SPANNER
        </p>

        <div className="space-y-6">
          {/* User Type Selection */}
          {mode !== "forgot" && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Login As</Label>
              <RadioGroup 
                value={userType} 
                onValueChange={(value: "client" | "worker") => setUserType(value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="client" id="client" className="text-blue-500" />
                  <Label htmlFor="client" className="text-sm text-gray-700 font-normal">
                    Client (Need Services)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="worker" id="worker" className="text-blue-500" />
                  <Label htmlFor="worker" className="text-sm text-gray-700 font-normal">
                    Worker (Provide Services)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Authentication Method Tabs */}
          {mode !== "forgot" && (
            <Tabs value={authMethod} onValueChange={(value: string) => setAuthMethod(value as "mobile" | "email" | "password")}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="mobile" className="flex items-center space-x-1 text-xs">
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center space-x-1 text-xs">
                  <Mail className="w-3 h-3" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="password" className="flex items-center space-x-1 text-xs">
                  <Lock className="w-3 h-3" />
                  <span>Password</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mobile" className="mt-4">
                <Label className="text-sm text-gray-600 mb-3 block">Mobile Number / Email</Label>
                {renderAuthMethodContent()}
              </TabsContent>

              <TabsContent value="email" className="mt-4">
                <Label className="text-sm text-gray-600 mb-3 block">Mobile Number / Email</Label>
                {renderAuthMethodContent()}
              </TabsContent>

              <TabsContent value="password" className="mt-4">
                <Label className="text-sm text-gray-600 mb-3 block">Mobile Number / Email</Label>
                {renderAuthMethodContent()}
              </TabsContent>
            </Tabs>
          )}

          {/* Forgot Password Mode */}
          {mode === "forgot" && (
            <div>
              <Label className="text-sm text-gray-600 mb-3 block">
                Enter your {authMethod === "mobile" ? "mobile number" : "email address"} to reset password
              </Label>
              {renderAuthMethodContent()}
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-4">
            {getActionButton()}

            {/* Google Sign In */}
            {mode !== "forgot" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full py-2.5 border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-2 text-sm">
            {mode === "login" && (
              <div className="flex justify-between">
                <Button
                  variant="link"
                  onClick={() => { setMode("signup"); resetForm(); }}
                  className="p-0 h-auto text-blue-500 hover:text-blue-600"
                >
                  Sign Up
                </Button>
                <Button
                  variant="link"
                  onClick={() => { setMode("forgot"); resetForm(); }}
                  className="p-0 h-auto text-blue-500 hover:text-blue-600"
                >
                  Forgot ID/Password
                </Button>
              </div>
            )}

            {mode === "signup" && (
              <div className="text-center">
                <span className="text-gray-600">Already have an account? </span>
                <Button
                  variant="link"
                  onClick={() => { setMode("login"); resetForm(); }}
                  className="p-0 h-auto text-blue-500 hover:text-blue-600"
                >
                  Login
                </Button>
              </div>
            )}

            {mode === "forgot" && (
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => { setMode("login"); resetForm(); }}
                  className="p-0 h-auto text-blue-500 hover:text-blue-600"
                >
                  Back to Login
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500 leading-relaxed">
              By continuing, you agree to SPANNER's{' '}
              <Button variant="link" className="p-0 h-auto text-xs text-blue-500 underline">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="p-0 h-auto text-xs text-blue-500 underline">
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}