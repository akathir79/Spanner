import { db } from "../server/db";
import { 
  users, 
  serviceCategories, 
  workerProfiles, 
  otpVerifications,
  bookings,
  jobPostings,
  bids,
  workerBankDetails,
  apiKeys
} from "../shared/schema";
import fs from 'fs';
import path from 'path';

/**
 * Database Backup Restore Utility
 * Restores database from JSON backup files
 * Creates tables if they don't exist and loads all data
 */

// Utility function to convert string timestamps to Date objects
function transformTimestampFields(data: any[]): any[] {
  return data.map(item => {
    const transformed = { ...item };
    // Convert timestamp fields from strings to Date objects
    const timestampFields = ['createdAt', 'updatedAt', 'scheduledDate', 'deadline', 'lastLoginAt'];
    
    for (const field of timestampFields) {
      if (transformed[field] && typeof transformed[field] === 'string') {
        transformed[field] = new Date(transformed[field]);
      }
    }
    
    return transformed;
  });
}

interface DatabaseBackup {
  metadata: {
    exportDate: string;
    version: string;
    description: string;
  };
  schema: {
    users: any[];
    serviceCategories: any[];
    workerProfiles: any[];
    otpVerifications: any[];
    bookings: any[];
    jobPostings: any[];
    bids: any[];
    workerBankDetails: any[];
    apiKeys?: any[];
    // Legacy fields (no longer used - districts/areas now via API)
    districts?: any[];
    areas?: any[];
  };
}

async function restoreDatabase(backupFilePath?: string): Promise<void> {
  try {
    console.log('🔄 Starting database restore...');
    
    // Determine backup file path
    let filepath: string;
    if (backupFilePath) {
      filepath = backupFilePath;
    } else {
      // Use latest backup
      const backupDir = path.join(process.cwd(), 'database', 'backups');
      filepath = path.join(backupDir, 'latest-backup.json');
    }

    // Check if backup file exists
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }

    console.log(`📁 Loading backup from: ${filepath}`);
    
    // Read and parse backup file
    const backupData = fs.readFileSync(filepath, 'utf8');
    const backup: DatabaseBackup = JSON.parse(backupData);

    console.log(`📋 Backup created: ${backup.metadata.exportDate}`);
    console.log(`🏷️  Version: ${backup.metadata.version}`);
    console.log(`📝 Description: ${backup.metadata.description}`);

    // Clear existing data (optional - could be made configurable)
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      db.delete(bids),
      db.delete(jobPostings),
      db.delete(bookings),
      db.delete(otpVerifications),
      db.delete(workerBankDetails),
      db.delete(workerProfiles),
      db.delete(users),
      db.delete(serviceCategories),
      db.delete(apiKeys)
    ]);

    // Restore data in correct order (respecting foreign key constraints)
    console.log('📊 Restoring data...');
    
    // 1. Service Categories first (no dependencies)
    if (backup.schema.serviceCategories.length > 0) {
      console.log(`🔧 Restoring ${backup.schema.serviceCategories.length} service categories...`);
      const transformedServiceCategories = transformTimestampFields(backup.schema.serviceCategories);
      await db.insert(serviceCategories).values(transformedServiceCategories);
    }

    // 2. Users (no foreign key dependencies now since districts are API-based)
    if (backup.schema.users.length > 0) {
      console.log(`👥 Restoring ${backup.schema.users.length} users...`);
      const transformedUsers = transformTimestampFields(backup.schema.users);
      await db.insert(users).values(transformedUsers);
    }

    // 3. Worker Profiles (depends on users and service categories)
    if (backup.schema.workerProfiles.length > 0) {
      console.log(`🔨 Restoring ${backup.schema.workerProfiles.length} worker profiles...`);
      const transformedWorkerProfiles = transformTimestampFields(backup.schema.workerProfiles);
      await db.insert(workerProfiles).values(transformedWorkerProfiles);
    }

    // 6. Worker Bank Details (depends on users)
    if (backup.schema.workerBankDetails.length > 0) {
      console.log(`🏦 Restoring ${backup.schema.workerBankDetails.length} worker bank details...`);
      await db.insert(workerBankDetails).values(backup.schema.workerBankDetails);
    }

    // 7. OTP Verifications (depends on users)
    if (backup.schema.otpVerifications.length > 0) {
      console.log(`📱 Restoring ${backup.schema.otpVerifications.length} OTP verifications...`);
      await db.insert(otpVerifications).values(backup.schema.otpVerifications);
    }

    // 8. Bookings (depends on users and districts)
    if (backup.schema.bookings.length > 0) {
      console.log(`📅 Restoring ${backup.schema.bookings.length} bookings...`);
      await db.insert(bookings).values(backup.schema.bookings);
    }

    // 9. Job Postings (depends on users and districts)
    if (backup.schema.jobPostings.length > 0) {
      console.log(`💼 Restoring ${backup.schema.jobPostings.length} job postings...`);
      await db.insert(jobPostings).values(backup.schema.jobPostings);
    }

    // 10. Bids (depends on job postings and users)
    if (backup.schema.bids.length > 0) {
      console.log(`💰 Restoring ${backup.schema.bids.length} bids...`);
      await db.insert(bids).values(backup.schema.bids);
    }

    // 11. API Keys (no dependencies)
    if (backup.schema.apiKeys && backup.schema.apiKeys.length > 0) {
      console.log(`🔑 Restoring ${backup.schema.apiKeys.length} API keys...`);
      const transformedApiKeys = transformTimestampFields(backup.schema.apiKeys);
      await db.insert(apiKeys).values(transformedApiKeys);
    }

    console.log('✅ Database restore completed successfully!');
    
    // Print summary
    console.log('\n📊 Restore Summary:');
    console.log(`- Users: ${backup.schema.users.length}`);
    console.log(`- Service Categories: ${backup.schema.serviceCategories.length}`);
    console.log(`- Worker Profiles: ${backup.schema.workerProfiles.length}`);
    console.log(`- OTP Verifications: ${backup.schema.otpVerifications.length}`);
    console.log(`- Bookings: ${backup.schema.bookings.length}`);
    console.log(`- Job Postings: ${backup.schema.jobPostings.length}`);
    console.log(`- Bids: ${backup.schema.bids.length}`);
    console.log(`- Worker Bank Details: ${backup.schema.workerBankDetails.length}`);
    if (backup.schema.apiKeys) {
      console.log(`- API Keys: ${backup.schema.apiKeys.length}`);
    }
    if (backup.schema.districts) {
      console.log(`- Districts (legacy): ${backup.schema.districts.length}`);
    }
    if (backup.schema.areas) {
      console.log(`- Areas (legacy): ${backup.schema.areas.length}`);
    }

  } catch (error) {
    console.error('❌ Database restore failed:', error);
    throw error;
  }
}

// Run restore if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupFile = process.argv[2]; // Optional backup file path
  
  restoreDatabase(backupFile)
    .then(() => {
      console.log('🎉 Restore process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Restore process failed:', error);
      process.exit(1);
    });
}

export { restoreDatabase };