import fs from 'fs';
import path from 'path';
import { db } from '../server/db.js';
import { users, workerProfiles } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

interface StateDistrictData {
  states: Record<string, { districts: string[] }>;
  serviceTypes: Array<{
    id: string;
    name: string;
    category: string;
    skills: string[];
    avgRate: number;
    description: string;
  }>;
}

// Load states-districts data
const stateDistrictPath = path.join(process.cwd(), 'shared', 'states-districts.json');
const stateDistrictData: StateDistrictData = JSON.parse(fs.readFileSync(stateDistrictPath, 'utf-8'));

// Indian names database for realistic worker names
const indianNames = {
  male: {
    first: [
      'Rajesh', 'Suresh', 'Ramesh', 'Mahesh', 'Mukesh', 'Dinesh', 'Naresh', 'Rakesh',
      'Anil', 'Sunil', 'Amit', 'Ajit', 'Rohit', 'Mohit', 'Sumit', 'Vinit',
      'Ravi', 'Kavi', 'Shyam', 'Ram', 'Krishna', 'Arjun', 'Bheem', 'Vikram',
      'Santosh', 'Ashok', 'Vinod', 'Pramod', 'Manoj', 'Arun', 'Varun', 'Tarun',
      'Sanjay', 'Vijay', 'Ajay', 'Jay', 'Deepak', 'Pawan', 'Chetan', 'Ratan',
      'Gopal', 'Kishore', 'Ganesh', 'Lokesh', 'Yogesh', 'Ritesh', 'Hitesh', 'Jitesh'
    ],
    last: [
      'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Kumar', 'Yadav', 'Mishra',
      'Pandey', 'Tiwari', 'Dubey', 'Shukla', 'Joshi', 'Chaudhary', 'Thakur', 'Rana',
      'Patel', 'Shah', 'Mehta', 'Jain', 'Bansal', 'Goel', 'Mittal', 'Chopra',
      'Malhotra', 'Kapoor', 'Arora', 'Bhatia', 'Sethi', 'Khanna', 'Sood', 'Anand'
    ]
  },
  female: {
    first: [
      'Priya', 'Pooja', 'Kavita', 'Sunita', 'Anita', 'Geeta', 'Seeta', 'Meera',
      'Shanti', 'Shakti', 'Lakshmi', 'Saraswati', 'Durga', 'Kali', 'Radha', 'Sita',
      'Anjali', 'Shweta', 'Preeti', 'Neeti', 'Jyoti', 'Bharti', 'Aarti', 'Kirti',
      'Rekha', 'Lekha', 'Sneha', 'Neha', 'Soha', 'Komal', 'Kamal', 'Vimal',
      'Suman', 'Raman', 'Kiran', 'Pawan', 'Chanda', 'Nanda', 'Sharda', 'Sarita'
    ],
    last: [
      'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Singh', 'Devi', 'Kumari', 'Mishra',
      'Pandey', 'Tiwari', 'Dubey', 'Shukla', 'Joshi', 'Chaudhary', 'Thakur', 'Rana',
      'Patel', 'Shah', 'Mehta', 'Jain', 'Bansal', 'Goel', 'Mittal', 'Chopra'
    ]
  }
};

// Bank names for realistic bank details
const bankNames = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank',
  'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Bank of India', 'Central Bank of India',
  'Indian Bank', 'Indian Overseas Bank', 'UCO Bank', 'IDBI Bank', 'Yes Bank'
];

// Generate IFSC codes based on bank and location
function generateIFSC(bankName: string, district: string): string {
  const bankCodes: Record<string, string> = {
    'State Bank of India': 'SBIN',
    'HDFC Bank': 'HDFC',
    'ICICI Bank': 'ICIC',
    'Axis Bank': 'UTIB',
    'Punjab National Bank': 'PUNB',
    'Bank of Baroda': 'BARB',
    'Canara Bank': 'CNRB',
    'Union Bank of India': 'UBIN',
    'Bank of India': 'BKID',
    'Central Bank of India': 'CBIN',
    'Indian Bank': 'IDIB',
    'Indian Overseas Bank': 'IOBA',
    'UCO Bank': 'UCBA',
    'IDBI Bank': 'IBKL',
    'Yes Bank': 'YESB'
  };
  
  const bankCode = bankCodes[bankName] || 'SBIN';
  const districtCode = district.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const branchCode = Math.floor(Math.random() * 9000) + 1000;
  
  return `${bankCode}0${districtCode}${branchCode}`;
}

// Generate Indian mobile number
function generateMobileNumber(): string {
  const prefixes = ['9', '8', '7', '6'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = prefix + Math.floor(Math.random() * 900000000 + 100000000).toString();
  return number;
}

// Generate email from name
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999) + 1}@${domain}`;
  return email;
}

// Generate address components
function generateAddress(district: string, state: string) {
  const houseNumbers = ['12', '45', '67', '89', '123', '456', '789', '234', '567', '890'];
  const streetNames = ['Main Street', 'Gandhi Road', 'Nehru Avenue', 'Station Road', 'Market Street', 'Temple Road', 'School Lane', 'Park Avenue'];
  const localities = ['Sector 1', 'Civil Lines', 'Old City', 'New Town', 'Railway Colony', 'Government Colony', 'Market Area', 'Residential Area'];
  
  const houseNumber = houseNumbers[Math.floor(Math.random() * houseNumbers.length)];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const locality = localities[Math.floor(Math.random() * localities.length)];
  const pincode = Math.floor(Math.random() * 900000) + 100000;
  
  return {
    address: `${houseNumber}, ${streetName}, ${locality}`,
    city: district,
    state: state,
    pincode: pincode.toString()
  };
}

// Generate experience years
function generateExperience(): number {
  return Math.floor(Math.random() * 15) + 1; // 1-15 years
}

// Generate user ID in format STATE-DISTRICT-XXXX-W
function generateUserId(state: string, district: string, sequence: number): string {
  const stateCode = state.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const districtCode = district.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const seqStr = sequence.toString().padStart(4, '0');
  return `${stateCode}-${districtCode}-${seqStr}-W`;
}

// Get random name
function getRandomName(gender: 'male' | 'female') {
  const firstNames = indianNames[gender].first;
  const lastNames = indianNames[gender].last;
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return { firstName, lastName };
}

// Get random service type
function getRandomServiceType() {
  return stateDistrictData.serviceTypes[Math.floor(Math.random() * stateDistrictData.serviceTypes.length)];
}

// Generate workers for a specific district
async function generateWorkersForDistrict(state: string, district: string, count: number) {
  const workers = [];
  const workerProfilesData = [];
  
  for (let i = 1; i <= count; i++) {
    const gender = Math.random() > 0.2 ? 'male' : 'female'; // 80% male, 20% female
    const { firstName, lastName } = getRandomName(gender);
    const serviceType = getRandomServiceType();
    const address = generateAddress(district, state);
    const mobile = generateMobileNumber();
    const email = generateEmail(firstName, lastName);
    const experience = generateExperience();
    const bankName = bankNames[Math.floor(Math.random() * bankNames.length)];
    const accountNumber = Math.floor(Math.random() * 90000000000000) + 10000000000000;
    const ifscCode = generateIFSC(bankName, district);
    
    // Generate skills (2-4 skills from service type)
    const availableSkills = serviceType.skills;
    const numSkills = Math.floor(Math.random() * 3) + 2; // 2-4 skills
    const selectedSkills = [];
    for (let j = 0; j < numSkills && j < availableSkills.length; j++) {
      selectedSkills.push(availableSkills[j]);
    }
    
    const userId = generateUserId(state, district, i);
    
    const worker = {
      id: userId,
      firstName,
      lastName,
      email,
      mobile,
      role: 'worker' as const,
      district,
      state,
      address: address.address,
      pincode: address.pincode,
      bankAccountNumber: accountNumber.toString(),
      bankIFSC: ifscCode,
      bankAccountHolderName: `${firstName} ${lastName}`,
      bankName,
      isVerified: Math.random() > 0.3, // 70% verified
      isSuspended: Math.random() > 0.95, // 5% suspended
      status: Math.random() > 0.2 ? 'approved' : 'pending', // 80% approved
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
      lastLoginAt: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null, // 80% have logged in
    };

    const workerProfile = {
      userId,
      aadhaarNumber: Math.floor(Math.random() * 900000000000) + 100000000000, // 12 digit aadhaar
      aadhaarVerified: Math.random() > 0.3, // 70% verified
      primaryService: serviceType.id,
      experienceYears: experience,
      hourlyRate: (serviceType.avgRate + Math.floor(Math.random() * 200) - 100).toString(), // ±100 from avg rate
      serviceDistricts: JSON.stringify([district]), // Service this district
      bio: `Experienced ${serviceType.name.toLowerCase()} with ${experience} years of expertise in ${selectedSkills.slice(0, 2).join(' and ')}.`,
      skills: JSON.stringify(selectedSkills),
      isAvailable: Math.random() > 0.2, // 80% available
      averageRating: Math.random() * 2 + 3, // 3-5 rating
      totalBookings: Math.floor(Math.random() * 100),
      completedBookings: Math.floor(Math.random() * 80),
      isActive: true,
    };
    
    workers.push(worker);
    workerProfilesData.push(workerProfile);
  }
  
  return { workers, workerProfilesData };
}

// Main function to generate workers for all states and districts
export async function generateAllWorkersData() {
  console.log('🚀 Starting comprehensive worker data generation...');
  
  let totalWorkers = 0;
  const batchSize = 50; // Insert in batches
  
  for (const [state, stateData] of Object.entries(stateDistrictData.states)) {
    console.log(`\n📍 Processing ${state}...`);
    
    for (const district of stateData.districts) {
      try {
        // Generate 3-8 workers per district
        const workerCount = Math.floor(Math.random() * 6) + 3;
        
        console.log(`  📋 Generating ${workerCount} workers for ${district}...`);
        
        const { workers, workerProfilesData } = await generateWorkersForDistrict(state, district, workerCount);
        
        if (workers.length > 0) {
          // Insert workers in batches
          for (let i = 0; i < workers.length; i += batchSize) {
            const batch = workers.slice(i, i + batchSize);
            await db.insert(users).values(batch).onConflictDoNothing();
          }
          
          // Insert worker profiles in batches
          for (let i = 0; i < workerProfilesData.length; i += batchSize) {
            const batch = workerProfilesData.slice(i, i + batchSize);
            await db.insert(workerProfiles).values(batch).onConflictDoNothing();
          }
          
          totalWorkers += workers.length;
          console.log(`    ✅ Added ${workers.length} workers to ${district}`);
        }
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`    ❌ Error generating workers for ${district}, ${state}:`, error);
        continue;
      }
    }
  }
  
  console.log(`\n🎉 Worker data generation completed!`);
  console.log(`📊 Total workers generated: ${totalWorkers}`);
  console.log(`🏭 Service types available: ${stateDistrictData.serviceTypes.length}`);
  console.log(`🗺️  Coverage: ${Object.keys(stateDistrictData.states).length} states`);
  
  return totalWorkers;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllWorkersData()
    .then(() => {
      console.log('✅ Worker generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Worker generation failed:', error);
      process.exit(1);
    });
}