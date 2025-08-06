import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobile: string;
  role: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  loginWithOtp: (mobile: string, role: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtp: (mobile: string, otp: string, type: string) => Promise<User | null>;
  signupClient: (data: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  signupWorker: (data: any) => Promise<{ user: User } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
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

  const verifyOtp = async (mobile: string, otp: string, type: string) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp, type }),
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
      const response = await fetch("/api/auth/signup-client", {
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
      const response = await fetch("/api/auth/signup-worker", {
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