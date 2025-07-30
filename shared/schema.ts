import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tamil Nadu Districts
export const districts = pgTable("districts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tamilName: text("tamil_name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User roles: client, worker, admin, super_admin
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email"),
  mobile: text("mobile").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("client"), // client, worker, admin, super_admin
  profilePicture: text("profile_picture"), // Base64 encoded image
  districtId: varchar("district_id").references(() => districts.id),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  status: text("status").default("pending"), // pending, approved, rejected (for worker approval workflow)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Worker-specific profile information
export const workerProfiles = pgTable("worker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  aadhaarNumber: text("aadhaar_number").notNull(),
  primaryService: text("primary_service").notNull(),
  experienceYears: integer("experience_years").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  serviceDistricts: jsonb("service_districts").notNull(), // Array of district IDs
  bio: text("bio"),
  skills: jsonb("skills").notNull(), // Array of skills
  isBackgroundVerified: boolean("is_background_verified").default(false),
  isAvailable: boolean("is_available").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalJobs: integer("total_jobs").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Service categories
export const serviceCategories = pgTable("service_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tamilName: text("tamil_name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  serviceCategory: text("service_category").notNull(),
  description: text("description").notNull(),
  districtId: varchar("district_id").references(() => districts.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, in_progress, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  clientRating: integer("client_rating"), // 1-5
  clientReview: text("client_review"),
  workerRating: integer("worker_rating"), // 1-5
  workerReview: text("worker_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job postings for bidding system
export const jobPostings = pgTable("job_postings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  serviceCategory: text("service_category").notNull(),
  districtId: varchar("district_id").references(() => districts.id).notNull(),
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  deadline: timestamp("deadline"),
  requirements: jsonb("requirements"), // Array of specific requirements
  attachments: jsonb("attachments"), // Array of file URLs
  status: text("status").notNull().default("open"), // open, in_progress, completed, cancelled
  selectedBidId: varchar("selected_bid_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bids on job postings
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: varchar("job_posting_id").references(() => jobPostings.id).notNull(),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  proposedAmount: decimal("proposed_amount", { precision: 10, scale: 2 }).notNull(),
  estimatedDuration: text("estimated_duration"), // e.g., "2-3 days", "1 week"
  proposal: text("proposal").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, withdrawn
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// OTP verification
export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mobile: text("mobile").notNull(),
  otp: text("otp").notNull(),
  purpose: text("purpose").notNull(), // login, signup, forgot_password
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  district: one(districts, {
    fields: [users.districtId],
    references: [districts.id],
  }),
  workerProfile: one(workerProfiles, {
    fields: [users.id],
    references: [workerProfiles.userId],
  }),
  clientBookings: many(bookings, { relationName: "clientBookings" }),
  workerBookings: many(bookings, { relationName: "workerBookings" }),
  jobPostings: many(jobPostings),
  bids: many(bids),
}));

export const districtsRelations = relations(districts, ({ many }) => ({
  users: many(users),
  bookings: many(bookings),
}));

export const workerProfilesRelations = relations(workerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [workerProfiles.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  client: one(users, {
    fields: [bookings.clientId],
    references: [users.id],
    relationName: "clientBookings",
  }),
  worker: one(users, {
    fields: [bookings.workerId],
    references: [users.id],
    relationName: "workerBookings",
  }),
  district: one(districts, {
    fields: [bookings.districtId],
    references: [districts.id],
  }),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  client: one(users, {
    fields: [jobPostings.clientId],
    references: [users.id],
  }),
  district: one(districts, {
    fields: [jobPostings.districtId],
    references: [districts.id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  jobPosting: one(jobPostings, {
    fields: [bids.jobPostingId],
    references: [jobPostings.id],
  }),
  worker: one(users, {
    fields: [bids.workerId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  proposedAmount: z.number(),
});

export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type District = typeof districts.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
