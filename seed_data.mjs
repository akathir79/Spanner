import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users, districts, serviceCategories } from './shared/schema.ts';
import ws from 'ws';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Insert Tamil Nadu districts
    const districtData = [
      { name: "Chennai", nameInTamil: "சென்னை" },
      { name: "Coimbatore", nameInTamil: "கோயம்புத்தூர்" },
      { name: "Madurai", nameInTamil: "மதுரை" },
      { name: "Tiruchirappalli", nameInTamil: "திருச்சிராப்பள்ளி" },
      { name: "Salem", nameInTamil: "சேலம்" },
      { name: "Tirunelveli", nameInTamil: "திருநெல்வேலி" },
      { name: "Tiruppur", nameInTamil: "திருப்பூர்" },
      { name: "Vellore", nameInTamil: "வேலூர்" },
      { name: "Erode", nameInTamil: "ஈரோடு" },
      { name: "Thoothukkudi", nameInTamil: "தூத்துக்குடி" },
      { name: "Kanchipuram", nameInTamil: "காஞ்சிபுரம்" },
      { name: "Thanjavur", nameInTamil: "தஞ்சாவூர்" },
      { name: "Cuddalore", nameInTamil: "கடலூர்" },
      { name: "Dindigul", nameInTamil: "திண்டுக்கல்" },
      { name: "Karur", nameInTamil: "கரூர்" }
    ];

    console.log('Inserting districts...');
    await db.insert(districts).values(districtData).onConflictDoNothing();

    // Insert service categories
    const serviceData = [
      { name: "Plumbing", nameInTamil: "குழாய் வேலை", description: "Water pipe repairs, installations, and maintenance" },
      { name: "Electrical", nameInTamil: "மின்சார வேலை", description: "Electrical repairs, installations, and wiring" },
      { name: "Painting", nameInTamil: "ஓவியம்", description: "House painting, wall coloring, and decoration" },
      { name: "Carpentry", nameInTamil: "தச்சு வேலை", description: "Furniture making, wood work, and repairs" },
      { name: "AC Repair", nameInTamil: "ஏசி பழுது", description: "Air conditioner servicing, repair, and installation" },
      { name: "Cleaning", nameInTamil: "சுத்தம்", description: "House cleaning, deep cleaning services" },
      { name: "Mechanic", nameInTamil: "மெக்கானிக்", description: "Vehicle repair and maintenance services" },
      { name: "Gardening", nameInTamil: "தோட்டக்கலை", description: "Garden maintenance and landscaping" }
    ];

    console.log('Inserting service categories...');
    await db.insert(serviceCategories).values(serviceData).onConflictDoNothing();

    // Create super admin user
    console.log('Creating super admin...');
    await db.insert(users).values({
      firstName: "Super",
      lastName: "Admin",
      mobile: "9000000001",
      email: "admin@spanner.com",
      role: "super_admin",
      isVerified: true
    }).onConflictDoNothing();

    // Create test admin user
    await db.insert(users).values({
      firstName: "Admin",
      lastName: "User",
      mobile: "9000000002",
      email: "admin2@spanner.com",
      role: "admin",
      isVerified: true
    }).onConflictDoNothing();

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await pool.end();
  }
}

seed();
