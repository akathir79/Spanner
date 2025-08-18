import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerSitemapRoutes } from "./routes-sitemap";
import { storage } from "./storage";
import { budgetAnalyticsService } from "./budget-analytics";
import statesDistrictsData from "@shared/states-districts.json";
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
  insertPaymentSchema,
  insertMessageSchema,
  insertTransferHistorySchema,
  insertAdvertisementSchema,
  insertWorkerReviewSchema,
  insertApiKeySchema
} from "@shared/schema";

// Job completion OTP schema
const generateCompletionOTPSchema = z.object({
  bookingId: z.string(),
  workerId: z.string(),
});

const verifyCompletionOTPSchema = z.object({
  bookingId: z.string(),
  otp: z.string().length(6),
  clientId: z.string(),
});

// Review and rating schema
const submitReviewSchema = z.object({
  bookingId: z.string(),
  workerId: z.string(),
  clientId: z.string(),
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
  workQualityRating: z.number().min(1).max(5).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Validation schemas
const loginSchema = z.object({
  mobile: z.string().min(1),
  userType: z.enum(["client", "worker", "admin", "super_admin", "auto"]).optional(),
  role: z.enum(["client", "worker"]).optional(),
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
  // NOTE: In production, OTPs should be:
  // 1. Stored temporarily in memory/cache (Redis) with short TTL (5-10 minutes)
  // 2. Never persisted in database for security reasons
  // 3. Generated fresh for each request
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

// Generate job completion OTP
function generateCompletionOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to add minutes to date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Generate professional job ID with user ID format + counter + date
async function generateJobId(clientId: string): Promise<string> {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString();
  const dateStr = `${day}${month}${year}`;
  
  // Get the next sequential number for this client
  const existingJobs = await storage.getJobPostingsByClient(clientId);
  const jobCount = existingJobs.length + 1;
  const sequentialNumber = jobCount.toString().padStart(3, '0');
  
  return `${clientId}/${sequentialNumber}/${dateStr}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cache control headers to prevent browser caching issues
  app.use((req, res, next) => {
    if (req.path.includes('/quick-post') || req.path.includes('/static/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
  
  // District API endpoint - serves authentic Indian district data from local JSON file
  app.get("/api/districts/:stateName", async (req, res) => {
    try {
      const { stateName } = req.params;
      
      // Load authentic Indian states and districts data from local JSON file
      const fs = await import('fs');
      const path = await import('path');
      const dataPath = path.join(process.cwd(), 'shared', 'states-districts.json');
      
      if (!fs.existsSync(dataPath)) {
        console.error("States-districts.json file not found at:", dataPath);
        return res.status(500).json({ error: "District data file not found" });
      }
      
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      
      // Handle JSON structure - data.states is an object with state names as keys
      let stateData;
      if (data.states) {
        // Check if the state exists in the states object
        const stateKey = Object.keys(data.states).find(key => 
          key.toLowerCase() === stateName.toLowerCase()
        );
        if (stateKey) {
          stateData = { districts: data.states[stateKey].districts };
        }
      }
      
      if (stateData && stateData.districts) {
        const districts = stateData.districts.map((districtName: string) => ({
          id: districtName.toLowerCase().replace(/\s+/g, '-'),
          name: districtName,
          state: stateName,
          tamilName: stateName === "Tamil Nadu" ? districtName : undefined
        }));
        
        console.log(`API: Served ${districts.length} authentic districts for ${stateName} from local JSON file`);
        return res.json(districts);
      }
      
      console.log(`API: No authentic districts found for ${stateName}`);
      return res.json([]);
      
    } catch (error) {
      console.error("Districts API error:", error);
      return res.status(500).json({ error: "Failed to load districts from local data file" });
    }
  });
  
  // Authentication routes - New endpoints for useAuth hook
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { mobile, role } = req.body;
      
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
          success: true,
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
          success: true,
          message: "OTP sent successfully", 
          otp: otp,
          userRole: "super_admin"
        });
      }
      
      // Check if user exists for clients and workers
      const existingUser = await storage.getUserByMobile(mobile);
      
      if (!existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "Mobile number not registered. Please sign up first." 
        });
      }
      
      // Generate and send OTP
      const otp = generateOTP();
      const expiresAt = addMinutes(new Date(), 10);
      
      await storage.createOtp({
        mobile,
        otp,
        purpose: "login",
        expiresAt,
      });
      
      const smsMessage = `Your SPANNER login OTP is: ${otp}. Valid for 10 minutes.`;
      await sendSMS(mobile, smsMessage);
      console.log(`OTP for ${mobile}: ${otp}`);
      
      return res.json({ 
        success: true,
        message: "OTP sent successfully", 
        otp: otp,
        userRole: existingUser.role
      });
      
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to send OTP" 
      });
    }
  });

  // Check availability of mobile/email/aadhaar for a specific role
  app.post("/api/auth/check-availability", async (req, res) => {
    try {
      const { mobile, email, aadhaarNumber, role } = req.body;
      
      let mobileAvailable = true;
      let emailAvailable = true;
      let aadhaarAvailable = true;
      
      // Check mobile availability if provided (globally across all users)
      if (mobile) {
        const existingUserByMobile = await storage.getUserByMobile(mobile);
        mobileAvailable = !existingUserByMobile;
      }
      
      // Check email availability if provided (globally across all users)
      if (email) {
        const existingUserByEmail = await storage.getUserByEmail(email);
        emailAvailable = !existingUserByEmail;
      }
      
      // Check Aadhaar availability if provided
      if (aadhaarNumber) {
        const existingUserByAadhaar = await storage.getUserByAadhaar(aadhaarNumber);
        aadhaarAvailable = !existingUserByAadhaar;
      }
      
      return res.json({
        mobile: mobileAvailable,
        email: emailAvailable,
        aadhaar: aadhaarAvailable
      });
      
    } catch (error) {
      console.error("Availability check error:", error);
      return res.status(500).json({ message: "Error checking availability" });
    }
  });

  app.post("/api/auth/signup-client", async (req, res) => {
    try {
      const userData = clientSignupSchema.parse(req.body);
      
      // Check if user already exists with this role
      const existingUserByMobile = await storage.getUserByMobileAndRole(userData.mobile, userData.role);
      if (existingUserByMobile) {
        return res.status(400).json({ message: "Mobile number already registered for this role" });
      }

      // Check email if provided
      if (userData.email) {
        const existingUserByEmail = await storage.getUserByEmailAndRole(userData.email, userData.role);
        if (existingUserByEmail) {
          return res.status(400).json({ message: "Email address already registered for this role" });
        }
      }
      
      // Create new user
      const user = await storage.createUser({
        ...userData,
        isVerified: false,
      });
      
      return res.json({ 
        message: "Client registered successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          profilePicture: user.profilePicture,
        }
      });
      
    } catch (error) {
      console.error("Client signup error:", error);
      return res.status(500).json({ message: "Failed to register client" });
    }
  });

  app.post("/api/auth/signup-worker", async (req, res) => {
    try {
      const userData = workerSignupSchema.parse(req.body);
      
      // Check if user already exists with this role
      const existingUserByMobile = await storage.getUserByMobileAndRole(userData.mobile, userData.role);
      if (existingUserByMobile) {
        return res.status(400).json({ message: "Mobile number already registered for this role" });
      }

      // Check email if provided
      if (userData.email) {
        const existingUserByEmail = await storage.getUserByEmailAndRole(userData.email, userData.role);
        if (existingUserByEmail) {
          return res.status(400).json({ message: "Email address already registered for this role" });
        }
      }

      // Check Aadhaar number uniqueness (required for workers)
      if (userData.aadhaarNumber) {
        const existingUserByAadhaar = await storage.getUserByAadhaar(userData.aadhaarNumber);
        if (existingUserByAadhaar) {
          return res.status(400).json({ message: "Aadhaar number already registered" });
        }
      }
      
      // Create new user
      // Use the first service district as the primary district for ID generation
      const primaryDistrict = userData.serviceDistricts?.[0] || "Salem"; // Default to Salem as it's a valid district
      
      const user = await storage.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        mobile: userData.mobile,
        role: userData.role,
        state: userData.state || "Tamil Nadu", // Default to Tamil Nadu for now
        district: primaryDistrict,
        profilePicture: userData.profilePicture,
        isVerified: false,
        address: userData.address,
        pincode: userData.pincode,
        status: "pending", // Set default status for workers
      });
      
      // Create worker profile with normalized service names
      const { normalizeServiceName } = await import('../shared/serviceUtils.js');
      await storage.createWorkerProfile({
        userId: user.id,
        aadhaarNumber: userData.aadhaarNumber,
        aadhaarVerified: userData.aadhaarVerified || false,
        primaryService: normalizeServiceName(userData.primaryService || ''),
        experienceYears: userData.experienceYears,
        hourlyRate: userData.hourlyRate.toString(),
        serviceDistricts: userData.serviceDistricts,
        serviceAreas: userData.serviceAreas || [],
        skills: userData.skills,
        bio: userData.bio,
        bioDataDocument: userData.bioDataDocument,
        isAvailable: true,
      });
      
      return res.json({ 
        message: "Worker registered successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          profilePicture: user.profilePicture,
        }
      });
      
    } catch (error) {
      console.error("Worker signup error:", error);
      return res.status(500).json({ message: "Failed to register worker" });
    }
  });

  // Legacy authentication routes (keeping for backward compatibility)
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { mobile, userType, role } = loginSchema.parse(req.body);
      
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

      // If role is specified, check if user has that role
      if (role && user.role !== role) {
        // User exists but doesn't have the requested role
        return res.status(404).json({ 
          message: `No ${role} account found for this mobile number. Please sign up as a ${role}.`,
          needsSignup: true,
          existingRole: user.role
        });
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
            district: "Chennai",
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
            district: "Chennai",
            isVerified: true,
            status: "approved"
          });
        }
      }
      // For regular users, they must exist
      else if (!user) {
        return res.status(404).json({ message: "User not found. Please sign up first." });
      }
      
      // Update last login timestamp for activity tracking
      await storage.updateUser(user.id, { 
        lastLoginAt: new Date()
      });
      
      // Refresh user data to include updated lastLoginAt
      user = await storage.getUser(user.id) || user;
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          district: user.district,
          houseNumber: user.houseNumber,
          streetName: user.streetName,
          areaName: user.areaName,
          state: user.state,
          pincode: user.pincode,
          fullAddress: user.fullAddress,
          isVerified: user.isVerified,
          status: user.status,
          createdAt: user.createdAt,
          profilePicture: user.profilePicture,
          address: user.address,
          bankAccountNumber: user.bankAccountNumber,
          bankIFSC: user.bankIFSC,
          bankAccountHolderName: user.bankAccountHolderName,
          bankName: user.bankName,
          bankBranch: user.bankBranch,
          bankAccountType: user.bankAccountType,
          bankMICR: user.bankMICR,
          lastLoginAt: user.lastLoginAt,
        }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Fast registration for both client and worker
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { role, ...userData } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByMobile(userData.mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this mobile number" });
      }
      
      if (role === "client") {
        const clientData = clientSignupSchema.parse({ role, ...userData });
        const user = await storage.createUser(clientData);
        
        res.json({
          message: "Client registered successfully",
          user: {
            id: user.id,
            mobile: user.mobile,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            district: user.district,
            houseNumber: user.houseNumber,
            streetName: user.streetName,
            areaName: user.areaName,
            state: user.state,
            pincode: user.pincode,
            fullAddress: user.fullAddress,
          }
        });
      } else if (role === "worker") {
        // For fast worker registration, create minimal profile
        const workerData = {
          ...userData,
          role: "worker",
          aadhaarNumber: "000000000000", // Placeholder - will be updated later
          experienceYears: 1,
          hourlyRate: 0,
          serviceDistricts: [userData.district],
          skills: [userData.primaryService],
        };
        
        const parsedData = workerSignupSchema.parse(workerData);
        const user = await storage.createUser(parsedData);
        
        // Create worker profile
        const workerProfile = await storage.createWorkerProfile({
          userId: user.id,
          aadhaarNumber: "000000000000", // Placeholder
          primaryService: userData.primaryService,
          experienceYears: 1,
          hourlyRate: 0,
          serviceDistricts: [userData.district],
          skills: [userData.primaryService],
          bio: "Profile to be updated",
        });
        
        res.json({
          message: "Worker registered successfully",
          user: {
            id: user.id,
            mobile: user.mobile,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            district: user.district,
            address: user.address,
            state: user.state,
            pincode: user.pincode,
          }
        });
      } else {
        return res.status(400).json({ message: "Invalid role specified" });
      }
    } catch (error) {
      console.error("Fast registration error:", error);
      res.status(400).json({ message: "Registration failed", error: error instanceof Error ? error.message : "Unknown error" });
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
          district: user.district,
          isVerified: user.isVerified,
          status: user.status,
          createdAt: user.createdAt,
          profilePicture: user.profilePicture,
          address: user.address,
          state: user.state,
          pincode: user.pincode,
          bankAccountNumber: user.bankAccountNumber,
          bankIFSC: user.bankIFSC,
          bankAccountHolderName: user.bankAccountHolderName,
          bankName: user.bankName,
          bankBranch: user.bankBranch,
          bankAccountType: user.bankAccountType,
          bankMICR: user.bankMICR,
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
      
      const user = await storage.createUser({
        ...userData,
        state: userData.state || "Tamil Nadu",
        district: serviceDistricts?.[0] || "Salem", // Use first service district
        status: "pending"
      });
      
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
          district: user.district,
          isVerified: user.isVerified,
          status: user.status,
          createdAt: user.createdAt,
          profilePicture: user.profilePicture,
          address: user.address,
          state: user.state,
          pincode: user.pincode,
          bankAccountNumber: user.bankAccountNumber,
          bankIFSC: user.bankIFSC,
          bankAccountHolderName: user.bankAccountHolderName,
          bankName: user.bankName,
          bankBranch: user.bankBranch,
          bankAccountType: user.bankAccountType,
          bankMICR: user.bankMICR,
        },
        workerProfile
      });
    } catch (error) {
      console.error("Worker signup error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Districts and areas now handled via API - database routes removed
  
  // Advertisement endpoints
  // Get all advertisements (for admin)
  app.get("/api/advertisements", async (req, res) => {
    try {
      const advertisements = await storage.getAllAdvertisements();
      res.json(advertisements);
    } catch (error) {
      console.error("Get advertisements error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get active advertisements by target audience
  app.get("/api/advertisements/active/:targetAudience", async (req, res) => {
    try {
      const { targetAudience } = req.params;
      const advertisements = await storage.getActiveAdvertisementsByType(targetAudience);
      res.json(advertisements);
    } catch (error) {
      console.error("Get active advertisements error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create advertisement
  app.post("/api/advertisements", async (req, res) => {
    try {
      const newAdvertisement = await storage.createAdvertisement(req.body);
      res.status(201).json(newAdvertisement);
    } catch (error) {
      console.error("Create advertisement error:", error);
      res.status(500).json({ message: "Failed to create advertisement" });
    }
  });

  // Update advertisement
  app.put("/api/advertisements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedAdvertisement = await storage.updateAdvertisement(id, req.body);
      res.json(updatedAdvertisement);
    } catch (error) {
      console.error("Update advertisement error:", error);
      res.status(500).json({ message: "Failed to update advertisement" });
    }
  });

  // Delete advertisement
  app.delete("/api/advertisements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdvertisement(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete advertisement error:", error);
      res.status(500).json({ message: "Failed to delete advertisement" });
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
      const { name, description, icon, isActive } = req.body;
      
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
        description: description?.trim() || `${name.trim()} services`,
        icon: icon || "wrench",
        isActive: isActive !== false, // Default to true
      });

      // Update states-districts.json with new service type
      try {
        const { statesDistrictsManager } = await import('./statesDistrictsManager.js');
        await statesDistrictsManager.addServiceTypeToAllStates(name.trim());
        console.log(`Successfully added service "${name.trim()}" to states-districts.json`);
      } catch (jsonError) {
        console.error("Failed to update states-districts.json:", jsonError);
        // Don't fail the request if JSON update fails
      }

      res.status(201).json(newService);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Get service types from states-districts.json
  app.get("/api/service-types", async (req, res) => {
    try {
      const { statesDistrictsManager } = await import('./statesDistrictsManager.js');
      const serviceTypes = await statesDistrictsManager.getAllServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      console.error("Get service types error:", error);
      res.status(500).json({ message: "Failed to get service types" });
    }
  });

  // Get service types for specific state
  app.get("/api/service-types/:state", async (req, res) => {
    try {
      const { state } = req.params;
      const { statesDistrictsManager } = await import('./statesDistrictsManager.js');
      const serviceTypes = await statesDistrictsManager.getServiceTypesForState(state);
      res.json(serviceTypes);
    } catch (error) {
      console.error("Get service types for state error:", error);
      res.status(500).json({ message: "Failed to get service types for state" });
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
      
      // Debug log to check status values
      console.log(`Worker profile requested for ${userId}:`, {
        id: user.id,
        firstName: user.firstName,
        status: user.status,
        isVerified: user.isVerified,
        role: user.role
      });
      
      // Get worker profile
      const workerProfile = await storage.getWorkerProfile(userId);
      
      // Get district name if district exists
      let district = null;
      if (user.district) {
        district = { name: user.district };
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
      console.log("PATCH booking status request:", { id: req.params.id, body: req.body });
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const booking = await storage.updateBookingStatus(id, status);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      console.log("Booking status updated successfully:", booking.id, "->", booking.status);
      
      res.set('Content-Type', 'application/json');
      res.json({
        success: true,
        message: "Booking status updated",
        booking
      });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // Worker marks job as complete (generates OTP for client)
  app.post("/api/bookings/:id/worker-complete", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Worker marking job complete:", id);
      
      // Generate OTP (in production, this would be sent via SMS)
      const completionOTP = Math.floor(100000 + Math.random() * 900000).toString();
      const otpGeneratedAt = new Date();
      const workerCompletedAt = new Date();
      
      // Update booking with completion details
      const booking = await storage.updateBookingCompletion(id, {
        status: 'completed',
        completionOTP,
        otpGeneratedAt,
        workerCompletedAt
      });
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      console.log(`Job marked complete. OTP ${completionOTP} generated for booking ${id}`);
      
      res.json({
        success: true,
        message: "Job marked as complete. OTP sent to client.",
        booking,
        otp: completionOTP // In development, return OTP for testing
      });
    } catch (error) {
      console.error("Worker complete error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // Client verifies completion OTP
  app.post("/api/bookings/:id/verify-completion", async (req, res) => {
    try {
      const { id } = req.params;
      const { otp } = req.body;
      
      console.log("Client verifying completion OTP:", id, "OTP:", otp);
      
      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }
      
      const booking = await storage.verifyCompletionOTP(id, otp);
      
      if (!booking) {
        return res.status(400).json({ message: "Invalid OTP or booking not found" });
      }
      
      console.log(`Completion OTP verified for booking ${id}`);
      
      res.json({
        success: true,
        message: "Job completion verified successfully",
        booking
      });
    } catch (error) {
      console.error("Verify completion error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // Submit review for completed job
  app.post("/api/bookings/:id/review", async (req, res) => {
    try {
      const { id } = req.params;
      const reviewData = req.body;
      
      console.log("Submitting review for booking:", id, reviewData);
      
      const review = await storage.createWorkerReview({
        bookingId: id,
        ...reviewData
      });
      
      if (!review) {
        return res.status(400).json({ message: "Could not create review" });
      }
      
      console.log(`Review submitted for booking ${id}`);
      
      res.json({
        success: true,
        message: "Review submitted successfully",
        review
      });
    } catch (error) {
      console.error("Submit review error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // Delete completed booking
  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // First check if booking exists and is completed
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "Only completed bookings can be deleted" });
      }
      
      const deleted = await storage.deleteBooking(id);
      
      if (!deleted) {
        return res.status(400).json({ message: "Could not delete booking" });
      }
      
      console.log(`Booking deleted: ${id}`);
      
      res.json({
        success: true,
        message: "Booking deleted successfully"
      });
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });

  // Cleanup old completed bookings (auto-removal after 30 days)
  app.post("/api/bookings/cleanup", async (req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      const deletedCount = await storage.cleanupOldBookings(thirtyDaysAgo);
      
      console.log(`Cleaned up ${deletedCount} old completed bookings`);
      
      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} old completed bookings`,
        deletedCount
      });
    } catch (error) {
      console.error("Cleanup bookings error:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
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

  // Dedicated endpoint for admin management - only returns admin and super_admin users
  app.get("/api/admin/admins", async (req, res) => {
    try {
      const users = await storage.getUsersWithProfiles();
      const adminUsers = users.filter(user => user.role === "admin" || user.role === "super_admin");
      

      
      res.json(adminUsers);
    } catch (error) {
      console.error("Get admin management users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all workers with their profiles for admin management
  app.get("/api/admin/workers", async (req, res) => {
    try {
      const workers = await storage.getAllWorkersWithProfiles();
      res.json(workers);
    } catch (error) {
      console.error("Get admin workers error:", error);
      res.status(500).json({ error: "Failed to fetch workers" });
    }
  });

  // Send message to worker
  app.post("/api/admin/workers/:workerId/message", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const worker = await storage.getUser(workerId);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      // For now, just log the message since messages table might not exist
      console.log(`Admin message to worker ${workerId}: ${message}`);
      
      // TODO: Implement proper message storage when messages table is available
      res.json({ message: "Message sent successfully to worker" });
    } catch (error) {
      console.error("Error sending message to worker:", error);
      res.status(500).json({ error: "Failed to send message to worker" });
    }
  });

  // Update worker status (verified/unverified)
  app.patch("/api/admin/workers/:workerId/status", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { status, reason } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const isVerified = status === "verified";
      
      const updatedUser = await storage.updateUser(workerId, { 
        isVerified,
        updatedAt: new Date()
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Worker not found" });
      }
      
      console.log(`Worker ${workerId} status changed to ${status}. Reason: ${reason || 'No reason provided'}`);
      
      res.json({ 
        message: `Worker ${status} successfully`,
        user: {
          id: updatedUser.id,
          isVerified: updatedUser.isVerified
        }
      });
    } catch (error) {
      console.error("Error updating worker status:", error);
      res.status(500).json({ error: "Failed to update worker status" });
    }
  });

  // Delete worker
  app.delete("/api/admin/workers/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      
      // First check if worker exists
      const worker = await storage.getUser(workerId);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      // Delete worker profile first
      await storage.deleteWorkerProfile(workerId);
      
      // Then delete the user
      await storage.deleteUser(workerId);
      
      res.json({ message: "Worker deleted successfully" });
    } catch (error) {
      console.error("Error deleting worker:", error);
      res.status(500).json({ error: "Failed to delete worker" });
    }
  });

  // Create admin user (super admin only)
  app.post("/api/admin/create-admin", async (req, res) => {
    try {
      const { firstName, lastName, mobile, email, address, district, profilePicture } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !mobile || !email || !address || !district) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByMobile(mobile);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this mobile number" });
      }

      // Create admin user
      const adminUser = await storage.createUser({
        firstName,
        lastName,
        mobile,
        email,
        address,
        district,
        profilePicture: profilePicture || null,
        role: "admin",
        isVerified: true, // Admins are pre-verified
        isActive: true,
        status: "approved"
      });

      res.status(201).json({
        message: "Admin user created successfully",
        user: {
          id: adminUser.id,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          mobile: adminUser.mobile,
          email: adminUser.email,
          role: adminUser.role,
          isVerified: adminUser.isVerified,
          createdAt: adminUser.createdAt
        }
      });
    } catch (error) {
      console.error("Create admin user error:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Database management endpoints (super admin only)
  app.post("/api/admin/database/export", async (req, res) => {
    try {
      const { execSync } = await import('child_process');
      
      // Execute the backup script
      execSync('cd database && tsx backup-export.ts', { 
        stdio: 'inherit',
        cwd: process.cwd() 
      });

      res.json({ 
        message: "Database exported successfully",
        timestamp: new Date().toISOString(),
        status: "completed"
      });
    } catch (error) {
      console.error("Database export error:", error);
      res.status(500).json({ message: "Failed to export database" });
    }
  });

  app.post("/api/admin/database/restore", async (req, res) => {
    try {
      const { execSync } = await import('child_process');
      
      // Execute the restore script
      execSync('cd database && tsx backup-restore.ts', { 
        stdio: 'inherit',
        cwd: process.cwd() 
      });

      res.json({ 
        message: "Database restored successfully",
        timestamp: new Date().toISOString(),
        status: "completed"
      });
    } catch (error) {
      console.error("Database restore error:", error);
      res.status(500).json({ message: "Failed to restore database" });
    }
  });

  app.get("/api/admin/database/download", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const backupPath = path.default.join(process.cwd(), 'database', 'backups', 'latest-backup.json');
      
      if (!fs.default.existsSync(backupPath)) {
        return res.status(404).json({ message: "Backup file not found" });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `spanner-database-backup-${timestamp}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.default.createReadStream(backupPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Database download error:", error);
      res.status(500).json({ message: "Failed to download backup" });
    }
  });

  app.get("/api/admin/admin-counts", async (req, res) => {
    try {
      const adminCounts = await storage.getAdminCounts();
      res.json(adminCounts);
    } catch (error) {
      console.error("Get admin counts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/location-counts", async (req, res) => {
    try {
      // Safely handle the states-districts.json structure
      const data = statesDistrictsData;
      
      if (!data || !data.states) {
        console.error("Invalid states-districts data structure:", data);
        return res.status(500).json({ message: "Invalid location data" });
      }
      
      const stateNames = Object.keys(data.states);
      const stateCount = stateNames.length;
      let districtCount = 0;
      
      // Count districts across all states
      for (const stateName of stateNames) {
        const state = data.states[stateName];
        if (state && state.districts && Array.isArray(state.districts)) {
          districtCount += state.districts.length;
        }
      }
      
      res.json({
        states: stateCount,
        districts: districtCount,
        totalLocations: stateCount + districtCount
      });
    } catch (error) {
      console.error("Get location counts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/database-info", async (req, res) => {
    try {
      const dbInfo = await storage.getDatabaseInfo();
      res.json(dbInfo);
    } catch (error) {
      console.error("Get database info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/service-counts", async (req, res) => {
    try {
      // Get service categories from database
      const serviceCategories = await storage.getAllServiceCategories();
      
      // Get workers with profiles to calculate skill-based services
      const workersWithProfiles = await storage.getAllWorkersWithProfiles();
      const allSkills = new Set<string>();
      
      for (const worker of workersWithProfiles) {
        if (worker.workerProfile && worker.workerProfile.skills && Array.isArray(worker.workerProfile.skills)) {
          for (const skill of worker.workerProfile.skills) {
            if (typeof skill === 'string') {
              allSkills.add(skill.toLowerCase().trim());
            }
          }
        }
      }
      
      // Calculate states with services based on worker presence
      const statesWithServices = new Set(
        workersWithProfiles
          .map((worker: any) => worker.state)
          .filter((state: any) => state && typeof state === 'string')
      ).size;
      
      res.json({
        uniqueServices: serviceCategories.length,
        totalServices: serviceCategories.length + allSkills.size,
        statesWithServices: statesWithServices || Object.keys(statesDistrictsData.states).length
      });
    } catch (error) {
      console.error("Get service counts error:", error);
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

  app.post("/api/admin/verify-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { comment } = req.body;
      
      if (!comment || !comment.trim()) {
        return res.status(400).json({ message: "Verification comment is required" });
      }
      
      const updatedUser = await storage.updateUser(workerId, { 
        status: "verified",
        verificationComment: comment.trim(),
        verifiedAt: new Date(),
        verifiedBy: "ADMIN"
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.json({ message: "Worker verified successfully", user: updatedUser });
    } catch (error) {
      console.error("Error verifying worker:", error);
      res.status(500).json({ message: "Failed to verify worker" });
    }
  });

  app.post("/api/admin/approve-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { comment } = req.body;
      
      const updatedUser = await storage.updateUser(workerId, { 
        status: "approved",
        isVerified: true,
        approvedAt: new Date(),
        approvedBy: "ADMIN",
        ...(comment && { verificationComment: comment.trim() })
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.json({ message: "Worker approved successfully", user: updatedUser });
    } catch (error) {
      console.error("Error approving worker:", error);
      res.status(500).json({ error: "Failed to approve worker" });
    }
  });

  // Suspend worker
  app.post("/api/admin/suspend-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { reason } = req.body;
      
      const updatedUser = await storage.updateUser(workerId, { 
        status: "suspended",
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedBy: "ADMIN",
        suspensionReason: reason || "No reason provided"
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.json({ message: "Worker suspended successfully", user: updatedUser });
    } catch (error) {
      console.error("Error suspending worker:", error);
      res.status(500).json({ error: "Failed to suspend worker" });
    }
  });

  // Resume worker (unsuspend)
  app.post("/api/admin/resume-worker/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      
      const updatedUser = await storage.updateUser(workerId, { 
        status: "approved", // Resume to approved status
        isSuspended: false,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
        hasRejoinRequest: false, // Clear rejoin request flag
        rejoinRequestedAt: null,
        rejoinRequestReason: null
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.json({ message: "Worker resumed successfully", user: updatedUser });
    } catch (error) {
      console.error("Error resuming worker:", error);
      res.status(500).json({ error: "Failed to resume worker" });
    }
  });

  // Worker rejoin request
  app.post("/api/worker/rejoin-request/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { reason } = req.body;
      
      const updatedUser = await storage.updateUser(workerId, { 
        hasRejoinRequest: true,
        rejoinRequestedAt: new Date(),
        rejoinRequestReason: reason || "No reason provided"
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Worker not found" });
      }
      
      res.json({ message: "Rejoin request submitted successfully", user: updatedUser });
    } catch (error) {
      console.error("Error submitting rejoin request:", error);
      res.status(500).json({ error: "Failed to submit rejoin request" });
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

  // Refresh user profile - fetch latest data from database
  app.get("/api/user/refresh/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return complete user object with all current fields
      res.json({
        message: "Profile refreshed successfully",
        user: {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          district: user.district,
          houseNumber: user.houseNumber,
          streetName: user.streetName,
          areaName: user.areaName,
          state: user.state,
          pincode: user.pincode,
          fullAddress: user.fullAddress,
          isVerified: user.isVerified,
          status: user.status,
          createdAt: user.createdAt,
          profilePicture: user.profilePicture,
          address: user.address,
          bankAccountNumber: user.bankAccountNumber,
          bankIFSC: user.bankIFSC,
          bankAccountHolderName: user.bankAccountHolderName,
          bankName: user.bankName,
          bankBranch: user.bankBranch,
          bankAccountType: user.bankAccountType,
          bankMICR: user.bankMICR,
          lastLoginAt: user.lastLoginAt,
        }
      });
    } catch (error) {
      console.error("Refresh user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete user endpoint (admin and super admin with restrictions)
  app.delete("/api/admin/delete-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get the user to be deleted and the current admin user
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get current admin from session (you might need to implement this based on your auth)
      // For now, we'll allow the deletion and let frontend handle permissions
      // In a real implementation, you'd validate the admin's role here
      
      // Prevent deletion of super admin accounts
      if (userToDelete.role === 'super_admin') {
        return res.status(403).json({ error: "Cannot delete super admin accounts" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Bulk delete users endpoint
  app.delete("/api/admin/bulk-delete-users", async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "No user IDs provided" });
      }
      
      console.log(`Bulk delete request for ${userIds.length} users:`, userIds);
      
      let deletedCount = 0;
      const errors = [];
      const skippedSuperAdmins = [];
      
      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await storage.getUser(userId);
          if (!user) {
            console.log(`User not found: ${userId}`);
            errors.push(`User ${userId} not found`);
            continue;
          }
          
          // Prevent deletion of super admin accounts
          if (user.role === 'super_admin') {
            console.log(`Skipping super admin: ${userId}`);
            skippedSuperAdmins.push(userId);
            continue;
          }
          
          await storage.deleteUser(userId);
          deletedCount++;
          console.log(`Successfully deleted user: ${userId}`);
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error);
          errors.push(`Failed to delete user ${userId}`);
        }
      }
      
      console.log(`Bulk delete completed: ${deletedCount} deleted, ${errors.length} errors, ${skippedSuperAdmins.length} super admins skipped`);
      
      let message = `${deletedCount} user(s) deleted successfully`;
      if (skippedSuperAdmins.length > 0) {
        message += `, ${skippedSuperAdmins.length} super admin(s) skipped`;
      }
      
      res.json({ 
        message,
        deletedCount,
        skippedSuperAdmins: skippedSuperAdmins.length > 0 ? skippedSuperAdmins : undefined,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Bulk verify users endpoint
  app.put("/api/admin/bulk-verify-users", async (req, res) => {
    try {
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "No user IDs provided" });
      }
      
      console.log(`Bulk verify request for ${userIds.length} users:`, userIds);
      
      let verifiedCount = 0;
      const errors = [];
      
      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await storage.getUser(userId);
          if (!user) {
            console.log(`User not found: ${userId}`);
            errors.push(`User ${userId} not found`);
            continue;
          }
          
          // Update user verification status and approve if worker
          if (user.role === 'worker') {
            await storage.updateUser(userId, { 
              isVerified: true,
              status: "approved"
            });
          } else {
            await storage.updateUser(userId, { 
              isVerified: true
            });
          }
          
          verifiedCount++;
          console.log(`Successfully verified user: ${userId}`);
        } catch (error) {
          console.error(`Error verifying user ${userId}:`, error);
          errors.push(`Failed to verify user ${userId}`);
        }
      }
      
      console.log(`Bulk verify completed: ${verifiedCount} verified, ${errors.length} errors`);
      
      res.json({ 
        message: `${verifiedCount} user(s) verified successfully`,
        verifiedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Bulk verify error:", error);
      res.status(500).json({ error: "Internal server error" });
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

  // Update user details endpoint (admin)
  app.put("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Remove any fields that shouldn't be updated this way
      const { id, createdAt, ...allowedUpdates } = updates;
      
      const updatedUser = await storage.updateUser(userId, allowedUpdates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // User verification endpoint
  app.put("/api/admin/verify-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // Update both isVerified and status to approved when verifying a worker
      await storage.updateUser(userId, { 
        isVerified: true,
        status: "approved" 
      });
      res.json({ message: "User verified successfully" });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ error: "Failed to verify user" });
    }
  });

  // One-time fix endpoint to correct status for already verified workers
  app.post("/api/admin/fix-verified-workers-status", async (req, res) => {
    try {
      // Get all workers with their profiles
      const allWorkers = await storage.getAllWorkersWithProfiles();
      let fixedCount = 0;
      
      // Update status for verified workers who have incorrect status
      for (const worker of allWorkers) {
        if (worker.isVerified && worker.status !== "approved") {
          await storage.updateUser(worker.id, { 
            status: "approved" 
          });
          fixedCount++;
          console.log(`Fixed status for verified worker: ${worker.id} (${worker.firstName})`);
        }
      }
      
      res.json({ 
        message: `Fixed status for ${fixedCount} verified workers`,
        fixedCount 
      });
    } catch (error) {
      console.error("Error fixing verified workers status:", error);
      res.status(500).json({ error: "Failed to fix verified workers status" });
    }
  });

  // Direct endpoint to check and fix a specific worker's status
  app.post("/api/admin/fix-worker-status/:workerId", async (req, res) => {
    try {
      const { workerId } = req.params;
      const { force } = req.body || {};
      
      // Get the worker details
      const worker = await storage.getUser(workerId);
      
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }
      
      console.log(`Current worker status for ${workerId}:`, {
        id: worker.id,
        firstName: worker.firstName,
        role: worker.role,
        status: worker.status,
        isVerified: worker.isVerified
      });
      
      // Force update if requested
      if (force) {
        await storage.updateUser(workerId, { 
          isVerified: true,
          status: "approved" 
        });
        console.log(`Force updated worker ${workerId} to verified and approved`);
        
        // Verify the update
        const updatedWorker = await storage.getUser(workerId);
        console.log(`After force update:`, {
          id: updatedWorker?.id,
          status: updatedWorker?.status,
          isVerified: updatedWorker?.isVerified
        });
        
        return res.json({ 
          message: "Worker force updated to verified and approved",
          previousStatus: worker.status,
          newStatus: updatedWorker?.status,
          isVerified: updatedWorker?.isVerified
        });
      }
      
      // If worker is verified but status is not approved, fix it
      if (worker.isVerified && worker.status !== "approved") {
        await storage.updateUser(workerId, { 
          status: "approved" 
        });
        console.log(`Fixed status for worker ${workerId} to approved`);
        return res.json({ 
          message: "Worker status fixed to approved",
          previousStatus: worker.status,
          newStatus: "approved"
        });
      } else if (!worker.isVerified || worker.status !== "approved") {
        // If not verified or not approved, set both
        await storage.updateUser(workerId, { 
          isVerified: true,
          status: "approved" 
        });
        console.log(`Set worker ${workerId} as verified and approved`);
        return res.json({ 
          message: "Worker set as verified and approved",
          previousStatus: worker.status,
          newStatus: "approved"
        });
      }
      
      return res.json({ 
        message: "Worker already has correct status",
        currentStatus: worker.status,
        isVerified: worker.isVerified
      });
    } catch (error) {
      console.error("Error fixing worker status:", error);
      res.status(500).json({ error: "Failed to fix worker status" });
    }
  });

  // User suspension endpoint
  app.put("/api/admin/suspend-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Suspend the user by setting them as inactive and unverified
      const updatedUser = await storage.updateUser(userId, { 
        isVerified: false,
        isActive: false,
        status: "suspended",
        updatedAt: new Date()
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user status" });
      }
      
      res.json({ 
        message: "User suspended successfully",
        user: {
          id: updatedUser.id,
          status: updatedUser.status,
          isActive: updatedUser.isActive,
          isVerified: updatedUser.isVerified
        }
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ error: "Failed to suspend user" });
    }
  });

  // Send message to user endpoint
  app.post("/api/admin/send-message", async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "userId and message are required" });
      }

      // For now, just log the message since messages table might not exist
      console.log(`Admin message to ${userId}: ${message}`);
      
      // TODO: Implement proper message storage when messages table is available
      res.json({ message: "Message sent successfully", messageId: "temp-id" });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Update user profile endpoint
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Get current user to verify existence
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove undefined/null/empty fields and filter allowed fields
      const allowedFields = [
        'firstName', 'lastName', 'email', 'mobile', 'address', 'profilePicture', 
        'houseNumber', 'streetName', 'areaName', 'district', 'state', 'pincode', 'fullAddress',
        'bankAccountNumber', 'bankIFSC', 'bankAccountHolderName', 'bankName', 'bankBranch', 'bankAccountType', 'bankMICR'
      ];
      const cleanData = Object.fromEntries(
        Object.entries(updateData)
          .filter(([key, value]) => 
            allowedFields.includes(key) && 
            value !== undefined && 
            value !== null && 
            value !== ""
          )
      );

      // Only update if there's data to update
      if (Object.keys(cleanData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      // Update user
      const updatedUser = await storage.updateUser(id, cleanData);
      
      res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update user bank details endpoint
  app.put("/api/users/:userId/bank-details", async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        bankAccountNumber,
        bankIFSC,
        bankAccountHolderName,
        bankName,
        bankBranch,
        bankAccountType,
        bankMICR,
        address,
        district,
        state,
        pincode
      } = req.body;

      // Validate required fields
      if (!bankAccountNumber || !bankIFSC || !bankAccountHolderName || !bankAccountType) {
        return res.status(400).json({ error: "Missing required bank details" });
      }

      // Validate IFSC format
      if (bankIFSC.length !== 11) {
        return res.status(400).json({ error: "Invalid IFSC code format" });
      }

      // Prepare update data - only include non-empty fields
      const updateData: any = {
        bankAccountNumber,
        bankIFSC,
        bankAccountHolderName,
        bankName,
        bankBranch,
        bankAccountType,
        bankMICR
      };

      // Add address fields if provided
      if (address) updateData.address = address;
      if (district) updateData.district = district;
      if (state) updateData.state = state;
      if (pincode) updateData.pincode = pincode;

      await storage.updateUser(userId, updateData);

      res.json({ message: "Bank details updated successfully" });
    } catch (error) {
      console.error("Error updating bank details:", error);
      res.status(500).json({ error: "Failed to update bank details" });
    }
  });

  // Job postings routes
  app.get("/api/job-postings", async (req, res) => {
    try {
      const { state, district, serviceCategory, workerId } = req.query;
      let jobs = await storage.getAllJobPostings();
      
      // If worker-specific filters are provided, apply location and service filtering
      if (workerId || (state && district && serviceCategory)) {
        // Get worker details if workerId is provided
        if (workerId) {
          const worker = await storage.getUser(workerId as string);
          if (worker && worker.role === 'worker') {
            const workerProfile = await storage.getWorkerProfile(workerId as string);
            if (workerProfile) {
              // Import service utility once before filtering
              const { areServicesEquivalent } = await import('../shared/serviceUtils.js');
              
              // Filter by worker's state, districts, and primary service
              jobs = jobs.filter(job => {
                const matchesState = job.state === worker.state;
                const matchesDistrict = (workerProfile.serviceDistricts as string[]).includes(job.district);
                // Use the service utility for consistent matching
                const matchesService = areServicesEquivalent(job.serviceCategory, workerProfile.primaryService);
                
                return matchesState && matchesDistrict && matchesService;
              });
            }
          }
        } else {
          // Manual filtering with provided parameters
          jobs = jobs.filter(job => {
            const matchesState = !state || job.state === state;
            const matchesDistrict = !district || job.district === district;
            const matchesService = !serviceCategory || job.serviceCategory === serviceCategory;
            return matchesState && matchesDistrict && matchesService;
          });
        }
      }
      
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
      console.log("Received job posting data:", req.body);
      
      // Generate professional job ID using client ID format
      const jobId = await generateJobId(req.body.clientId);
      
      // Convert budget numbers to strings for database compatibility
      const { budgetMin, budgetMax, deadline, districtId, ...rest } = req.body;
      const jobData = {
        ...rest,
        id: jobId, // Use the generated professional job ID as the primary key
        district: districtId, // Map districtId to district field
        budgetMin: budgetMin !== undefined && budgetMin !== null ? budgetMin.toString() : null,
        budgetMax: budgetMax !== undefined && budgetMax !== null ? budgetMax.toString() : null,
        deadline: deadline ? new Date(deadline) : null, // Ensure deadline is properly converted to Date
      };
      
      console.log("Processed job data for database:", jobData);
      console.log("Generated Job ID:", jobId);
      
      const job = await storage.createJobPosting(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job posting:", error);
      res.status(500).json({ message: "Failed to create job posting" });
    }
  });

  app.put("/api/job-postings/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      console.log("Updating job posting:", jobId, req.body);
      
      // Process deadline field
      const { deadline, ...rest } = req.body;
      const updateData = {
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
      };
      
      console.log("Processed update data for database:", updateData);
      
      const updatedJob = await storage.updateJobPosting(jobId, updateData);
      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job posting:", error);
      res.status(500).json({ message: "Failed to update job posting" });
    }
  });

  app.put("/api/job-postings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("=== PUT /api/job-postings/:id ===");
      console.log("Job ID:", id);
      console.log("Request body:", req.body);
      
      console.log("Processed job data for database:", req.body);
      
      const job = await storage.updateJobPosting(id, req.body);
      console.log("Updated job result:", job);
      
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
      
      // Enhance accepted bids with client information for privacy model
      const enhancedBids = await Promise.all(
        bids.map(async (bid: any) => {
          if (bid.status === 'accepted' && bid.jobPosting?.clientId) {
            // Fetch client details only for accepted bids (Financial model activated)
            const client = await storage.getUser(bid.jobPosting.clientId);
            if (client) {
              // Include client mobile and name only for accepted bids
              return {
                ...bid,
                jobPosting: {
                  ...bid.jobPosting,
                  clientMobile: client.mobile,
                  clientFirstName: client.firstName,
                  clientLastName: client.lastName,
                  clientFullName: `${client.firstName} ${client.lastName || ''}`.trim()
                }
              };
            }
          }
          return bid;
        })
      );
      
      res.json(enhancedBids);
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

  // Update bid (for workers to edit their bids)
  app.patch("/api/bids/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { proposedAmount, estimatedDuration, proposal } = req.body;
      
      // Validate required fields
      if (!proposedAmount || !proposal) {
        return res.status(400).json({ message: "Proposed amount and proposal are required" });
      }

      const result = await storage.updateBid(id, {
        proposedAmount,
        estimatedDuration,
        proposal,
        updatedAt: new Date().toISOString()
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error updating bid:", error);
      res.status(500).json({ message: "Failed to update bid" });
    }
  });

  // Delete bid (for workers to delete their bids)
  app.delete("/api/bids/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBid(id);
      res.json({ message: "Bid deleted successfully" });
    } catch (error) {
      console.error("Error deleting bid:", error);
      res.status(500).json({ message: "Failed to delete bid" });
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

  // Worker acknowledges awarded job (with financial model detection)
  app.post("/api/bookings/:id/acknowledge", async (req, res) => {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      
      if (!workerId) {
        return res.status(400).json({ message: "Worker ID is required" });
      }
      
      const result = await storage.acknowledgeJob(id, workerId);
      
      res.json({
        success: true,
        message: "Job acknowledged successfully",
        data: result
      });
    } catch (error) {
      console.error("Error acknowledging job:", error);
      res.status(500).json({ 
        message: error.message || "Failed to acknowledge job" 
      });
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

  // Worker completes job by entering client's OTP (final step)
  app.post("/api/bookings/:id/complete-with-otp", async (req, res) => {
    try {
      const { id } = req.params;
      const { workerId, otp } = req.body;

      // Get booking details
      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.workerId !== workerId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (booking.status !== "in_progress") {
        return res.status(400).json({ message: "Job must be in progress to complete" });
      }

      // Verify OTP (client's OTP generated during job award)
      if (!booking.completionOTP || booking.completionOTP !== otp) {
        return res.status(400).json({ message: "Invalid completion OTP" });
      }

      // Check if OTP is expired (24 hours as set in acceptBid)
      const otpAge = new Date().getTime() - new Date(booking.otpGeneratedAt).getTime();
      if (otpAge > 24 * 60 * 60 * 1000) { // 24 hours
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Update booking to completed status
      await storage.updateBooking(id, {
        status: "completed",
        otpVerifiedAt: new Date(),
        workerCompletedAt: new Date(),
        clientConfirmedAt: new Date(),
      });

      res.json({ 
        message: "Job completed successfully using client's OTP.",
        status: "completed"
      });
    } catch (error) {
      console.error("Complete job with OTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client verifies OTP and confirms job completion
  app.post("/api/bookings/:id/verify-completion", async (req, res) => {
    try {
      const { id } = req.params;
      const { clientId, otp } = req.body;

      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.clientId !== clientId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (booking.status !== "worker_completed") {
        return res.status(400).json({ message: "Job not marked as complete by worker" });
      }

      if (booking.completionOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Check if OTP is expired (15 minutes)
      const otpAge = new Date().getTime() - new Date(booking.otpGeneratedAt).getTime();
      if (otpAge > 15 * 60 * 1000) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Update booking to completed
      await storage.updateBooking(id, {
        status: "completed",
        otpVerifiedAt: new Date(),
        clientConfirmedAt: new Date(),
      });

      res.json({ 
        message: "Job completion confirmed successfully!",
        status: "completed"
      });
    } catch (error) {
      console.error("Verify completion OTP error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Submit worker review and rating
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = submitReviewSchema.parse(req.body);

      // Check if booking is completed
      const booking = await storage.getBookingById(reviewData.bookingId);
      if (!booking || booking.status !== "completed") {
        return res.status(400).json({ message: "Can only review completed jobs" });
      }

      if (booking.clientId !== reviewData.clientId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Create review
      const review = await storage.createWorkerReview({
        ...reviewData,
        isPublic: true,
        isVerified: true,
      });

      // Update booking with client rating and review
      await storage.updateBooking(reviewData.bookingId, {
        clientRating: reviewData.rating,
        clientReview: reviewData.review || "",
      });

      // Update worker's overall rating
      await storage.updateWorkerRating(reviewData.workerId);

      res.status(201).json({
        message: "Review submitted successfully",
        review
      });
    } catch (error) {
      console.error("Submit review error:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Get worker reviews
  app.get("/api/workers/:id/reviews", async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getWorkerReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Get worker reviews error:", error);
      res.status(500).json({ message: "Internal server error" });
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

  // Messaging API endpoints
  
  // Send a message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get messages for a specific user (inbox)
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { type = 'received' } = req.query;
      
      const messages = type === 'sent' 
        ? await storage.getMessagesBySender(userId)
        : await storage.getMessagesByReceiver(userId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get conversation between two users
  app.get("/api/messages/conversation/:userId1/:userId2", async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const messages = await storage.getConversation(userId1, userId2);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Mark message as read
  app.patch("/api/messages/:messageId/read", async (req, res) => {
    try {
      const { messageId } = req.params;
      const message = await storage.markMessageAsRead(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Get unread message count
  app.get("/api/messages/:userId/unread-count", async (req, res) => {
    try {
      const { userId } = req.params;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Delete message
  app.delete("/api/messages/:messageId", async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.deleteMessage(messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Service History API routes
  
  // Get service history for a user
  app.get("/api/bookings/history", async (req, res) => {
    try {
      const userId = req.headers["user-id"] as string;
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const bookings = await storage.getBookingsWithDetails(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching service history:", error);
      res.status(500).json({ message: "Failed to fetch service history" });
    }
  });

  // Add/update review for a booking
  app.post("/api/bookings/:bookingId/review", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { rating, review } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const booking = await storage.updateBookingReview(bookingId, rating, review || "");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error updating booking review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  // Transfer History API Routes
  
  // Create transfer history
  app.post("/api/transfer-history", async (req, res) => {
    try {
      const transferData = insertTransferHistorySchema.parse(req.body);
      const transfer = await storage.createTransferHistory(transferData);
      res.status(201).json(transfer);
    } catch (error) {
      console.error("Error creating transfer history:", error);
      res.status(500).json({ message: "Failed to create transfer history" });
    }
  });

  // Get transfer history by client ID
  app.get("/api/transfer-history/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const transfers = await storage.getTransferHistoryByClient(clientId);
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching transfer history:", error);
      res.status(500).json({ message: "Failed to fetch transfer history" });
    }
  });

  // Delete transfer history
  app.delete("/api/transfer-history/:transferId", async (req, res) => {
    try {
      const { transferId } = req.params;
      await storage.deleteTransferHistory(transferId);
      res.json({ message: "Transfer history deleted successfully" });
    } catch (error) {
      console.error("Error deleting transfer history:", error);
      res.status(500).json({ message: "Failed to delete transfer history" });
    }
  });

  // Get financial statements by client ID (returns last 2 years data)
  app.get("/api/financial-statements/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const statements = await storage.getFinancialStatementsByClient(clientId);
      res.json(statements);
    } catch (error) {
      console.error("Error fetching financial statements:", error);
      res.status(500).json({ message: "Failed to fetch financial statements" });
    }
  });

  // Create or update financial statement
  app.post("/api/financial-statements", async (req, res) => {
    try {
      const { clientId, year, balance, spent, totalEarnings, totalBookings } = req.body;
      
      if (!clientId || !year) {
        return res.status(400).json({ message: "Client ID and year are required" });
      }

      const statement = await storage.createOrUpdateFinancialStatement(clientId, year, {
        balance: balance || "0.00",
        spent: spent || "0.00", 
        totalEarnings: totalEarnings || "0.00",
        totalBookings: totalBookings || 0,
      });
      
      res.json(statement);
    } catch (error) {
      console.error("Error creating/updating financial statement:", error);
      res.status(500).json({ message: "Failed to create/update financial statement" });
    }
  });

  // Generate workers for all states and districts (Admin only)
  app.post('/api/admin/generate-workers', async (req, res) => {
    try {
      // Import the generateWorkers function dynamically
      const { generateWorkers } = await import('../database/generate-workers.js');
      await generateWorkers();
      res.json({ message: 'Workers generated successfully' });
    } catch (error) {
      console.error('Error generating workers:', error);
      res.status(500).json({ message: 'Failed to generate workers' });
    }
  });

  // Get all districts with optional filtering
  app.get('/api/districts/:stateName?', async (req, res) => {
    try {
      const { stateName } = req.params;
      
      if (stateName && stateName !== 'undefined') {
        // Return districts for specific state
        const stateData = statesDistrictsData.states.find(
          state => state.state.toLowerCase() === stateName.toLowerCase()
        );
        
        if (!stateData) {
          return res.status(404).json({ message: 'State not found' });
        }
        
        res.json(stateData.districts);
      } else {
        // Return all states and their districts
        res.json(statesDistrictsData.states);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      res.status(500).json({ message: 'Failed to fetch districts' });
    }
  });

  // Advertisement management endpoints
  
  // Get all advertisements (admin)
  app.get('/api/advertisements', async (req, res) => {
    try {
      const ads = await storage.getAllAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      res.status(500).json({ message: 'Failed to fetch advertisements' });
    }
  });

  // Get active advertisements by type
  app.get('/api/advertisements/active/:targetAudience', async (req, res) => {
    try {
      const { targetAudience } = req.params;
      const ads = await storage.getActiveAdvertisementsByType(targetAudience);
      res.json(ads);
    } catch (error) {
      console.error('Error fetching active advertisements:', error);
      res.status(500).json({ message: 'Failed to fetch active advertisements' });
    }
  });

  // Get advertisement by ID
  app.get('/api/advertisements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.getAdvertisementById(id);
      if (!ad) {
        return res.status(404).json({ message: 'Advertisement not found' });
      }
      res.json(ad);
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      res.status(500).json({ message: 'Failed to fetch advertisement' });
    }
  });

  // Create advertisement (admin only)
  app.post('/api/advertisements', async (req, res) => {
    try {
      const validatedData = insertAdvertisementSchema.parse(req.body);
      const ad = await storage.createAdvertisement(validatedData);
      res.status(201).json(ad);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create advertisement' });
    }
  });

  // Update advertisement (admin only)
  app.put('/api/advertisements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.updateAdvertisement(id, req.body);
      if (!ad) {
        return res.status(404).json({ message: 'Advertisement not found' });
      }
      res.json(ad);
    } catch (error) {
      console.error('Error updating advertisement:', error);
      res.status(500).json({ message: 'Failed to update advertisement' });
    }
  });

  // Delete advertisement (admin only)
  app.delete('/api/advertisements/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdvertisement(id);
      res.status(200).json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ message: 'Failed to delete advertisement' });
    }
  });

  // Get global advertisement toggle setting
  app.get('/api/settings/advertisement-toggle', async (req, res) => {
    try {
      const value = await storage.getSetting('advertisement_enabled');
      // Default to true if not set
      res.json({ enabled: value === null ? true : value === 'true' });
    } catch (error) {
      console.error('Error getting advertisement toggle:', error);
      res.status(500).json({ message: 'Failed to get advertisement toggle' });
    }
  });

  // Set global advertisement toggle setting (admin only)
  app.put('/api/settings/advertisement-toggle', async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.setSetting('advertisement_enabled', enabled ? 'true' : 'false');
      res.json({ message: 'Advertisement toggle updated successfully', enabled });
    } catch (error) {
      console.error('Error setting advertisement toggle:', error);
      res.status(500).json({ message: 'Failed to set advertisement toggle' });
    }
  });

  // Notification routes
  app.post("/api/notifications", async (req, res) => {
    try {
      const notification = await storage.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Chat routes
  app.post("/api/chat/conversations", async (req, res) => {
    try {
      const conversation = await storage.createConversation(req.body);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/chat/conversations/client/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const conversations = await storage.getConversationsByClient(clientId);
      res.json(conversations);
    } catch (error) {
      console.error("Error getting client conversations:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/chat/conversations/admin/:adminId", async (req, res) => {
    try {
      const { adminId } = req.params;
      const conversations = await storage.getConversationsByAdmin(adminId);
      res.json(conversations);
    } catch (error) {
      console.error("Error getting admin conversations:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/chat/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error getting all conversations:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/chat/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversationById(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error getting conversation:", error);
      res.status(500).json({ message: "Failed to get conversation" });
    }
  });

  app.put("/api/chat/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.updateConversation(id, req.body);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const message = await storage.createChatMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/chat/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.put("/api/chat/messages/read/:conversationId/:userId", async (req, res) => {
    try {
      const { conversationId, userId } = req.params;
      await storage.markMessagesAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  app.get("/api/chat/unread/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread message count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });

  app.delete("/api/chat/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChatMessage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Chat Notification Preferences API Routes

  // Get user's notification preferences (create default if none exist)
  app.get("/api/chat/notification-preferences/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let preferences = await storage.getChatNotificationPreferences(userId);
      
      // If no preferences exist, create default ones
      if (!preferences) {
        const defaultPreferences = {
          userId,
          newMessageNotifications: true,
          priorityMessageNotifications: true,
          conversationStartedNotifications: true,
          adminResponseNotifications: true,
          emailNotifications: false,
          pushNotifications: true,
          soundNotifications: true,
          desktopNotifications: false,
          notificationFrequency: 'immediate' as const,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        };
        preferences = await storage.createChatNotificationPreferences(defaultPreferences);
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      res.status(500).json({ message: "Failed to get notification preferences" });
    }
  });

  // Update user's notification preferences
  app.put("/api/chat/notification-preferences/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      // Try to update existing preferences
      let preferences = await storage.updateChatNotificationPreferences(userId, updates);
      
      // If no preferences exist, create them with the updates
      if (!preferences) {
        const defaultPreferences = {
          userId,
          newMessageNotifications: true,
          priorityMessageNotifications: true,
          conversationStartedNotifications: true,
          adminResponseNotifications: true,
          emailNotifications: false,
          pushNotifications: true,
          soundNotifications: true,
          desktopNotifications: false,
          notificationFrequency: 'immediate' as const,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          ...updates,
        };
        preferences = await storage.createChatNotificationPreferences(defaultPreferences);
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Reset user's notification preferences to defaults
  app.post("/api/chat/notification-preferences/:userId/reset", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Delete existing preferences
      await storage.deleteChatNotificationPreferences(userId);
      
      // Create default preferences
      const defaultPreferences = {
        userId,
        newMessageNotifications: true,
        priorityMessageNotifications: true,
        conversationStartedNotifications: true,
        adminResponseNotifications: true,
        emailNotifications: false,
        pushNotifications: true,
        soundNotifications: true,
        desktopNotifications: false,
        notificationFrequency: 'immediate' as const,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };
      
      const preferences = await storage.createChatNotificationPreferences(defaultPreferences);
      res.json(preferences);
    } catch (error) {
      console.error("Error resetting notification preferences:", error);
      res.status(500).json({ message: "Failed to reset notification preferences" });
    }
  });

  // Financial Models API Routes

  // Get all financial models
  app.get("/api/financial-models", async (req, res) => {
    try {
      const models = await storage.getAllFinancialModels();
      // Prevent caching to ensure fresh data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(models);
    } catch (error) {
      console.error("Error fetching financial models:", error);
      res.status(500).json({ message: "Failed to fetch financial models" });
    }
  });

  // Get active financial models only
  app.get("/api/financial-models/active", async (req, res) => {
    try {
      const models = await storage.getActiveFinancialModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching active financial models:", error);
      res.status(500).json({ message: "Failed to fetch active financial models" });
    }
  });

  // Create new financial model (Super Admin only)
  app.post("/api/financial-models", async (req, res) => {
    try {
      const modelData = req.body;
      const newModel = await storage.createFinancialModel({
        ...modelData,
        createdBy: req.body.createdBy || null
      });
      res.status(201).json(newModel);
    } catch (error) {
      console.error("Error creating financial model:", error);
      res.status(500).json({ message: "Failed to create financial model" });
    }
  });

  // Update financial model (Super Admin only)
  app.put("/api/financial-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedModel = await storage.updateFinancialModel(id, updates);
      
      if (!updatedModel) {
        return res.status(404).json({ message: "Financial model not found" });
      }
      
      res.json(updatedModel);
    } catch (error) {
      console.error("Error updating financial model:", error);
      res.status(500).json({ message: "Failed to update financial model" });
    }
  });

  // Activate financial model
  app.post("/api/financial-models/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const activatedModel = await storage.activateFinancialModel(id, userId);
      if (!activatedModel) {
        return res.status(404).json({ message: "Financial model not found" });
      }
      
      res.json(activatedModel);
    } catch (error) {
      console.error("Error activating financial model:", error);
      res.status(500).json({ message: "Failed to activate financial model" });
    }
  });

  // Deactivate financial model
  app.post("/api/financial-models/:id/deactivate", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deactivateFinancialModel(id);
      res.json({ message: "Financial model deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating financial model:", error);
      res.status(500).json({ message: "Failed to deactivate financial model" });
    }
  });

  // Delete financial model
  app.delete("/api/financial-models/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Attempting to delete financial model with ID: ${id}`);
      
      // Check if model exists
      const model = await storage.getFinancialModelById(id);
      if (!model) {
        console.log(`Financial model ${id} not found`);
        return res.status(404).json({ message: "Financial model not found" });
      }

      console.log(`Found financial model: ${model.name}, isActive: ${model.isActive}`);

      // Allow deletion regardless of active status for admin override
      await storage.deleteFinancialModel(id);
      console.log(`Successfully deleted financial model: ${id}`);
      
      res.json({ message: "Financial model deleted successfully" });
    } catch (error) {
      console.error("Error deleting financial model:", error);
      res.status(500).json({ message: "Failed to delete financial model" });
    }
  });

  // User Wallets API Routes

  // Get user wallet (create if doesn't exist)
  app.get("/api/wallet/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let wallet = await storage.getUserWallet(userId);
      
      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await storage.createUserWallet({ userId });
      }
      
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching user wallet:", error);
      res.status(500).json({ message: "Failed to fetch user wallet" });
    }
  });

  // Get wallet transactions
  app.get("/api/wallet/:userId/transactions", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getWalletTransactionsByUser(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });

  // Credit wallet with financial model integration
  app.post("/api/wallet/:userId/credit", async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, description, category = 'admin_credit', financialModelId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Get wallet first
      let wallet = await storage.getUserWallet(userId);
      if (!wallet) {
        wallet = await storage.createUserWallet({ userId });
      }

      const balanceBefore = parseFloat(wallet.balance);
      const updatedWallet = await storage.updateWalletBalance(userId, amount, 'credit', financialModelId);
      
      // Calculate final amount for transaction record (may differ from original due to financial model)
      const balanceAfter = parseFloat(updatedWallet?.balance || '0');
      const actualCreditAmount = balanceAfter - balanceBefore;
      
      // Create transaction record with real values
      await storage.createWalletTransaction({
        userId,
        walletId: wallet.id,
        type: 'credit',
        category,
        amount: actualCreditAmount.toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        description: description || `Wallet credited with ₹${actualCreditAmount.toFixed(2)} (Financial Model Applied)`,
        netAmount: actualCreditAmount.toString(),
        status: 'completed'
      });

      res.json(updatedWallet);
    } catch (error) {
      console.error("Error crediting wallet:", error);
      res.status(500).json({ message: error.message || "Failed to credit wallet" });
    }
  });

  // Debit wallet with financial model integration
  app.post("/api/wallet/:userId/debit", async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, description, category = 'admin_debit', financialModelId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const wallet = await storage.getUserWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const balanceBefore = parseFloat(wallet.balance);
      if (balanceBefore < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const updatedWallet = await storage.updateWalletBalance(userId, amount, 'debit', financialModelId);
      
      // Calculate final amount for transaction record
      const balanceAfter = parseFloat(updatedWallet?.balance || '0');
      const actualDebitAmount = balanceBefore - balanceAfter;
      
      // Create transaction record with real values
      await storage.createWalletTransaction({
        userId,
        walletId: wallet.id,
        type: 'debit',
        category,
        amount: actualDebitAmount.toString(),
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        description: description || `Wallet debited with ₹${actualDebitAmount.toFixed(2)} (Financial Model Applied)`,
        netAmount: actualDebitAmount.toString(),
        status: 'completed'
      });

      res.json(updatedWallet);
    } catch (error) {
      console.error("Error debiting wallet:", error);
      res.status(500).json({ message: error.message || "Failed to debit wallet" });
    }
  });

  // Voice Processing API Routes
  app.post("/api/voice/transcribe", async (req, res) => {
    try {
      const { audioData, mimeType = "audio/webm" } = req.body;
      
      const { transcribeAudioWithLanguageDetection } = await import('./gemini-service');
      const result = await transcribeAudioWithLanguageDetection(audioData, mimeType);
      
      res.json(result);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  app.post("/api/voice/extract-job", async (req, res) => {
    try {
      const { text, detectedLanguage = "en" } = req.body;
      
      const { extractJobInformation } = await import('./gemini-service');
      const result = await extractJobInformation(text, detectedLanguage);
      
      res.json(result);
    } catch (error) {
      console.error("Error extracting job information:", error);
      res.status(500).json({ message: "Failed to extract job information" });
    }
  });

  app.post("/api/voice/extract-user", async (req, res) => {
    try {
      const { text, detectedLanguage = "en" } = req.body;
      
      const { extractUserInformation } = await import('./gemini-service');
      const result = await extractUserInformation(text, detectedLanguage);
      
      res.json(result);
    } catch (error) {
      console.error("Error extracting user information:", error);
      res.status(500).json({ message: "Failed to extract user information" });
    }
  });

  app.post("/api/voice/resolve-location", async (req, res) => {
    try {
      const { partialAddress, detectedLanguage = "en" } = req.body;
      
      const { resolveLocationFromPartialAddress } = await import('./gemini-service');
      const result = await resolveLocationFromPartialAddress(partialAddress, detectedLanguage);
      
      res.json(result);
    } catch (error) {
      console.error("Error resolving location:", error);
      res.status(500).json({ message: "Failed to resolve location" });
    }
  });

  app.post("/api/voice/detect-language", async (req, res) => {
    try {
      const { text } = req.body;
      
      const { detectLanguage } = await import('./gemini-service');
      const result = await detectLanguage(text);
      
      res.json(result);
    } catch (error) {
      console.error("Error detecting language:", error);
      res.status(500).json({ message: "Failed to detect language" });
    }
  });

  // Quick signup for voice users
  app.post("/api/auth/quick-signup", async (req, res) => {
    try {
      const userData = req.body;
      
      // Generate a temporary mobile if not provided
      if (!userData.mobile) {
        userData.mobile = `temp_${Date.now()}`;
      }
      
      // Set default password
      userData.password = userData.password || "quickpost123";
      userData.confirmPassword = userData.password;
      userData.role = "client";
      userData.isVerified = false; // Will need manual verification
      userData.status = "pending";
      
      // Use location resolution if needed
      if (userData.location && !userData.district) {
        const { resolveLocationFromPartialAddress } = await import('./gemini-service');
        const locationResult = await resolveLocationFromPartialAddress(
          `${userData.location.area || ''} ${userData.location.district || ''} ${userData.location.state || ''}`,
          "en"
        );
        
        if (locationResult.confidence > 0.7) {
          userData.district = locationResult.district;
          userData.state = locationResult.state;
          userData.address = `${locationResult.area}, ${locationResult.district}, ${locationResult.state}`;
        }
      }
      
      // Create user
      const user = await storage.createUser(userData);
      
      // Create wallet for the new user
      await storage.createUserWallet({ userId: user.id });
      
      res.status(201).json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        role: user.role,
        district: user.district,
        state: user.state,
        isVoiceCreated: true
      });
    } catch (error) {
      console.error("Error in quick signup:", error);
      res.status(400).json({ message: "Quick signup failed", error: error.message });
    }
  });

  // Referrals API Routes

  // Generate referral code
  app.post("/api/referrals/generate", async (req, res) => {
    try {
      const { userId, type = 'client_referral' } = req.body;
      
      const referralCode = await storage.generateReferralCode(userId);
      const referral = await storage.createReferral({
        referrerId: userId,
        referralCode,
        type,
        rewardAmount: '0', // Will be set based on financial model
        status: 'pending'
      });
      
      res.status(201).json(referral);
    } catch (error) {
      console.error("Error generating referral:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  // Get user referrals
  app.get("/api/referrals/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const referrals = await storage.getReferralsByUser(userId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Use referral code
  app.post("/api/referrals/use", async (req, res) => {
    try {
      const { referralCode, newUserId } = req.body;
      
      const referral = await storage.getReferralByCode(referralCode);
      if (!referral) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      if (referral.status !== 'pending') {
        return res.status(400).json({ message: "Referral code already used or expired" });
      }

      // Update referral with new user
      const updatedReferral = await storage.updateReferralStatus(referral.id, 'completed');
      res.json(updatedReferral);
    } catch (error) {
      console.error("Error using referral code:", error);
      res.status(500).json({ message: "Failed to use referral code" });
    }
  });

  // Enhanced Payment Processing with Mock Support
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { amount, userId, bookingId, financialModelId, description } = req.body;
      
      // Mock payment processing for now
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Process based on financial model
      const model = financialModelId ? await storage.getFinancialModelById(financialModelId) : null;
      
      let finalAmount = amount;
      let gstAmount = 0;
      let adminCommission = 0;
      
      if (model && model.gstEnabled) {
        gstAmount = (amount * parseFloat(model.gstRate)) / 100;
        finalAmount += gstAmount;
      }
      
      if (model && model.adminCommissionRate) {
        adminCommission = (amount * parseFloat(model.adminCommissionRate)) / 100;
      }

      // Create payment intent record
      await storage.createPaymentIntent({
        stripePaymentIntentId: mockPaymentId,
        userId,
        bookingId,
        amount: finalAmount.toString(),
        currency: 'INR',
        status: 'succeeded',
        financialModelId,
        metadata: { 
          gstAmount: gstAmount.toString(),
          adminCommission: adminCommission.toString(),
          description 
        }
      });

      res.json({
        success: true,
        paymentId: mockPaymentId,
        amount: finalAmount,
        gstAmount,
        adminCommission,
        message: "Payment processed successfully (Mock Mode)"
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Initialize default financial models
  app.post("/api/financial-models/initialize", async (req, res) => {
    try {
      const defaultModels = [
        {
          name: "Free Service Model",
          description: "Completely free posting and receiving of services with no charges",
          type: "free",
          isActive: true,
          adminCommissionPercentage: "0",
          gstPercentage: "0",
          referralClientReward: "0",
          referralWorkerReward: "0",
          referralEnabledForClient: false,
          referralEnabledForWorker: false,
          settings: {}
        },
        {
          name: "Standard Commission Model",
          description: "10% admin commission with 18% GST on successful service completion",
          type: "standard_commission",
          isActive: true,
          adminCommissionPercentage: "10",
          gstPercentage: "18",
          referralClientReward: "0",
          referralWorkerReward: "0",
          referralEnabledForClient: false,
          referralEnabledForWorker: false,
          settings: {}
        },
        {
          name: "Advance Payment Model",
          description: "30% advance payment, 70% on completion with GST and admin commission",
          type: "advance_payment",
          isActive: false,
          gstEnabled: true,
          gstRate: "18",
          adminCommissionRate: "8",
          advancePaymentPercentage: "30",
          completionPercentage: "70",
          referralRewardAmount: "0",
          minimumTransactionAmount: "500",
          maximumTransactionAmount: "100000",
          processingFeeRate: "2.5"
        },
        {
          name: "Referral Earning System",
          description: "Earn ₹100 for each successful referral that completes their first service",
          type: "referral_earning",
          isActive: true,
          gstEnabled: false,
          gstRate: "0",
          adminCommissionRate: "0",
          advancePaymentPercentage: "0",
          completionPercentage: "100",
          referralRewardAmount: "100",
          minimumTransactionAmount: "0",
          maximumTransactionAmount: "0",
          processingFeeRate: "0"
        },
        {
          name: "Premium Full Payment Model",
          description: "Full payment after OTP-verified service completion with premium commission rates",
          type: "completion_payment",
          isActive: false,
          gstEnabled: true,
          gstRate: "18",
          adminCommissionRate: "15",
          advancePaymentPercentage: "0",
          completionPercentage: "100",
          referralRewardAmount: "0",
          minimumTransactionAmount: "1000",
          maximumTransactionAmount: "200000",
          processingFeeRate: "3.0"
        }
      ];

      const createdModels = [];
      for (const model of defaultModels) {
        try {
          const existingModel = await storage.getAllFinancialModels();
          const modelExists = existingModel.some(m => m.name === model.name);
          
          if (!modelExists) {
            const created = await storage.createFinancialModel(model);
            createdModels.push(created);
          }
        } catch (error) {
          console.error(`Error creating model ${model.name}:`, error);
        }
      }

      res.json({
        success: true,
        message: `${createdModels.length} financial models initialized`,
        models: createdModels
      });
    } catch (error) {
      console.error("Error initializing financial models:", error);
      res.status(500).json({ message: "Failed to initialize financial models" });
    }
  });

  // Voice processing endpoint for Quick Post
  app.post("/api/voice/process-job-posting", async (req, res) => {
    try {
      const { audioData, mimeType, language, userId } = req.body;
      
      console.log("Voice processing request:", {
        hasAudioData: !!audioData,
        audioDataLength: audioData?.length || 0,
        mimeType,
        language,
        userId
      });

      if (!audioData) {
        return res.status(400).json({
          success: false,
          message: "Audio data is required"
        });
      }
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      try {
        // Import Gemini service
        const { processVoiceJobPosting } = await import('./gemini-service');
        
        // Process the voice recording with Gemini
        const voiceResult = await processVoiceJobPosting(audioData, mimeType, language, userId);
        
        if (!voiceResult.success) {
          return res.status(400).json({
            success: false,
            message: voiceResult.message || "Failed to process voice recording"
          });
        }

        // Get user details for location fallback
        const user = await storage.getUserById(userId);
        
        // Always require location confirmation for voice posts to show original language
        // This ensures users can see both Tamil original and English translation
        // Pre-populate with user's profile address data
        const userProfileLocation = {
          area: user?.areaName || '',
          district: user?.district || '',
          state: user?.state || '',
          fullAddress: user?.fullAddress || ''
        };
        
        return res.json({
          success: true,
          requiresLocationConfirmation: true,
          message: "Please confirm your job location",
          extractedData: {
            ...voiceResult.extractedData,
            location: {
              ...voiceResult.extractedData?.location,
              // Use voice-extracted location if available, otherwise use profile data
              area: voiceResult.extractedData?.location?.area || userProfileLocation.area,
              district: voiceResult.extractedData?.location?.district || userProfileLocation.district,
              state: voiceResult.extractedData?.location?.state || userProfileLocation.state,
              fullAddress: voiceResult.extractedData?.location?.fullAddress || userProfileLocation.fullAddress
            }
          },
          transcription: voiceResult.transcription,
          originalText: voiceResult.originalText,
          processingTime: voiceResult.processingTime
        });

        // Determine job ID format matching existing pattern
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const jobCount = Math.floor(Math.random() * 999) + 1;
        const jobId = `${userId}/${jobCount.toString().padStart(3, '0')}/${timestamp}`;
        
        // Create the job post with extracted details
        const jobPostData = {
          id: jobId,
          clientId: userId,
          title: voiceResult.extractedData?.jobTitle || "Voice-Generated Job Request",
          description: voiceResult.extractedData?.jobDescription || voiceResult.transcription || "Job details extracted from voice recording",
          serviceCategory: voiceResult.extractedData?.serviceCategory || "General Services",
          serviceAddress: voiceResult.extractedData?.location?.fullAddress || 
                   `${voiceResult.extractedData?.location?.area || ''}, ${voiceResult.extractedData?.location?.district || user?.district || ''}, ${voiceResult.extractedData?.location?.state || user?.state || ''}`.replace(/^, |, $/, ''),
          district: voiceResult.extractedData?.location?.district || user?.district || "Not specified",
          state: voiceResult.extractedData?.location?.state || user?.state || "Not specified",
          budgetMin: voiceResult.extractedData?.budget?.min || 1000,
          budgetMax: voiceResult.extractedData?.budget?.max || 5000,
          requirements: voiceResult.extractedData?.requirements || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Actually create the job posting in the database
        const createdJobPost = await storage.createJobPosting(jobPostData);

        console.log("Voice job posting created successfully:", {
          jobId: createdJobPost.id,
          title: createdJobPost.title,
          location: createdJobPost.location,
          userId: userId
        });

        res.json({
          success: true,
          message: "Voice job posting created successfully",
          jobPost: createdJobPost,
          transcription: voiceResult.transcription,
          originalText: voiceResult.originalText,
          extractedData: {
            language: language || 'en',
            confidence: voiceResult.confidence || 0.85,
            detectedLocation: voiceResult.extractedData?.location,
            detectedBudget: voiceResult.extractedData?.budget,
            processingTime: voiceResult.processingTime
          }
        });

      } catch (geminiError: any) {
        console.error("Gemini processing error:", geminiError);
        
        // Return error for fallback processing on client side
        return res.status(500).json({
          success: false,
          message: "Voice processing is temporarily unavailable. Please fill in job details manually.",
          fallbackMode: true,
          error: geminiError.message || "Voice processing service error",
          audioReceived: true // Indicates audio was received but processing failed
        });
      }

    } catch (error: any) {
      console.error("Voice processing error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process voice recording: " + error.message
      });
    }
  });

  // Voice job posting confirmation endpoint (when location info is missing)
  app.post("/api/voice/confirm-job-posting", async (req, res) => {
    try {
      const { userId, extractedData, transcription, locationData, customLocationData } = req.body;

      if (!userId || !extractedData) {
        return res.status(400).json({
          success: false,
          message: "Missing required data"
        });
      }

      // Determine job ID format
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const jobId = `${userId}/VOICE/${timestamp}`;
      
      // Use custom location data if provided, otherwise use default location data
      const finalLocationData = customLocationData && customLocationData.areaName ? {
        area: customLocationData.areaName,
        district: customLocationData.district,
        state: customLocationData.state,
        fullAddress: `${customLocationData.houseNumber}, ${customLocationData.streetName}, ${customLocationData.areaName}, ${customLocationData.district}, ${customLocationData.state} - ${customLocationData.pincode}`.replace(/^,\s*|,\s*,/g, ', ').replace(/,\s*$/, '')
      } : {
        area: locationData.area,
        district: locationData.district,
        state: locationData.state,
        fullAddress: locationData.fullAddress || `${locationData.area || ''}, ${locationData.district || ''}, ${locationData.state || ''}`.replace(/^, |, $/, '')
      };

      // Create the job post with confirmed details including user-provided budget
      const jobPostData = {
        id: jobId,
        clientId: userId,
        title: extractedData.jobTitle || "Voice-Generated Job Request",
        description: extractedData.jobDescription || transcription || "Job details extracted from voice recording",
        serviceCategory: extractedData.serviceCategory || "General Services",
        serviceAddress: finalLocationData.fullAddress,
        district: finalLocationData.district || "Not specified",
        state: finalLocationData.state || "Not specified",
        budgetMin: locationData.budgetMin || extractedData.budget?.min || 1000,
        budgetMax: locationData.budgetMax || extractedData.budget?.max || 5000,
        requirements: extractedData.requirements || [],
        originalTranscription: transcription,
        originalLanguage: extractedData.originalLanguage || 'ta',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create the job posting in the database
      const createdJobPost = await storage.createJobPosting(jobPostData);

      console.log("Voice job posting confirmed and created:", {
        jobId: createdJobPost.id,
        title: createdJobPost.title,
        location: createdJobPost.location,
        userId: userId
      });

      res.json({
        success: true,
        message: "Voice job posting created successfully",
        jobPost: createdJobPost
      });

    } catch (error: any) {
      console.error("Voice job confirmation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create job posting: " + error.message
      });
    }
  });

  // Budget Analytics Routes
  app.get("/api/budget-analytics/heat-map", async (req, res) => {
    try {
      const analytics = await budgetAnalyticsService.getBudgetHeatMapData();
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching budget heat map data:", error);
      res.status(500).json({ 
        message: "Failed to fetch budget analytics",
        error: error.message 
      });
    }
  });

  app.get("/api/budget-analytics/trends", async (req, res) => {
    try {
      const { state, serviceCategory } = req.query;
      const trends = await budgetAnalyticsService.getRegionalBudgetTrends(
        state as string, 
        serviceCategory as string
      );
      res.json(trends);
    } catch (error: any) {
      console.error("Error fetching budget trends:", error);
      res.status(500).json({ 
        message: "Failed to fetch budget trends",
        error: error.message 
      });
    }
  });

  // Register SEO sitemap routes
  registerSitemapRoutes(app);
  
  // API Key Management Routes (Super Admin Only)
  
  // Get all API keys
  app.get("/api/admin/api-keys", async (req, res) => {
    try {
      const apiKeys = await storage.getAllApiKeys();
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  // Save/Update API keys (bulk operation)
  app.post("/api/admin/api-keys", async (req, res) => {
    try {
      const { apiKeys: keysData } = req.body;
      
      const savedKeys = [];
      
      // Save each API key
      for (const [keyType, keyValues] of Object.entries(keysData)) {
        if (typeof keyValues === 'object' && keyValues !== null) {
          for (const [keyName, keyValue] of Object.entries(keyValues)) {
            if (keyValue && keyValue.trim()) {
              const apiKeyData = {
                keyType,
                keyName,
                keyValue: keyValue.trim(),
                isActive: true
              };
              
              // Check if key already exists
              const existingKey = await storage.getApiKey(keyType, keyName);
              if (existingKey) {
                await storage.updateApiKey(existingKey.id, { keyValue: keyValue.trim() });
              } else {
                const savedKey = await storage.createApiKey(apiKeyData);
                savedKeys.push(savedKey);
              }
            }
          }
        } else if (keyValues && keyValues.trim()) {
          // Handle simple string values
          const apiKeyData = {
            keyType,
            keyName: 'default',
            keyValue: keyValues.trim(),
            isActive: true
          };
          
          const existingKey = await storage.getApiKey(keyType, 'default');
          if (existingKey) {
            await storage.updateApiKey(existingKey.id, { keyValue: keyValues.trim() });
          } else {
            const savedKey = await storage.createApiKey(apiKeyData);
            savedKeys.push(savedKey);
          }
        }
      }
      
      res.json({ 
        message: "API keys saved successfully",
        savedKeys
      });
    } catch (error) {
      console.error("Error saving API keys:", error);
      res.status(500).json({ message: "Failed to save API keys" });
    }
  });

  // Delete API key
  app.delete("/api/admin/api-keys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteApiKey(id);
      res.json({ message: "API key deleted successfully" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // Get specific API key by type and name
  app.get("/api/admin/api-keys/:keyType/:keyName", async (req, res) => {
    try {
      const { keyType, keyName } = req.params;
      const apiKey = await storage.getApiKey(keyType, keyName);
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      res.json(apiKey);
    } catch (error) {
      console.error("Error fetching API key:", error);
      res.status(500).json({ message: "Failed to fetch API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
