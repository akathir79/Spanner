import { db } from "../server/db.js";
import { users, userSequence } from "../shared/schema.js";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

// Indian first names (mix of traditional and modern)
const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun",
  "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
  "Shaurya", "Atharv", "Advait", "Aryan", "Rudra",
  "Anaya", "Aadhya", "Anika", "Diya", "Ira",
  "Kavya", "Kiara", "Myra", "Priya", "Riya",
  "Saanvi", "Sara", "Tara", "Vanya", "Zara",
  "Raj", "Suresh", "Ramesh", "Mahesh", "Ganesh",
  "Deepak", "Ashok", "Vijay", "Ravi", "Kiran",
  "Sunita", "Meera", "Geeta", "Sita", "Radha",
  "Kamala", "Lakshmi", "Saraswati", "Parvati", "Uma"
];

const lastNames = [
  "Sharma", "Verma", "Singh", "Kumar", "Gupta",
  "Agarwal", "Jain", "Bansal", "Mittal", "Goel",
  "Reddy", "Rao", "Murthy", "Naidu", "Chowdhury",
  "Das", "Sen", "Ghosh", "Bose", "Roy",
  "Patel", "Shah", "Modi", "Mehta", "Desai",
  "Iyer", "Nair", "Menon", "Pillai", "Krishnan",
  "Khan", "Ali", "Ahmed", "Mohammad", "Hussain"
];

// Generate mobile number (Indian format)
function generateMobile(): string {
  const prefixes = ['91', '92', '93', '94', '95', '96', '97', '98', '99'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const remaining = Math.floor(Math.random() * 90000000) + 10000000;
  return `${prefix}${remaining}`;
}

// Generate email
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${number}@${domain}`;
}

// Generate address
function generateAddress(district: string, state: string): string {
  const streets = [
    'Main Street', 'Market Road', 'Station Road', 'Church Street', 'School Street',
    'Temple Road', 'Gandhi Road', 'Nehru Street', 'MG Road', 'Civil Lines'
  ];
  const areas = [
    'Colony', 'Nagar', 'Puram', 'Ganj', 'Bazar', 'Layout', 'Extension', 'Town'
  ];
  
  const houseNo = Math.floor(Math.random() * 999) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const area = areas[Math.floor(Math.random() * areas.length)];
  
  return `${houseNo}, ${street}, ${district} ${area}, ${district}, ${state}`;
}

// Generate pincode (6 digits)
function generatePincode(): string {
  return (Math.floor(Math.random() * 900000) + 100000).toString();
}

// Generate custom user ID
async function generateCustomUserId(state: string, district: string, role: string): Promise<string> {
  // Get state code (first 3 letters)
  const stateCode = state.substring(0, 3).toUpperCase();
  
  // Get district code (first 3 letters)
  const districtCode = district.substring(0, 3).toUpperCase();
  
  // Get role code
  const roleCode = role === 'client' ? 'C' : role === 'worker' ? 'W' : role === 'admin' ? 'A' : 'SA';
  
  // Check if sequence exists
  const sequenceId = `${stateCode}-${districtCode}-${roleCode}`;
  
  try {
    const existingSequence = await db.select()
      .from(userSequence)
      .where(eq(userSequence.id, sequenceId))
      .limit(1);
    
    let nextNumber = 1;
    
    if (existingSequence.length > 0) {
      nextNumber = existingSequence[0].lastNumber + 1;
      await db.update(userSequence)
        .set({ 
          lastNumber: nextNumber,
          updatedAt: new Date()
        })
        .where(eq(userSequence.id, sequenceId));
    } else {
      await db.insert(userSequence).values({
        id: sequenceId,
        state,
        district,
        role,
        lastNumber: nextNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `${stateCode}-${districtCode}-${paddedNumber}-${roleCode}`;
  } catch (error) {
    console.error('Error generating custom user ID:', error);
    // Fallback to timestamp-based ID
    return `${stateCode}-${districtCode}-${Date.now()}-${roleCode}`;
  }
}

async function generateUsersForStateDistrict(state: string, district: string, count: number = 5) {
  const users_to_create = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Generate unique mobile number
    let mobile = generateMobile();
    let attempts = 0;
    while (attempts < 5) {
      try {
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.mobile, mobile))
          .limit(1);
        
        if (existingUser.length === 0) break;
        mobile = generateMobile();
        attempts++;
      } catch (error) {
        break;
      }
    }
    
    const customId = await generateCustomUserId(state, district, 'client');
    
    const user = {
      id: customId,
      email: generateEmail(firstName, lastName),
      mobile,
      firstName,
      lastName,
      role: 'client' as const,
      district,
      address: generateAddress(district, state),
      pincode: generatePincode(),
      state,
      isVerified: true,
      isActive: true,
      status: 'approved',
      lastLoginAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    };
    
    users_to_create.push(user);
  }
  
  try {
    await db.insert(users).values(users_to_create);
    console.log(`✅ ${state} - ${district}: ${count} users`);
  } catch (error) {
    console.error(`❌ ${state} - ${district}: Error`);
  }
}

async function completeRemainingStates() {
  console.log('🚀 Completing user generation for remaining states...');
  
  // Read states and districts from JSON file
  const statesDataPath = path.join(process.cwd(), 'shared', 'states-districts.json');
  const statesData = JSON.parse(fs.readFileSync(statesDataPath, 'utf8'));
  
  // Focus on specific states that need completion
  const statesToComplete = [
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Puducherry (UT)', 'Ladakh (UT)', 'Lakshadweep (UT)'
  ];
  
  let totalUsersCreated = 0;
  
  for (const stateInfo of statesData.states) {
    const state = stateInfo.state;
    
    // Only process specific states
    if (!statesToComplete.includes(state)) {
      continue;
    }
    
    console.log(`\n📍 Processing: ${state}`);
    
    for (const district of stateInfo.districts) {
      await generateUsersForStateDistrict(state, district, 5);
      totalUsersCreated += 5;
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  
  console.log(`\n🎉 Complete! Created ${totalUsersCreated} new users`);
  
  // Final summary
  const finalCount = await db.select()
    .from(users)
    .where(eq(users.role, 'client'))
    .then(results => results.length);
  
  console.log(`📈 Total clients: ${finalCount}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  completeRemainingStates()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}