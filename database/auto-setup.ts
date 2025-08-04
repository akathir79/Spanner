import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { restoreDatabase } from "./backup-restore";
import path from 'path';
import fs from 'fs';

/**
 * Auto Database Setup Utility
 * Automatically detects if database is empty and restores from backup
 * Perfect for new deployments and fresh installations
 */

async function checkDatabaseExists(): Promise<boolean> {
  try {
    // Check if service_categories table exists and has data (core table for the platform)
    const result = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'service_categories'
    `);
    
    const tableExists = (result.rows[0] as any)?.count > 0;
    
    if (!tableExists) {
      return false;
    }

    // Check if service_categories table has data
    const serviceCount = await db.execute(sql`SELECT COUNT(*) as count FROM service_categories`);
    const hasData = (serviceCount.rows[0] as any)?.count > 0;
    
    return hasData;
  } catch (error) {
    console.log('Database not accessible or doesn\'t exist:', error);
    return false;
  }
}

async function runDatabaseMigrations(): Promise<void> {
  try {
    console.log('🔧 Running database migrations...');
    
    // Run drizzle migrations to create tables
    const { execSync } = await import('child_process');
    execSync('npm run db:push', { stdio: 'inherit' });
    
    console.log('✅ Database migrations completed!');
  } catch (error) {
    console.error('❌ Database migrations failed:', error);
    throw error;
  }
}

async function autoSetupDatabase(): Promise<void> {
  try {
    console.log('🚀 Starting auto database setup...');
    
    // Check if database exists and has data
    const databaseReady = await checkDatabaseExists();
    
    if (databaseReady) {
      console.log('✅ Database already exists and has data. No setup needed.');
      return;
    }

    console.log('📦 Database is empty or doesn\'t exist. Setting up from backup...');
    
    // Run migrations first to create tables
    await runDatabaseMigrations();
    
    // Check if backup file exists
    const backupDir = path.join(process.cwd(), 'database', 'backups');
    const latestBackupPath = path.join(backupDir, 'latest-backup.json');
    
    if (!fs.existsSync(latestBackupPath)) {
      console.log('⚠️  No backup file found. Database will be empty.');
      console.log('📝 You can manually import data or create a backup from another instance.');
      return;
    }

    // Restore from backup
    console.log('📁 Found backup file. Restoring data...');
    await restoreDatabase(latestBackupPath);
    
    console.log('🎉 Auto database setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Auto database setup failed:', error);
    throw error;
  }
}

// Run auto setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoSetupDatabase()
    .then(() => {
      console.log('✨ Database setup process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup process failed:', error);
      process.exit(1);
    });
}

export { autoSetupDatabase, checkDatabaseExists };