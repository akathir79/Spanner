import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertTransferHistorySchema
} from "@shared/schema";

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

// Helper function to add minutes to date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      
      // Find the state in the authentic government data
      const stateData = data.states.find((state: any) => 
        state.state.toLowerCase() === stateName.toLowerCase()
      );
      
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
      
      // Create worker profile
      await storage.createWorkerProfile({
        userId: user.id,
        aadhaarNumber: userData.aadhaarNumber,
        aadhaarVerified: userData.aadhaarVerified || false,
        primaryService: userData.primaryService,
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
          lastLoginAt: user.lastLoginAt,
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
      const data = statesDistrictsData as { states: Array<{ state: string; districts: string[] }> };
      const stateCount = data.states.length;
      let districtCount = 0;
      
      data.states.forEach(stateObj => {
        districtCount += stateObj.districts.length;
      });
      
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
      const data = statesDistrictsData as { states: Array<{ state: string; districts: string[]; serviceTypes: string[] }> };
      let totalServices = 0;
      let statesWithServices = 0;
      const uniqueServices = new Set<string>();
      
      data.states.forEach(stateObj => {
        if (stateObj.serviceTypes && stateObj.serviceTypes.length > 0) {
          statesWithServices++;
          stateObj.serviceTypes.forEach(service => {
            uniqueServices.add(service.toLowerCase().trim());
          });
          totalServices += stateObj.serviceTypes.length;
        }
      });
      
      res.json({
        uniqueServices: uniqueServices.size,
        totalServices: totalServices,
        statesWithServices: statesWithServices
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
      await storage.updateUser(userId, { isVerified: true });
      res.json({ message: "User verified successfully" });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ error: "Failed to verify user" });
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
        'firstName', 'lastName', 'email', 'mobile', 'address', 'profilePicture', 'pincode', 'state',
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
              // Filter by worker's state, districts, and primary service
              jobs = jobs.filter(job => {
                const matchesState = job.state === worker.state;
                const matchesDistrict = (workerProfile.serviceDistricts as string[]).includes(job.district);
                const matchesService = job.serviceCategory === workerProfile.primaryService;
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
      
      // Convert budget numbers to strings for database compatibility
      const { budgetMin, budgetMax, deadline, districtId, ...rest } = req.body;
      const jobData = {
        ...rest,
        district: districtId, // Map districtId to district field
        budgetMin: budgetMin !== undefined && budgetMin !== null ? budgetMin.toString() : null,
        budgetMax: budgetMax !== undefined && budgetMax !== null ? budgetMax.toString() : null,
        deadline: deadline ? new Date(deadline) : null, // Ensure deadline is properly converted to Date
      };
      
      console.log("Processed job data for database:", jobData);
      
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
      
      // Convert budget numbers to strings for database compatibility
      const { budgetMin, budgetMax, deadline, ...rest } = req.body;
      const updateData = {
        ...rest,
        budgetMin: budgetMin !== undefined && budgetMin !== null ? budgetMin.toString() : null,
        budgetMax: budgetMax !== undefined && budgetMax !== null ? budgetMax.toString() : null,
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

  const httpServer = createServer(app);
  return httpServer;
}
