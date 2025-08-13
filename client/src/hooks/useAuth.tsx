import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { ReactNode } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobile: string;
  role: string;
  profilePicture?: string;
  address?: string;
  houseNumber?: string;
  streetName?: string;
  areaName?: string;
  state?: string;
  district?: string;
  pincode?: string;
  fullAddress?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  bankMICR?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loginWithOtp: (mobile: string, role: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtp: (mobile: string, otp: string, purpose: string) => Promise<User | null>;
  signupClient: (data: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  signupWorker: (data: any) => Promise<{ user: User } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Redirect to home page after logout
    setLocation("/");
  };

  const loginWithOtp = async (mobile: string, role: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, role }),
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, otp: result.otp };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const verifyOtp = async (mobile: string, otp: string, purpose: string) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp, purpose }),
      });

      const result = await response.json();
      
      if (response.ok && result.user) {
        login(result.user);
        return result.user;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const signupClient = async (data: any) => {
    try {
      const response = await fetch("/api/auth/signup/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok && result.user) {
        login(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.message || "Registration failed" };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const signupWorker = async (data: any) => {
    try {
      const response = await fetch("/api/auth/signup/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok && result.user) {
        login(result.user);
        return { user: result.user };
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return false;
    
    try {
      console.log("🔄 Refreshing user profile...");
      const response = await fetch(`/api/user/refresh/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("🔄 Fresh user data from server:", data.user);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("✅ User profile refreshed successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    loginWithOtp,
    verifyOtp,
    signupClient,
    signupWorker,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}