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
 * Database Backup Export Utility
 * Exports all database tables and data to JSON files for backup and migration
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

async function exportDatabase(): Promise<void> {
  try {
    console.log('🔄 Starting database export...');
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'database', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Export all table data
    console.log('📊 Exporting table data...');
    
    const [
      usersData,
      serviceCategoriesData,
      workerProfilesData,
      otpVerificationsData,
      bookingsData,
      jobPostingsData,
      bidsData,
      workerBankDetailsData
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(serviceCategories),
      db.select().from(workerProfiles),
      db.select().from(otpVerifications),
      db.select().from(bookings),
      db.select().from(jobPostings),
      db.select().from(bids),
      db.select().from(workerBankDetails)
    ]);

    // Create backup object
    const backup: DatabaseBackup = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        description: 'SPANNER Tamil Nadu Blue-Collar Service Marketplace Database Backup'
      },
      schema: {
        users: usersData,
        serviceCategories: serviceCategoriesData,
        workerProfiles: workerProfilesData,
        otpVerifications: otpVerificationsData,
        bookings: bookingsData,
        jobPostings: jobPostingsData,
        bids: bidsData,
        workerBankDetails: workerBankDetailsData
      }
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `spanner-database-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Write backup to file
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    // Also create a latest backup file
    const latestPath = path.join(backupDir, 'latest-backup.json');
    fs.writeFileSync(latestPath, JSON.stringify(backup, null, 2));

    console.log('✅ Database export completed successfully!');
    console.log(`📁 Backup saved to: ${filepath}`);
    console.log(`📋 Latest backup: ${latestPath}`);
    
    // Print summary
    console.log('\n📊 Export Summary:');
    console.log(`- Users: ${backup.schema.users.length}`);
    console.log(`- Service Categories: ${backup.schema.serviceCategories.length}`);
    console.log(`- Worker Profiles: ${backup.schema.workerProfiles.length}`);
    console.log(`- OTP Verifications: ${backup.schema.otpVerifications.length}`);
    console.log(`- Bookings: ${backup.schema.bookings.length}`);
    console.log(`- Job Postings: ${backup.schema.jobPostings.length}`);
    console.log(`- Bids: ${backup.schema.bids.length}`);
    console.log(`- Worker Bank Details: ${backup.schema.workerBankDetails.length}`);

  } catch (error) {
    console.error('❌ Database export failed:', error);
    throw error;
  }
}

// Run export if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportDatabase()
    .then(() => {
      console.log('🎉 Export process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Export process failed:', error);
      process.exit(1);
    });
}

export { exportDatabase };