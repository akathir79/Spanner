import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  mobile: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: "client" | "worker" | "admin" | "super_admin";
  districtId?: string;
  isVerified: boolean;
  status?: string; // pending, approved, rejected
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (mobile: string, userType: string) => Promise<{ success: boolean; otp?: string }>;
  verifyOtp: (mobile: string, otp: string, purpose: string) => Promise<boolean>;
  signupClient: (data: any) => Promise<boolean>;
  signupWorker: (data: any) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (mobile: string, userType: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/send-otp", {
        mobile,
        userType,
        role: userType !== "auto" ? userType : undefined,
      });
      
      const data = await response.json();
      toast({
        title: "OTP Sent",
        description: "Please check your mobile for the OTP code.",
      });
      
      return { success: true, otp: data.otp };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (mobile: string, otp: string, purpose: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        mobile,
        otp,
        purpose,
      });
      
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast({
        title: "Login Successful",
        description: "Welcome to SPANNER!",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signupClient = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/signup/client", data);
      const result = await response.json();
      
      setUser(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
      
      // Redirect to client dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
      return true;
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWorker = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/signup/worker", data);
      const result = await response.json();
      
      setUser(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
      
      // Don't show toast or redirect here - let the calling component handle it
      // Return the full result object so AuthModal can access user.id
      return result;
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear local storage and navigate directly without state updates
    localStorage.removeItem("user");
    // Direct navigation to home page with complete page replacement
    window.location.replace("/");
  };

  const value = {
    user,
    login,
    verifyOtp,
    signupClient,
    signupWorker,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
