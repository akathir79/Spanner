import { db } from "../server/db";
import { 
  users, 
  serviceCategories, 
  workerProfiles, 
  otpVerifications,
  bookings,
  jobPostings,
  bids,
  workerBankDetails
} from "../shared/schema";
import fs from 'fs';
import path from 'path';

/**
 * Database Backup Restore Utility
 * Restores database from JSON backup files
 * Creates tables if they don't exist and loads all data
 */

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
      db.delete(areas),
      db.delete(serviceCategories),
      db.delete(districts)
    ]);

    // Restore data in correct order (respecting foreign key constraints)
    console.log('📊 Restoring data...');
    
    // 1. Districts first (no dependencies)
    if (backup.schema.districts.length > 0) {
      console.log(`📍 Restoring ${backup.schema.districts.length} districts...`);
      await db.insert(districts).values(backup.schema.districts);
    }

    // 2. Service Categories (no dependencies)
    if (backup.schema.serviceCategories.length > 0) {
      console.log(`🔧 Restoring ${backup.schema.serviceCategories.length} service categories...`);
      await db.insert(serviceCategories).values(backup.schema.serviceCategories);
    }

    // 3. Areas (depends on districts)
    if (backup.schema.areas.length > 0) {
      console.log(`🏘️  Restoring ${backup.schema.areas.length} areas...`);
      await db.insert(areas).values(backup.schema.areas);
    }

    // 4. Users (depends on districts)
    if (backup.schema.users.length > 0) {
      console.log(`👥 Restoring ${backup.schema.users.length} users...`);
      await db.insert(users).values(backup.schema.users);
    }

    // 5. Worker Profiles (depends on users and service categories)
    if (backup.schema.workerProfiles.length > 0) {
      console.log(`🔨 Restoring ${backup.schema.workerProfiles.length} worker profiles...`);
      await db.insert(workerProfiles).values(backup.schema.workerProfiles);
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

    console.log('✅ Database restore completed successfully!');
    
    // Print summary
    console.log('\n📊 Restore Summary:');
    console.log(`- Users: ${backup.schema.users.length}`);
    console.log(`- Districts: ${backup.schema.districts.length}`);
    console.log(`- Areas: ${backup.schema.areas.length}`);
    console.log(`- Service Categories: ${backup.schema.serviceCategories.length}`);
    console.log(`- Worker Profiles: ${backup.schema.workerProfiles.length}`);
    console.log(`- OTP Verifications: ${backup.schema.otpVerifications.length}`);
    console.log(`- Bookings: ${backup.schema.bookings.length}`);
    console.log(`- Job Postings: ${backup.schema.jobPostings.length}`);
    console.log(`- Bids: ${backup.schema.bids.length}`);
    console.log(`- Worker Bank Details: ${backup.schema.workerBankDetails.length}`);

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