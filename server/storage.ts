import { 
  users, 
  workerProfiles, 
  bookings, 
  districts, 
  serviceCategories,
  otpVerifications,
  type User, 
  type InsertUser,
  type WorkerProfile,
  type InsertWorkerProfile,
  type Booking,
  type InsertBooking,
  type District,
  type ServiceCategory,
  type OtpVerification,
  type InsertOtp
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Worker profiles
  getWorkerProfile(userId: string): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;
  getWorkersByDistrict(districtId: string): Promise<(User & { workerProfile: WorkerProfile })[]>;
  getWorkersByService(service: string): Promise<(User & { workerProfile: WorkerProfile })[]>;
  
  // Districts
  getAllDistricts(): Promise<District[]>;
  getDistrictById(id: string): Promise<District | undefined>;
  getDistrictByCode(code: string): Promise<District | undefined>;
  
  // Service categories
  getAllServiceCategories(): Promise<ServiceCategory[]>;
  
  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getClientBookings(clientId: string): Promise<Booking[]>;
  getWorkerBookings(workerId: string): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  
  // OTP management
  createOtp(otp: InsertOtp): Promise<OtpVerification>;
  getValidOtp(mobile: string, otp: string, purpose: string): Promise<OtpVerification | undefined>;
  markOtpAsUsed(id: string): Promise<void>;
  
  // Admin functions
  getAllUsers(): Promise<User[]>;
  getUsersWithProfiles(): Promise<(User & { workerProfile?: WorkerProfile })[]>;
  getBookingsWithDetails(): Promise<(Booking & { client: User; worker: User; district: District })[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
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

  async getAllDistricts(): Promise<District[]> {
    return db.select().from(districts).orderBy(districts.name);
  }

  async getDistrictById(id: string): Promise<District | undefined> {
    const [district] = await db.select().from(districts).where(eq(districts.id, id));
    return district || undefined;
  }

  async getDistrictByCode(code: string): Promise<District | undefined> {
    const [district] = await db.select().from(districts).where(eq(districts.code, code));
    return district || undefined;
  }

  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories).where(eq(serviceCategories.isActive, true));
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

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersWithProfiles(): Promise<(User & { workerProfile?: WorkerProfile })[]> {
    const results = await db
      .select()
      .from(users)
      .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .orderBy(desc(users.createdAt));
    
    return results.map(result => ({
      ...result.users,
      workerProfile: result.worker_profiles || undefined
    }));
  }

  async getBookingsWithDetails(): Promise<(Booking & { client: User; worker: User; district: District })[]> {
    const results = await db
      .select()
      .from(bookings)
      .innerJoin(users, eq(bookings.clientId, users.id))
      .innerJoin(users, eq(bookings.workerId, users.id))
      .innerJoin(districts, eq(bookings.districtId, districts.id))
      .orderBy(desc(bookings.createdAt));
    
    return results.map(result => ({
      ...result.bookings,
      client: result.users,
      worker: result.users,
      district: result.districts
    }));
  }
}

export const storage = new DatabaseStorage();
