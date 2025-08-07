import { db } from "../server/db";
import { users, workerProfiles, serviceCategories, userSequence } from "../shared/schema";
import { generateCustomUserId } from "../server/userIdGenerator";
import { eq } from "drizzle-orm";
import statesDistrictsData from "../shared/states-districts.json";

const serviceTypes = [
  "Plumbing",
  "Electrical",
  "Painting", 
  "Carpentry",
  "AC Repair",
  "Appliance Repair",
  "Cleaning Services",
  "Pest Control",
  "Home Security",
  "Interior Design"
];

const firstNames = [
  "Rajesh", "Suresh", "Ramesh", "Mahesh", "Dinesh", "Mukesh", "Naresh", "Hitesh", "Umesh", "Ritesh",
  "Amit", "Rohit", "Ajit", "Sumit", "Vinit", "Hemant", "Vikram", "Deepak", "Ashok", "Manoj",
  "Ravi", "Sanjay", "Vijay", "Anil", "Sunil", "Kapil", "Rahul", "Sachin", "Nitin", "Tarun"
];

const lastNames = [
  "Kumar", "Singh", "Sharma", "Verma", "Gupta", "Agarwal", "Jain", "Yadav", "Mishra", "Tiwari",
  "Patel", "Shah", "Mehta", "Desai", "Thakur", "Rana", "Malhotra", "Khanna", "Arora", "Bhatia"
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateMobileNumber(): string {
  // Generate Indian mobile number starting with 9, 8, 7, or 6
  const firstDigit = [9, 8, 7, 6][Math.floor(Math.random() * 4)];
  const remaining = Math.floor(Math.random() * 900000000) + 100000000;
  return `${firstDigit}${remaining.toString().slice(0, 8)}`;
}

function generateAadhaarNumber(): string {
  // Generate 12-digit Aadhaar-like number (for demo purposes)
  return Math.floor(Math.random() * 900000000000 + 100000000000).toString();
}

async function generateWorkersForState(stateName: string, districts: string[]) {
  console.log(`Generating workers for ${stateName} (${districts.length} districts)`);
  
  for (const districtName of districts) {
    console.log(`  Creating workers for ${districtName}...`);
    
    // Create 10 workers per district
    for (let i = 0; i < 10; i++) {
      try {
        const serviceType = serviceTypes[i % serviceTypes.length];
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        const mobile = generateMobileNumber();
        
        // Generate unique user ID
        const userId = await generateCustomUserId({
          state: stateName,
          district: districtName,
          role: "worker"
        });
        
        // Create user record
        const userData = {
          id: userId,
          mobile,
          firstName,
          lastName,
          role: "worker" as const,
          district: districtName,
          state: stateName,
          address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomItem(["MG Road", "Gandhi Street", "Main Street", "Station Road", "Market Road"])}`,
          pincode: (Math.floor(Math.random() * 900000) + 100000).toString(),
          isVerified: Math.random() > 0.3, // 70% verified
          isActive: true,
          status: Math.random() > 0.2 ? "approved" : "pending", // 80% approved
          // Random last login (some recent, some old, some never)
          lastLoginAt: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Created within last 60 days
        };

        const [user] = await db.insert(users).values(userData).returning();

        // Create worker profile
        const workerProfileData = {
          userId: user.id,
          aadhaarNumber: generateAadhaarNumber(),
          aadhaarVerified: Math.random() > 0.4, // 60% verified
          primaryService: serviceType,
          experienceYears: Math.floor(Math.random() * 15) + 1, // 1-15 years
          hourlyRate: Math.floor(Math.random() * 500) + 200, // ₹200-700 per hour
          serviceDistricts: [districtName],
          serviceAreas: null, // Will serve all areas in district
          serviceAllAreas: true,
          bio: `Experienced ${serviceType.toLowerCase()} professional with ${Math.floor(Math.random() * 15) + 1} years of experience. Reliable and skilled service provider.`,
          skills: [serviceType, "Customer Service", "Quality Work"],
          isBackgroundVerified: Math.random() > 0.3, // 70% background verified
          isAvailable: Math.random() > 0.2, // 80% available
          rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0-5.0 rating
          totalJobs: Math.floor(Math.random() * 50), // 0-50 jobs completed
        };

        await db.insert(workerProfiles).values([workerProfileData]);
        
        console.log(`    Created worker: ${firstName} ${lastName} (${serviceType}) - ID: ${userId}`);
        
      } catch (error) {
        console.error(`    Error creating worker ${i + 1} for ${districtName}:`, error);
      }
    }
  }
}

export async function generateWorkers() {
  console.log("🚀 Starting worker generation for all states and districts...");
  
  try {
    // Process each state
    for (const stateData of statesDistrictsData.states) {
      await generateWorkersForState(stateData.state, stateData.districts);
    }
    
    console.log("✅ Worker generation completed!");
    
    // Show summary
    const totalWorkers = await db.select().from(users).where(eq(users.role, "worker"));
    console.log(`📊 Total workers created: ${totalWorkers.length}`);
    
  } catch (error) {
    console.error("❌ Error during worker generation:", error);
  }
}