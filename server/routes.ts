import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertWorkerProfileSchema, 
  insertBookingSchema, 
  insertJobPostingSchema, 
  insertBidSchema,
  insertLocationTrackingSchema,
  insertLocationSharingSessionSchema,
  insertGeofenceSchema,
  insertLocationEventSchema,
  insertWorkerBankDetailsSchema,
  insertPaymentSchema
} from "@shared/schema";

// Validation schemas
const loginSchema = z.object({
  mobile: z.string().min(1),
  userType: z.enum(["client", "worker", "admin", "super_admin", "auto"]).optional(),
});

const verifyOtpSchema = z.object({
  mobile: z.string().min(10).max(15),
  otp: z.string().length(6),
  purpose: z.string(),
});

const clientSignupSchema = insertUserSchema.extend({
  role: z.literal("client"),
});

const workerSignupSchema = insertUserSchema.extend({
  role: z.literal("worker"),
  aadhaarNumber: z.string().length(12),
  aadhaarVerified: z.boolean().optional(),
  primaryService: z.string().min(1),
  experienceYears: z.number().min(0).max(50),
  hourlyRate: z.number().min(0),
  serviceDistricts: z.array(z.string()),
  serviceAreas: z.array(z.string()).optional(),
  skills: z.array(z.string()),
  bio: z.string().optional(),
  bioDataDocument: z.string().optional(),
});

// Helper function to generate OTP
function generateOTP(): string {
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

// Helper function to send SMS (ready for Twilio integration)
async function sendSMS(mobile: string, message: string): Promise<boolean> {
  try {
    // When Twilio credentials are available, replace this with actual Twilio SMS
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: `+91${mobile}`
    // });
    
    // For now, just log the SMS (development mode)
    console.log(`SMS to ${mobile}: ${message}`);
    return true;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return false;
  }
}

// Helper function to add minutes to date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { mobile, userType } = loginSchema.parse(req.body);
      
      // For admin mobile, always send OTP
      if (mobile === "9000000001") {
        const otp = generateOTP();
        const expiresAt = addMinutes(new Date(), 10);
        
        await storage.createOtp({
          mobile,
          otp,
          purpose: "login",
          expiresAt,
        });
        
        const smsMessage = `Your SPANNER admin login OTP is: ${otp}. Valid for 10 minutes.`;
        await sendSMS(mobile, smsMessage);
        console.log(`OTP for ${mobile}: ${otp}`);
        
        return res.json({ 
          message: "OTP sent successfully", 
          otp: otp,
          userRole: "admin"
        });
      }
      
      // For super admin mobiles, always send OTP
      if (["9000000002"].includes(mobile)) {
        const otp = generateOTP();
        const expiresAt = addMinutes(new Date(), 10);
        
        await storage.createOtp({
          mobile,
          otp,
          purpose: "login",
          expiresAt,
        });
        
        const smsMessage = `Your SPANNER super admin login OTP is: ${otp}. Valid for 10 minutes.`;
        await sendSMS(mobile, smsMessage);
        console.log(`OTP for ${mobile}: ${otp}`);
        
        return res.json({ 
          message: "OTP sent successfully", 
          otp: otp,
          userRole: "super_admin"
        });
      }
      
      // Check if user exists for regular users
      const user = await storage.getUserByMobile(mobile);
      if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }

      // If userType is provided and not "auto", verify it matches
      if (userType && userType !== "auto" && user.role !== userType) {
        return res.status(403).json({ message: `User role mismatch. Expected: ${user.role}` });
      }
      
      const otp = generateOTP();
      const expiresAt = addMinutes(new Date(), 10); // 10 minutes expiry
      
      await storage.createOtp({
        mobile,
        otp,
        purpose: "login",
        expiresAt,
      });
      
      // Send SMS with OTP
      const smsMessage = `Your SPANNER login OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;
      await sendSMS(mobile, smsMessage);
      console.log(`OTP for ${mobile}: ${otp}`);
      
      res.json({ 
        message: "OTP sent successfully", 
        otp: otp, // Only for development
        userRole: user.role // Send back detected role
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { mobile, otp, purpose } = verifyOtpSchema.parse(req.body);
      
      const otpRecord = await storage.getValidOtp(mobile, otp, purpose);
      if (!otpRecord) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }
      
      await storage.markOtpAsUsed(otpRecord.id);
      
      // Find user based on mobile
      let user = await storage.getUserByMobile(mobile);
      
      // For admin mobile, ensure user exists or create if needed
      if (mobile === "9000000001") {
        if (!user) {
          // Create admin user if doesn't exist
          user = await storage.createUser({
            mobile: "9000000001",
            email: "admin@spanner.com",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            districtId: "76a03385-6ce1-4749-9ae5-67f192b1db7f",
            isVerified: true,
            status: "approved"
          });
        }
      }
      // For super admin mobile, ensure user exists or create if needed
      else if (mobile === "9000000002") {
        if (!user) {
          // Create super admin user if doesn't exist
          user = await storage.createUser({
            mobile: "9000000002",
            email: "superadmin@spanner.com",
            firstName: "Super",
            lastName: "Admin",
            role: "super_admin",
            districtId: "76a03385-6ce1-4749-9ae5-67f192b1db7f",
            isVerified: true,
            status: "approved"
          });
        }
      }
      // For regular users, they must exist
      else if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          districtId: user.districtId,
          isVerified: user.isVerified,
          status: user.status,
          createdAt: user.createdAt,
        }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Client signup
  app.post("/api/auth/signup/client", async (req, res) => {
    try {
      const userData = clientSignupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByMobile(userData.mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this mobile number" });
      }
      
      const user = await storage.createUser(userData);
      
      res.json({
        message: "Client registered successfully",
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Client signup error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Worker signup
  app.post("/api/auth/signup/worker", async (req, res) => {
    try {
      const { aadhaarNumber, aadhaarVerified, primaryService, experienceYears, hourlyRate, serviceDistricts, serviceAreas, skills, bio, bioDataDocument, ...userData } = workerSignupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByMobile(userData.mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this mobile number" });
      }
      
      const user = await storage.createUser(userData);
      
      const workerProfile = await storage.createWorkerProfile({
        userId: user.id,
        aadhaarNumber,
        aadhaarVerified: aadhaarVerified || false,
        primaryService,
        experienceYears,
        hourlyRate: hourlyRate.toString(),
        serviceDistricts,
        serviceAreas: serviceAreas || [],
        skills,
        bio: bio || null,
        bioDataDocument: bioDataDocument || null,
      });
      
      res.json({
        message: "Worker registered successfully. Application under review.",
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
        workerProfile
      });
    } catch (error) {
      console.error("Worker signup error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get districts
  app.get("/api/districts", async (req, res) => {
    try {
      const districts = await storage.getAllDistricts();
      res.json(districts);
    } catch (error) {
      console.error("Get districts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get service categories
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServiceCategories();
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get areas by district
  app.get("/api/districts/:districtId/areas", async (req, res) => {
    try {
      const { districtId } = req.params;
      const areas = await storage.getAreasByDistrict(districtId);
      res.json(areas);
    } catch (error) {
      console.error("Get areas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all areas
  app.get("/api/areas", async (req, res) => {
    try {
      const areas = await storage.getAllAreas();
      res.json(areas);
    } catch (error) {
      console.error("Get all areas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new area
  app.post("/api/areas", async (req, res) => {
    try {
      const areaData = req.body;
      const area = await storage.createArea(areaData);
      res.json(area);
    } catch (error) {
      console.error("Create area error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new service category
  app.post("/api/services", async (req, res) => {
    try {
      const { name, tamilName, description, icon, isActive } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Service name is required" });
      }

      // Check if service already exists
      const existingServices = await storage.getAllServiceCategories();
      const serviceExists = existingServices.some(
        (service: any) => service.name.toLowerCase() === name.toLowerCase()
      );

      if (serviceExists) {
        return res.status(409).json({ message: "Service already exists" });
      }

      const newService = await storage.createServiceCategory({
        name: name.trim(),
        tamilName: tamilName?.trim() || name.trim(),
        description: description?.trim() || `${name.trim()} services`,
        icon: icon || "wrench",
        isActive: isActive !== false, // Default to true
      });

      res.status(201).json(newService);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Get worker profile with user data
  app.get("/api/worker/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get worker profile
      const workerProfile = await storage.getWorkerProfile(userId);
      
      // Get district name if districtId exists
      let district = null;
      if (user.districtId) {
        const districts = await storage.getAllDistricts();
        district = districts.find((d: any) => d.id === user.districtId);
      }
      
      // Get area names for service areas if they exist
      let serviceAreaNames = [];
      if (workerProfile && workerProfile.serviceAreas && Array.isArray(workerProfile.serviceAreas) && !workerProfile.serviceAllAreas) {
        const allAreas = await storage.getAllAreas();
        serviceAreaNames = workerProfile.serviceAreas.map((areaId: string) => {
          const area = allAreas.find((a: any) => a.id === areaId);
          return area ? area.name : `Area ${areaId}`;
        });
      }
      
      // Combine user and worker profile data
      const completeProfile = {
        ...user,
        workerProfile: workerProfile ? {
          ...workerProfile,
          serviceAreaNames
        } : null,
        district
      };
      
      res.json(completeProfile);
    } catch (error) {
      console.error("Get worker profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search workers
  app.get("/api/workers/search", async (req, res) => {
    try {
      const { district, service } = req.query;
      
      let workers: any[] = [];
      if (district) {
        workers = await storage.getWorkersByDistrict(district as string);
      } else if (service) {
        workers = await storage.getWorkersByService(service as string);
      }
      
      res.json(workers);
    } catch (error) {
      console.error("Search workers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      
      // In production, send notifications here
      console.log(`New booking created: ${booking.id}`);
      
      res.json({
        message: "Booking created successfully",
        booking
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  // Get user bookings
  app.get("/api/bookings/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.query;
      
      let bookings;
      if (role === "worker") {
        bookings = await storage.getWorkerBookings(userId);
      } else {
        bookings = await storage.getClientBookings(userId);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Get user bookings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update booking status
  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const booking = await storage.updateBookingStatus(id, status);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json({
        message: "Booking status updated",
        booking
      });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getUsersWithProfiles();
      res.json(users);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookingsWithDetails();
      res.json(bookings);
    } catch (error) {
      console.error("Get admin bookings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/pending-workers", async (req, res) => {
    try {
      const pendingWorkers = await storage.getPendingWorkers();
      res.json(pendingWorkers);
    } catch (error) {
      console.error("Error fetching pending workers:", error);
      res.status(500).json({ error: "Failed to fetch pending workers" });
    }
  });

  app.post("/api/admin/approve-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const updatedWorker = await storage.approveWorker(workerId);
      res.json(updatedWorker);
    } catch (error) {
      console.error("Error approving worker:", error);
      res.status(500).json({ error: "Failed to approve worker" });
    }
  });

  app.delete("/api/admin/reject-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      await storage.rejectWorker(workerId);
      res.json({ message: "Worker rejected and deleted successfully" });
    } catch (error) {
      console.error("Error rejecting worker:", error);
      res.status(500).json({ error: "Failed to reject worker" });
    }
  });

  app.patch("/api/admin/update-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const updates = req.body;
      const updatedWorker = await storage.updateWorker(workerId, updates);
      res.json(updatedWorker);
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(500).json({ error: "Failed to update worker" });
    }
  });

  // Job postings routes
  app.get("/api/job-postings", async (req, res) => {
    try {
      const jobs = await storage.getAllJobPostings();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });

  app.get("/api/job-postings/client/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const jobs = await storage.getJobPostingsByClient(clientId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching client job postings:", error);
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });

  app.post("/api/job-postings", async (req, res) => {
    try {
      // Convert budget numbers to strings for database compatibility
      const { budgetMin, budgetMax, ...rest } = req.body;
      const jobData = {
        ...rest,
        budgetMin: budgetMin !== undefined && budgetMin !== null ? budgetMin.toString() : null,
        budgetMax: budgetMax !== undefined && budgetMax !== null ? budgetMax.toString() : null,
      };
      const job = await storage.createJobPosting(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job posting:", error);
      res.status(500).json({ message: "Failed to create job posting" });
    }
  });

  app.put("/api/job-postings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Convert budget numbers to strings for database compatibility
      const { budgetMin, budgetMax, ...rest } = req.body;
      const jobData = {
        ...rest,
        budgetMin: budgetMin !== undefined ? budgetMin?.toString() : undefined,
        budgetMax: budgetMax !== undefined ? budgetMax?.toString() : undefined,
      };
      const job = await storage.updateJobPosting(id, jobData);
      res.json(job);
    } catch (error) {
      console.error("Error updating job posting:", error);
      res.status(500).json({ message: "Failed to update job posting" });
    }
  });

  app.delete("/api/job-postings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteJobPosting(id);
      res.json({ message: "Job posting deleted successfully" });
    } catch (error) {
      console.error("Error deleting job posting:", error);
      res.status(500).json({ message: "Failed to delete job posting" });
    }
  });

  // Bidding routes
  app.get("/api/bids/job/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const bids = await storage.getBidsByJobPosting(jobId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get("/api/bids/worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const bids = await storage.getBidsByWorker(workerId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching worker bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.post("/api/bids", async (req, res) => {
    try {
      const bidData = insertBidSchema.parse(req.body);
      const bid = await storage.createBid(bidData);
      res.status(201).json(bid);
    } catch (error) {
      console.error("Error creating bid:", error);
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  app.put("/api/bids/:id/accept", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.acceptBid(id);
      res.json(result);
    } catch (error) {
      console.error("Error accepting bid:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });

  app.put("/api/bids/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.rejectBid(id);
      res.json(result);
    } catch (error) {
      console.error("Error rejecting bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  // Location Tracking API Routes
  
  // Create location tracking entry
  app.post("/api/location-tracking", async (req, res) => {
    try {
      const locationData = insertLocationTrackingSchema.parse(req.body);
      const tracking = await storage.createLocationTracking(locationData);
      res.status(201).json(tracking);
    } catch (error) {
      console.error("Error creating location tracking:", error);
      res.status(500).json({ message: "Failed to create location tracking" });
    }
  });

  // Get latest location for a booking
  app.get("/api/location-tracking/latest/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const location = await storage.getLatestLocationByBooking(bookingId);
      if (!location) {
        return res.status(404).json({ message: "No location data found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching latest location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Get location history for a booking
  app.get("/api/location-tracking/history/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { limit = "50", hours = "24" } = req.query;
      const locations = await storage.getLocationHistoryByBooking(
        bookingId,
        parseInt(limit as string),
        parseInt(hours as string)
      );
      res.json(locations);
    } catch (error) {
      console.error("Error fetching location history:", error);
      res.status(500).json({ message: "Failed to fetch location history" });
    }
  });

  // Start location sharing session
  app.post("/api/location-sharing", async (req, res) => {
    try {
      const sessionData = insertLocationSharingSessionSchema.parse(req.body);
      const session = await storage.createLocationSharingSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating location sharing session:", error);
      res.status(500).json({ message: "Failed to create sharing session" });
    }
  });

  // Get location sharing session by booking
  app.get("/api/location-sharing/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const session = await storage.getLocationSharingSessionByBooking(bookingId);
      if (!session) {
        return res.status(404).json({ message: "No sharing session found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching sharing session:", error);
      res.status(500).json({ message: "Failed to fetch sharing session" });
    }
  });

  // Update location sharing session
  app.patch("/api/location-sharing/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const updateData = req.body;
      const session = await storage.updateLocationSharingSession(sessionId, updateData);
      res.json(session);
    } catch (error) {
      console.error("Error updating sharing session:", error);
      res.status(500).json({ message: "Failed to update sharing session" });
    }
  });

  // Create geofence
  app.post("/api/geofences", async (req, res) => {
    try {
      const geofenceData = insertGeofenceSchema.parse(req.body);
      const geofence = await storage.createGeofence(geofenceData);
      res.status(201).json(geofence);
    } catch (error) {
      console.error("Error creating geofence:", error);
      res.status(500).json({ message: "Failed to create geofence" });
    }
  });

  // Get geofences by booking
  app.get("/api/geofences/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const geofences = await storage.getGeofencesByBooking(bookingId);
      res.json(geofences);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      res.status(500).json({ message: "Failed to fetch geofences" });
    }
  });

  // Create location event
  app.post("/api/location-events", async (req, res) => {
    try {
      const eventData = insertLocationEventSchema.parse(req.body);
      const event = await storage.createLocationEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating location event:", error);
      res.status(500).json({ message: "Failed to create location event" });
    }
  });

  // Get location events by booking
  app.get("/api/location-events/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const events = await storage.getLocationEventsByBooking(bookingId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching location events:", error);
      res.status(500).json({ message: "Failed to fetch location events" });
    }
  });

  // Worker Bank Details API Routes
  
  // Create worker bank details
  app.post("/api/worker-bank-details", async (req, res) => {
    try {
      const bankDetailsData = insertWorkerBankDetailsSchema.parse(req.body);
      const bankDetails = await storage.createWorkerBankDetails(bankDetailsData);
      res.status(201).json(bankDetails);
    } catch (error) {
      console.error("Error creating bank details:", error);
      res.status(500).json({ message: "Failed to create bank details" });
    }
  });

  // Get worker bank details by worker ID
  app.get("/api/worker-bank-details/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const bankDetails = await storage.getWorkerBankDetails(workerId);
      if (!bankDetails) {
        return res.status(404).json({ message: "Bank details not found" });
      }
      res.json(bankDetails);
    } catch (error) {
      console.error("Error fetching bank details:", error);
      res.status(500).json({ message: "Failed to fetch bank details" });
    }
  });

  // Delete worker bank details by ID
  app.delete("/api/worker-bank-details/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWorkerBankDetails(id);
      res.status(200).json({ message: "Bank details deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank details:", error);
      res.status(500).json({ message: "Failed to delete bank details" });
    }
  });

  // Update worker bank details
  app.put("/api/worker-bank-details/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const bankDetails = await storage.updateWorkerBankDetails(id, updateData);
      if (!bankDetails) {
        return res.status(404).json({ message: "Bank details not found" });
      }
      res.json(bankDetails);
    } catch (error) {
      console.error("Error updating bank details:", error);
      res.status(500).json({ message: "Failed to update bank details" });
    }
  });

  // Delete worker bank details
  app.delete("/api/worker-bank-details/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWorkerBankDetails(id);
      res.json({ message: "Bank details deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank details:", error);
      res.status(500).json({ message: "Failed to delete bank details" });
    }
  });

  // Mock Stripe Payment Endpoints
  
  // Create payment intent (mock)
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "INR", bookingId, paymentMethod = "card" } = req.body;
      
      // Validate required fields
      if (!amount || !bookingId) {
        return res.status(400).json({ 
          message: "Missing required fields: amount, bookingId" 
        });
      }

      // Mock payment intent creation (in production, this would call Stripe API)
      const mockPaymentIntent = {
        id: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100), // Convert to paise/cents
        currency: currency.toLowerCase(),
        status: "requires_payment_method",
        payment_method_types: ["card", "upi", "netbanking"],
        metadata: {
          bookingId,
          paymentMethod
        }
      };
      
      console.log(`Mock Payment Intent Created: ${mockPaymentIntent.id} for ₹${amount}`);
      
      res.json({ 
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
        amount: mockPaymentIntent.amount,
        currency: mockPaymentIntent.currency
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm payment (mock)
  app.post("/api/confirm-payment", async (req, res) => {
    try {
      const { paymentIntentId, paymentMethodType, bookingId, clientId, workerId, amount } = req.body;
      
      // Validate required fields
      if (!paymentIntentId || !bookingId || !clientId || !workerId || !amount) {
        return res.status(400).json({ 
          message: "Missing required payment confirmation fields" 
        });
      }

      // Mock payment confirmation (randomly succeed/fail for testing)
      const shouldSucceed = Math.random() > 0.1; // 90% success rate
      
      const platformFee = parseFloat((amount * 0.05).toFixed(2)); // 5% platform fee
      const workerAmount = parseFloat((amount - platformFee).toFixed(2));
      
      const paymentData = {
        method: paymentMethodType || "card",
        ...(paymentMethodType === "card" && {
          last4: "4242",
          brand: "visa"
        }),
        ...(paymentMethodType === "upi" && {
          upiId: "test@mockupi"
        }),
        ...(paymentMethodType === "netbanking" && {
          bank: "Mock Bank"
        })
      };

      if (shouldSucceed) {
        // Create payment record
        const payment = await storage.createPayment({
          bookingId,
          clientId,
          workerId,
          amount: amount.toString(),
          currency: "INR",
          paymentMethod: paymentMethodType || "card",
          paymentProvider: "stripe",
          providerTransactionId: paymentIntentId,
          status: "completed",
          paymentData,
          platformFee: platformFee.toString(),
          workerAmount: workerAmount.toString()
        });

        // Update booking status to paid
        await storage.updateBookingStatus(bookingId, "confirmed");
        
        console.log(`Mock Payment Confirmed: ${paymentIntentId} - ₹${amount} (Worker gets ₹${workerAmount})`);
        
        res.json({
          success: true,
          paymentId: payment.id,
          status: "completed",
          amount,
          platformFee,
          workerAmount,
          paymentMethod: paymentMethodType || "card"
        });
      } else {
        // Payment failed
        const payment = await storage.createPayment({
          bookingId,
          clientId,
          workerId,
          amount: amount.toString(),
          currency: "INR",
          paymentMethod: paymentMethodType || "card",
          paymentProvider: "stripe",
          providerTransactionId: paymentIntentId,
          status: "failed",
          paymentData,
          platformFee: "0.00",
          workerAmount: "0.00",
          failureReason: "Mock payment failure for testing"
        });

        console.log(`Mock Payment Failed: ${paymentIntentId} - ₹${amount}`);
        
        res.status(400).json({
          success: false,
          error: "Payment failed",
          paymentId: payment.id,
          status: "failed",
          failureReason: "Insufficient funds (mock failure)"
        });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Get payment details
  app.get("/api/payment/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment details" });
    }
  });

  // Get payments for a booking
  app.get("/api/booking/:bookingId/payments", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const payments = await storage.getPaymentsByBooking(bookingId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching booking payments:", error);
      res.status(500).json({ message: "Failed to fetch booking payments" });
    }
  });

  // Get payment history for user
  app.get("/api/user/:userId/payments", async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.query; // 'client' or 'worker'
      const payments = await storage.getPaymentsByUser(userId, role as string);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ message: "Failed to fetch user payments" });
    }
  });

  // Refund payment (mock)
  app.post("/api/refund-payment", async (req, res) => {
    try {
      const { paymentId, refundAmount, refundReason } = req.body;
      
      if (!paymentId || !refundAmount) {
        return res.status(400).json({ 
          message: "Missing required fields: paymentId, refundAmount" 
        });
      }

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.status !== "completed") {
        return res.status(400).json({ message: "Can only refund completed payments" });
      }

      // Mock refund process
      const updatedPayment = await storage.updatePaymentRefund(paymentId, {
        status: "refunded",
        refundAmount: refundAmount.toString(),
        refundReason: refundReason || "Customer request"
      });

      console.log(`Mock Refund Processed: ${paymentId} - ₹${refundAmount}`);
      
      res.json({
        success: true,
        refundId: `re_mock_${Date.now()}`,
        payment: updatedPayment
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
