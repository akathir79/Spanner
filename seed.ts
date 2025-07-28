import { db } from './server/db';
import { users, districts, serviceCategories, workerProfiles } from './shared/schema';

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Insert Tamil Nadu districts
    const districtData = [
      { name: "Chennai", tamilName: "சென்னை", code: "CHN" },
      { name: "Coimbatore", tamilName: "கோயம்புத்தூர்", code: "CBE" },
      { name: "Madurai", tamilName: "மதுரை", code: "MDU" },
      { name: "Tiruchirappalli", tamilName: "திருச்சிராப்பள்ளி", code: "TRY" },
      { name: "Salem", tamilName: "சேலம்", code: "SLM" },
      { name: "Tirunelveli", tamilName: "திருநெல்வேலி", code: "TVL" },
      { name: "Tiruppur", tamilName: "திருப்பூர்", code: "TPR" },
      { name: "Vellore", tamilName: "வேலூர்", code: "VLR" },
      { name: "Erode", tamilName: "ஈரோடு", code: "ERD" },
      { name: "Thoothukkudi", tamilName: "தூத்துக்குடி", code: "TKD" },
      { name: "Kanchipuram", tamilName: "காஞ்சிபுரம்", code: "KCP" },
      { name: "Thanjavur", tamilName: "தஞ்சாவூர்", code: "TNJ" },
      { name: "Cuddalore", tamilName: "கடலூர்", code: "CDL" },
      { name: "Dindigul", tamilName: "திண்டுக்கல்", code: "DGL" },
      { name: "Karur", tamilName: "கரூர்", code: "KRR" },
      { name: "Nagapattinam", tamilName: "நாகப்பட்டினம்", code: "NPT" },
      { name: "Viluppuram", tamilName: "விழுப்புரம்", code: "VLP" },
      { name: "Tiruvannamalai", tamilName: "திருவண்ணாமலை", code: "TVL" },
      { name: "Sivaganga", tamilName: "சிவகங்கை", code: "SVG" },
      { name: "Ramanathapuram", tamilName: "இராமநாதபுரம்", code: "RMD" },
    ];

    console.log('Inserting districts...');
    const insertedDistricts = await db.insert(districts).values(districtData).onConflictDoNothing().returning();
    
    // Get the first district ID for users
    const firstDistrictId = insertedDistricts[0]?.id;

    // Insert service categories
    const serviceData = [
      { name: "Plumbing", tamilName: "குழாய் வேலை", description: "Water pipe repairs, installations, and maintenance", icon: "wrench" },
      { name: "Electrical", tamilName: "மின்சார வேலை", description: "Electrical repairs, installations, and wiring", icon: "zap" },
      { name: "Painting", tamilName: "ஓவியம்", description: "House painting, wall coloring, and decoration", icon: "palette" },
      { name: "Carpentry", tamilName: "தச்சு வேலை", description: "Furniture making, wood work, and repairs", icon: "hammer" },
      { name: "AC Repair", tamilName: "ஏசி பழுது", description: "Air conditioner servicing, repair, and installation", icon: "snowflake" },
      { name: "Cleaning", tamilName: "சுத்தம்", description: "House cleaning, deep cleaning services", icon: "sparkles" },
      { name: "Mechanic", tamilName: "மெக்கானிக்", description: "Vehicle repair and maintenance services", icon: "car" },
      { name: "Gardening", tamilName: "தோட்டக்கலை", description: "Garden maintenance and landscaping", icon: "flower" }
    ];

    console.log('Inserting service categories...');
    await db.insert(serviceCategories).values(serviceData).onConflictDoNothing();

    // Create super admin users only if we have a district
    if (firstDistrictId) {
      console.log('Creating admin users...');
      const adminUsers = [
        {
          firstName: "Super",
          lastName: "Admin",
          mobile: "9000000001",
          email: "admin@spanner.com",
          role: "super_admin" as const,
          isVerified: true,
          districtId: firstDistrictId
        },
        {
          firstName: "Admin",
          lastName: "User",
          mobile: "9000000002", 
          email: "admin2@spanner.com",
          role: "admin" as const,
          isVerified: true,
          districtId: firstDistrictId
        }
      ];

      await db.insert(users).values(adminUsers).onConflictDoNothing();

      // Create some sample client and worker users
      const sampleUsers = [
        {
          firstName: "Raman",
          lastName: "Kumar",
          mobile: "9876543210",
          email: "raman@example.com", 
          role: "client" as const,
          isVerified: true,
          districtId: firstDistrictId
        },
        {
          firstName: "Suresh",
          lastName: "M",
          mobile: "9876543211",
          email: "suresh@example.com",
          role: "worker" as const,
          isVerified: true,
          districtId: firstDistrictId
        },
        {
          firstName: "Lakshmi",
          lastName: "Narayanan",
          mobile: "9876543212",
          email: "lakshmi@example.com",
          role: "worker" as const,
          isVerified: true,
          districtId: firstDistrictId
        }
      ];

      await db.insert(users).values(sampleUsers).onConflictDoNothing();
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    process.exit(0);
  }
}

seed();