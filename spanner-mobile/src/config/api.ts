/**
 * SPANNER Mobile App - API Configuration
 * Connects to the existing SPANNER backend
 */

// Backend API Configuration
export const API_CONFIG = {
  // Change this to your deployed backend URL when ready
  BASE_URL: __DEV__ 
    ? 'http://localhost:5000' // Development - connects to your existing backend
    : 'https://your-spanner-backend.com', // Production URL
  
  TIMEOUT: 10000, // 10 seconds
  
  // API endpoints from your existing backend
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGOUT: '/api/auth/logout',
    
    // User management
    USERS: '/api/users',
    PROFILE: '/api/profile',
    
    // Bookings
    BOOKINGS: '/api/bookings',
    CLIENT_BOOKINGS: '/api/client/bookings',
    WORKER_BOOKINGS: '/api/worker/bookings',
    
    // Jobs and Services
    JOB_POSTINGS: '/api/job-postings',
    SERVICES: '/api/services',
    AREAS: '/api/areas',
    DISTRICTS: '/api/districts',
    
    // Bids
    BIDS: '/api/bids',
    
    // Reviews
    REVIEWS: '/api/reviews',
    
    // Worker features
    WORKER_PROFILE: '/api/worker/profile',
    WORKER_BANK_DETAILS: '/api/worker/bank-details',
    
    // Admin (if user is admin)
    ADMIN_USERS: '/api/admin/users',
    ADMIN_BOOKINGS: '/api/admin/bookings',
  }
};

// HTTP Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};