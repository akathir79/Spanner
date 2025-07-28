const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Insert Tamil Nadu districts
    const districts = [
      { name: "Chennai", nameInTamil: "சென்னை" },
      { name: "Coimbatore", nameInTamil: "கோயம்புத்தூர்" },
      { name: "Madurai", nameInTamil: "மதுரை" },
      { name: "Tiruchirappalli", nameInTamil: "திருச்சிராப்பள்ளி" },
      { name: "Salem", nameInTamil: "சேலம்" },
      { name: "Tirunelveli", nameInTamil: "திருநெல்வேலி" },
      { name: "Tiruppur", nameInTamil: "திருப்பூர்" },
      { name: "Vellore", nameInTamil: "வேலூர்" },
      { name: "Erode", nameInTamil: "ஈரோடு" },
      { name: "Thoothukkudi", nameInTamil: "தூத்துக்குடி" }
    ];

    await db.insert(require('./shared/schema').districts).values(districts).onConflictDoNothing();

    // Insert service categories
    const services = [
      { name: "Plumbing", nameInTamil: "குழாய் வேலை", description: "Water pipe repairs, installations" },
      { name: "Electrical", nameInTamil: "மின்சார வேலை", description: "Electrical repairs and installations" },
      { name: "Painting", nameInTamil: "ஓவியம்", description: "House and wall painting services" },
      { name: "Carpentry", nameInTamil: "தச்சு வேலை", description: "Furniture making and wood work" },
      { name: "AC Repair", nameInTamil: "ஏசி பழுது", description: "Air conditioner servicing and repair" }
    ];

    await db.insert(require('./shared/schema').serviceCategories).values(services).onConflictDoNothing();

    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.insert(require('./shared/schema').users).values({
      firstName: "Super",
      lastName: "Admin",
      mobile: "9000000001",
      email: "admin@spanner.com",
      password: hashedPassword,
      role: "super_admin",
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
