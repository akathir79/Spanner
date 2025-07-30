import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertWorkerProfileSchema, insertBookingSchema, insertJobPostingSchema, insertBidSchema } from "@shared/schema";

// Validation schemas
const loginSchema = z.object({
  mobile: z.string().min(10).max(15),
  userType: z.enum(["client", "worker", "admin", "super_admin"]),
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
  primaryService: z.string().min(1),
  experienceYears: z.number().min(0).max(50),
  hourlyRate: z.number().min(0),
  serviceDistricts: z.array(z.string()),
  skills: z.array(z.string()),
  workAddress: z.string().min(1),
  pincode: z.string().min(5).max(10),
});

// Helper function to generate OTP
function generateOTP(): string {
  // For development, return fixed OTP
  return "123456";
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
      
      // Check if user exists for super admin
      if (userType === "super_admin") {
        if (!["9000000001", "9000000002"].includes(mobile)) {
          return res.status(401).json({ message: "Invalid super admin mobile number" });
        }
      }
      
      const otp = generateOTP();
      const expiresAt = addMinutes(new Date(), 10); // 10 minutes expiry
      
      await storage.createOtp({
        mobile,
        otp,
        purpose: "login",
        expiresAt,
      });
      
      // In production, send actual SMS here
      console.log(`OTP for ${mobile}: ${otp}`);
      
      res.json({ 
        message: "OTP sent successfully", 
        otp: otp // Only for development
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
      
      // Find or create user based on mobile
      let user = await storage.getUserByMobile(mobile);
      
      if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }
      
      // For super admin, verify mobile numbers
      if (user.role === "super_admin" && !["9000000001", "9000000002"].includes(mobile)) {
        return res.status(401).json({ message: "Invalid super admin credentials" });
      }
      
      // For workers, check approval status
      if (user.role === "worker") {
        const workerProfile = await storage.getWorkerProfile(user.id);
        if (!workerProfile || workerProfile.approvalStatus !== "approved") {
          return res.status(403).json({ 
            message: "Your application is under review. Please wait for admin approval.",
            approvalStatus: workerProfile?.approvalStatus || "pending"
          });
        }
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
      const { aadhaarNumber, primaryService, experienceYears, hourlyRate, serviceDistricts, skills, workAddress, pincode, ...userData } = workerSignupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByMobile(userData.mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this mobile number" });
      }
      
      const user = await storage.createUser(userData);
      
      const workerProfile = await storage.createWorkerProfile({
        userId: user.id,
        aadhaarNumber,
        primaryService,
        experienceYears,
        hourlyRate: hourlyRate.toString(),
        serviceDistricts,
        skills,
        workAddress,
        pincode,
      });
      
      res.json({
        message: "Worker application submitted successfully. Your application is under admin review. You will be notified once approved.",
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        workerProfile,
        requiresApproval: true
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

  // Admin routes for worker approval
  app.get("/api/admin/pending-applications", async (req, res) => {
    try {
      const applications = await storage.getPendingWorkerApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching pending applications:", error);
      res.status(500).json({ message: "Failed to fetch pending applications" });
    }
  });

  app.post("/api/admin/approve-worker/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminId } = req.body;
      
      const result = await storage.approveWorkerApplication(userId, adminId);
      if (!result) {
        return res.status(404).json({ message: "Worker application not found" });
      }
      
      res.json({ message: "Worker application approved successfully", workerProfile: result });
    } catch (error) {
      console.error("Error approving worker:", error);
      res.status(500).json({ message: "Failed to approve worker application" });
    }
  });

  app.post("/api/admin/reject-worker/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminId, reason } = req.body;
      
      const result = await storage.rejectWorkerApplication(userId, adminId, reason);
      if (!result) {
        return res.status(404).json({ message: "Worker application not found" });
      }
      
      res.json({ message: "Worker application rejected", workerProfile: result });
    } catch (error) {
      console.error("Error rejecting worker:", error);
      res.status(500).json({ message: "Failed to reject worker application" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
