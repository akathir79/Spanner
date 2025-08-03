# SPANNER Database Backup & Restore System

This directory contains utilities for backing up, restoring, and auto-setting up the SPANNER Tamil Nadu Blue-Collar Service Marketplace database.

## Features

- **Complete Database Backup**: Export all tables and data to JSON files
- **Selective Restore**: Restore database from backup files
- **Auto Setup**: Automatically detect and setup database on fresh deployments
- **Migration Ready**: Perfect for deploying to new websites or environments

## Files

### Core Utilities
- `backup-export.ts` - Export current database to JSON backup files
- `backup-restore.ts` - Restore database from JSON backup files  
- `auto-setup.ts` - Automatically setup database on fresh installations
- `backups/` - Directory containing backup JSON files

### Usage

#### 1. Create Database Backup
```bash
# Export current database to backup files
npx tsx database/backup-export.ts
```

#### 2. Restore from Backup
```bash
# Restore from latest backup
npx tsx database/backup-restore.ts

# Restore from specific backup file
npx tsx database/backup-restore.ts /path/to/backup.json
```

#### 3. Auto Setup (New Deployments)
```bash
# Automatically setup database if empty
npx tsx database/auto-setup.ts
```

## Backup Files

### Structure
```json
{
  "metadata": {
    "exportDate": "2025-08-03T10:30:00.000Z",
    "version": "1.0.0", 
    "description": "SPANNER Tamil Nadu Blue-Collar Service Marketplace Database Backup"
  },
  "schema": {
    "users": [...],
    "districts": [...],
    "areas": [...],
    "serviceCategories": [...],
    "workerProfiles": [...],
    "otpVerifications": [...],
    "sessions": [...]
  }
}
```

### Files Created
- `spanner-database-backup-TIMESTAMP.json` - Timestamped backup
- `latest-backup.json` - Always contains the most recent backup

## Integration with New Websites

### Method 1: Copy Backup Files
1. Copy the entire `database/` directory to your new project
2. Place backup JSON files in `database/backups/`
3. Run auto setup: `npx tsx database/auto-setup.ts`

### Method 2: Manual Integration
1. Copy `database/backup-restore.ts` to your project
2. Place your backup JSON file anywhere accessible
3. Run restore: `npx tsx database/backup-restore.ts /path/to/your-backup.json`

## Data Included

### Core Data (492+ Locations)
- **38 Tamil Nadu Districts** with English and Tamil names
- **492+ Areas/Villages** across all districts with bilingual support
- **Service Categories** for blue-collar services
- **User Accounts** (currently only super admin)

### Authentication & Sessions
- User authentication data
- OTP verification records
- Active user sessions

## Production Deployment

### New Website Setup
1. Deploy your code to new environment
2. Set up database (PostgreSQL)
3. Configure `DATABASE_URL` environment variable
4. Run: `npx tsx database/auto-setup.ts`

The auto-setup will:
- Detect if database is empty
- Run migrations to create tables
- Restore data from backup if available
- Set up complete Tamil Nadu service marketplace

### Backup Strategy
- Export backups before major updates
- Store backups in version control (for static data)
- Regular automated exports for production data

## Technical Notes

### Dependencies
- Requires existing Drizzle schema in `shared/schema.ts`
- Uses same database connection as main application
- Compatible with PostgreSQL (Neon, Supabase, etc.)

### Foreign Key Handling
Restore process handles foreign key constraints by loading data in correct order:
1. Districts (no dependencies)
2. Service Categories (no dependencies)  
3. Areas (depends on districts)
4. Users (depends on districts)
5. Worker Profiles (depends on users & service categories)
6. OTP Verifications (depends on users)
7. Sessions (depends on users)

### Error Handling
- Comprehensive error messages
- Rollback on failure
- Validation of backup file format
- Safe handling of missing files

## Security Considerations

- Backup files contain sensitive user data
- Store backups securely in production
- Consider encryption for production backups
- Regular cleanup of old OTP and session data