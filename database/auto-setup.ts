/**
 * SPANNER Database Auto-Setup
 * Automatically creates database schema and populates sample data
 * for Git deployment to new Replit accounts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Import all table schemas
const {
  users,
  serviceCategories,
  bookings,
  advertisements,
  workerProfiles,
  apiKeys
} = schema;

export async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    return false;
  }

  const connection = neon(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema });

  console.log('🚀 Starting database auto-setup...');

  try {
    // Check if database already has data
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('✅ Database already exists and has data. No setup needed.');
      return true;
    }

    console.log('📦 Creating database schema and sample data...');

    // 1. Create Service Categories (replaces old services)
    const sampleServices = [
      {
        id: '4423648c-2bb0-4d04-9c29-8e66aac22f1e',
        name: 'Plumbing',
        description: 'Water pipe installation, repair, and maintenance',
        icon: 'Wrench',
        isActive: true
      },
      {
        id: '5534759d-3cc1-5e15-ad3a-9f77bbd33f2f',
        name: 'Electrical Work',
        description: 'Electrical installation, wiring, and repairs',
        icon: 'Zap',
        isActive: true
      },
      {
        id: '6645860e-4dd2-6f26-be4b-af88cce44f3g',
        name: 'Painting',
        description: 'Interior and exterior painting services',
        icon: 'Paintbrush',
        isActive: true
      },
      {
        id: '7756971f-5ee3-7037-cf5c-bg99ddf55f4h',
        name: 'Carpenter',
        description: 'Furniture making, repair, and woodwork',
        icon: 'Hammer',
        isActive: true
      },
      {
        id: '8867082g-6ff4-8148-dg6d-ch00eeg66g5i',
        name: 'Mechanic',
        description: 'Vehicle repair and maintenance services',
        icon: 'Car',
        isActive: true
      }
    ];

    await db.insert(serviceCategories).values(sampleServices);
    console.log('✅ Created service categories');

    // 2. Create Sample Users
    const sampleUsers = [
      // Admin user
      {
        id: 'TN-SALEM-0001-ADMIN',
        firstName: 'System',
        lastName: 'Administrator',
        mobile: '9876543210',
        email: 'admin@spanner.com',
        role: 'admin' as const,
        houseNumber: '1',
        streetName: 'Admin Street',
        areaName: 'Anna Nagar',
        district: 'Salem',
        state: 'Tamil Nadu',
        pincode: '636001',
        fullAddress: '1, Admin Street, Anna Nagar, Salem, Tamil Nadu 636001',
        isVerified: true,

      },
      // Sample client
      {
        id: 'TN-SALEM-0002-CLIENT',
        firstName: 'Raj',
        lastName: 'Kumar',
        mobile: '9876543211',
        email: 'raj@example.com',
        role: 'client' as const,
        houseNumber: '123',
        streetName: 'Main Street',
        areaName: 'Anna Nagar',
        district: 'Salem',
        state: 'Tamil Nadu',
        pincode: '636001',
        fullAddress: '123, Main Street, Anna Nagar, Salem, Tamil Nadu 636001',
        isVerified: true,

      },
      // Sample worker
      {
        id: 'TN-SALEM-0003-WORKER',
        firstName: 'Murugan',
        lastName: 'S',
        mobile: '9876543212',
        email: 'murugan@example.com',
        role: 'worker' as const,
        houseNumber: '456',
        streetName: 'Worker Street',
        areaName: 'Gandhi Road',
        district: 'Salem',
        state: 'Tamil Nadu',
        pincode: '636002',
        fullAddress: '456, Worker Street, Gandhi Road, Salem, Tamil Nadu 636002',
        isVerified: true,

      }
    ];

    await db.insert(users).values(sampleUsers);
    console.log('✅ Created sample users');

    // 3. Create Worker Profile for sample worker
    const sampleWorkerProfile = [
      {
        userId: 'TN-SALEM-0003-WORKER',
        aadhaarNumber: '123456789012',
        primaryService: 'Plumbing',
        experienceYears: 5,
        hourlyRate: '150.00',
        serviceDistricts: ['Salem', 'Coimbatore'],
        serviceAreas: ['Anna Nagar', 'Gandhi Road'],
        serviceAllAreas: false,
        bio: 'Experienced plumber with 5 years of expertise in residential and commercial plumbing services.',
        skills: ['Plumbing', 'Electrical Work'],
        isAvailable: true,
        rating: '4.80',
        totalJobs: 25
      }
    ];

    await db.insert(workerProfiles).values(sampleWorkerProfile);
    console.log('✅ Created worker profiles');

    // 4. Create Sample Bookings  
    const sampleBookings = [
      {
        id: 'BOOK-001',
        clientId: 'TN-SALEM-0002-CLIENT',
        workerId: 'TN-SALEM-0003-WORKER',
        serviceCategory: 'Plumbing',
        description: 'Fix leaking kitchen sink pipe',
        district: 'Salem',
        scheduledDate: new Date('2024-08-15T10:00:00Z'),
        status: 'completed',
        totalAmount: '500.00',
        paymentStatus: 'paid',
        clientRating: 5,
        clientReview: 'Excellent work! Fixed the pipe perfectly and very professional.',
        completionOTP: '123456',
        otpGeneratedAt: new Date('2024-08-01T14:00:00Z'),
        otpVerifiedAt: new Date('2024-08-01T15:00:00Z'),
        workerCompletedAt: new Date('2024-08-01T14:30:00Z'),
        clientConfirmedAt: new Date('2024-08-01T15:00:00Z')
      }
    ];

    await db.insert(bookings).values(sampleBookings);
    console.log('✅ Created sample bookings');

    // 5. Create Sample Advertisements
    const sampleAds = [
      {
        title: 'Welcome to SPANNER',
        description: 'Find reliable blue-collar workers near you',
        image: '', // Base64 image will be added later
        targetAudience: 'client',
        isActive: true,
        priority: 1
      },
      {
        title: 'Join as Worker',
        description: 'Earn money by providing your skills',
        image: '', // Base64 image will be added later
        targetAudience: 'worker',
        isActive: true,
        priority: 2
      }
    ];

    await db.insert(advertisements).values(sampleAds);
    console.log('✅ Created sample advertisements');

    // 6. Create API Keys Storage
    const sampleKeys = [
      {
        keyType: 'ai_service',
        keyName: 'GEMINI_API_KEY',
        keyValue: 'your_gemini_api_key_here',
        description: 'Google Gemini API key for voice processing',
        isActive: true
      },
      {
        keyType: 'communication',
        keyName: 'SMS_API_KEY', 
        keyValue: 'your_sms_api_key_here',
        description: 'SMS service API key for OTP',
        isActive: false
      }
    ];

    await db.insert(apiKeys).values(sampleKeys);
    console.log('✅ Created sample API keys');

    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${sampleServices.length} service categories created`);
    console.log(`   • ${sampleUsers.length} users created`);
    console.log(`   • ${sampleWorkerProfile.length} worker profiles created`);
    console.log(`   • ${sampleBookings.length} bookings created`);
    console.log(`   • ${sampleAds.length} advertisements created`);
    console.log(`   • ${sampleKeys.length} API keys created`);
    console.log('');
    console.log('🔐 Default Login Credentials:');
    console.log('   Admin: 9876543210 (OTP: 123456)');
    console.log('   Client: 9876543211 (OTP: 123456)');
    console.log('   Worker: 9876543212 (OTP: 123456)');
    console.log('');
    console.log('🚀 Ready to start the application!');

    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}