import { 
  users,
  userSequence,
  workerProfiles, 
  bookings, 
  jobPostings,
  bids,
  serviceCategories,
  otpVerifications,
  locationTracking,
  locationSharingSessions,
  geofences,
  locationEvents,
  workerBankDetails,
  payments,
  paymentWebhooks,
  messages,
  transferHistory,
  financialStatements,
  type User, 
  type InsertUser,
  type WorkerProfile,
  type InsertWorkerProfile,
  type Booking,
  type InsertBooking,
  type JobPosting,
  type InsertJobPosting,
  type Bid,
  type InsertBid,
  type ServiceCategory,
  type OtpVerification,
  type InsertOtp,
  type LocationTracking,
  type InsertLocationTracking,
  type LocationSharingSession,
  type InsertLocationSharingSession,
  type Geofence,
  type InsertGeofence,
  type LocationEvent,
  type InsertLocationEvent,
  type WorkerBankDetails,
  type InsertWorkerBankDetails,
  type Payment,
  type InsertPayment,
  type PaymentWebhook,
  type InsertPaymentWebhook,
  type Message,
  type InsertMessage,
  type TransferHistory,
  type InsertTransferHistory,
  type FinancialStatement,
  type InsertFinancialStatement,
  advertisements,
  type Advertisement,
  type InsertAdvertisement,
  workerReviews,
  settings,
  type Settings,
  type InsertSettings,
  workerReviews,
  jobCompletionOTPs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, ilike, inArray, or, isNull, lt } from "drizzle-orm";
import { generateCustomUserId } from "./userIdGenerator";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobileAndRole(mobile: string, role: string): Promise<User | undefined>;
  getUserByEmailAndRole(email: string, role: string): Promise<User | undefined>;
  getUserByAadhaar(aadhaarNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Worker profiles
  getWorkerProfile(userId: string): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;
  deleteWorkerProfile(userId: string): Promise<void>;
  getWorkersByDistrict(districtId: string): Promise<(User & { workerProfile: WorkerProfile })[]>;
  getWorkersByService(service: string): Promise<(User & { workerProfile: WorkerProfile })[]>;
  getAllWorkersWithProfiles(): Promise<(User & { workerProfile?: WorkerProfile })[]>;
  
  // Districts and Areas now handled via API - removed from storage  
  getAllAreas(): Promise<any[]>;
  
  // Service categories
  getAllServiceCategories(): Promise<ServiceCategory[]>;
  createServiceCategory(serviceCategory: any): Promise<ServiceCategory>;
  
  // Worker approval methods
  getPendingWorkers(): Promise<any[]>;
  approveWorker(workerId: string): Promise<User>;
  rejectWorker(workerId: string): Promise<void>;
  updateWorker(workerId: string, updates: any): Promise<User>;
  
  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getClientBookings(clientId: string): Promise<Booking[]>;
  getWorkerBookings(workerId: string): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  getBookingsWithDetails(userId: string): Promise<any[]>;
  updateBookingReview(bookingId: string, rating: number, review: string): Promise<Booking | undefined>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  
  // Worker reviews and ratings
  createWorkerReview(review: any): Promise<any>;
  getWorkerReviews(workerId: string): Promise<any[]>;
  updateWorkerRating(workerId: string): Promise<void>;
  getUserById(userId: string): Promise<User | undefined>;
  
  // OTP management
  createOtp(otp: InsertOtp): Promise<OtpVerification>;
  getValidOtp(mobile: string, otp: string, purpose: string): Promise<OtpVerification | undefined>;
  verifyOtp(mobile: string, otp: string, purpose: string): Promise<boolean>;
  
  // Location Tracking
  createLocationTracking(tracking: InsertLocationTracking): Promise<LocationTracking>;
  getLatestLocationByBooking(bookingId: string): Promise<LocationTracking | undefined>;
  getLocationHistoryByBooking(bookingId: string, limit?: number, hours?: number): Promise<LocationTracking[]>;
  
  // Location Sharing Sessions
  createLocationSharingSession(session: InsertLocationSharingSession): Promise<LocationSharingSession>;
  getLocationSharingSessionByBooking(bookingId: string): Promise<LocationSharingSession | undefined>;
  updateLocationSharingSession(sessionId: string, updates: Partial<LocationSharingSession>): Promise<LocationSharingSession>;
  
  // Geofences
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  getGeofencesByBooking(bookingId: string): Promise<Geofence[]>;
  
  // Location Events
  createLocationEvent(event: InsertLocationEvent): Promise<LocationEvent>;
  getLocationEventsByBooking(bookingId: string): Promise<LocationEvent[]>;
  markOtpAsUsed(id: string): Promise<void>;
  
  // Job postings
  getAllJobPostings(): Promise<(JobPosting & { client: User; bids?: Bid[] })[]>;
  getJobPostingsByClient(clientId: string): Promise<(JobPosting & { bids?: Bid[] })[]>;
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: string, updates: Partial<JobPosting>): Promise<JobPosting | undefined>;
  deleteJobPosting(id: string): Promise<void>;
  
  // Bidding
  getBidsByJobPosting(jobPostingId: string): Promise<(Bid & { worker: User & { workerProfile?: WorkerProfile } })[]>;
  getBidsByWorker(workerId: string): Promise<(Bid & { jobPosting: JobPosting & { client: User } })[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  updateBid(bidId: string, updates: Partial<Bid>): Promise<Bid | undefined>;
  deleteBid(bidId: string): Promise<void>;
  acceptBid(bidId: string): Promise<Bid | undefined>;
  rejectBid(bidId: string): Promise<Bid | undefined>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getUsersWithProfiles(): Promise<(User & { workerProfile?: WorkerProfile })[]>;
  getBookingsWithDetails(): Promise<(Booking & { client: User; worker: User })[]>;
  getAdminCounts(): Promise<{ regularAdmins: number; superAdmins: number; totalAdmins: number }>;
  getDatabaseInfo(): Promise<{ databaseType: string; databaseName: string; tableCount: number }>;
  
  // Worker Bank Details
  createWorkerBankDetails(bankDetails: InsertWorkerBankDetails): Promise<WorkerBankDetails>;
  getWorkerBankDetails(workerId: string): Promise<WorkerBankDetails | undefined>;
  updateWorkerBankDetails(id: string, updates: Partial<WorkerBankDetails>): Promise<WorkerBankDetails | undefined>;
  deleteWorkerBankDetails(id: string): Promise<void>;
  
  // Payment Management
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | undefined>;
  getPaymentsByBooking(bookingId: string): Promise<Payment[]>;
  getPaymentsByUser(userId: string, role: string): Promise<Payment[]>;
  updatePaymentRefund(paymentId: string, refundData: { status: string; refundAmount: string; refundReason: string }): Promise<Payment | undefined>;
  
  // Messaging
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySender(senderId: string): Promise<Message[]>;
  getMessagesByReceiver(receiverId: string): Promise<Message[]>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<Message | undefined>;
  getUnreadMessageCount(userId: string): Promise<number>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Transfer History
  createTransferHistory(transfer: InsertTransferHistory): Promise<TransferHistory>;
  getTransferHistoryByClient(clientId: string): Promise<TransferHistory[]>;
  deleteTransferHistory(transferId: string): Promise<void>;
  
  // Financial Statements
  getFinancialStatementsByClient(clientId: string): Promise<FinancialStatement[]>;
  createOrUpdateFinancialStatement(clientId: string, year: number, updates: Partial<FinancialStatement>): Promise<FinancialStatement>;
  getFinancialStatementByClientAndYear(clientId: string, year: number): Promise<FinancialStatement | undefined>;
  
  // Advertisements
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: string, updates: Partial<Advertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: string): Promise<void>;
  getAdvertisementById(id: string): Promise<Advertisement | undefined>;
  getActiveAdvertisementsByType(targetAudience: string): Promise<Advertisement[]>;
  getAllAdvertisements(): Promise<Advertisement[]>;
  
  // Settings
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.mobile, mobile));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByMobileAndRole(mobile: string, role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.mobile, mobile), eq(users.role, role))
    );
    return user || undefined;
  }

  async getUserByEmailAndRole(email: string, role: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(
      and(eq(users.email, email), eq(users.role, role))
    );
    return user || undefined;
  }

  async getUserByAadhaar(aadhaarNumber: string): Promise<User | undefined> {
    if (!aadhaarNumber) return undefined;
    try {
      // First find the worker profile with the Aadhaar number
      const [workerProfile] = await db
        .select()
        .from(workerProfiles)
        .where(eq(workerProfiles.aadhaarNumber, aadhaarNumber))
        .limit(1);
      
      if (!workerProfile) {
        return undefined;
      }
      
      // Then get the user with that userId
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, workerProfile.userId))
        .limit(1);
      
      return user || undefined;
    } catch (error) {
      console.error("Error in getUserByAadhaar:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate custom user ID if not provided
    let userDataWithId = { ...insertUser };
    
    console.log("CreateUser called with:", {
      hasId: !!insertUser.id,
      state: insertUser.state,
      district: insertUser.district,
      role: insertUser.role
    });
    
    if (!insertUser.id && insertUser.state && insertUser.district && insertUser.role) {
      console.log("Generating custom ID for:", insertUser.state, insertUser.district, insertUser.role);
      const customId = await generateCustomUserId({
        state: insertUser.state,
        district: insertUser.district,
        role: insertUser.role as 'client' | 'worker' | 'admin' | 'super_admin'
      });
      console.log("Generated custom ID:", customId);
      userDataWithId.id = customId;
    } else if (!insertUser.id) {
      console.log("ID generation failed - missing required fields");
      throw new Error("Cannot create user: missing ID and required fields for ID generation");
    }
    
    console.log("Final user data with ID:", userDataWithId.id);
    const [user] = await db.insert(users).values([userDataWithId]).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Ensure updatedAt is properly set as a Date object
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // Remove any timestamp fields that might not be proper Date objects
    delete (updateData as any).createdAt;
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    // First get the user to check if they are a worker
    const user = await this.getUser(id);
    if (!user) {
      return; // User doesn't exist, nothing to delete
    }

    try {
      // Delete related data in transaction
      await db.transaction(async (tx) => {
        // If user is a worker, delete worker-specific data
        if (user.role === 'worker') {
          // Delete worker bank details
          await tx.delete(workerBankDetails).where(eq(workerBankDetails.workerId, id));
          
          // Delete worker profile
          await tx.delete(workerProfiles).where(eq(workerProfiles.userId, id));
          
          // Delete worker-related location tracking
          await tx.delete(locationTracking).where(eq(locationTracking.workerId, id));
          
          // Delete worker-related location sharing sessions
          await tx.delete(locationSharingSessions).where(eq(locationSharingSessions.workerId, id));
          
          // Delete worker-related location events
          await tx.delete(locationEvents).where(eq(locationEvents.workerId, id));
          
          // Delete bids made by the worker
          await tx.delete(bids).where(eq(bids.workerId, id));
        }

        // Delete user-related data regardless of role
        // Delete OTP verifications
        await tx.delete(otpVerifications).where(eq(otpVerifications.mobile, user.mobile));
        
        // Delete payments (both as client and worker)
        await tx.delete(payments).where(eq(payments.clientId, id));
        await tx.delete(payments).where(eq(payments.workerId, id));
        
        // Delete messages (both sent and received)
        await tx.delete(messages).where(eq(messages.senderId, id));
        await tx.delete(messages).where(eq(messages.receiverId, id));
        
        // Delete bookings where user is client
        const userBookings = await tx.select().from(bookings).where(eq(bookings.clientId, id));
        for (const booking of userBookings) {
          // Delete related location data for each booking
          await tx.delete(locationTracking).where(eq(locationTracking.bookingId, booking.id));
          await tx.delete(locationSharingSessions).where(eq(locationSharingSessions.bookingId, booking.id));
          await tx.delete(locationEvents).where(eq(locationEvents.bookingId, booking.id));
          await tx.delete(geofences).where(eq(geofences.bookingId, booking.id));
        }
        await tx.delete(bookings).where(eq(bookings.clientId, id));
        
        // Delete bookings where user is worker
        const workerBookings = await tx.select().from(bookings).where(eq(bookings.workerId, id));
        for (const booking of workerBookings) {
          // Delete related location data for each booking
          await tx.delete(locationTracking).where(eq(locationTracking.bookingId, booking.id));
          await tx.delete(locationSharingSessions).where(eq(locationSharingSessions.bookingId, booking.id));
          await tx.delete(locationEvents).where(eq(locationEvents.bookingId, booking.id));
          await tx.delete(geofences).where(eq(geofences.bookingId, booking.id));
        }
        await tx.delete(bookings).where(eq(bookings.workerId, id));
        
        // Delete job postings if user is client
        const userJobPostings = await tx.select().from(jobPostings).where(eq(jobPostings.clientId, id));
        for (const jobPosting of userJobPostings) {
          // Delete bids for each job posting
          await tx.delete(bids).where(eq(bids.jobPostingId, jobPosting.id));
        }
        await tx.delete(jobPostings).where(eq(jobPostings.clientId, id));
        
        // Finally, delete the user
        await tx.delete(users).where(eq(users.id, id));
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user completely');
    }
  }

  async getWorkerProfile(userId: string): Promise<WorkerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, userId));
    return profile || undefined;
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const [workerProfile] = await db
      .insert(workerProfiles)
      .values(profile)
      .returning();
    return workerProfile;
  }

  async deleteWorkerProfile(userId: string): Promise<void> {
    await db.delete(workerProfiles).where(eq(workerProfiles.userId, userId));
  }

  async getAllWorkersWithProfiles(): Promise<(User & { workerProfile?: WorkerProfile })[]> {
    const allWorkers = await db
      .select()
      .from(users)
      .where(eq(users.role, "worker"));
    
    const workersWithProfiles = [];
    for (const worker of allWorkers) {
      const profile = await this.getWorkerProfile(worker.id);
      workersWithProfiles.push({
        ...worker,
        workerProfile: profile
      });
    }
    
    return workersWithProfiles;
  }

  async getWorkersByDistrict(districtId: string): Promise<(User & { workerProfile: WorkerProfile })[]> {
    const results = await db
      .select()
      .from(users)
      .innerJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .where(
        and(
          eq(users.role, "worker"),
          eq(users.isActive, true),
          sql`${workerProfiles.serviceDistricts} @> ${JSON.stringify([districtId])}`
        )
      );
    
    return results.map(result => ({
      ...result.users,
      workerProfile: result.worker_profiles
    }));
  }

  async getWorkersByService(service: string): Promise<(User & { workerProfile: WorkerProfile })[]> {
    const results = await db
      .select()
      .from(users)
      .innerJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .where(
        and(
          eq(users.role, "worker"),
          eq(users.isActive, true),
          eq(workerProfiles.primaryService, service)
        )
      );
    
    return results.map(result => ({
      ...result.users,
      workerProfile: result.worker_profiles
    }));
  }

  // District methods removed - now handled via API

  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true));
  }

  async createServiceCategory(serviceCategory: any): Promise<ServiceCategory> {
    const [newService] = await db.insert(serviceCategories).values(serviceCategory).returning();
    return newService;
  }

  // Area management
  // Area methods removed - now handled via API

  async getPendingWorkers(): Promise<any[]> {
    return db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        mobile: users.mobile,
        email: users.email,
        profilePicture: users.profilePicture,
        status: users.status,
        houseNumber: users.houseNumber,
        streetName: users.streetName,
        areaName: users.areaName,
        pincode: users.pincode,
        district: users.district, // District name stored as text
        createdAt: users.createdAt,
        workerProfile: {
          id: workerProfiles.id,
          primaryService: workerProfiles.primaryService,
          experienceYears: workerProfiles.experienceYears,
          hourlyRate: workerProfiles.hourlyRate,
          aadhaarNumber: workerProfiles.aadhaarNumber,
          aadhaarVerified: workerProfiles.aadhaarVerified,
          isBackgroundVerified: workerProfiles.isBackgroundVerified,
          bio: workerProfiles.bio,
          skills: workerProfiles.skills,
          serviceDistricts: workerProfiles.serviceDistricts,
          serviceAreas: workerProfiles.serviceAreas,
          serviceAllAreas: workerProfiles.serviceAllAreas,
          bioDataDocument: workerProfiles.bioDataDocument,
        },
      })
      .from(users)
      .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .where(and(eq(users.role, "worker"), eq(users.status, "pending")))
      .orderBy(users.createdAt);
  }

  async approveWorker(workerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        status: "approved",
        updatedAt: new Date()
      })
      .where(eq(users.id, workerId))
      .returning();
    return updatedUser;
  }

  async rejectWorker(workerId: string): Promise<void> {
    // Delete worker profile first (due to foreign key constraint)
    await db.delete(workerProfiles).where(eq(workerProfiles.userId, workerId));
    
    // Delete user
    await db.delete(users).where(eq(users.id, workerId));
  }

  async updateWorker(workerId: string, updates: any): Promise<User> {
    const { workerProfile, ...userUpdates } = updates;

    // Update user information
    if (Object.keys(userUpdates).length > 0) {
      await db
        .update(users)
        .set({ ...userUpdates, updatedAt: new Date() })
        .where(eq(users.id, workerId));
    }

    // Update worker profile information
    if (workerProfile && Object.keys(workerProfile).length > 0) {
      await db
        .update(workerProfiles)
        .set({ ...workerProfile, updatedAt: new Date() })
        .where(eq(workerProfiles.userId, workerId));
    }

    // Return updated user
    const [updatedUser] = await db.select().from(users).where(eq(users.id, workerId));
    return updatedUser;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getClientBookings(clientId: string): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.clientId, clientId))
      .orderBy(desc(bookings.createdAt));
  }

  async getWorkerBookings(workerId: string): Promise<Booking[]> {
    return db
      .select()
      .from(bookings)
      .where(eq(bookings.workerId, workerId))
      .orderBy(desc(bookings.createdAt));
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  // Job completion workflow methods
  async updateBookingCompletion(id: string, completionData: {
    status: string;
    completionOTP: string;
    otpGeneratedAt: Date;
    workerCompletedAt: Date;
  }): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({
        status: completionData.status,
        completionOTP: completionData.completionOTP,
        otpGeneratedAt: completionData.otpGeneratedAt,
        workerCompletedAt: completionData.workerCompletedAt,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async verifyCompletionOTP(id: string, otp: string): Promise<Booking | undefined> {
    // First check if OTP matches
    const [existingBooking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!existingBooking || existingBooking.completionOTP !== otp) {
      return undefined;
    }

    // Update with verification timestamp
    const [booking] = await db
      .update(bookings)
      .set({
        otpVerifiedAt: new Date(),
        clientConfirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async createWorkerReview(reviewData: {
    bookingId: string;
    workerId: string;
    clientId: string;
    overallRating: number;
    workQualityRating: number;
    timelinessRating: number;
    communicationRating: number;
    professionalismRating: number;
    reviewText?: string;
  }): Promise<any> {
    // Create review in worker_reviews table matching the actual database schema
    const [review] = await db
      .insert(workerReviews)
      .values({
        bookingId: reviewData.bookingId,
        workerId: reviewData.workerId,
        clientId: reviewData.clientId,
        rating: reviewData.overallRating, // This maps to the required 'rating' column
        review: reviewData.reviewText || null,
        workQualityRating: reviewData.workQualityRating,
        timelinessRating: reviewData.timelinessRating,
        communicationRating: reviewData.communicationRating,
        professionalismRating: reviewData.professionalismRating,
        wouldRecommend: true, // Default to true for positive reviews
        isPublic: true,
        isVerified: true,
        helpfulVotes: 0,
      })
      .returning();

    // Update booking with client rating and review
    await db
      .update(bookings)
      .set({
        clientRating: reviewData.overallRating,
        clientReview: reviewData.reviewText || null,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, reviewData.bookingId));

    return review;
  }

  async getBooking(bookingId: string): Promise<any> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    return booking || null;
  }

  async deleteBooking(bookingId: string): Promise<boolean> {
    try {
      // First delete related reviews
      await db
        .delete(workerReviews)
        .where(eq(workerReviews.bookingId, bookingId));

      // Then delete the booking
      const result = await db
        .delete(bookings)
        .where(eq(bookings.id, bookingId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Delete booking error:", error);
      return false;
    }
  }

  async cleanupOldBookings(cutoffDate: Date): Promise<number> {
    try {
      // Delete reviews for old completed bookings first
      const oldBookingsSubquery = db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            or(
              lt(bookings.clientConfirmedAt, cutoffDate),
              and(
                isNull(bookings.clientConfirmedAt),
                lt(bookings.createdAt, cutoffDate)
              )
            )
          )
        );

      await db
        .delete(workerReviews)
        .where(
          inArray(
            workerReviews.bookingId,
            oldBookingsSubquery
          )
        );

      // Then delete the old completed bookings
      const deletedBookings = await db
        .delete(bookings)
        .where(
          and(
            eq(bookings.status, "completed"),
            or(
              lt(bookings.clientConfirmedAt, cutoffDate),
              and(
                isNull(bookings.clientConfirmedAt),
                lt(bookings.createdAt, cutoffDate)
              )
            )
          )
        )
        .returning();

      return deletedBookings.length;
    } catch (error) {
      console.error("Cleanup old bookings error:", error);
      return 0;
    }
  }



  async updateBookingReview(bookingId: string, rating: number, review: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ 
        clientRating: rating,
        clientReview: review,
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking || undefined;
  }

  async createOtp(otp: InsertOtp): Promise<OtpVerification> {
    const [otpRecord] = await db.insert(otpVerifications).values(otp).returning();
    return otpRecord;
  }

  async getValidOtp(mobile: string, otp: string, purpose: string): Promise<OtpVerification | undefined> {
    const [otpRecord] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.mobile, mobile),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.purpose, purpose),
          eq(otpVerifications.isUsed, false),
          sql`${otpVerifications.expiresAt} > NOW()`
        )
      );
    return otpRecord || undefined;
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(eq(otpVerifications.id, id));
  }

  async verifyOtp(mobile: string, otp: string, purpose: string): Promise<boolean> {
    const otpRecord = await this.getValidOtp(mobile, otp, purpose);
    if (otpRecord) {
      await this.markOtpAsUsed(otpRecord.id);
      return true;
    }
    return false;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersWithProfiles(): Promise<(User & { workerProfile?: WorkerProfile; workerBankDetails?: WorkerBankDetails })[]> {
    const results = await db
      .select()
      .from(users)
      .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .leftJoin(workerBankDetails, eq(users.id, workerBankDetails.workerId))
      .orderBy(desc(users.createdAt));
    
    return results.map(result => {
      const user = result.users;
      const bankDetails = result.worker_bank_details;
      const workerProfile = result.worker_profiles;
      
      const mapped = {
        ...user,
        workerProfile: workerProfile || undefined,
        workerBankDetails: bankDetails || undefined,
        // Flatten bank details directly onto user object for easier access
        ...(bankDetails && {
          bankAccountNumber: bankDetails.accountNumber,
          bankIFSC: bankDetails.ifscCode,
          bankMICR: bankDetails.micrCode,
          bankName: bankDetails.bankName,
          bankBranch: bankDetails.branchName,
          bankAddress: bankDetails.bankAddress,
          bankAccountType: bankDetails.accountType,
          bankAccountHolderName: bankDetails.accountHolderName
        }),
        // Flatten worker profile service details for easier access
        ...(workerProfile && {
          primaryService: workerProfile.primaryService,
          skills: workerProfile.skills,
          experienceYears: workerProfile.experienceYears,
          hourlyRate: workerProfile.hourlyRate
        })
        // Note: address and pincode come from user table, not worker profile
      };
      
      return mapped;
    });
  }

  async getBookingsWithDetails(): Promise<(Booking & { client: User; worker: User })[]> {
    // Get all bookings first
    const allBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt));
    
    // Fetch related data for each booking
    const enrichedBookings = await Promise.all(
      allBookings.map(async (booking) => {
        const [client] = await db.select().from(users).where(eq(users.id, booking.clientId));
        const [worker] = await db.select().from(users).where(eq(users.id, booking.workerId));
        
        return {
          ...booking,
          client: client!,
          worker: worker!
        };
      })
    );
    
    return enrichedBookings;
  }

  async getAdminCounts(): Promise<{ regularAdmins: number; superAdmins: number; totalAdmins: number }> {
    const adminCounts = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)::int`
      })
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'super_admin')))
      .groupBy(users.role);
    
    let regularAdmins = 0;
    let superAdmins = 0;
    
    for (const count of adminCounts) {
      if (count.role === 'admin') {
        regularAdmins = count.count;
      } else if (count.role === 'super_admin') {
        superAdmins = count.count;
      }
    }
    
    return {
      regularAdmins,
      superAdmins,
      totalAdmins: regularAdmins + superAdmins
    };
  }

  async getDatabaseInfo(): Promise<{ databaseType: string; databaseName: string; tableCount: number }> {
    try {
      // Get database type and name from connection string or direct query
      const dbTypeResult = await db.execute(sql`SELECT version() as version`);
      const version = (dbTypeResult.rows[0] as any)?.version || 'Unknown';
      const databaseType = version.includes('PostgreSQL') ? 'PostgreSQL' : 'Unknown';
      
      // Get current database name
      const dbNameResult = await db.execute(sql`SELECT current_database() as database_name`);
      const databaseName = (dbNameResult.rows[0] as any)?.database_name || 'Unknown';
      
      // Get table count from information_schema
      const tableCountResult = await db.execute(sql`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);
      const tableCount = Number((tableCountResult.rows[0] as any)?.table_count) || 0;
      
      return {
        databaseType,
        databaseName,
        tableCount
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return {
        databaseType: 'PostgreSQL',
        databaseName: 'Unknown',
        tableCount: 0
      };
    }
  }
  // Job posting methods
  async getAllJobPostings(): Promise<(JobPosting & { client: User; bids?: Bid[] })[]> {
    const result = await db.select()
      .from(jobPostings)
      .leftJoin(users, eq(jobPostings.clientId, users.id))
      .orderBy(desc(jobPostings.createdAt));
    
    return result.map(row => ({
      ...row.job_postings!,
      client: row.users!
    }));
  }

  async getJobPostingsByClient(clientId: string): Promise<(JobPosting & { bids?: Bid[] })[]> {
    const result = await db.select()
      .from(jobPostings)
      .where(eq(jobPostings.clientId, clientId))
      .orderBy(desc(jobPostings.createdAt));
    
    return result;
  }

  async createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting> {
    // Convert numeric fields to strings for database compatibility
    const dbJobPosting = {
      ...jobPosting,
      budgetMin: jobPosting.budgetMin !== undefined && jobPosting.budgetMin !== null ? jobPosting.budgetMin.toString() : null,
      budgetMax: jobPosting.budgetMax !== undefined && jobPosting.budgetMax !== null ? jobPosting.budgetMax.toString() : null,
    };
    const [job] = await db.insert(jobPostings).values([dbJobPosting]).returning();
    return job;
  }

  async updateJobPosting(id: string, updates: Partial<JobPosting>): Promise<JobPosting | undefined> {
    const [job] = await db.update(jobPostings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPostings.id, id))
      .returning();
    return job || undefined;
  }

  async deleteJobPosting(id: string): Promise<void> {
    // First delete all related bids
    await db.delete(bids).where(eq(bids.jobPostingId, id));
    
    // Then delete the job posting
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
  }

  // Bidding methods
  async getBidsByJobPosting(jobPostingId: string): Promise<(Bid & { worker: User & { workerProfile?: WorkerProfile } })[]> {
    const result = await db.select()
      .from(bids)
      .leftJoin(users, eq(bids.workerId, users.id))
      .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .where(eq(bids.jobPostingId, jobPostingId))
      .orderBy(desc(bids.createdAt));
    
    return result.map(row => ({
      ...row.bids,
      worker: {
        ...row.users!,
        workerProfile: row.worker_profiles || undefined
      }
    }));
  }

  async getBidsByWorker(workerId: string): Promise<(Bid & { jobPosting: JobPosting & { client: User } })[]> {
    const result = await db.select()
      .from(bids)
      .leftJoin(jobPostings, eq(bids.jobPostingId, jobPostings.id))
      .leftJoin(users, eq(jobPostings.clientId, users.id))
      .where(eq(bids.workerId, workerId))
      .orderBy(desc(bids.createdAt));
    
    return result.map(row => ({
      ...row.bids,
      jobPosting: {
        ...row.job_postings!,
        client: row.users!
      }
    }));
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    // Convert numeric fields to strings for database compatibility
    const dbBid = {
      ...bid,
      proposedAmount: bid.proposedAmount !== undefined ? bid.proposedAmount.toString() : '',
    };
    const [newBid] = await db.insert(bids).values([dbBid]).returning();
    return newBid;
  }

  async updateBid(bidId: string, updates: Partial<Bid>): Promise<Bid | undefined> {
    // Convert numeric fields to strings for database compatibility if present
    const dbUpdates = {
      ...updates,
      proposedAmount: updates.proposedAmount !== undefined ? updates.proposedAmount.toString() : undefined,
      updatedAt: new Date()
    };
    
    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
        delete dbUpdates[key as keyof typeof dbUpdates];
      }
    });

    const [updatedBid] = await db.update(bids)
      .set(dbUpdates)
      .where(eq(bids.id, bidId))
      .returning();
    
    return updatedBid || undefined;
  }

  async deleteBid(bidId: string): Promise<void> {
    await db.delete(bids).where(eq(bids.id, bidId));
  }

  async acceptBid(bidId: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));
    if (!bid) return undefined;

    // Get the job posting details
    const [jobPosting] = await db.select().from(jobPostings).where(eq(jobPostings.id, bid.jobPostingId));
    if (!jobPosting) return undefined;

    // Update bid status to accepted
    const [updatedBid] = await db.update(bids)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(bids.id, bidId))
      .returning();

    // Update job posting status and selected bid
    await db.update(jobPostings)
      .set({ 
        status: "in_progress", 
        selectedBidId: bidId,
        updatedAt: new Date()
      })
      .where(eq(jobPostings.id, bid.jobPostingId));

    // Reject all other bids for this job
    await db.update(bids)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(and(
        eq(bids.jobPostingId, bid.jobPostingId),
        sql`${bids.id} != ${bidId}`
      ));

    // Create a booking automatically
    try {
      const bookingData = {
        id: `BKG-${jobPosting.id}`, // Use job posting ID format
        clientId: jobPosting.clientId,
        workerId: bid.workerId,
        serviceCategory: jobPosting.serviceCategory,
        description: `Booking created from accepted bid for: ${jobPosting.title}`,
        district: jobPosting.district,
        scheduledDate: new Date(), // Default to current date
        totalAmount: bid.proposedAmount,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(bookings).values(bookingData);
      console.log('Booking created successfully:', bookingData.id);
    } catch (error) {
      console.error('Error creating booking:', error);
    }

    return updatedBid || undefined;
  }

  async rejectBid(bidId: string): Promise<Bid | undefined> {
    const [bid] = await db.update(bids)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(bids.id, bidId))
      .returning();
    return bid || undefined;
  }

  // Location Tracking Methods
  async createLocationTracking(tracking: InsertLocationTracking): Promise<LocationTracking> {
    const [newTracking] = await db.insert(locationTracking).values(tracking).returning();
    return newTracking;
  }

  async getLatestLocationByBooking(bookingId: string): Promise<LocationTracking | undefined> {
    const [location] = await db
      .select()
      .from(locationTracking)
      .where(eq(locationTracking.bookingId, bookingId))
      .orderBy(desc(locationTracking.timestamp))
      .limit(1);
    return location || undefined;
  }

  async getLocationHistoryByBooking(bookingId: string, limit: number = 50, hours: number = 24): Promise<LocationTracking[]> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(locationTracking)
      .where(and(
        eq(locationTracking.bookingId, bookingId),
        sql`${locationTracking.timestamp} >= ${hoursAgo}`
      ))
      .orderBy(desc(locationTracking.timestamp))
      .limit(limit);
  }

  // Location Sharing Session Methods
  async createLocationSharingSession(session: InsertLocationSharingSession): Promise<LocationSharingSession> {
    const [newSession] = await db.insert(locationSharingSessions).values(session).returning();
    return newSession;
  }

  async getLocationSharingSessionByBooking(bookingId: string): Promise<LocationSharingSession | undefined> {
    const [session] = await db
      .select()
      .from(locationSharingSessions)
      .where(eq(locationSharingSessions.bookingId, bookingId))
      .orderBy(desc(locationSharingSessions.createdAt))
      .limit(1);
    return session || undefined;
  }

  async updateLocationSharingSession(sessionId: string, updates: Partial<LocationSharingSession>): Promise<LocationSharingSession> {
    const [session] = await db
      .update(locationSharingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(locationSharingSessions.id, sessionId))
      .returning();
    return session;
  }

  // Geofence Methods
  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const [newGeofence] = await db.insert(geofences).values(geofence).returning();
    return newGeofence;
  }

  async getGeofencesByBooking(bookingId: string): Promise<Geofence[]> {
    return await db
      .select()
      .from(geofences)
      .where(eq(geofences.bookingId, bookingId))
      .orderBy(geofences.createdAt);
  }

  // Location Event Methods
  async createLocationEvent(event: InsertLocationEvent): Promise<LocationEvent> {
    const [newEvent] = await db.insert(locationEvents).values(event).returning();
    return newEvent;
  }

  async getLocationEventsByBooking(bookingId: string): Promise<LocationEvent[]> {
    return await db
      .select()
      .from(locationEvents)
      .where(eq(locationEvents.bookingId, bookingId))
      .orderBy(desc(locationEvents.timestamp));
  }

  // Worker Bank Details Implementation
  async createWorkerBankDetails(bankDetails: InsertWorkerBankDetails): Promise<WorkerBankDetails> {
    const [newBankDetails] = await db
      .insert(workerBankDetails)
      .values(bankDetails)
      .returning();
    return newBankDetails;
  }

  async getWorkerBankDetails(workerId: string): Promise<WorkerBankDetails | undefined> {
    const [bankDetails] = await db
      .select()
      .from(workerBankDetails)
      .where(eq(workerBankDetails.workerId, workerId));
    return bankDetails;
  }

  async updateWorkerBankDetails(id: string, updates: Partial<WorkerBankDetails>): Promise<WorkerBankDetails | undefined> {
    const [updatedBankDetails] = await db
      .update(workerBankDetails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workerBankDetails.id, id))
      .returning();
    return updatedBankDetails;
  }

  async deleteWorkerBankDetails(id: string): Promise<void> {
    await db
      .delete(workerBankDetails)
      .where(eq(workerBankDetails.id, id));
  }

  // Areas method implementation - returning empty array since areas are handled via API
  async getAllAreas(): Promise<any[]> {
    // Areas are now handled via the /api/areas endpoint and shared/states-districts.json
    // This method is kept for backward compatibility
    return [];
  }

  // Payment Methods Implementation
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPayment(paymentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    return payment;
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByUser(userId: string, role: string): Promise<Payment[]> {
    if (role === "client") {
      return await db
        .select()
        .from(payments)
        .where(eq(payments.clientId, userId))
        .orderBy(desc(payments.createdAt));
    } else if (role === "worker") {
      return await db
        .select()
        .from(payments)
        .where(eq(payments.workerId, userId))
        .orderBy(desc(payments.createdAt));
    }
    return [];
  }

  async updatePaymentRefund(paymentId: string, refundData: { status: string; refundAmount: string; refundReason: string }): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        ...refundData, 
        updatedAt: new Date() 
      })
      .where(eq(payments.id, paymentId))
      .returning();
    return updatedPayment;
  }

  // Messaging Methods Implementation
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesBySender(senderId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, senderId))
      .orderBy(desc(messages.createdAt));
  }

  async getMessagesByReceiver(receiverId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, receiverId))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        sql`(${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2}) OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})`
      )
      .orderBy(messages.createdAt);
  }

  async markMessageAsRead(messageId: string): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ 
        isRead: true,
        updatedAt: new Date() 
      })
      .where(eq(messages.id, messageId))
      .returning();
    return updatedMessage;
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db
      .delete(messages)
      .where(eq(messages.id, messageId));
  }

  // Transfer History Methods
  async createTransferHistory(transfer: InsertTransferHistory): Promise<TransferHistory> {
    const [createdTransfer] = await db
      .insert(transferHistory)
      .values(transfer)
      .returning();
    return createdTransfer;
  }

  async getTransferHistoryByClient(clientId: string): Promise<TransferHistory[]> {
    return await db
      .select()
      .from(transferHistory)
      .where(eq(transferHistory.clientId, clientId))
      .orderBy(desc(transferHistory.transferredAt));
  }

  async deleteTransferHistory(transferId: string): Promise<void> {
    await db
      .delete(transferHistory)
      .where(eq(transferHistory.id, transferId));
  }

  // Financial Statements Methods
  async getFinancialStatementsByClient(clientId: string): Promise<FinancialStatement[]> {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    return await db
      .select()
      .from(financialStatements)
      .where(
        and(
          eq(financialStatements.clientId, clientId),
          inArray(financialStatements.year, [currentYear, previousYear])
        )
      )
      .orderBy(desc(financialStatements.year));
  }

  async getFinancialStatementByClientAndYear(clientId: string, year: number): Promise<FinancialStatement | undefined> {
    const [statement] = await db
      .select()
      .from(financialStatements)
      .where(
        and(
          eq(financialStatements.clientId, clientId),
          eq(financialStatements.year, year)
        )
      );
    return statement;
  }

  async createOrUpdateFinancialStatement(clientId: string, year: number, updates: Partial<FinancialStatement>): Promise<FinancialStatement> {
    const existing = await this.getFinancialStatementByClientAndYear(clientId, year);
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(financialStatements)
        .set({
          ...updates,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(financialStatements.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(financialStatements)
        .values({
          clientId,
          year,
          balance: "0.00",
          spent: "0.00",
          totalEarnings: "0.00",
          totalBookings: 0,
          ...updates,
        })
        .returning();
      return created;
    }
  }

  // Advertisement methods
  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    // Convert date strings to Date objects if they exist
    // Handle DD/MM/YYYY format
    const parseDate = (dateStr: any): Date | null => {
      if (!dateStr || dateStr === '') return null;
      
      // If it's already a Date object, return it
      if (dateStr instanceof Date) return dateStr;
      
      // Handle DD/MM/YYYY format
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        if (day && month && year) {
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // Try standard date parsing
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const adData = {
      ...ad,
      startDate: parseDate(ad.startDate),
      endDate: parseDate(ad.endDate),
    };
    
    const [created] = await db.insert(advertisements).values(adData).returning();
    return created;
  }

  async updateAdvertisement(id: string, updates: Partial<Advertisement>): Promise<Advertisement | undefined> {
    // Convert date strings to Date objects if they exist
    // Handle DD/MM/YYYY format
    const parseDate = (dateStr: any): Date | null | undefined => {
      if (dateStr === undefined) return undefined; // Keep undefined as is
      if (!dateStr || dateStr === '') return null;
      
      // If it's already a Date object, return it
      if (dateStr instanceof Date) return dateStr;
      
      // Handle DD/MM/YYYY format
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        if (day && month && year) {
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      
      // Try standard date parsing
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const updateData = {
      ...updates,
      startDate: parseDate(updates.startDate),
      endDate: parseDate(updates.endDate),
      updatedAt: new Date()
    };
    
    const [updated] = await db
      .update(advertisements)
      .set(updateData)
      .where(eq(advertisements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdvertisement(id: string): Promise<void> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }

  async getAdvertisementById(id: string): Promise<Advertisement | undefined> {
    const [ad] = await db.select().from(advertisements).where(eq(advertisements.id, id));
    return ad || undefined;
  }

  async getActiveAdvertisementsByType(targetAudience: string): Promise<Advertisement[]> {
    // Simply get all active advertisements for the target audience
    // Date filtering can be added back later if needed
    return db
      .select()
      .from(advertisements)
      .where(
        and(
          eq(advertisements.targetAudience, targetAudience),
          eq(advertisements.isActive, true)
        )
      )
      .orderBy(desc(advertisements.priority));
  }

  async getAllAdvertisements(): Promise<Advertisement[]> {
    return db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() }
      });
  }

  // Job completion and review methods
  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async createWorkerReview(review: any): Promise<any> {
    const [newReview] = await db.insert(workerReviews).values(review).returning();
    return newReview;
  }

  async getWorkerReviews(workerId: string): Promise<any[]> {
    const reviews = await db
      .select({
        id: workerReviews.id,
        rating: workerReviews.rating,
        review: workerReviews.review,
        workQualityRating: workerReviews.workQualityRating,
        timelinessRating: workerReviews.timelinessRating,
        communicationRating: workerReviews.communicationRating,
        professionalismRating: workerReviews.professionalismRating,
        wouldRecommend: workerReviews.wouldRecommend,
        tags: workerReviews.tags,
        isPublic: workerReviews.isPublic,
        createdAt: workerReviews.createdAt,
        clientName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(workerReviews)
      .leftJoin(users, eq(workerReviews.clientId, users.id))
      .where(and(
        eq(workerReviews.workerId, workerId),
        eq(workerReviews.isPublic, true)
      ))
      .orderBy(desc(workerReviews.createdAt));

    return reviews;
  }

  async updateWorkerRating(workerId: string): Promise<void> {
    // Calculate average rating from all reviews
    const ratingResult = await db
      .select({
        avgRating: sql<number>`AVG(${workerReviews.rating})::decimal(3,2)`,
        totalJobs: sql<number>`COUNT(*)::int`
      })
      .from(workerReviews)
      .where(eq(workerReviews.workerId, workerId));

    const avgRating = ratingResult[0]?.avgRating || 0;
    const totalJobs = ratingResult[0]?.totalJobs || 0;

    // Update worker profile with new rating and job count
    await db
      .update(workerProfiles)
      .set({
        rating: avgRating.toString(),
        totalJobs: totalJobs,
        updatedAt: new Date()
      })
      .where(eq(workerProfiles.userId, workerId));
  }

  async getUserById(userId: string): Promise<User | undefined> {
    return this.getUser(userId);
  }
}

export const storage = new DatabaseStorage();
