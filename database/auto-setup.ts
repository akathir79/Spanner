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

async function ensureCoreTablesExist(): Promise<void> {
  try {
    console.log('🔧 Ensuring core tables exist...');
    
    // Create settings table if it doesn't exist
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `));
    
    // Create advertisements table if it doesn't exist
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        image TEXT,
        target_audience TEXT NOT NULL,
        link TEXT,
        button_text TEXT,
        background_color TEXT DEFAULT '#ffffff',
        text_color TEXT DEFAULT '#000000',
        display_mode TEXT DEFAULT 'card',
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_by VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `));
    
    // Create transfer_history table if it doesn't exist
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS transfer_history (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id VARCHAR NOT NULL,
        client_id VARCHAR,
        amount DECIMAL(10, 2) NOT NULL,
        transfer_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        reference_id TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `));
    
    // Create financial_models table if it doesn't exist with all current fields
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS financial_models (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        gst_rate NUMERIC(5,2) DEFAULT '0',
        admin_commission_percentage NUMERIC(5,2) DEFAULT '0',
        advance_payment_percentage NUMERIC(5,2) DEFAULT '0',
        completion_payment_percentage NUMERIC(5,2) DEFAULT '0',
        client_referral_bonus NUMERIC(10,2) DEFAULT '0',
        worker_referral_bonus NUMERIC(10,2) DEFAULT '0',
        worker_commission_percentage NUMERIC(5,2) DEFAULT '0',
        min_transaction_limit NUMERIC(10,2) DEFAULT '0',
        max_transaction_limit NUMERIC(10,2) DEFAULT '0',
        processing_fee_percentage NUMERIC(5,2) DEFAULT '0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `));
    
    console.log('✅ Core tables verified/created!');
  } catch (error) {
    console.error('❌ Core table creation failed:', error);
  }
}

async function ensureSchemaUpdated(): Promise<void> {
  try {
    console.log('🔧 Ensuring database schema is up to date...');
    
    // Check and add missing columns that might not exist in older databases
    const missingColumns = [
      { table: 'users', column: 'house_number', type: 'TEXT' },
      { table: 'users', column: 'street_name', type: 'TEXT' },
      { table: 'users', column: 'area_name', type: 'TEXT' },
      { table: 'users', column: 'full_address', type: 'TEXT' },
      { table: 'users', column: 'bank_address', type: 'TEXT' },
      { table: 'users', column: 'bank_micr', type: 'TEXT' },
      { table: 'users', column: 'is_suspended', type: 'BOOLEAN DEFAULT false' },
      { table: 'users', column: 'suspended_at', type: 'TIMESTAMP' },
      { table: 'users', column: 'suspended_by', type: 'VARCHAR' },
      { table: 'users', column: 'suspension_reason', type: 'TEXT' },
      { table: 'users', column: 'rejoin_requested_at', type: 'TIMESTAMP' },
      { table: 'users', column: 'rejoin_request_reason', type: 'TEXT' },
      { table: 'users', column: 'has_rejoin_request', type: 'BOOLEAN DEFAULT false' },
      { table: 'users', column: 'verification_comment', type: 'TEXT' },
      { table: 'users', column: 'verified_at', type: 'TIMESTAMP' },
      { table: 'users', column: 'verified_by', type: 'VARCHAR' },
      { table: 'users', column: 'approved_at', type: 'TIMESTAMP' },
      { table: 'users', column: 'approved_by', type: 'VARCHAR' },
      { table: 'users', column: 'last_login_at', type: 'TIMESTAMP' },
      { table: 'financial_models', column: 'worker_commission_percentage', type: 'NUMERIC(5,2) DEFAULT \'0\'' }
    ];

    for (const { table, column, type } of missingColumns) {
      try {
        // Check if column exists
        const columnCheck = await db.execute(sql.raw(`
          SELECT COUNT(*) as count 
          FROM information_schema.columns 
          WHERE table_name = '${table}' 
          AND column_name = '${column}'
        `));
        
        const columnExists = (columnCheck.rows[0] as any)?.count > 0;
        
        if (!columnExists) {
          console.log(`  Adding missing column: ${table}.${column}`);
          await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`));
        }
      } catch (error) {
        // Column might already exist or there might be a constraint issue
        console.log(`  Column ${table}.${column} already exists or has constraint issues`);
      }
    }

    console.log('✅ Database schema update completed!');
  } catch (error) {
    console.error('❌ Database schema update failed:', error);
    throw error;
  }
}

async function runDatabaseMigrations(): Promise<void> {
  try {
    console.log('🔧 Running database migrations...');
    
    // Create any missing tables first
    await ensureCoreTablesExist();
    
    // First try to create tables using drizzle-kit push in non-interactive mode
    try {
      const { execSync } = await import('child_process');
      // Use --yes flag to auto-confirm all prompts
      execSync('yes | npm run db:push', { stdio: 'ignore', timeout: 30000 });
    } catch (error) {
      // If drizzle push fails, continue with manual schema updates
      console.log('📝 Drizzle push completed or skipped, continuing with schema updates...');
    }
    
    // Ensure all schema updates are applied
    await ensureSchemaUpdated();
    
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