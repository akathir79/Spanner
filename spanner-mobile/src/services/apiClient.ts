/**
 * SPANNER Mobile App - API Client
 * Handles all communication with the SPANNER backend
 */

import { API_CONFIG, DEFAULT_HEADERS } from '../config/api';

interface APIResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
}

class APIClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.headers = { ...DEFAULT_HEADERS };
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  clearAuthToken() {
    delete this.headers['Authorization'];
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(mobile: string): Promise<APIResponse> {
    return this.post(API_CONFIG.ENDPOINTS.LOGIN, { mobile });
  }

  async verifyOTP(mobile: string, otp: string): Promise<APIResponse> {
    return this.post(API_CONFIG.ENDPOINTS.VERIFY_OTP, { mobile, otp });
  }

  async logout(): Promise<APIResponse> {
    return this.post(API_CONFIG.ENDPOINTS.LOGOUT);
  }

  // User methods
  async getProfile(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.PROFILE);
  }

  // Booking methods
  async getClientBookings(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.CLIENT_BOOKINGS);
  }

  async getWorkerBookings(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.WORKER_BOOKINGS);
  }

  async createBooking(bookingData: any): Promise<APIResponse> {
    return this.post(API_CONFIG.ENDPOINTS.BOOKINGS, bookingData);
  }

  // Service methods
  async getServices(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.SERVICES);
  }

  async getAreas(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.AREAS);
  }

  async getDistricts(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.DISTRICTS);
  }

  // Job posting methods
  async getJobPostings(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.JOB_POSTINGS);
  }

  async createJobPosting(jobData: any): Promise<APIResponse> {
    return this.post(API_CONFIG.ENDPOINTS.JOB_POSTINGS, jobData);
  }

  // Bid methods
  async createBid(bidData: any): Promise<APIResponse> {
    return this.post(API_CONFIG.ENDPOINTS.BIDS, bidData);
  }

  async getBidsForJob(jobId: string): Promise<APIResponse> {
    return this.get(`${API_CONFIG.ENDPOINTS.BIDS}?jobId=${jobId}`);
  }

  // Worker profile methods
  async getWorkerProfile(): Promise<APIResponse> {
    return this.get(API_CONFIG.ENDPOINTS.WORKER_PROFILE);
  }

  async updateWorkerProfile(profileData: any): Promise<APIResponse> {
    return this.put(API_CONFIG.ENDPOINTS.WORKER_PROFILE, profileData);
  }
}

// Export singleton instance
export const apiClient = new APIClient();