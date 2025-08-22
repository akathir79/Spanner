/**
 * SPANNER Mobile App - Type Definitions
 * Mirrors the types from your existing backend
 */

// User types (from your existing backend)
export interface User {
  id: string;
  email: string | null;
  mobile: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'worker' | 'admin' | 'super_admin';
  profilePicture: string | null;
  district: string | null;
  state: string | null;
  houseNumber: string | null;
  streetName: string | null;
  areaName: string | null;
  pincode: string | null;
  fullAddress: string | null;
  // Worker-specific fields
  experience: string | null;
  skills: string | null;
  serviceAreas: string | null;
  bankAccountNumber: string | null;
  bankIFSC: string | null;
  bankAccountHolderName: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service category types
export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking types
export interface Booking {
  id: string;
  clientId: string;
  workerId: string | null;
  serviceId: string;
  districtId: string;
  title: string;
  description: string;
  scheduledDate: Date;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  clientRating: number | null;
  clientReview: string | null;
  workerRating: number | null;
  workerReview: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Job posting types
export interface JobPosting {
  id: string;
  clientId: string;
  serviceId: string;
  districtId: string;
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  requirements: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Bid types
export interface Bid {
  id: string;
  jobPostingId: string;
  workerId: string;
  amount: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  estimatedDuration: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Worker profile types
export interface WorkerProfile {
  id: string;
  userId: string;
  services: string[];
  experience: number;
  hourlyRate: number;
  rating: number;
  totalJobs: number;
  description: string | null;
  profilePicture: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  OTPVerification: { mobile: string };
  MainTabs: undefined;
  JobDetails: { jobId: string };
  BookingDetails: { bookingId: string };
  CreateJob: undefined;
  Profile: undefined;
  WorkerProfile: undefined;
  Dashboard: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Jobs: undefined;
  Bookings: undefined;
  Profile: undefined;
  Wallet: undefined;
};

// API Response types
export interface APIResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  user?: User;
}

// Authentication context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (mobile: string) => Promise<void>;
  verifyOTP: (mobile: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}