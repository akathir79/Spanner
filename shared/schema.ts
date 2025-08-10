import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: Districts and areas now handled via API - no longer stored in database

// Sequence counter for custom user IDs
export const userSequence = pgTable("user_sequence", {
  id: varchar("id").primaryKey(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  role: text("role").notNull(), // client, worker, admin, super_admin
  lastNumber: integer("last_number").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User roles: client, worker, admin, super_admin
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email"),
  mobile: text("mobile").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("client"), // client, worker, admin, super_admin
  profilePicture: text("profile_picture"), // Base64 encoded image
  district: text("district"), // District name stored as text since API-based
  address: text("address"), // Physical address
  pincode: text("pincode"), // Area pincode
  state: text("state"), // State name
  // Bank details for clients (added to dashboard only, not registration)
  bankAccountNumber: text("bank_account_number"),
  bankIFSC: text("bank_ifsc"),
  bankAccountHolderName: text("bank_account_holder_name"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAddress: text("bank_address"), // Bank address field
  bankAccountType: text("bank_account_type"), // savings, current
  bankMICR: text("bank_micr"), // MICR code
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  isSuspended: boolean("is_suspended").default(false), // Track suspension status
  suspendedAt: timestamp("suspended_at"), // When user was suspended
  suspendedBy: varchar("suspended_by"), // Admin ID who suspended the user
  suspensionReason: text("suspension_reason"), // Reason for suspension
  rejoinRequestedAt: timestamp("rejoin_requested_at"), // When worker requested to rejoin
  rejoinRequestReason: text("rejoin_request_reason"), // Worker's reason for rejoin request
  hasRejoinRequest: boolean("has_rejoin_request").default(false), // Track if worker has active rejoin request
  status: text("status").default("pending"), // pending, verified, approved, rejected, suspended (for worker approval workflow)
  verificationComment: text("verification_comment"), // Admin comment when verifying worker
  verifiedAt: timestamp("verified_at"), // When worker was verified
  verifiedBy: varchar("verified_by"), // Admin ID who verified the worker
  approvedAt: timestamp("approved_at"), // When worker was approved
  approvedBy: varchar("approved_by"), // Admin ID who approved the worker
  lastLoginAt: timestamp("last_login_at"), // Track last login for activity monitoring
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Worker-specific profile information
export const workerProfiles = pgTable("worker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  aadhaarNumber: text("aadhaar_number").notNull(),
  aadhaarVerified: boolean("aadhaar_verified").default(false), // Aadhaar verification status
  primaryService: text("primary_service").notNull(),
  experienceYears: integer("experience_years").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  serviceDistricts: jsonb("service_districts").notNull(), // Array of district names
  serviceAreas: jsonb("service_areas"), // Array of area names within service districts
  serviceAllAreas: boolean("service_all_areas").default(false), // Whether worker serves all areas in selected districts
  bio: text("bio"),
  skills: jsonb("skills").notNull(), // Array of skills
  bioDataDocument: text("bio_data_document"), // Base64 encoded document
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
  district: text("district").notNull(), // District name stored as text
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
  serviceAddress: text("service_address").notNull(), // Complete service address
  state: text("state").notNull(), // State name stored as text
  district: text("district").notNull(), // District name stored as text
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

// GPS Location Tracking for Service Delivery
export const locationTracking = pgTable("location_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // GPS accuracy in meters
  speed: decimal("speed", { precision: 10, scale: 2 }), // Speed in km/h
  heading: decimal("heading", { precision: 5, scale: 2 }), // Direction in degrees
  address: text("address"), // Reverse geocoded address
  isSharedWithClient: boolean("is_shared_with_client").default(true),
  batteryLevel: integer("battery_level"), // Worker's device battery percentage
  connectionType: text("connection_type"), // wifi, cellular, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Location Sharing Sessions
export const locationSharingSessions = pgTable("location_sharing_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  sharePreferences: jsonb("share_preferences").notNull(), // {realTime: boolean, locationHistory: boolean, estimatedArrival: boolean}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Geofences for service areas
export const geofences = pgTable("geofences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  centerLatitude: decimal("center_latitude", { precision: 10, scale: 7 }).notNull(),
  centerLongitude: decimal("center_longitude", { precision: 10, scale: 7 }).notNull(),
  radius: decimal("radius", { precision: 10, scale: 2 }).notNull(), // radius in meters
  type: text("type").notNull(), // service_area, client_location, worker_start_point
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Location Events (entries/exits from geofences, arrival notifications, etc.)
export const locationEvents = pgTable("location_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  eventType: text("event_type").notNull(), // arrived_at_client, started_work, geofence_entry, geofence_exit, work_completed
  geofenceId: varchar("geofence_id").references(() => geofences.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  address: text("address"),
  metadata: jsonb("metadata"), // Additional event-specific data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker Bank Details
export const workerBankDetails = pgTable("worker_bank_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  micrCode: text("micr_code"),
  bankName: text("bank_name").notNull(),
  branchName: text("branch_name").notNull(),
  bankAddress: text("bank_address").notNull(),
  accountType: text("account_type").default("savings"), // savings, current
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment tables
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  workerId: varchar("worker_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("INR").notNull(),
  paymentMethod: text("payment_method").notNull(), // card, upi, netbanking, wallet
  paymentProvider: text("payment_provider").default("stripe").notNull(),
  providerTransactionId: text("provider_transaction_id"), // Stripe payment intent ID
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed, refunded
  paymentData: jsonb("payment_data"), // Store payment method details (last 4 digits, UPI ID, etc.)
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0.00"),
  workerAmount: decimal("worker_amount", { precision: 10, scale: 2 }).notNull(), // Amount after platform fee
  failureReason: text("failure_reason"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default("0.00"),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment webhooks log
export const paymentWebhooks = pgTable("payment_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // stripe, razorpay
  eventType: text("event_type").notNull(),
  eventId: text("event_id").notNull().unique(),
  paymentId: varchar("payment_id").references(() => payments.id),
  webhookData: jsonb("webhook_data").notNull(),
  processed: boolean("processed").default(false),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages between users and admins
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  parentMessageId: varchar("parent_message_id"), // For replies
  attachments: jsonb("attachments"), // Array of attachment URLs/data
  messageType: text("message_type").default("general"), // general, support, complaint, inquiry
  priority: text("priority").default("normal"), // low, normal, high, urgent
  status: text("status").default("active"), // active, archived, deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transfer history for tracking money transfers
export const transferHistory = pgTable("transfer_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  receiverName: text("receiver_name").notNull(),
  receiverAccountNumber: text("receiver_account_number").notNull(),
  receiverIFSC: text("receiver_ifsc").notNull(),
  receiverBankName: text("receiver_bank_name"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transferType: text("transfer_type").notNull(), // IMPS, NEFT, RTGS
  transactionId: text("transaction_id"),
  status: text("status").default("pending"), // pending, completed, failed
  description: text("description"),
  transferredAt: timestamp("transferred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Statements for clients - Balance and Spent tracking by year
export const financialStatements = pgTable("financial_statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  spent: decimal("spent", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0.00").notNull(), // For tracking income
  totalBookings: integer("total_bookings").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  workerProfile: one(workerProfiles, {
    fields: [users.id],
    references: [workerProfiles.userId],
  }),
  workerBankDetails: one(workerBankDetails, {
    fields: [users.id],
    references: [workerBankDetails.workerId],
  }),
  clientBookings: many(bookings, { relationName: "clientBookings" }),
  workerBookings: many(bookings, { relationName: "workerBookings" }),
  jobPostings: many(jobPostings),
  bids: many(bids),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  transferHistory: many(transferHistory),
  financialStatements: many(financialStatements),
}));

export const workerProfilesRelations = relations(workerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [workerProfiles.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
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
  locationTracking: many(locationTracking),
  locationSharingSession: one(locationSharingSessions, {
    fields: [bookings.id],
    references: [locationSharingSessions.bookingId],
  }),
  geofences: many(geofences),
  locationEvents: many(locationEvents),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  client: one(users, {
    fields: [jobPostings.clientId],
    references: [users.id],
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

// Location tracking relations
export const locationTrackingRelations = relations(locationTracking, ({ one }) => ({
  booking: one(bookings, {
    fields: [locationTracking.bookingId],
    references: [bookings.id],
  }),
  worker: one(users, {
    fields: [locationTracking.workerId],
    references: [users.id],
  }),
}));

export const locationSharingSessionsRelations = relations(locationSharingSessions, ({ one }) => ({
  booking: one(bookings, {
    fields: [locationSharingSessions.bookingId],
    references: [bookings.id],
  }),
  worker: one(users, {
    fields: [locationSharingSessions.workerId],
    references: [users.id],
  }),
  client: one(users, {
    fields: [locationSharingSessions.clientId],
    references: [users.id],
  }),
}));

export const geofencesRelations = relations(geofences, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [geofences.bookingId],
    references: [bookings.id],
  }),
  locationEvents: many(locationEvents),
}));

export const locationEventsRelations = relations(locationEvents, ({ one }) => ({
  booking: one(bookings, {
    fields: [locationEvents.bookingId],
    references: [bookings.id],
  }),
  worker: one(users, {
    fields: [locationEvents.workerId],
    references: [users.id],
  }),
  geofence: one(geofences, {
    fields: [locationEvents.geofenceId],
    references: [geofences.id],
  }),
}));

// Payment relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
  client: one(users, {
    fields: [payments.clientId],
    references: [users.id],
  }),
  worker: one(users, {
    fields: [payments.workerId],
    references: [users.id],
  }),
}));

export const paymentWebhooksRelations = relations(paymentWebhooks, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentWebhooks.paymentId],
    references: [payments.id],
  }),
}));

export const transferHistoryRelations = relations(transferHistory, ({ one }) => ({
  client: one(users, {
    fields: [transferHistory.clientId],
    references: [users.id],
  }),
}));

export const financialStatementsRelations = relations(financialStatements, ({ one }) => ({
  client: one(users, {
    fields: [financialStatements.clientId],
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

// insertAreaSchema removed - areas now handled via API

export const insertLocationTrackingSchema = createInsertSchema(locationTracking).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSharingSessionSchema = createInsertSchema(locationSharingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
  createdAt: true,
});

export const insertLocationEventSchema = createInsertSchema(locationEvents).omit({
  id: true,
  createdAt: true,
});

export const insertWorkerBankDetailsSchema = createInsertSchema(workerBankDetails).omit({
  id: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  micrCode: z.string().optional(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentWebhookSchema = createInsertSchema(paymentWebhooks).omit({
  id: true,
  createdAt: true,
});

export const insertTransferHistorySchema = createInsertSchema(transferHistory).omit({
  id: true,
  createdAt: true,
});

export const insertFinancialStatementSchema = createInsertSchema(financialStatements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
// District types removed - now handled via API
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
// Area types removed - now handled via API
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type LocationTracking = typeof locationTracking.$inferSelect;
export type InsertLocationTracking = z.infer<typeof insertLocationTrackingSchema>;
export type LocationSharingSession = typeof locationSharingSessions.$inferSelect;
export type InsertLocationSharingSession = z.infer<typeof insertLocationSharingSessionSchema>;
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type LocationEvent = typeof locationEvents.$inferSelect;
export type InsertLocationEvent = z.infer<typeof insertLocationEventSchema>;
export type WorkerBankDetails = typeof workerBankDetails.$inferSelect;
export type InsertWorkerBankDetails = z.infer<typeof insertWorkerBankDetailsSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;
export type InsertPaymentWebhook = z.infer<typeof insertPaymentWebhookSchema>;
export type TransferHistory = typeof transferHistory.$inferSelect;
export type InsertTransferHistory = z.infer<typeof insertTransferHistorySchema>;
export type FinancialStatement = typeof financialStatements.$inferSelect;
export type InsertFinancialStatement = z.infer<typeof insertFinancialStatementSchema>;

// Message relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: "parentMessage",
  }),
  replies: many(messages, { relationName: "parentMessage" }),
}));

// Message schemas
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
